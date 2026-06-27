import { type FC, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Scissors,
  Loader2,
  MousePointer2,
} from 'lucide-react';
import { imageProcessingService } from '../../services/imageProcessingService';

export const PropertiesPanel: FC = () => {
  const { getCurrentPage, selectedElementId, updateElement, deleteElement, duplicateElement, updateElementStyle } = useEditorStore();
  const currentPage = getCurrentPage();
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);
  const [isProcessing, setIsProcessing] = useState(false);

  // Accordion states
  const [openSections, setOpenSections] = useState({
    transform: true,
    appearance: true,
    info: false,
    actions: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRemoveBackground = async () => {
    if (!selectedElement) return;

    let imageUrl = '';
    if (selectedElement.content?.imageUrl) {
      imageUrl = selectedElement.content.imageUrl;
    } else if (selectedElement.imageUrl) {
      imageUrl = selectedElement.imageUrl;
    } else if (selectedElement.content?.src) {
      imageUrl = selectedElement.content.src;
    }

    if (!imageUrl) {
      console.warn('Nenhuma imagem encontrada para remover fundo');
      return;
    }

    try {
      setIsProcessing(true);
      const processedUrl = await imageProcessingService.removeBackground(imageUrl);

      if (selectedElement.content?.imageUrl) {
        updateElement(selectedElement.id, { content: { ...selectedElement.content, imageUrl: processedUrl } });
      } else if (selectedElement.imageUrl) {
        updateElement(selectedElement.id, { imageUrl: processedUrl });
      } else if (selectedElement.content?.src) {
        updateElement(selectedElement.id, { content: { ...selectedElement.content, src: processedUrl } });
      } else {
        updateElement(selectedElement.id, { content: { ...selectedElement.content, imageUrl: processedUrl } });
      }
    } catch (error) {
      console.error('Failed to remove background:', error);
      alert('Falha ao remover o fundo da imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-gray-800/40 rounded-lg flex items-center justify-center mb-3">
          <MousePointer2 className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-400">Nenhuma seleção</p>
        <p className="text-xs text-gray-500 mt-1">Selecione um elemento no canvas</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-3 space-y-2">
        {/* Element Info - Compacto */}
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-700/50 rounded-md flex items-center justify-center text-xs font-medium text-gray-400">
              {selectedElement.type.includes('product') ? '□' : selectedElement.type.includes('text') ? 'T' : '◇'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-300 truncate capitalize">
                {selectedElement.type.replace(/-/g, ' ')}
              </div>
              <div className="text-[10px] text-gray-500 font-mono truncate">{selectedElement.id.slice(0, 12)}</div>
            </div>
          </div>

          <input
            type="text"
            value={selectedElement.name || ''}
            onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
            placeholder="Nome do elemento"
            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
          />
        </div>

        {/* Transform Section */}
        <Section
          title="Transformação"
          isOpen={openSections.transform}
          onToggle={() => toggleSection('transform')}
        >
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="X"
              type="number"
              value={Math.round(selectedElement.position.x)}
              onChange={(val) => updateElement(selectedElement.id, { position: { ...selectedElement.position, x: Number(val) } })}
            />
            <PropertyInput
              label="Y"
              type="number"
              value={Math.round(selectedElement.position.y)}
              onChange={(val) => updateElement(selectedElement.id, { position: { ...selectedElement.position, y: Number(val) } })}
            />
            <PropertyInput
              label="W"
              type="number"
              value={Math.round(selectedElement.size.width)}
              onChange={(val) => updateElement(selectedElement.id, { size: { ...selectedElement.size, width: Number(val) } })}
            />
            <PropertyInput
              label="H"
              type="number"
              value={Math.round(selectedElement.size.height)}
              onChange={(val) => updateElement(selectedElement.id, { size: { ...selectedElement.size, height: Number(val) } })}
            />
          </div>
        </Section>

        {/* Appearance Section */}
        <Section
          title="Aparência"
          isOpen={openSections.appearance}
          onToggle={() => toggleSection('appearance')}
        >
          <div className="space-y-2">
            {/* Opacity Slider */}
            <PropertySlider
              label="Opacidade"
              value={Math.round((selectedElement.style.opacity ?? 1) * 100)}
              onChange={(val) => updateElementStyle(selectedElement.id, { opacity: val / 100 })}
              min={0}
              max={100}
              suffix="%"
            />

            {/* Background Color */}
            <PropertyColor
              label="Fundo"
              value={selectedElement.style.backgroundColor || '#FFFFFF'}
              onChange={(val) => updateElementStyle(selectedElement.id, { backgroundColor: val })}
            />

            {/* Border */}
            <PropertyInput
              label="Borda"
              type="number"
              value={selectedElement.style.borderWidth || 0}
              onChange={(val) => updateElementStyle(selectedElement.id, { borderWidth: Number(val) })}
              suffix="px"
            />

            {selectedElement.style.borderWidth && selectedElement.style.borderWidth > 0 && (
              <PropertyColor
                label="Cor da Borda"
                value={selectedElement.style.borderColor || '#000000'}
                onChange={(val) => updateElementStyle(selectedElement.id, { borderColor: val })}
              />
            )}

            {/* Border Radius */}
            <PropertyInput
              label="Arredondamento"
              type="number"
              value={selectedElement.style.borderRadius || 0}
              onChange={(val) => updateElementStyle(selectedElement.id, { borderRadius: Number(val) })}
              suffix="px"
            />
          </div>
        </Section>

        {/* Image Actions */}
        {(selectedElement.type === 'image' || selectedElement.type === 'uploaded-image') && (
          <Section title="Imagem" isOpen={openSections.actions} onToggle={() => toggleSection('actions')}>
            <div className="space-y-2">
              <button
                onClick={handleRemoveBackground}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-md text-xs font-medium text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Scissors className="w-3.5 h-3.5" />
                    Remover Fundo
                  </>
                )}
              </button>

              {/* Image URL Input */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={selectedElement.content?.imageUrl || selectedElement.imageUrl || ''}
                  onChange={(e) => {
                    if (selectedElement.content?.imageUrl !== undefined) {
                      updateElement(selectedElement.id, {
                        content: { ...selectedElement.content, imageUrl: e.target.value }
                      });
                    } else {
                      updateElement(selectedElement.id, { imageUrl: e.target.value });
                    }
                  }}
                  placeholder="http://localhost:3000/media/image.png"
                  className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
            </div>
          </Section>
        )}

        {/* Text Properties */}
        {selectedElement.type.includes('text') && (
          <Section title="Tipografia" isOpen={true} onToggle={() => {}}>
            <div className="space-y-2">
              <PropertyInput
                label="Tamanho"
                type="number"
                value={selectedElement.style.fontSize || 16}
                onChange={(val) => updateElementStyle(selectedElement.id, { fontSize: Number(val) })}
                suffix="px"
              />
              <PropertyColor
                label="Cor do Texto"
                value={selectedElement.style.textColor || '#1F2937'}
                onChange={(val) => updateElementStyle(selectedElement.id, { textColor: val })}
              />
            </div>
          </Section>
        )}

        {/* QR Code Properties */}
        {selectedElement.type === 'qr-code' && (
          <>
            <Section title="Destino do QR Code" isOpen={true} onToggle={() => {}}>
              <div className="space-y-2">
                {/* Tipo de Destino */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Tipo de Destino</label>
                  <select
                    value={selectedElement.qrCodeData?.destinationType || 'url'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...(selectedElement.qrCodeData || {}),
                          destinationType: e.target.value as any,
                          data: '', // Reset URL quando mudar tipo
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 focus:outline-none focus:border-gray-600 transition-colors"
                  >
                    <option value="catalog">📚 Catálogo</option>
                    <option value="product">📦 Produto</option>
                    <option value="profile">👤 Perfil Público</option>
                    <option value="url">🔗 URL Customizada</option>
                  </select>
                </div>

                {/* Catalog ID */}
                {selectedElement.qrCodeData?.destinationType === 'catalog' && (
                  <PropertyInput
                    label="ID do Catálogo"
                    type="number"
                    value={selectedElement.qrCodeData?.catalogId || ''}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          catalogId: val ? Number(val) : undefined,
                          data: val ? `${window.location.origin}/catalog/${val}` : '',
                        },
                      })
                    }
                    placeholder="Ex: 123"
                  />
                )}

                {/* Product ID */}
                {selectedElement.qrCodeData?.destinationType === 'product' && (
                  <PropertyInput
                    label="ID do Produto"
                    type="number"
                    value={selectedElement.qrCodeData?.productId || ''}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          productId: val ? Number(val) : undefined,
                          data: val ? `${window.location.origin}/product/${val}` : '',
                        },
                      })
                    }
                    placeholder="Ex: 456"
                  />
                )}

                {/* Profile ID */}
                {selectedElement.qrCodeData?.destinationType === 'profile' && (
                  <PropertyInput
                    label="ID do Perfil"
                    type="number"
                    value={selectedElement.qrCodeData?.profileId || ''}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          profileId: val ? Number(val) : undefined,
                          data: val ? `${window.location.origin}/profile/${val}` : '',
                        },
                      })
                    }
                    placeholder="Ex: 789"
                  />
                )}

                {/* Custom URL */}
                {selectedElement.qrCodeData?.destinationType === 'url' && (
                  <PropertyInput
                    label="URL Customizada"
                    type="text"
                    value={selectedElement.qrCodeData?.customUrl || ''}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          customUrl: val,
                          data: val,
                        },
                      })
                    }
                    placeholder="https://example.com"
                  />
                )}

                {/* Label */}
                <PropertyInput
                  label="Label (opcional)"
                  type="text"
                  value={selectedElement.qrCodeData?.label || ''}
                  onChange={(val) =>
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        label: val,
                      },
                    })
                  }
                  placeholder="Ex: Escaneie para ver o catálogo"
                />
              </div>
            </Section>

            <Section title="Personalização Visual" isOpen={true} onToggle={() => {}}>
              <div className="space-y-2">
                {/* Cor do QR Code */}
                <PropertyColor
                  label="Cor do QR Code"
                  value={selectedElement.qrCodeData?.color || '#000000'}
                  onChange={(val) =>
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        color: val,
                      },
                    })
                  }
                />

                {/* Cor de Fundo */}
                <PropertyColor
                  label="Cor de Fundo"
                  value={selectedElement.qrCodeData?.backgroundColor || '#FFFFFF'}
                  onChange={(val) =>
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        backgroundColor: val,
                      },
                    })
                  }
                />

                {/* Logo URL */}
                <PropertyInput
                  label="Logo Central (URL)"
                  type="text"
                  value={selectedElement.qrCodeData?.logo || ''}
                  onChange={(val) =>
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        logo: val,
                      },
                    })
                  }
                  placeholder="https://example.com/logo.png"
                />

                {/* Logo Size */}
                {selectedElement.qrCodeData?.logo && (
                  <PropertyInput
                    label="Tamanho do Logo"
                    type="number"
                    value={selectedElement.qrCodeData?.logoSize || 40}
                    onChange={(val) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          logoSize: Number(val),
                        },
                      })
                    }
                    suffix="px"
                  />
                )}

                {/* Margem */}
                <PropertyInput
                  label="Margem"
                  type="number"
                  value={selectedElement.qrCodeData?.margin ?? 4}
                  onChange={(val) =>
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        margin: Number(val),
                      },
                    })
                  }
                  suffix="px"
                />

                {/* Error Correction Level */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Correção de Erro
                  </label>
                  <select
                    value={selectedElement.qrCodeData?.errorCorrection || 'M'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          errorCorrection: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 focus:outline-none focus:border-gray-600 transition-colors"
                  >
                    <option value="L">Baixa (L) - 7%</option>
                    <option value="M">Média (M) - 15%</option>
                    <option value="Q">Alta (Q) - 25%</option>
                    <option value="H">Muito Alta (H) - 30%</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Qualidade de Renderização
                  </label>
                  <select
                    value={selectedElement.qrCodeData?.quality || 'medium'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          quality: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 focus:outline-none focus:border-gray-600 transition-colors"
                  >
                    <option value="low">Baixa (mais leve)</option>
                    <option value="medium">Média (padrão)</option>
                    <option value="high">Alta (para impressão)</option>
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Tracking e Métricas" isOpen={false} onToggle={() => {}}>
              <div className="space-y-2">
                {/* Track Scans Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-gray-500">Rastrear Escaneamentos</label>
                  <input
                    type="checkbox"
                    checked={selectedElement.qrCodeData?.trackScans || false}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        qrCodeData: {
                          ...selectedElement.qrCodeData,
                          trackScans: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 bg-gray-900/50 border border-gray-700/50 rounded cursor-pointer accent-gray-500"
                  />
                </div>

                {selectedElement.qrCodeData?.trackScans && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                    ℹ️ Os scans deste QR Code serão rastreados e estatísticas estarão disponíveis no dashboard.
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Actions - Sempre visível no final */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => duplicateElement(selectedElement.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-md text-xs font-medium text-gray-300 transition-colors"
            title="Duplicar (Cmd+D)"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicar
          </button>
          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-xs font-medium text-red-400 transition-colors"
            title="Excluir (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Section (Accordion)
interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: FC<SectionProps> = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-gray-800/20 rounded-lg border border-gray-700/30 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/20 transition-colors"
    >
      <span className="text-xs font-medium text-gray-300">{title}</span>
      {isOpen ? (
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
      )}
    </button>
    {isOpen && <div className="px-3 pb-3">{children}</div>}
  </div>
);

// Componente PropertyInput
interface PropertyInputProps {
  label: string;
  type: 'text' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
}

const PropertyInput: FC<PropertyInputProps> = ({ label, type, value, onChange, placeholder, suffix }) => (
  <div>
    <label className="block text-[10px] font-medium text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors pr-6"
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// Componente PropertySlider
interface PropertySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}

const PropertySlider: FC<PropertySliderProps> = ({ label, value, onChange, min, max, suffix }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-[10px] font-medium text-gray-500">{label}</label>
      <span className="text-[10px] font-medium text-gray-400">
        {value}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-gray-700/50 rounded-full appearance-none cursor-pointer accent-gray-500"
      style={{
        backgroundImage: `linear-gradient(to right, rgb(107 114 128) 0%, rgb(107 114 128) ${((value - min) / (max - min)) * 100}%, rgb(55 65 81 / 0.5) ${((value - min) / (max - min)) * 100}%, rgb(55 65 81 / 0.5) 100%)`
      }}
    />
  </div>
);

// Componente PropertyColor
interface PropertyColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const PropertyColor: FC<PropertyColorProps> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-medium text-gray-500 mb-1">{label}</label>
    <div className="flex gap-1.5">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 bg-transparent border border-gray-700/50 rounded cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-400 font-mono uppercase placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
      />
    </div>
  </div>
);

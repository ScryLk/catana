import { type FC, useState, useRef, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiFolder } from 'react-icons/fi';
import { ImageUploadSection } from './ImageUploadSection';
import { useComponentStore } from '../../store/componentStore';
import { useSidebarWidth } from '../../contexts/SidebarContext';
import type { CustomComponent } from '../../store/componentStore';
import { DIPACK_TEMPLATES } from '../../plugins/dipack';
import { Tooltip } from '../ui/Tooltip';

interface ComponentItem {
  id: string;
  name: string;
  icon: string;
  type: string;
  tooltip?: string;
}

// Elementos de Texto - Onde o usuário passa muito tempo
const textComponents: ComponentItem[] = [
  { id: 'title-main', name: 'Título Principal', icon: '📝', type: 'text-title', tooltip: 'Adicione um título grande e destacado' },
  { id: 'subtitle', name: 'Subtítulo', icon: '📄', type: 'text-subtitle', tooltip: 'Texto secundário para complementar títulos' },
  { id: 'paragraph', name: 'Parágrafo', icon: '📃', type: 'text-paragraph', tooltip: 'Bloco de texto editável para descrições' },
  { id: 'list', name: 'Lista', icon: '📑', type: 'text-list', tooltip: 'Lista de itens com marcadores' },
];

// Elementos de Imagem - Upload, IA, biblioteca
const imageComponents: ComponentItem[] = [
  { id: 'image-simple', name: 'Imagem Simples', icon: '🖼️', type: 'uploaded-image', tooltip: 'Adicione uma imagem do seu computador' },
  { id: 'banner', name: 'Banner', icon: '🎨', type: 'banner', tooltip: 'Banner grande para destaque visual' },
  { id: 'gallery', name: 'Galeria', icon: '🖼️', type: 'gallery', tooltip: 'Galeria com múltiplas imagens' },
  { id: 'carousel', name: 'Carrossel', icon: '🎠', type: 'carousel', tooltip: 'Carrossel de imagens com navegação' },
];

// Elementos de Produto - Core do Catana
const productComponents: ComponentItem[] = [
  { id: 'card-basic', name: 'Card Produto', icon: '📦', type: 'product-card', tooltip: 'Card com imagem, nome e especificações do produto' },
  { id: 'card-premium', name: 'Destaque Premium', icon: '⭐', type: 'product-highlight', tooltip: 'Destaque especial para produtos em promoção' },
  { id: 'list-compact', name: 'Lista Compacta', icon: '📋', type: 'product-list', tooltip: 'Lista vertical de produtos com informações básicas' },
  { id: 'grid-multiple', name: 'Grade de Produtos', icon: '🔲', type: 'product-grid', tooltip: 'Grade responsiva com múltiplos produtos' },
];

// Tabelas
const tableComponents: ComponentItem[] = [
  { id: 'data-table', name: 'Tabela de Dados', icon: '📊', type: 'data-table', tooltip: 'Tabela para exibir dados estruturados' },
  { id: 'tech-specs', name: 'Especificações', icon: '🔧', type: 'technical-specs', tooltip: 'Tabela de especificações técnicas do produto' },
];

// Ícones e Selos - Alta Resistência, Food Service, etc.
const iconComponents: ComponentItem[] = [
  { id: 'icon-grid', name: 'Grade de Ícones', icon: '🎯', type: 'icon-grid', tooltip: 'Grade de ícones com legendas' },
  { id: 'certification', name: 'Selo Certificação', icon: '✓', type: 'certification-badge', tooltip: 'Selo de certificação (ISO, CE, etc.)' },
  { id: 'feature-list', name: 'Lista de Features', icon: '⚡', type: 'feature-list', tooltip: 'Lista de características com ícones' },
];

// Linha / Divisor
const dividerComponents: ComponentItem[] = [
  { id: 'line', name: 'Linha', icon: '➖', type: 'shape-line', tooltip: 'Linha personalizável (sólida, tracejada, com setas)' },
  { id: 'divider', name: 'Divisor', icon: '━', type: 'divider', tooltip: 'Divisor decorativo para separar seções' },
];

// Bloco de destaque (callout)
const highlightComponents: ComponentItem[] = [
  { id: 'callout', name: 'Bloco Destaque', icon: '💬', type: 'highlight-callout', tooltip: 'Caixa de destaque para informações importantes' },
  { id: 'banner-highlight', name: 'Banner Destaque', icon: '🎯', type: 'highlight-banner', tooltip: 'Banner promocional com call-to-action' },
  { id: 'testimonial', name: 'Depoimento', icon: '💭', type: 'testimonial', tooltip: 'Caixa de depoimento de cliente' },
];

// QR Code - Muito forte para catálogos físicos
const specialComponents: ComponentItem[] = [
  { id: 'qr-code', name: 'QR Code', icon: '📱', type: 'qr-code', tooltip: 'QR Code personalizável para links ou informações' },
];

// Formas básicas
const shapeComponents: ComponentItem[] = [
  { id: 'rectangle', name: 'Retângulo', icon: '⬛', type: 'shape-rectangle', tooltip: 'Retângulo com bordas e cores personalizáveis' },
  { id: 'circle', name: 'Círculo', icon: '⚫', type: 'shape-circle', tooltip: 'Círculo perfeito com preenchimento' },
  { id: 'triangle', name: 'Triângulo', icon: '🔺', type: 'shape-triangle', tooltip: 'Triângulo para setas e decorações' },
  { id: 'square', name: 'Quadrado', icon: '🟦', type: 'shape-square', tooltip: 'Quadrado ou botão com bordas arredondadas' },
  { id: 'frame', name: 'Frame', icon: '🖼️', type: 'shape-frame', tooltip: 'Moldura decorativa para conteúdo' },
];

interface SectionProps {
  title: string;
  items: ComponentItem[];
  icon: string;
  defaultOpen?: boolean;
  highlighted?: boolean; // Para destacar seções importantes
  description?: string; // Breve descrição da seção
}

const Section: FC<SectionProps> = ({ title, items, icon, defaultOpen = false, highlighted = false, description }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleDragStart = (e: React.DragEvent, item: ComponentItem) => {
    e.dataTransfer.setData('componentType', item.type);
    e.dataTransfer.setData('componentName', item.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={`border-b ${highlighted ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 transition-colors ${highlighted
            ? 'hover:bg-primary-50'
            : 'hover:bg-gray-50'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="text-left">
            <div className={`font-semibold text-sm ${highlighted ? 'text-primary-900' : 'text-gray-900'}`}>
              {title}
            </div>
            {description && (
              <div className="text-xs text-gray-500 mt-0.5">{description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">{items.length}</span>
          <FiChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <Tooltip key={item.id} text={item.tooltip || item.name}>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={`bg-white border rounded-lg p-3 cursor-move transition-all group ${highlighted
                      ? 'border-primary-200 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-100'
                      : 'border-gray-200 hover:border-primary-500 hover:shadow-md'
                    }`}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-700 leading-tight">
                    {item.name}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomComponentSectionProps {
  onOpenManager: () => void;
}

const CustomComponentSection: FC<CustomComponentSectionProps> = ({ onOpenManager }) => {
  const { components } = useComponentStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, component: CustomComponent) => {
    e.dataTransfer.setData('componentType', 'custom-component');
    e.dataTransfer.setData('componentId', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const categoryIcons: Record<CustomComponent['category'], string> = {
    header: '📄',
    footer: '📋',
    section: '📦',
    card: '🎴',
    other: '🔧',
  };

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FiFolder className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-gray-900">Meus Componentes</span>
          <span className="text-xs text-gray-500">({components.length})</span>
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-gray-50 space-y-3">
          {components.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">Nenhum componente salvo</p>
              <button
                onClick={onOpenManager}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Criar primeiro componente
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {components.slice(0, 6).map((component) => (
                  <div
                    key={component.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component)}
                    className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:border-primary-500 hover:shadow-md transition-all group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      {categoryIcons[component.category]}
                    </div>
                    <div className="text-xs font-medium text-gray-700 leading-tight truncate">
                      {component.name}
                    </div>
                  </div>
                ))}
              </div>

              {components.length > 6 && (
                <button
                  onClick={onOpenManager}
                  className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                  Ver todos ({components.length})
                </button>
              )}

              <button
                onClick={onOpenManager}
                className="w-full text-xs bg-primary-600 text-white hover:bg-primary-700 rounded-lg py-2 font-medium transition-colors"
              >
                Gerenciar Componentes
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface EditorSidebarProps {
  onOpenComponentsManager: () => void;
}

export const EditorSidebar: FC<EditorSidebarProps> = ({ onOpenComponentsManager }) => {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [height, setHeight] = useState<number | null>(null); // null = tela inteira
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;

      if (isDraggingHorizontal) {
        const newWidth = e.clientX;
        const clampedWidth = Math.max(200, Math.min(newWidth, 500));
        setSidebarWidth(clampedWidth);
      }

      if (isDraggingVertical) {
        const newHeight = e.clientY;
        const clampedHeight = Math.max(300, Math.min(newHeight, window.innerHeight - 50));
        setHeight(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
      setIsDraggingVertical(false);
    };

    if (isDraggingHorizontal || isDraggingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal, isDraggingVertical, setSidebarWidth]);

  return (
    <aside
      ref={sidebarRef}
      className="bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0"
      style={{
        width: `${sidebarWidth}px`,
        height: height ? `${height}px` : '100vh'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🎨</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Elementos</h2>
            <p className="text-xs text-gray-500">Arraste para o canvas</p>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar elementos..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Seção de Upload de Imagem */}
        <ImageUploadSection />

        {/* Componentes Customizados */}
        <CustomComponentSection onOpenManager={onOpenComponentsManager} />

        {/* Elementos principais - organizados por prioridade/uso */}
        <Section
          title="Texto"
          items={textComponents}
          icon="✏️"
          defaultOpen={true}
          highlighted={true}
          description="Títulos, subtítulos e parágrafos"
        />
        <Section
          title="Imagem"
          items={imageComponents}
          icon="🖼️"
          highlighted={true}
          description="Upload, IA e biblioteca"
        />
        <Section
          title="Produto"
          items={productComponents}
          icon="📦"
          defaultOpen={true}
          highlighted={true}
          description="Core do Catana - Itens do catálogo"
        />
        <Section
          title="Tabelas"
          items={tableComponents}
          icon="📊"
          description="Dados e especificações técnicas"
        />
        <Section
          title="Ícones & Selos"
          items={iconComponents}
          icon="🎯"
          description="Certificações e features"
        />
        <Section
          title="Linha & Divisor"
          items={dividerComponents}
          icon="➖"
          description="Separadores visuais"
        />
        <Section
          title="Blocos de Destaque"
          items={highlightComponents}
          icon="💬"
          description="Callouts e destaques"
        />
        <Section
          title="QR Code"
          items={specialComponents}
          icon="📱"
          highlighted={true}
          description="Forte para catálogos físicos"
        />
        <Section
          title="Formas"
          items={shapeComponents}
          icon="🔷"
          description="Elementos geométricos básicos"
        />

        {/* Templates DiPACK Section */}
        <Section
          title="📑 Templates DiPACK"
          items={Object.values(DIPACK_TEMPLATES).map(template => ({
            id: template.id,
            name: template.name,
            icon: template.icon,
            type: template.id
          }))}
          icon="📑"
        />
      </div>

      {/* Resize Handle - Horizontal (Right) */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500 transition-colors ${isDraggingHorizontal ? 'bg-primary-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsDraggingHorizontal(true)}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full hover:bg-primary-500 transition-colors" />
      </div>

      {/* Resize Handle - Vertical (Bottom) */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary-500 transition-colors group ${isDraggingVertical ? 'bg-primary-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsDraggingVertical(true)}
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full group-hover:bg-white transition-colors" />
      </div>
    </aside>
  );
};

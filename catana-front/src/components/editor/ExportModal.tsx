import { type FC, useState } from 'react';
import { FiX, FiDownload, FiCheck, FiAlertCircle, FiImage, FiFileText } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';
import { pdfExportService } from '../../services/pdfExportService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportSettings {
  quality: number;
  scale: number;
  compress: boolean;
  selectedPages: string[];
  fileName: string;
}

export const ExportModal: FC<Props> = ({ isOpen, onClose }) => {
  const { pages, catalogName } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [settings, setSettings] = useState<ExportSettings>({
    quality: 0.95,
    scale: 2,
    compress: true,
    selectedPages: pages.map(p => p.id),
    fileName: catalogName || 'catalogo'
  });

  // Validate before export
  const validateExport = (): boolean => {
    const errors: string[] = [];

    // Check if pages are selected
    if (settings.selectedPages.length === 0) {
      errors.push('Selecione pelo menos uma página para exportar');
    }

    // Check for empty pages
    const emptyPages = pages.filter(p =>
      settings.selectedPages.includes(p.id) && p.elements.length === 0
    );
    if (emptyPages.length > 0) {
      errors.push(`${emptyPages.length} página(s) vazia(s) detectada(s)`);
    }

    // Check for images without source
    pages.forEach((page, idx) => {
      if (!settings.selectedPages.includes(page.id)) return;

      const imagesWithoutSource = page.elements.filter(el =>
        (el.type === 'uploaded-image' || el.type === 'image') &&
        !el.content?.assetId && !el.imageUrl
      );

      if (imagesWithoutSource.length > 0) {
        errors.push(`Página ${idx + 1}: ${imagesWithoutSource.length} imagem(ns) sem fonte`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleExport = async () => {
    if (!validateExport()) {
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress (since html2canvas doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await pdfExportService.generatePDF('pdf-preview-container', {
        fileName: `${settings.fileName}.pdf`,
        quality: settings.quality,
        scale: settings.scale,
        compress: settings.compress
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Close modal after success
      setTimeout(() => {
        onClose();
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  const togglePage = (pageId: string) => {
    setSettings(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.includes(pageId)
        ? prev.selectedPages.filter(id => id !== pageId)
        : [...prev.selectedPages, pageId]
    }));
  };

  const selectAllPages = () => {
    setSettings(prev => ({
      ...prev,
      selectedPages: pages.map(p => p.id)
    }));
  };

  const deselectAllPages = () => {
    setSettings(prev => ({
      ...prev,
      selectedPages: []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[800px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exportar PDF</h2>
            <p className="text-sm text-gray-600 mt-1">Configure as opções de exportação</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            disabled={isExporting}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFileText className="inline w-4 h-4 mr-2" />
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={settings.fileName}
              onChange={(e) => setSettings(prev => ({ ...prev, fileName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="nome-do-catalogo"
              disabled={isExporting}
            />
            <p className="text-xs text-gray-500 mt-1">O arquivo será salvo como "{settings.fileName}.pdf"</p>
          </div>

          {/* Quality Settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiImage className="inline w-4 h-4 mr-2" />
                Qualidade ({Math.round(settings.quality * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                className="w-full"
                disabled={isExporting}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Menor tamanho</span>
                <span>Melhor qualidade</span>
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala ({settings.scale}x)
              </label>
              <select
                value={settings.scale}
                onChange={(e) => setSettings(prev => ({ ...prev, scale: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isExporting}
              >
                <option value="1">1x (Rápido)</option>
                <option value="2">2x (Recomendado)</option>
                <option value="3">3x (Alta qualidade)</option>
                <option value="4">4x (Máxima qualidade)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Maior escala = melhor resolução</p>
            </div>
          </div>

          {/* Compress */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-700">Comprimir PDF</span>
                <p className="text-xs text-gray-500 mt-1">Reduz o tamanho do arquivo final</p>
              </div>
              <input
                type="checkbox"
                checked={settings.compress}
                onChange={(e) => setSettings(prev => ({ ...prev, compress: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                disabled={isExporting}
              />
            </label>
          </div>

          {/* Page Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Páginas para Exportar ({settings.selectedPages.length}/{pages.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPages}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  disabled={isExporting}
                >
                  Selecionar Todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={deselectAllPages}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  disabled={isExporting}
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {pages.map((page, idx) => {
                const isSelected = settings.selectedPages.includes(page.id);
                const isEmpty = page.elements.length === 0;

                return (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    disabled={isExporting}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${isEmpty ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          Página {idx + 1}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {page.name || `Página ${idx + 1}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {page.elements.length} elemento(s)
                        </div>
                      </div>
                      {isSelected && (
                        <FiCheck className="w-4 h-4 text-primary-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">Avisos</h4>
                  <ul className="space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-amber-700">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiImage className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Informações</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Formato: A4 (210 x 297 mm)</li>
                  <li>• Resolução: {settings.scale * 72} DPI aprox.</li>
                  <li>• Compressão: {settings.compress ? 'Ativada' : 'Desativada'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {isExporting && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Gerando PDF...</span>
                <span className="text-sm text-gray-600">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || settings.selectedPages.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import type { FC } from 'react';
import { useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';
import { HeaderFooter } from './HeaderFooter';
import { ElementRenderer } from './ElementRenderer';
import { pdfExportService } from '../../services/pdfExportService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PDFPreviewModal: FC<Props> = ({ isOpen, onClose }) => {
  const { pages, catalogName } = useEditorStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // We need to target the preview content for export
      // The preview content has the class 'pdf-preview-content'
      // We can add an ID to it for easier targeting
      await pdfExportService.generatePDF('pdf-preview-container', {
        fileName: `${catalogName || 'catalogo'}.pdf`
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Preview do PDF</h2>
            <p className="text-sm text-gray-600 mt-1">{String(catalogName || 'Catálogo')} - {pages.length} página(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - PDF Preview */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100 relative">
          <div
            id="pdf-preview-container"
            className="pdf-preview-content max-w-[800px] mx-auto space-y-8"
          >
            {pages.map((page, index) => {
              return (
                <div key={page.id} className="bg-white shadow-xl rounded-lg">
                  {/* Page Content */}
                  <div
                    className="pdf-page-content relative w-full aspect-[210/297] bg-white overflow-visible"
                    data-page-id={page.id}
                  >
                    {/* Header */}
                    {page.header?.enabled && (
                      <div className="absolute top-0 left-0 right-0 z-10">
                        <HeaderFooter
                          config={page.header}
                          type="header"
                          currentPage={index + 1}
                          totalPages={pages.length}
                          catalogName={catalogName}
                        />
                      </div>
                    )}

                    {/* Footer */}
                    {page.footer?.enabled && (
                      <div className="absolute bottom-0 left-0 right-0 z-10">
                        <HeaderFooter
                          config={page.footer}
                          type="footer"
                          currentPage={index + 1}
                          totalPages={pages.length}
                          catalogName={catalogName}
                        />
                      </div>
                    )}

                    {page.elements
                      .filter(el => !el.groupId || el.isGroup) // Only render top-level elements and groups
                      .map((element) => {
                        const isDiPackTemplate = element.type.startsWith('dipack-');

                        const elementStyle = isDiPackTemplate ? {
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                        } : {
                          left: `${(element.position.x / 794) * 100}%`,
                          top: `${(element.position.y / 1123) * 100}%`,
                          width: `${(element.size.width / 794) * 100}%`,
                          height: `${(element.size.height / 1123) * 100}%`,
                        };

                        return (
                          <div
                            key={element.id}
                            className="absolute"
                            style={{
                              ...elementStyle,
                              transform: `rotate(${element.rotation || 0}deg)`,
                              opacity: element.style?.opacity ?? 1,
                              visibility: element.visible === false ? 'hidden' : 'visible',
                              overflow: 'visible',
                            }}
                          >
                            <ElementRenderer element={element} isPDF={false} />
                          </div>
                        );
                      })}

                    {page.elements.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Página vazia
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

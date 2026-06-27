import { type FC } from 'react';
import { FiX, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';
import { useAssetStore } from '../../store/assetStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PagesManagerModal: FC<Props> = ({ isOpen, onClose }) => {
  const { pages, currentPageId, setCurrentPage, addPage, deletePage } = useEditorStore();
  const { getAsset } = useAssetStore();

  if (!isOpen) return null;

  const handleSelectPage = (pageId: string) => {
    setCurrentPage(pageId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Páginas</h2>
            <p className="text-sm text-gray-600 mt-1">{pages.length} página(s) no catálogo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addPage()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Nova Página
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Pages Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className={`group relative bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-xl cursor-pointer ${currentPageId === page.id
                    ? 'border-primary-500 ring-4 ring-primary-100'
                    : 'border-gray-200 hover:border-primary-300'
                  }`}
                onClick={() => handleSelectPage(page.id)}
              >
                {/* Page Number Badge */}
                <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-gray-900/80 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                  Página {index + 1}
                </div>

                {/* Current Page Badge */}
                {currentPageId === page.id && (
                  <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                    Atual
                  </div>
                )}

                {/* Page Preview */}
                <div className="relative w-full aspect-[210/297] bg-gray-50">
                  {/* Mini Canvas */}
                  <div className="absolute inset-0 p-2">
                    <div className="w-full h-full bg-white shadow-inner rounded relative">
                      {page.elements.map((element) => (
                        <div
                          key={element.id}
                          className="absolute overflow-hidden"
                          style={{
                            left: `${(element.position.x / 800) * 100}%`,
                            top: `${(element.position.y / 1000) * 100}%`,
                            width: `${(element.size.width / 800) * 100}%`,
                            height: `${(element.size.height / 1000) * 100}%`,
                            backgroundColor: element.type !== 'uploaded-image' ? (element.style?.backgroundColor || '#E5E7EB') : 'transparent',
                            borderRadius: element.style?.borderRadius ? `${element.style.borderRadius * 0.5}px` : undefined,
                            opacity: 0.8,
                          }}
                        >
                          {element.type === 'uploaded-image' && element.content?.assetId && (
                            <img
                              src={getAsset(element.content.assetId)?.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}

                      {page.elements.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          Página vazia
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Page Info */}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {page.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {page.elements.length} elemento(s)
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPage(page.id);
                        }}
                        className="p-1.5 hover:bg-primary-100 rounded text-primary-600"
                        title="Editar"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar "${page.name}"?`)) {
                              deletePage(page.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600"
                          title="Deletar"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/5 transition-all pointer-events-none" />
              </div>
            ))}

            {/* Add New Page Card */}
            <button
              onClick={() => addPage()}
              className="group relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl aspect-[210/297] hover:border-primary-500 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FiPlus className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700 group-hover:text-primary-700">
                  Adicionar Página
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Página {pages.length + 1}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Clique em uma página para editá-la
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

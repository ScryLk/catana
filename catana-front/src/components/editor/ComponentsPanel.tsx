import { type FC } from 'react';
import { FiTrash2, FiPackage, FiCheck } from 'react-icons/fi';
import { useComponentStore } from '../../store/componentStore';
import { useEditorStore } from '../../store/editorStore';
import type { CustomComponent } from '../../store/componentStore';

export const ComponentsPanel: FC = () => {
  const { components, deleteComponent } = useComponentStore();
  const { pages, currentPageId, getCurrentPage } = useEditorStore();

  const categories: { value: CustomComponent['category']; label: string; icon: string }[] = [
    { value: 'header', label: 'Cabeçalhos', icon: '📄' },
    { value: 'footer', label: 'Rodapés', icon: '📋' },
    { value: 'section', label: 'Seções', icon: '📦' },
    { value: 'card', label: 'Cards', icon: '🎴' },
    { value: 'other', label: 'Outros', icon: '🔧' },
  ];

  // Pegar elementos da página atual
  const currentPage = getCurrentPage();
  const currentElements = currentPage?.elements || [];

  // Verificar quais componentes estão no canvas
  const getComponentUsageInCanvas = (componentId: string) => {
    let count = 0;
    const pageNames: string[] = [];

    pages.forEach((page) => {
      const elementsInPage = page.elements.filter((el) => el.componentId === componentId);
      if (elementsInPage.length > 0) {
        count += elementsInPage.length;
        pageNames.push(page.name);
      }
    });

    return { count, pageNames: [...new Set(pageNames)] };
  };

  // Função para obter o ícone do tipo de elemento
  const getElementIcon = (type: string) => {
    if (type.startsWith('text-')) return '📝';
    if (type.startsWith('shape-')) return '🔷';
    if (type.startsWith('product-')) return '🛍️';
    if (type === 'image' || type === 'uploaded-image') return '🖼️';
    if (type === 'qr-code') return '📱';
    if (type.startsWith('dipack-')) return '📦';
    return '📄';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Components List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Elementos no Canvas */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 px-1">
            Elementos no Canvas ({currentElements.length})
          </h3>
          {currentElements.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-600 px-4">
              <FiPackage className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Nenhum elemento na página</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentElements.map((element) => (
                <div
                  key={element.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
                >
                  <span className="text-base">{getElementIcon(element.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {element.name || element.type}
                    </p>
                    {element.componentName && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        De: {element.componentName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divisor */}
        {components.length > 0 && (
          <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />
        )}

        {/* Componentes Salvos */}
        {components.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 px-1">
              Componentes Salvos ({components.length})
            </h3>
          </div>
        )}

        {components.length === 0 ? null : (
          <div className="space-y-2">
            {components.map((component) => {
              const usage = getComponentUsageInCanvas(component.id);
              const isInCanvas = usage.count > 0;

              return (
                <div
                  key={component.id}
                  className="group relative bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                {/* Component Preview */}
                <div className="relative w-full aspect-video bg-white dark:bg-zinc-900 p-2">
                  <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                    {component.thumbnail ? (
                      <img
                        src={component.thumbnail}
                        alt={component.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-3xl opacity-30">
                        {categories.find((c) => c.value === component.category)?.icon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Component Info */}
                <div className="p-2 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-xs truncate">
                          {component.name}
                        </h4>
                        <span className="text-xs opacity-50">
                          {categories.find((c) => c.value === component.category)?.icon}
                        </span>
                        {isInCanvas && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                            <FiCheck className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {component.elements.length} elemento(s)
                      </p>
                      {isInCanvas && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          No canvas: {usage.pageNames.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deletar "${component.name}"?`)) {
                          deleteComponent(component.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Deletar"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Drag Overlay */}
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('componentType', 'custom-component');
                    e.dataTransfer.setData('componentId', component.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="absolute inset-0 cursor-move opacity-0 hover:opacity-100 transition-opacity bg-zinc-900/80 dark:bg-zinc-100/80 flex items-center justify-center"
                >
                  <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg shadow-lg font-medium text-xs text-zinc-900 dark:text-zinc-100">
                    Arraste para o canvas
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          {currentElements.length} elemento(s) na página
          {components.length > 0 && (
            <span className="ml-1">
              • {components.length} salvos
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

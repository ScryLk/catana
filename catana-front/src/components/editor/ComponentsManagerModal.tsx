import { type FC, useState } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { useComponentStore } from '../../store/componentStore';

import type { CustomComponent } from '../../store/componentStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentsManagerModal: FC<Props> = ({ isOpen, onClose }) => {
  const { components, deleteComponent } = useComponentStore();

  const [selectedCategory, setSelectedCategory] = useState<CustomComponent['category']>('header');

  if (!isOpen) return null;

  const categories: { value: CustomComponent['category']; label: string; icon: string }[] = [
    { value: 'header', label: 'Cabeçalhos', icon: '📄' },
    { value: 'footer', label: 'Rodapés', icon: '📋' },
    { value: 'section', label: 'Seções', icon: '📦' },
    { value: 'card', label: 'Cards', icon: '🎴' },
    { value: 'other', label: 'Outros', icon: '🔧' },
  ];

  const filteredComponents = components.filter((comp) => comp.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meus Componentes</h2>
            <p className="text-sm text-gray-600 mt-1">{components.length} componente(s) salvos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${selectedCategory === cat.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="text-xs opacity-75">
                ({components.filter((c) => c.category === cat.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Content - Components Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredComponents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg font-medium">Nenhum componente nesta categoria</p>
              <p className="text-sm mt-2">Selecione elementos no canvas e salve como componente</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-xl hover:border-primary-300"
                >
                  {/* Component Preview */}
                  <div className="relative w-full aspect-video bg-gray-50 p-4">
                    <div className="w-full h-full bg-white shadow-inner rounded flex items-center justify-center">
                      {component.thumbnail ? (
                        <img
                          src={component.thumbnail}
                          alt={component.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-4xl opacity-50">
                          {categories.find((c) => c.value === component.category)?.icon}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Component Info */}
                  <div className="p-3 bg-white border-t border-gray-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {component.name}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {component.elements.length} elemento(s)
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (confirm(`Deletar "${component.name}"?`)) {
                              deleteComponent(component.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Deletar"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    className="absolute inset-0 cursor-move opacity-0 hover:opacity-100 transition-opacity bg-primary-500/10 flex items-center justify-center"
                  >
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                      Arraste para o canvas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Arraste os componentes para o canvas para utilizá-los
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

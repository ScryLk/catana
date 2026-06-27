import { type FC, useState, useRef, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiFolder, FiMove, FiMinus, FiEdit2, FiCopy, FiTrash2 } from 'react-icons/fi';
import { ImageUploadSection } from './ImageUploadSection';
import { useComponentStore } from '../../store/componentStore';
import { usePanelContext } from '../../contexts/PanelContext';
import type { CustomComponent } from '../../store/componentStore';

interface ComponentItem {
  id: string;
  name: string;
  icon: string;
  type: string;
}

const productComponents: ComponentItem[] = [
  { id: 'card-basic', name: 'Card Produto Básico', icon: '📦', type: 'product-card' },
  { id: 'card-premium', name: 'Card Destaque Premium', icon: '⭐', type: 'product-highlight' },
  { id: 'list-compact', name: 'Lista Produto Compacto', icon: '📋', type: 'product-list' },
  { id: 'grid-multiple', name: 'Grid Produto Múltiplos', icon: '🔲', type: 'product-grid' },
];

const imageComponents: ComponentItem[] = [
  { id: 'image-simple', name: 'Imagem Simples', icon: '🖼️', type: 'image' },
  { id: 'banner', name: 'Banner', icon: '🎨', type: 'banner' },
  { id: 'gallery', name: 'Galeria', icon: '🖼️', type: 'gallery' },
  { id: 'carousel', name: 'Carrossel', icon: '🎠', type: 'carousel' },
];

const textComponents: ComponentItem[] = [
  { id: 'title-main', name: 'Título Principal', icon: '📝', type: 'text-title' },
  { id: 'subtitle', name: 'Subtítulo', icon: '📄', type: 'text-subtitle' },
  { id: 'paragraph', name: 'Parágrafo', icon: '📃', type: 'text-paragraph' },
  { id: 'list', name: 'Lista', icon: '📑', type: 'text-list' },
];

const shapeComponents: ComponentItem[] = [
  { id: 'rectangle', name: 'Retângulo', icon: '⬛', type: 'shape-rectangle' },
  { id: 'circle', name: 'Círculo', icon: '⚫', type: 'shape-circle' },
  { id: 'triangle', name: 'Triângulo', icon: '🔺', type: 'shape-triangle' },
  { id: 'line', name: 'Linha', icon: '➖', type: 'shape-line' },
  { id: 'square', name: 'Botão', icon: '🟦', type: 'shape-square' },
  { id: 'frame', name: 'Frame', icon: '🖼️', type: 'shape-frame' },
];

interface SectionProps {
  title: string;
  items: ComponentItem[];
  icon: string;
  defaultOpen?: boolean;
}

const Section: FC<SectionProps> = ({ title, items, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleDragStart = (e: React.DragEvent, item: ComponentItem) => {
    e.dataTransfer.setData('componentType', item.type);
    e.dataTransfer.setData('componentName', item.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-2 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:border-primary-500 hover:shadow-md transition-all group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-xs font-medium text-gray-700 leading-tight">
                  {item.name}
                </div>
              </div>
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
  const { components, deleteComponent, updateComponent } = useComponentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, component: CustomComponent) => {
    e.dataTransfer.setData('componentType', 'custom-component');
    e.dataTransfer.setData('componentId', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleContextMenu = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este componente?')) {
      deleteComponent(id);
    }
  };

  const handleRename = (id: string) => {
    const component = components.find(c => c.id === id);
    if (!component) return;

    const newName = prompt('Novo nome:', component.name);
    if (newName && newName.trim()) {
      updateComponent(id, { name: newName.trim() });
    }
  };

  const handleDuplicate = (id: string) => {
    const component = components.find(c => c.id === id);
    if (!component) return;

    const { addComponent } = useComponentStore.getState();
    addComponent({
      name: `${component.name} (cópia)`,
      category: component.category,
      elements: component.elements,
    });
  };

  const categoryIcons: Record<CustomComponent['category'], string> = {
    header: '📄',
    footer: '📋',
    section: '📦',
    card: '🎴',
    other: '🔧',
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [contextMenu]);

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
                    onContextMenu={(e) => handleContextMenu(e, component.id)}
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[180px] bg-white rounded-lg shadow-2xl border border-gray-200 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleRename(contextMenu.componentId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FiEdit2 className="w-4 h-4" />
            Renomear
          </button>
          <button
            onClick={() => {
              handleDuplicate(contextMenu.componentId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FiCopy className="w-4 h-4" />
            Duplicar
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              handleDelete(contextMenu.componentId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
};

interface ComponentsFloatingPanelProps {
  onOpenComponentsManager: () => void;
}

export const ComponentsFloatingPanel: FC<ComponentsFloatingPanelProps> = ({ onOpenComponentsManager }) => {
  const { minimizedPanels, togglePanel } = usePanelContext();
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [size, setSize] = useState({ width: 320, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }

      if (isResizingHorizontal) {
        const newWidth = e.clientX - position.x;
        const clampedWidth = Math.max(280, Math.min(newWidth, 600));
        setSize((prev) => ({ ...prev, width: clampedWidth }));
      }

      if (isResizingVertical) {
        const newHeight = e.clientY - position.y;
        const clampedHeight = Math.max(400, Math.min(newHeight, window.innerHeight - position.y - 20));
        setSize((prev) => ({ ...prev, height: clampedHeight }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingHorizontal(false);
      setIsResizingVertical(false);
    };

    if (isDragging || isResizingHorizontal || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizingHorizontal, isResizingVertical, dragOffset, position]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Don't render if minimized
  if (minimizedPanels.components) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 40,
      }}
    >
      {/* Header - Draggable */}
      <div
        className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between cursor-move rounded-t-lg"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <FiMove className="w-4 h-4" style={{ color: '#ffffff' }} />
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>Componentes</h2>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePanel('components');
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="p-1 hover:bg-primary-700 rounded transition-colors"
          title="Minimizar"
        >
          <FiMinus className="w-4 h-4" style={{ color: '#ffffff' }} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar componentes..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Sections - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ImageUploadSection />
        <CustomComponentSection onOpenManager={onOpenComponentsManager} />
        <Section title="Produtos" items={productComponents} icon="📦" defaultOpen={true} />
        <Section title="Imagens" items={imageComponents} icon="🖼️" />
        <Section title="Texto" items={textComponents} icon="📝" />
        <Section title="Formas" items={shapeComponents} icon="🔷" />

        {/* Templates Section */}
        <div className="border-b border-gray-200">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-lg">📑</span>
              <span className="font-semibold text-gray-900">Templates</span>
            </div>
            <FiChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Resize Handle - Horizontal (Right) */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500 transition-colors ${isResizingHorizontal ? 'bg-primary-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsResizingHorizontal(true)}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full hover:bg-primary-500 transition-colors" />
      </div>

      {/* Resize Handle - Vertical (Bottom) */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary-500 transition-colors group ${isResizingVertical ? 'bg-primary-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsResizingVertical(true)}
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full group-hover:bg-white transition-colors" />
      </div>
    </div>
  );
};

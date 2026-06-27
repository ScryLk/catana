import { type FC, useState, useRef, useEffect } from 'react';
import { FiFolder, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiCopy, FiLayers, FiMinus } from 'react-icons/fi';
import { useComponentStore } from '../../store/componentStore';
import { usePanelContext } from '../../contexts/PanelContext';
import type { CustomComponent } from '../../store/componentStore';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateGroup: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  targetId?: string;
}

const ContextMenu: FC<ContextMenuProps> = ({ x, y, onClose, onCreateGroup, onDelete, onRename, onDuplicate, targetId }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[9999] min-w-[180px]"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => {
          onCreateGroup();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <FiPlus className="w-4 h-4" />
        Criar Grupo
      </button>

      {targetId && (
        <>
          <div className="border-t border-gray-200 my-1" />

          {onRename && (
            <button
              onClick={() => {
                onRename();
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FiEdit2 className="w-4 h-4" />
              Renomear
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => {
                onDuplicate();
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FiCopy className="w-4 h-4" />
              Duplicar
            </button>
          )}

          {onDelete && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Deletar
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export const GroupsPanel: FC = () => {
  const { components, addComponent, updateComponent, deleteComponent } = useComponentStore();
  const { minimizedPanels, togglePanel } = usePanelContext();
  const [height, setHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId?: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Grupos são componentes com category 'other' (você pode criar uma categoria específica se preferir)
  const groups = components.filter(c => c.category === 'other');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;

      const newHeight = window.innerHeight - e.clientY;

      // Limitar altura mínima e máxima
      const clampedHeight = Math.max(200, Math.min(newHeight, window.innerHeight - 100));
      setHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleContextMenu = (e: React.MouseEvent, groupId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId: groupId });
  };

  const handleCreateGroup = () => {
    const groupName = prompt('Nome do grupo:');
    if (!groupName) return;

    addComponent({
      name: groupName,
      category: 'other',
      elements: [],
    });
  };

  const handleRename = (id: string) => {
    const group = components.find(c => c.id === id);
    if (!group) return;

    setEditingId(id);
    setEditingName(group.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updateComponent(id, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este grupo?')) {
      deleteComponent(id);
    }
  };

  const handleDuplicate = (id: string) => {
    const group = components.find(c => c.id === id);
    if (!group) return;

    addComponent({
      name: `${group.name} (cópia)`,
      category: group.category,
      elements: group.elements,
    });
  };

  const handleDragStart = (e: React.DragEvent, component: CustomComponent) => {
    e.dataTransfer.setData('componentType', 'custom-component');
    e.dataTransfer.setData('componentId', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Don't render if minimized
  if (minimizedPanels.groups) return null;

  return (
    <>
      <div
        ref={panelRef}
        className="fixed bottom-0 left-6 bg-white rounded-t-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          width: '320px',
          height: `${height}px`,
        }}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary-500 transition-colors group ${isDragging ? 'bg-primary-500' : 'bg-transparent'
            }`}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full group-hover:bg-white transition-colors" />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <FiFolder className="w-4 h-4" style={{ color: '#ffffff' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#ffffff' }}>Grupos de Componentes</h3>
            <span className="text-xs" style={{ color: '#e9d5ff' }}>({groups.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateGroup}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 hover:bg-primary-700 rounded transition-colors"
              title="Criar novo grupo"
            >
              <FiPlus className="w-4 h-4" style={{ color: '#ffffff' }} />
            </button>
            <button
              onClick={() => togglePanel('groups')}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 hover:bg-primary-700 rounded transition-colors"
              title="Minimizar"
            >
              <FiMinus className="w-4 h-4" style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="overflow-y-auto" style={{ height: `${height - 60}px` }}>
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FiFolder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-2">Nenhum grupo criado</p>
              <p className="text-xs text-gray-400 mb-4">
                Clique com o botão direito para criar um grupo
              </p>
              <button
                onClick={handleCreateGroup}
                className="text-xs bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Criar Primeiro Grupo
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, group)}
                  onContextMenu={(e) => handleContextMenu(e, group.id)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-primary-500 hover:shadow-md transition-all group cursor-move"
                >
                  <div className="flex items-center justify-between mb-2">
                    {editingId === group.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveRename(group.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(group.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <FiLayers className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, group.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                    >
                      <FiMoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{group.elements.length} componentes</span>
                    <span>•</span>
                    <span>{new Date(group.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
          <p className="text-xs text-gray-500">
            Botão direito para opções • Arraste para usar
          </p>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetId={contextMenu.targetId}
          onClose={() => setContextMenu(null)}
          onCreateGroup={handleCreateGroup}
          onRename={contextMenu.targetId ? () => handleRename(contextMenu.targetId!) : undefined}
          onDelete={contextMenu.targetId ? () => handleDelete(contextMenu.targetId!) : undefined}
          onDuplicate={contextMenu.targetId ? () => handleDuplicate(contextMenu.targetId!) : undefined}
        />
      )}
    </>
  );
};

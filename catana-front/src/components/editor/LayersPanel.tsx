import { type FC, useState, useRef, useEffect } from 'react';
import { FiLayers, FiEye, FiEyeOff, FiLock, FiUnlock, FiChevronDown, FiChevronRight, FiTrash2, FiMinus, FiSearch, FiCopy, FiFolder, FiSave } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';
import { usePanelContext } from '../../contexts/PanelContext';
import type { CatalogElement } from '../../types/editor';
import { Tooltip } from '../ui/Tooltip';
import { SaveComponentModal } from './SaveComponentModal';

export const LayersPanel: FC = () => {
  const { getCurrentPage, selectedElementIds, setSelectedElement, toggleSelectElement, updateElement, deleteElement, duplicateElement, groupElements, ungroupElements } = useEditorStore();
  const { minimizedPanels, togglePanel } = usePanelContext();
  const currentPage = getCurrentPage();
  const elements = currentPage?.elements || [];

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 });
  const [size, setSize] = useState({ width: 320, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
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
        const clampedHeight = Math.max(300, Math.min(newHeight, window.innerHeight - position.y - 20));
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

  // Keyboard shortcuts (Figma-like)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete - Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => deleteElement(id));
      }

      // Ctrl/Cmd + D - Duplicate selected elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => duplicateElement(id));
      }

      // Ctrl/Cmd + G - Group selected elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey && selectedElementIds.length > 1) {
        e.preventDefault();
        groupElements(selectedElementIds);
      }

      // Ctrl/Cmd + Shift + G - Ungroup selected element
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G' && selectedElementIds.length === 1) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedElementIds[0]);
        if (element?.isGroup) {
          ungroupElements(selectedElementIds[0]);
        }
      }

      // Ctrl/Cmd + A - Select all elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.map((el) => el.id);
        useEditorStore.setState({ selectedElementIds: allIds });
      }

      // Escape - Clear selection or close context menu
      if (e.key === 'Escape') {
        e.preventDefault();
        if (contextMenu) {
          setContextMenu(null);
        } else if (selectedElementIds.length > 0) {
          useEditorStore.setState({ selectedElementIds: [], selectedElementId: null });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, elements, deleteElement, duplicateElement, groupElements, ungroupElements, contextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Helper functions
  const getElementIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'product-card': '📦',
      'product-highlight': '⭐',
      'product-list': '📋',
      'product-grid': '🔲',
      'text-title': '📝',
      'text-subtitle': '📄',
      'text-paragraph': '📃',
      'text-list': '📑',
      'shape-rectangle': '⬛',
      'shape-circle': '⚫',
      'shape-triangle': '🔺',
      'shape-line': '➖',
      'image': '🖼️',
      'uploaded-image': '🖼️',
      'qr-code': '📱',
      'banner': '🎨',
    };
    return iconMap[type] || '📄';
  };

  const getElementName = (el: CatalogElement) => {
    if (el.isGroup) {
      const children = elements.filter((child) => child.groupId === el.id);
      return `Grupo (${children.length})`;
    }
    return el.name || el.type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderElement = (element: CatalogElement, depth: number = 0) => {
    const isSelected = selectedElementIds.includes(element.id);
    const isGroup = element.isGroup;
    const isExpanded = expandedGroups.has(element.id);
    const children = isGroup ? elements.filter((el) => el.groupId === element.id) : [];

    // Filter by search
    const elementName = getElementName(element).toLowerCase();
    if (searchQuery && !elementName.includes(searchQuery.toLowerCase())) {
      return null;
    }

    return (
      <div key={element.id} className="group/item">
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-blue-50 ring-1 ring-blue-500 ring-inset'
              : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={(e) => {
            if (e.shiftKey) {
              toggleSelectElement(element.id);
            } else {
              setSelectedElement(element.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, elementId: element.id });
            if (!selectedElementIds.includes(element.id)) {
              setSelectedElement(element.id);
            }
          }}
        >
          {/* Selection Checkbox (Figma-style) */}
          <div className={`flex-shrink-0 ${isSelected || selectedElementIds.length > 1 ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} transition-opacity`}>
            <div
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-400 hover:border-gray-600'
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {/* Expand/Collapse for groups */}
          {isGroup ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup(element.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0 transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-3 h-3 text-gray-600" />
              ) : (
                <FiChevronRight className="w-3 h-3 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-3.5" />
          )}

          {/* Icon */}
          <span className="text-sm flex-shrink-0 opacity-70">
            {isGroup ? <FiLayers className="w-3.5 h-3.5 text-gray-700" /> : getElementIcon(element.type)}
          </span>

          {/* Name - Editable for groups */}
          {isGroup && editingGroupId === element.id ? (
            <input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              onBlur={() => {
                if (editingGroupName.trim()) {
                  updateElement(element.id, { name: editingGroupName.trim() });
                }
                setEditingGroupId(null);
                setEditingGroupName('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingGroupName.trim()) {
                    updateElement(element.id, { name: editingGroupName.trim() });
                  }
                  setEditingGroupId(null);
                  setEditingGroupName('');
                } else if (e.key === 'Escape') {
                  setEditingGroupId(null);
                  setEditingGroupName('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-xs px-1 py-0.5 border border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 text-xs truncate transition-colors ${
                isSelected ? 'text-gray-900 font-medium' : 'text-gray-700 font-normal'
              }`}
              onDoubleClick={(e) => {
                if (isGroup) {
                  e.stopPropagation();
                  setEditingGroupId(element.id);
                  setEditingGroupName(getElementName(element));
                }
              }}
            >
              {getElementName(element)}
            </span>
          )}

          {/* Actions - Figma-style subtle buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
            <Tooltip text={element.visible !== false ? 'Ocultar' : 'Mostrar'} position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { visible: !element.visible });
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {element.visible !== false ? (
                  <FiEye className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <FiEyeOff className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </Tooltip>
            <Tooltip text={element.locked ? 'Desbloquear' : 'Bloquear'} position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { locked: !element.locked });
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {element.locked ? (
                  <FiLock className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <FiUnlock className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Render children if group is expanded */}
        {isGroup && isExpanded && children.map((child) => renderElement(child, depth + 1))}
      </div>
    );
  };

  // Filter out child elements of groups and groups with no parent, sort by zIndex (reversed - top of list = highest z-index)
  const topLevelElements = elements
    .filter((el) => !el.groupId || el.isGroup)
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)); // Ascending order - elementos no topo da lista estão "na frente"

  // Don't render if minimized
  if (minimizedPanels.layers) return null;

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
        className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between cursor-move rounded-t-lg"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2 flex-1">
          <FiLayers className="w-4 h-4 text-gray-700" />
          <h3 className="font-semibold text-sm text-gray-900">Componentes</h3>
          <span className="text-xs text-gray-500">({elements.length})</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePanel('layers');
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Minimizar"
        >
          <FiMinus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar componentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Components List - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-white">
        {topLevelElements.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <FiLayers className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Nenhum componente</p>
            <p className="text-xs text-gray-400">
              Arraste elementos da sidebar<br />ou use as ferramentas da toolbar
            </p>
          </div>
        ) : (
          <div className="py-1">
            {topLevelElements.map((element) => renderElement(element))}
          </div>
        )}
      </div>

      {/* Multi-Select Action Bar */}
      {selectedElementIds.length > 1 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-t border-blue-700 px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-white">
                {selectedElementIds.length} selecionados
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip text="Criar Grupo" position="top">
              <button
                onClick={() => {
                  groupElements(selectedElementIds);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-xs font-medium"
              >
                <FiFolder className="w-3.5 h-3.5" />
                Agrupar
              </button>
            </Tooltip>
            <Tooltip text="Salvar como Componente" position="top">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-xs font-medium"
              >
                <FiSave className="w-3.5 h-3.5" />
                Salvar
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Footer - Shortcuts Info (Figma-style) */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5">
        {selectedElementIds.length === 0 ? (
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">Shift</kbd> + Click = Seleção múltipla •
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono ml-1">Right-click</kbd> = Menu
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-600">
              {selectedElementIds.length} {selectedElementIds.length === 1 ? 'selecionado' : 'selecionados'}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">Del</kbd>
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">⌘D</kbd>
              {selectedElementIds.length > 1 && (
                <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">⌘G</kbd>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle - Horizontal (Right) */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors ${isResizingHorizontal ? 'bg-blue-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsResizingHorizontal(true)}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full hover:bg-blue-500 transition-colors" />
      </div>

      {/* Resize Handle - Vertical (Bottom) */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500 transition-colors group ${isResizingVertical ? 'bg-blue-500' : 'bg-transparent'
          }`}
        onMouseDown={() => setIsResizingVertical(true)}
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full group-hover:bg-white transition-colors" />
      </div>

      {/* Context Menu (Figma-style) */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[9999] min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              duplicateElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <FiCopy className="w-4 h-4 text-gray-500" />
            <span>Duplicar</span>
            <span className="ml-auto text-xs text-gray-400">Ctrl+D</span>
          </button>

          {selectedElementIds.length > 1 && (
            <>
              <button
                onClick={() => {
                  groupElements(selectedElementIds);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FiFolder className="w-4 h-4 text-gray-500" />
                <span>Agrupar Seleção</span>
                <span className="ml-auto text-xs text-gray-400">Ctrl+G</span>
              </button>

              <button
                onClick={() => {
                  setIsSaveModalOpen(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FiSave className="w-4 h-4 text-gray-500" />
                <span>Salvar como Componente</span>
              </button>
            </>
          )}

          {selectedElementIds.length === 1 && elements.find(el => el.id === contextMenu.elementId)?.isGroup && (
            <button
              onClick={() => {
                ungroupElements(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FiLayers className="w-4 h-4 text-gray-500" />
              <span>Desagrupar</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+G</span>
            </button>
          )}

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={() => {
              updateElement(contextMenu.elementId, { visible: false });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <FiEyeOff className="w-4 h-4 text-gray-500" />
            <span>Ocultar</span>
          </button>

          <button
            onClick={() => {
              updateElement(contextMenu.elementId, { locked: true });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <FiLock className="w-4 h-4 text-gray-500" />
            <span>Bloquear</span>
          </button>

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={() => {
              if (confirm(`Deletar "${getElementName(elements.find(el => el.id === contextMenu.elementId)!)}\"?`)) {
                deleteElement(contextMenu.elementId);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Deletar</span>
            <span className="ml-auto text-xs text-red-400">Del</span>
          </button>
        </div>
      )}

      {/* Save Component Modal */}
      <SaveComponentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </div>
  );
};

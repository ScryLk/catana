import { create } from 'zustand';
import type { EditorStore, CatalogElement, CatalogPage, HeaderFooterConfig, CatalogState } from '../types/editor';
import type { DesignTokens } from '../types/designTokens';
import { DEFAULT_DESIGN_TOKENS } from '../types/designTokens';
import { exportCatalog, downloadCatalogJSON } from '../services/catalogIO.service';

const MAX_HISTORY = 50;

const createInitialPage = (): CatalogPage => ({
  id: `page-${Date.now()}`,
  name: 'Página 1',
  order: 0,
  elements: [],
});



export const useEditorStore = create<EditorStore>((set, get) => {
  const initialPage = createInitialPage();

  return {
    // Initial State
    pages: [initialPage],
    currentPageId: initialPage.id,
    selectedElementId: null,
    selectedElementIds: [],
    zoom: Math.max(25, Math.min(100, 75)),
    gridVisible: true,
    snapToGrid: true,
    gridSize: 8,
    catalogName: '',
    history: [[initialPage]],
    historyIndex: 0,
    rightSidebarTab: 'properties',
    interactionMode: 'select',
    activeTool: 'select',
    designTokens: undefined, // Tokens podem ser definidos via import ou manualmente

    // Helper to get current page
    getCurrentPage: () => {
      const state = get();
      return state.pages.find((p) => p.id === state.currentPageId);
    },

    // Element Actions
    addElement: (element, targetPageId?: string) => {
      console.log('[EditorStore] addElement chamado com:', element);

      const state = get();
      // Se targetPageId foi fornecido, usar ele; senão usar a página atual
      const targetPage = targetPageId
        ? state.pages.find(p => p.id === targetPageId)
        : state.getCurrentPage();

      if (!targetPage) {
        console.error('[EditorStore] Não há página de destino!', { targetPageId, currentPageId: state.currentPageId });
        return;
      }

      console.log('[EditorStore] Adicionando elemento à página:', targetPage.id, targetPage.name);

      // Fazer uma cópia profunda do content para evitar mutações
      const contentCopy = element.content ? JSON.parse(JSON.stringify(element.content)) : undefined;

      // Gerar nome automático baseado no tipo do elemento
      const getElementTypeName = (type: string): string => {
        const typeNames: Record<string, string> = {
          'shape-rectangle': 'Retângulo',
          'shape-circle': 'Círculo',
          'shape-triangle': 'Triângulo',
          'shape-line': 'Linha',
          'line': 'Linha',
          'text-paragraph': 'Texto',
          'text-title': 'Título',
          'text-subtitle': 'Subtítulo',
          'uploaded-image': 'Imagem',
          'image': 'Imagem',
          'qr-code': 'QR Code',
          'product-card': 'Produto',
          'banner': 'Banner',
        };
        return typeNames[type] || 'Elemento';
      };

      // Contar quantos elementos do mesmo tipo já existem
      const sameTypeElements = targetPage.elements.filter(el => el.type === element.type);
      const elementNumber = sameTypeElements.length + 1;
      const defaultName = `${getElementTypeName(element.type)} ${elementNumber}`;

      const newElement: CatalogElement = {
        ...element,
        ...(contentCopy !== undefined ? { content: contentCopy } : {}),
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: element.name || defaultName,
        pageId: targetPage.id,
        zIndex: targetPage.elements.length,
        visible: element.visible ?? true,
        locked: element.locked ?? false,
      };

      console.log('[EditorStore] Novo elemento criado:', newElement);
      console.log('[EditorStore] Content do elemento:', JSON.stringify(newElement.content));

      set((state) => {
        const newPages = state.pages.map((page) =>
          page.id === targetPage.id
            ? { ...page, elements: [...page.elements, newElement] }
            : page
        );

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: newElement.id,
        };
      });
    },

    updateElement: (id, updates) => {
      console.log('[EditorStore] updateElement chamado - id:', id, 'updates:', updates);
      set((state) => {
        const newPages = state.pages.map((page) => {
          const elements = page.elements.map((el) => {
            if (el.id === id) {
              const updated = { ...el, ...updates };
              console.log('[EditorStore] Elemento atualizado:', updated);
              return updated;
            }
            return el;
          });

          // Check if the updated element is part of a group
          const updatedElement = elements.find(el => el.id === id);
          if (updatedElement && updatedElement.groupId && (updates.position || updates.size)) {
            // Find the group
            const group = elements.find(el => el.id === updatedElement.groupId);
            if (group && group.isGroup) {
              // Get all children of the group
              const children = elements.filter(el => el.groupId === group.id);

              // Calculate new bounds
              let minX = Infinity;
              let minY = Infinity;
              let maxX = -Infinity;
              let maxY = -Infinity;

              children.forEach(child => {
                minX = Math.min(minX, child.position.x);
                minY = Math.min(minY, child.position.y);
                maxX = Math.max(maxX, child.position.x + child.size.width);
                maxY = Math.max(maxY, child.position.y + child.size.height);
              });

              // Update group bounds
              const groupIndex = elements.findIndex(el => el.id === group.id);
              if (groupIndex !== -1) {
                elements[groupIndex] = {
                  ...elements[groupIndex],
                  position: { x: minX, y: minY },
                  size: { width: maxX - minX, height: maxY - minY },
                };
              }
            }
          }

          return {
            ...page,
            elements,
          };
        });

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
        };
      });
    },

    deleteElement: (id) => {
      set((state) => {
        const newPages = state.pages.map((page) => ({
          ...page,
          elements: page.elements.filter((el) => el.id !== id),
        }));

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        };
      });
    },

    clearCurrentPage: () => {
      set((state) => {
        const currentPageId = state.currentPageId;
        const newPages = state.pages.map((page) =>
          page.id === currentPageId
            ? { ...page, elements: [] }
            : page
        );

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: null,
          selectedElementIds: [],
        };
      });
    },

    setSelectedElement: (id) => {
      set({ selectedElementId: id, selectedElementIds: id ? [id] : [] });
    },

    // Multi-selection Actions
    toggleSelectElement: (id) => {
      set((state) => {
        const isSelected = state.selectedElementIds.includes(id);
        const newSelectedIds = isSelected
          ? state.selectedElementIds.filter((elId) => elId !== id)
          : [...state.selectedElementIds, id];

        return {
          selectedElementIds: newSelectedIds,
          selectedElementId: newSelectedIds.length === 1 ? newSelectedIds[0] : null,
        };
      });
    },

    selectMultipleElements: (ids) => {
      set({
        selectedElementIds: ids,
        selectedElementId: ids.length === 1 ? ids[0] : null,
      });
    },

    clearSelection: () => {
      set({ selectedElementId: null, selectedElementIds: [] });
    },

    // Group Actions
    groupElements: (elementIds) => {
      const state = get();
      const currentPage = state.getCurrentPage();
      if (!currentPage || elementIds.length < 2) return;

      const elementsToGroup = currentPage.elements.filter((el) =>
        elementIds.includes(el.id)
      );

      if (elementsToGroup.length < 2) return;

      // Calculate bounding box for the group
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elementsToGroup.forEach((el) => {
        minX = Math.min(minX, el.position.x);
        minY = Math.min(minY, el.position.y);
        maxX = Math.max(maxX, el.position.x + el.size.width);
        maxY = Math.max(maxY, el.position.y + el.size.height);
      });

      const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create group element (invisible container)
      const groupElement: CatalogElement = {
        id: groupId,
        type: 'shape-rectangle',
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        style: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          opacity: 1
        },
        isGroup: true,
        children: elementIds,
        pageId: currentPage.id,
        zIndex: Math.max(...elementsToGroup.map((el) => el.zIndex || 0)),
      };

      set((state) => {
        const newPages = state.pages.map((page) => {
          if (page.id !== currentPage.id) return page;

          return {
            ...page,
            elements: [
              ...page.elements.map((el) =>
                elementIds.includes(el.id)
                  ? {
                    ...el,
                    groupId,
                    position: {
                      x: el.position.x - minX,
                      y: el.position.y - minY,
                    },
                  }
                  : el
              ),
              groupElement,
            ],
          };
        });

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: groupId,
          selectedElementIds: [groupId],
        };
      });
    },

    ungroupElements: (groupId) => {
      const state = get();
      const currentPage = state.getCurrentPage();
      if (!currentPage) return;

      const groupElement = currentPage.elements.find(
        (el) => el.id === groupId && el.isGroup
      );
      if (!groupElement || !groupElement.children) return;

      const groupPosition = groupElement.position;

      set((state) => {
        const newPages = state.pages.map((page) => {
          if (page.id !== currentPage.id) return page;

          return {
            ...page,
            elements: page.elements
              .map((el) => {
                if (el.groupId === groupId) {
                  return {
                    ...el,
                    groupId: undefined,
                    position: {
                      x: el.position.x + groupPosition.x,
                      y: el.position.y + groupPosition.y,
                    },
                  };
                }
                return el;
              })
              .filter((el) => el.id !== groupId),
          };
        });

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: null,
          selectedElementIds: groupElement.children || [],
        };
      });
    },

    duplicateElement: (id) => {
      const state = get();
      const currentPage = state.getCurrentPage();
      if (!currentPage) return;

      const element = currentPage.elements.find((el) => el.id === id);
      if (!element) return;

      const newElement: CatalogElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20,
        },
        zIndex: currentPage.elements.length,
      };

      set((state) => {
        const newPages = state.pages.map((page) =>
          page.id === currentPage.id
            ? { ...page, elements: [...page.elements, newElement] }
            : page
        );

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: newElement.id,
        };
      });
    },

    moveElement: (id, position) => {
      get().updateElement(id, { position });
    },

    resizeElement: (id, size) => {
      get().updateElement(id, { size });
    },

    updateElementStyle: (id, style) => {
      const state = get();
      const currentPage = state.getCurrentPage();
      if (!currentPage) return;

      const element = currentPage.elements.find((el) => el.id === id);
      if (!element) return;

      get().updateElement(id, {
        style: { ...element.style, ...style },
      });
    },

    // Page Actions
    addPage: (name) => {
      set((state) => {
        const newPage: CatalogPage = {
          id: `page-${Date.now()}`,
          name: name || `Página ${state.pages.length + 1}`,
          order: state.pages.length,
          elements: [],
        };

        const newPages = [...state.pages, newPage];
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        console.log('[EditorStore] addPage - Nova página criada:', newPage.id, 'Nome:', newPage.name);
        console.log('[EditorStore] addPage - currentPageId atual:', state.currentPageId);
        console.log('[EditorStore] addPage - Mudando para nova página:', newPage.id);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          currentPageId: newPage.id,
        };
      });
    },

    deletePage: (pageId) => {
      set((state) => {
        if (state.pages.length <= 1) return state; // Não deletar última página

        const pageIndex = state.pages.findIndex((p) => p.id === pageId);
        const newPages = state.pages.filter((p) => p.id !== pageId);

        // Se deletar página atual, mover para anterior ou próxima
        let newCurrentPageId = state.currentPageId;
        if (state.currentPageId === pageId) {
          const newIndex = Math.max(0, pageIndex - 1);
          newCurrentPageId = newPages[newIndex].id;
        }

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          currentPageId: newCurrentPageId,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
        };
      });
    },

    setCurrentPage: (pageId) => {
      const state = get();
      const targetPage = state.pages.find(p => p.id === pageId);
      console.log('[EditorStore] setCurrentPage chamado:');
      console.log('  - pageId:', pageId);
      console.log('  - Página encontrada:', targetPage?.name);
      console.log('  - Elementos na página:', targetPage?.elements.length || 0);

      // Log detalhado de todos os elementos
      if (targetPage && targetPage.elements.length > 0) {
        targetPage.elements.forEach((el, index) => {
          console.log(`  - Elemento ${index + 1}:`, {
            type: el.type,
            hasContent: !!el.content,
            hasProducts: !!el.content?.products,
            productsLength: el.content?.products?.length || 0,
            contentKeys: el.content ? Object.keys(el.content) : []
          });
        });
      }

      set({ currentPageId: pageId, selectedElementId: null });
    },

    reorderPages: (pageIds) => {
      set((state) => {
        const newPages = pageIds
          .map((id, index) => {
            const page = state.pages.find((p) => p.id === id);
            return page ? { ...page, order: index } : null;
          })
          .filter((p): p is CatalogPage => p !== null);

        return { pages: newPages };
      });
    },

    // Other Actions
    setZoom: (zoom) => {
      set({ zoom: Math.max(25, Math.min(100, zoom)) });
    },

    toggleGrid: () => {
      set((state) => ({ gridVisible: !state.gridVisible }));
    },

    toggleSnapToGrid: () => {
      set((state) => ({ snapToGrid: !state.snapToGrid }));
    },

    setInteractionMode: (mode) => {
      set({ interactionMode: mode });
    },

    setActiveTool: (tool) => {
      set({ activeTool: tool });
    },

    toggleSelection: (id, multi) => {
      set((state) => {
        const currentSelected = state.selectedElementIds || [];
        let newSelected: string[];

        if (multi) {
          if (currentSelected.includes(id)) {
            newSelected = currentSelected.filter((sid) => sid !== id);
          } else {
            newSelected = [...currentSelected, id];
          }
        } else {
          newSelected = [id];
        }

        return {
          selectedElementIds: newSelected,
          selectedElementId: newSelected.length === 1 ? newSelected[0] : null, // Maintain backward compatibility
        };
      });
    },



    moveSelectedElements: (dx, dy) => {
      set((state) => {
        const { selectedElementIds } = state;
        if (!selectedElementIds || selectedElementIds.length === 0) return state;

        const newPages = state.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) => {
            if (selectedElementIds.includes(el.id)) {
              return {
                ...el,
                position: {
                  x: el.position.x + dx,
                  y: el.position.y + dy,
                },
              };
            }
            return el;
          }),
        }));

        return { pages: newPages };
      });
    },

    deleteSelectedElements: () => {
      set((state) => {
        const { selectedElementIds } = state;
        if (!selectedElementIds || selectedElementIds.length === 0) return state;

        const newPages = state.pages.map((page) => ({
          ...page,
          elements: page.elements.filter((el) => !selectedElementIds.includes(el.id)),
        }));

        // Add to history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          selectedElementIds: [],
          selectedElementId: null,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
        };
      });
    },

    setCatalogName: (catalogName) => {
      set({ catalogName });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return {
            pages: state.history[newIndex],
            historyIndex: newIndex,
          };
        }
        return state;
      });
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return {
            pages: state.history[newIndex],
            historyIndex: newIndex,
          };
        }
        return state;
      });
    },

    setRightSidebarTab: (tab) => {
      set({ rightSidebarTab: tab });
    },

    toggleElementVisibility: (id) => {
      set((state) => {
        const newPages = state.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) =>
            el.id === id ? { ...el, visible: el.visible === false ? true : false } : el
          ),
        }));

        return { pages: newPages };
      });
    },

    toggleElementLock: (id) => {
      set((state) => {
        const newPages = state.pages.map((page) => ({
          ...page,
          elements: page.elements.map((el) =>
            el.id === id ? { ...el, locked: !el.locked } : el
          ),
        }));

        return { pages: newPages };
      });
    },

    clearCanvas: () => {
      const currentPage = get().getCurrentPage();
      if (!currentPage) return;

      set((state) => {
        const newPages = state.pages.map((page) =>
          page.id === currentPage.id ? { ...page, elements: [] } : page
        );

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newPages);

        return {
          pages: newPages,
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: newHistory.length - 1,
          selectedElementId: null,
        };
      });
    },

    // Header/Footer Actions
    updatePageHeader: (pageId, header) => {
      set((state) => {
        const newPages = state.pages.map((page) =>
          page.id === pageId
            ? { ...page, header: { ...page.header, ...header } as HeaderFooterConfig }
            : page
        );

        return { pages: newPages };
      });
    },

    updatePageFooter: (pageId, footer) => {
      set((state) => {
        const newPages = state.pages.map((page) =>
          page.id === pageId
            ? { ...page, footer: { ...page.footer, ...footer } as HeaderFooterConfig }
            : page
        );

        return { pages: newPages };
      });
    },

    togglePageHeader: (pageId, enabled) => {
      set((state) => {
        const newPages = state.pages.map((page) => {
          if (page.id !== pageId) return page;

          if (enabled && !page.header) {
            return {
              ...page,
              header: {
                enabled: true,
                height: 50,
                backgroundColor: '#F3F4F6',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 8,
                fields: [
                  {
                    id: crypto.randomUUID(),
                    type: 'catalog-name' as const,
                    prefix: '',
                    suffix: '',
                  },
                  {
                    id: crypto.randomUUID(),
                    type: 'page-of-total' as const,
                    prefix: 'Página ',
                    suffix: '',
                  },
                ],
                alignment: 'space-between' as const,
                fontSize: 12,
                fontFamily: 'Arial',
                textColor: '#374151',
              },
            };
          }

          return {
            ...page,
            header: page.header ? { ...page.header, enabled } : undefined,
          };
        });

        return { pages: newPages };
      });
    },

    togglePageFooter: (pageId, enabled) => {
      set((state) => {
        const newPages = state.pages.map((page) => {
          if (page.id !== pageId) return page;

          if (enabled && !page.footer) {
            return {
              ...page,
              footer: {
                enabled: true,
                height: 50,
                backgroundColor: '#F3F4F6',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 8,
                fields: [
                  {
                    id: crypto.randomUUID(),
                    type: 'catalog-name' as const,
                    prefix: '',
                    suffix: '',
                  },
                  {
                    id: crypto.randomUUID(),
                    type: 'page-of-total' as const,
                    prefix: 'Página ',
                    suffix: '',
                  },
                ],
                alignment: 'space-between' as const,
                fontSize: 12,
                fontFamily: 'Arial',
                textColor: '#374151',
              },
            };
          }

          return {
            ...page,
            footer: page.footer ? { ...page.footer, enabled } : undefined,
          };
        });

        return { pages: newPages };
      });
    },

    // Import/Export Actions
    exportCatalogToJSON: () => {
      const state = get();

      // Pegar organização e sede do localStorage
      const activeOrg = localStorage.getItem('active_organization');
      const activeSede = localStorage.getItem('active_sede');

      const organizationName = activeOrg ? JSON.parse(activeOrg).name : undefined;
      const sedeName = activeSede ? JSON.parse(activeSede).name : undefined;

      const schema = exportCatalog(state.pages, state.catalogName || 'Catálogo sem nome', {
        organization: organizationName,
        sede: sedeName,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        defaultZoom: state.zoom,
      });

      downloadCatalogJSON(schema);
    },

    importCatalogFromJSON: (pages, catalogName, settings) => {
      set((state) => {
        const newHistory = [pages];

        return {
          pages,
          catalogName,
          currentPageId: pages[0]?.id || state.currentPageId,
          history: newHistory,
          historyIndex: 0,
          selectedElementId: null,
          selectedElementIds: [],
          // Aplicar settings se fornecidos
          ...(settings?.gridSize !== undefined && { gridSize: settings.gridSize }),
          ...(settings?.snapToGrid !== undefined && { snapToGrid: settings.snapToGrid }),
          ...(settings?.defaultZoom !== undefined && { zoom: settings.defaultZoom }),
        };
      });
    },

    // Método para importar páginas de catálogos importados do backend
    importPages: (pages: CatalogPage[], catalogName: string, designTokens?: DesignTokens) => {
      set((state) => {
        const newHistory = [pages];

        return {
          pages,
          catalogName,
          currentPageId: pages[0]?.id || state.currentPageId,
          history: newHistory,
          historyIndex: 0,
          selectedElementId: null,
          selectedElementIds: [],
          designTokens: designTokens || state.designTokens,
        };
      });
    },

    loadCatalogState: (newState) => {
      set((state) => ({
        ...state,
        ...newState,
      }));
    },

    resetEditor: () => {
      const newInitialPage = createInitialPage();
      set({
        pages: [newInitialPage],
        currentPageId: newInitialPage.id,
        selectedElementId: null,
        selectedElementIds: [],
        zoom: 75,
        gridVisible: true,
        snapToGrid: true,
        gridSize: 8,
        catalogName: '',
        history: [[newInitialPage]],
        historyIndex: 0,
        rightSidebarTab: 'properties',
        interactionMode: 'select',
        activeTool: 'select',
        designTokens: undefined,
      });
    },

    // 🎨 Design Tokens Actions
    setDesignTokens: (tokens) => {
      set({ designTokens: tokens });
    },

    updateDesignTokens: (updates) => {
      set((state) => ({
        designTokens: state.designTokens
          ? { ...state.designTokens, ...updates }
          : { ...DEFAULT_DESIGN_TOKENS, ...updates },
      }));
    },

    resetDesignTokens: () => {
      set({ designTokens: undefined });
    },
  };
});

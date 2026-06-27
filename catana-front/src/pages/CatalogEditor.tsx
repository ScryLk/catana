import { type FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EditorHeader } from '../components/editor/EditorHeader';
import { FigmaHeader } from '../components/editor/FigmaHeader';
import { PhotoshopToolbar } from '../components/editor/PhotoshopToolbar';
import { FigmaToolbar } from '../components/editor/FigmaToolbar';
import { CompactPageIndicator } from '../components/editor/CompactPageIndicator';
import { InfiniteCanvas } from '../components/editor/InfiniteCanvas';
import { FigmaCanvasV2 as FigmaCanvas } from '../components/editor/FigmaCanvasV2';
import { PDFPreviewModal } from '../components/editor/PDFPreviewModal';
import { ExportModal } from '../components/editor/ExportModal';
import { PagesManagerModal } from '../components/editor/PagesManagerModal';
import { SaveComponentModal } from '../components/editor/SaveComponentModal';
import { UnifiedPanel } from '../components/editor/UnifiedPanelV2';
import { ShortcutsPanel } from '../components/editor/ShortcutsPanel';
import { ElementRenderer } from '../components/editor/ElementRenderer';
import { PanelProvider } from '../contexts/PanelContext';
import { UIProvider, useUIContext } from '../contexts/UIContext';
import { useEditorShortcuts } from '../hooks/useKeyboardShortcuts';
import { useFigmaInteractions } from '../hooks/useFigmaInteractions';
import { useEditorStore } from '../store/editorStore';
import { useAssetStore } from '../store/assetStore';
import {
  alignElements,
} from '../utils/alignmentHelpers';
import { loadImportedCatalog, isImportedCatalog } from '../services/catalogLoader.service';

const CatalogEditorContent: FC = () => {
  const location = useLocation();
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPagesManager, setShowPagesManager] = useState(false);
  const [showSaveComponent, setShowSaveComponent] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPhotoshopSidebar, setShowPhotoshopSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'ai' | 'library' | 'plugins' | 'templates'>('properties');
  const { uiVisible } = useUIContext();

  // Ativar interações Figma-like (atalhos de teclado, etc)
  useFigmaInteractions();

  const {
    pages,
    selectedElementIds,
    updateElement,
    deleteElement,
    duplicateElement,
    toggleGrid,
    toggleSnapToGrid,
    undo,
    redo,
    currentPageId,
    setCatalogName,
    resetEditor,
    importPages
  } = useEditorStore();

  // Initialize catalog from navigation state or reset for new catalog
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const catalogId = searchParams.get('catalog');
    const state = location.state as { catalogId?: number; catalogName?: string } | null;

    // Se não há catalogId na URL e não há state, é um novo catálogo
    if (!catalogId && !state?.catalogId) {
      resetEditor();
    } else if (catalogId) {
      // Verificar se é um catálogo importado (do backend)
      const numericCatalogId = parseInt(catalogId);

      isImportedCatalog(numericCatalogId)
        .then(isImported => {
          if (isImported) {
            // Carregar catálogo do backend
            console.log('[CatalogEditor] Carregando catálogo importado:', numericCatalogId);
            return loadImportedCatalog(numericCatalogId);
          }
          return null;
        })
        .then(loaded => {
          if (loaded) {
            console.log('[CatalogEditor] Catálogo importado carregado:', loaded.catalogName);
            console.log('[CatalogEditor] Páginas:', loaded.pages.length);
            console.log('[CatalogEditor] Design Tokens:', loaded.designTokens ? 'Sim' : 'Não');

            // Importar páginas para o EditorStore
            importPages(loaded.pages, loaded.catalogName, loaded.designTokens);
          } else if (state?.catalogName) {
            // Fallback: apenas definir nome se não foi importado
            setCatalogName(state.catalogName);
          }
        })
        .catch(error => {
          console.error('[CatalogEditor] Erro ao carregar catálogo importado:', error);
          // Fallback: resetar ou usar state
          if (state?.catalogName) {
            setCatalogName(state.catalogName);
          }
        });
    } else if (state?.catalogName) {
      setCatalogName(state.catalogName);
    }
  }, [location.search, location.state, setCatalogName, resetEditor, importPages]);

  const { } = useAssetStore();

  const currentPage = pages.find(p => p.id === useEditorStore.getState().currentPageId);
  const selectedElements = currentPage?.elements.filter(el =>
    selectedElementIds.includes(el.id)
  ) || [];

  // Alignment handlers
  const handleAlign = (alignType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const updates = alignElements(selectedElements, alignType);
    updates.forEach((position, id) => {
      updateElement(id, { position });
    });
  };

  /* Unused handlers
  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    const updates = distributeElements(selectedElements, type);
    updates.forEach((position, id) => {
      updateElement(id, { position });
    });
  };

  const handleMatchSize = (dimension: 'width' | 'height' | 'both') => {
    const updates = matchSize(selectedElements, dimension);
    updates.forEach((size, id) => {
      updateElement(id, { size });
    });
  };

  const handleArrangeGrid = () => {
    const columns = Math.ceil(Math.sqrt(selectedElements.length));
    const updates = arrangeInGrid(selectedElements, columns, 20);
    updates.forEach((position, id) => {
      updateElement(id, { position });
    });
  };
  */

  // Função para download direto de PDF - agora abre o modal de exportação
  const handleDownloadPDF = () => {
    // Abre o modal de exportação com opções avançadas
    setShowExportModal(true);
  };

  // Escutar evento de duplo clique para abrir painel de propriedades
  useEffect(() => {
    const handleOpenPropertiesPanel = () => {
      setActiveTab('properties');
      if (!showPhotoshopSidebar) {
        setShowPhotoshopSidebar(true);
      }
    };

    window.addEventListener('openPropertiesPanel', handleOpenPropertiesPanel);
    return () => {
      window.removeEventListener('openPropertiesPanel', handleOpenPropertiesPanel);
    };
  }, [showPhotoshopSidebar]);

  // Keyboard shortcuts
  useEditorShortcuts({
    onCopy: () => console.log('Copy'),
    onPaste: () => console.log('Paste'),
    onDuplicate: () => selectedElementIds.forEach(id => duplicateElement(id)),
    onDelete: () => selectedElementIds.forEach(id => deleteElement(id)),
    onUndo: undo,
    onRedo: redo,
    onToggleGrid: toggleGrid,
    onToggleSnap: toggleSnapToGrid,
    onToggleElements: () => setShowPhotoshopSidebar(!showPhotoshopSidebar),
    onAlignLeft: () => handleAlign('left'),
    onAlignCenter: () => handleAlign('center'),
    onAlignRight: () => handleAlign('right'),
    onAlignTop: () => handleAlign('top'),
    onAlignMiddle: () => handleAlign('middle'),
    onAlignBottom: () => handleAlign('bottom'),
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      {uiVisible && (
        <FigmaHeader
          onShowPreview={() => { setShowPDFPreview(true); }}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Main Layout */}
      <div className={`flex h-full ${uiVisible ? 'pt-14' : ''}`}>
        {/* Canvas - Full width */}
        <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
          <FigmaCanvas />

          {/* Figma-style Floating Toolbar (Bottom Center) */}
          {uiVisible && (
            <FigmaToolbar
              onSaveComponent={() => setShowSaveComponent(true)}
            />
          )}

          {/* Compact Page Indicator (Bottom Left) */}
          {uiVisible && (
            <CompactPageIndicator
              onOpenPagesManager={() => setShowPagesManager(true)}
            />
          )}
        </div>

        {/* Right Unified Panel (Always Visible Rail) */}
        {uiVisible && (
          <UnifiedPanel
            isOpen={showPhotoshopSidebar}
            onClose={() => setShowPhotoshopSidebar(false)}
            activeTab={activeTab as any}
            onTabChange={(tab) => {
              setActiveTab(tab as any);
              setShowPhotoshopSidebar(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <PDFPreviewModal isOpen={showPDFPreview} onClose={() => setShowPDFPreview(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <PagesManagerModal isOpen={showPagesManager} onClose={() => setShowPagesManager(false)} />
      <SaveComponentModal isOpen={showSaveComponent} onClose={() => setShowSaveComponent(false)} />

      {/* Shortcuts Panel */}
      {showShortcuts && (
        <ShortcutsPanel
          shortcuts={getAllShortcuts()}
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* Hidden PDF Export Container */}
      <div id="pdf-preview-container" className="fixed -left-[9999px] top-0">
        {pages.map((page) => (
          <div
            key={page.id}
            className="pdf-page-content"
            data-page-id={page.id}
            style={{
              width: '210mm',
              height: '297mm',
              position: 'relative',
              backgroundColor: '#ffffff',
            }}
          >
            {page.elements
              .filter(el => !el.groupId || el.isGroup) // Only render top-level elements and groups
              .map((element) => (
                <div
                  key={element.id}
                  style={{
                    position: 'absolute',
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    opacity: element.style?.opacity ?? 1,
                    visibility: element.visible === false ? 'hidden' : 'visible',
                  }}
                >
                  <ElementRenderer element={element} isPDF={true} />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get all shortcuts for the panel
function getAllShortcuts() {
  return [
    // Basic editing
    { key: 'c', ctrl: true, description: 'Copiar' },
    { key: 'd', ctrl: true, description: 'Duplicar' },
    { key: 'Delete', description: 'Deletar' },
    // History
    { key: 'z', ctrl: true, description: 'Desfazer' },
    { key: 'y', ctrl: true, description: 'Refazer' },
    // Alignment
    { key: 'l', ctrl: true, shift: true, description: 'Alinhar à esquerda' },
    { key: 'c', ctrl: true, shift: true, description: 'Centralizar horizontalmente' },
    { key: 'r', ctrl: true, shift: true, description: 'Alinhar à direita' },
    { key: 't', ctrl: true, shift: true, description: 'Alinhar ao topo' },
    { key: 'm', ctrl: true, shift: true, description: 'Centralizar verticalmente' },
    { key: 'b', ctrl: true, shift: true, description: 'Alinhar à base' },
    // UI Panels
    { key: 'e', ctrl: true, description: 'Alternar painel de elementos' },
    // Grid
    { key: "'", ctrl: true, description: 'Alternar grade' },
  ].map(s => ({ ...s, action: () => { } }));
}

export const CatalogEditor: FC = () => {
  return (
    <UIProvider>
      <PanelProvider>
        <CatalogEditorContent />
      </PanelProvider>
    </UIProvider>
  );
};

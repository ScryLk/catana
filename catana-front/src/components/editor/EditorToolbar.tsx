import { type FC } from 'react';
import { FiRotateCcw, FiRotateCw, FiAlignLeft, FiAlignCenter, FiAlignRight, FiAlignJustify, FiZoomIn, FiZoomOut, FiMaximize2, FiGrid, FiEye, FiSave, FiLayers, FiCopy, FiDownload } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';
import { PageNavigation } from './PageNavigation';

interface Props {
  onShowPreview: () => void;
  onSaveComponent: () => void;
}

export const EditorToolbar: FC<Props> = ({ onShowPreview, onSaveComponent }) => {
  const {
    zoom,
    setZoom,
    undo,
    redo,
    historyIndex,
    history,
    gridVisible,
    toggleGrid,
    selectedElementId,
    selectedElementIds,
    groupElements,
    ungroupElements,
    getCurrentPage,
    exportCatalogToJSON
  } = useEditorStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canGroup = selectedElementIds.length >= 2;

  const currentPage = getCurrentPage();
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);
  const canUngroup = selectedElement?.isGroup;

  const handleGroup = () => {
    if (canGroup) {
      groupElements(selectedElementIds);
    }
  };

  const handleUngroup = () => {
    if (canUngroup && selectedElementId) {
      ungroupElements(selectedElementId);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-64 right-80 z-10">
      <div className="flex items-center gap-2">
        <button onClick={undo} disabled={!canUndo} className={`p-2 rounded-lg ${canUndo ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}><FiRotateCcw /></button>
        <button onClick={redo} disabled={!canRedo} className={`p-2 rounded-lg ${canRedo ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}><FiRotateCw /></button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button className="p-2 hover:bg-gray-100 rounded-lg"><FiAlignLeft /></button>
        <button className="p-2 hover:bg-gray-100 rounded-lg"><FiAlignCenter /></button>
        <button className="p-2 hover:bg-gray-100 rounded-lg"><FiAlignRight /></button>
        <button className="p-2 hover:bg-gray-100 rounded-lg"><FiAlignJustify /></button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={handleGroup}
          disabled={!canGroup}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${canGroup ? 'hover:bg-gray-100 text-gray-700' : 'opacity-30 cursor-not-allowed text-gray-400'
            }`}
          title="Agrupar elementos selecionados (Ctrl+G)"
        >
          <FiLayers className="w-4 h-4" />
          <span>Agrupar</span>
        </button>
        <button
          onClick={handleUngroup}
          disabled={!canUngroup}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${canUngroup ? 'hover:bg-gray-100 text-gray-700' : 'opacity-30 cursor-not-allowed text-gray-400'
            }`}
          title="Desagrupar elementos (Ctrl+Shift+G)"
        >
          <FiCopy className="w-4 h-4" />
          <span>Desagrupar</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <PageNavigation />

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(Math.max(zoom - 10, 10))} className="p-2 hover:bg-gray-100 rounded-lg"><FiZoomOut /></button>
          <span className="text-sm font-medium px-3 py-1.5 bg-gray-50 rounded-lg min-w-[70px] text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(zoom + 10, 100))} className="p-2 hover:bg-gray-100 rounded-lg"><FiZoomIn /></button>
          <button onClick={() => setZoom(100)} className="p-2 hover:bg-gray-100 rounded-lg"><FiMaximize2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Exportar Catálogo */}
        <button
          onClick={exportCatalogToJSON}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Exportar catálogo como JSON"
        >
          <FiDownload className="w-4 h-4" />
          Exportar JSON
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button onClick={toggleGrid} className={`p-2 rounded-lg ${gridVisible ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}><FiGrid /></button>
        <button
          onClick={onSaveComponent}
          disabled={!selectedElementId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${selectedElementId
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          title={selectedElementId ? 'Salvar seleção como componente' : 'Selecione um elemento primeiro'}
        >
          <FiSave className="w-4 h-4" />
          Salvar Componente
        </button>
        <button onClick={onShowPreview} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <FiEye className="w-4 h-4" />
          Preview PDF
        </button>
      </div>
    </div>
  );
};

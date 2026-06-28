import { logger } from '../../utils/logger';
import { type FC, useState } from 'react';
import {
  FiRotateCcw,
  FiRotateCw,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiGrid,
  FiEye,
  FiSave,
  FiLayers,
  FiCopy,
  FiMove,
  FiSquare,
  FiCircle,
  FiType,
  FiImage,
  FiMousePointer,
  FiSidebar,
  FiHash,
  FiFolder,
  FiMinus,
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { MediaLibrary } from './MediaLibrary';
import { useAssetStore } from '../../store/assetStore';

interface Props {
  onShowPreview: () => void;
  onSaveComponent: () => void;
  onToggleSidebar?: () => void;
  isSidebarVisible?: boolean;
  onOpenAI?: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

const ToolButton: FC<ToolButtonProps> = ({
  icon,
  tooltip,
  active = false,
  disabled = false,
  onClick,
  badge
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200
          relative group
          ${active ? 'bg-zinc-100 text-zinc-900 shadow-md' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}
          ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="text-xl">{icon}</div>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold">
            {badge}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !disabled && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md whitespace-nowrap shadow-lg border border-gray-700">
            {tooltip}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

const ToolDivider: FC = () => (
  <div className="w-full h-px bg-gray-700 my-2" />
);

const ToolGroup: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col gap-1 py-2">
    {children}
  </div>
);

export const PhotoshopToolbar: FC<Props> = ({ onShowPreview, onSaveComponent, onToggleSidebar, isSidebarVisible = true, onOpenAI }) => {
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
    addElement,
    interactionMode,
    setInteractionMode,
    activeTool,
    setActiveTool,
  } = useEditorStore();

  const { assets } = useAssetStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canGroup = selectedElementIds.length >= 2;

  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Função para ativar a ferramenta (não adiciona mais o elemento automaticamente)
  const handleAddElement = (type: string) => {
    logger.debug('[PhotoshopToolbar] Ativando ferramenta:', type);
    setActiveTool(type);
    // Agora o elemento só será adicionado quando o usuário clicar no canvas
  };

  const handleGroup = () => {
    if (canGroup) {
      groupElements(selectedElementIds);
    }
  };

  const handleUngroup = () => {
    const currentPage = useEditorStore.getState().getCurrentPage();
    const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);
    if (selectedElement?.isGroup && selectedElementId) {
      ungroupElements(selectedElementId);
    }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 100));
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 10));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className="w-16 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col items-center fixed left-0 top-14 z-20 py-4 shadow-lg overflow-y-auto overflow-x-hidden scrollbar-thin">
      {/* Ferramentas de Seleção */}
      <ToolGroup>
        <ToolButton
          icon={<FiMousePointer />}
          tooltip="Ferramenta de Seleção (V)"
          active={interactionMode === 'select'}
          onClick={() => {
            setInteractionMode('select');
            setActiveTool('select');
          }}
        />
        <ToolButton
          icon={<FiMove />}
          tooltip="Mover Canvas (H)"
          active={interactionMode === 'pan'}
          onClick={() => {
            setInteractionMode('pan');
            setActiveTool('move');
          }}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de Desenho */}
      <ToolGroup>
        <ToolButton
          icon={<FiSquare />}
          tooltip="Retângulo (U)"
          active={activeTool === 'rectangle'}
          onClick={() => handleAddElement('rectangle')}
        />
        <ToolButton
          icon={<FiCircle />}
          tooltip="Círculo (C)"
          active={activeTool === 'circle'}
          onClick={() => handleAddElement('circle')}
        />
        <ToolButton
          icon={<FiMinus />}
          tooltip="Linha (L)"
          active={activeTool === 'line'}
          onClick={() => handleAddElement('line')}
        />
        <ToolButton
          icon={<FiType />}
          tooltip="Texto (T)"
          active={activeTool === 'text'}
          onClick={() => handleAddElement('text')}
        />
        <ToolButton
          icon={<FiImage />}
          tooltip="Imagem (I)"
          active={activeTool === 'image'}
          onClick={() => handleAddElement('image')}
        />
        <ToolButton
          icon={<FiHash />}
          tooltip="QR Code (Q)"
          active={activeTool === 'qrcode'}
          onClick={() => handleAddElement('qrcode')}
        />
        <ToolButton
          icon={<FiFolder />}
          tooltip="Biblioteca de Mídia (M)"
          onClick={() => setShowMediaLibrary(true)}
          badge={assets.length > 0 ? assets.length : undefined}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de História */}
      <ToolGroup>
        <ToolButton
          icon={<FiRotateCcw />}
          tooltip="Desfazer (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        />
        <ToolButton
          icon={<FiRotateCw />}
          tooltip="Refazer (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de Agrupamento */}
      <ToolGroup>
        <ToolButton
          icon={<FiLayers />}
          tooltip="Agrupar (Ctrl+G)"
          onClick={handleGroup}
          disabled={!canGroup}
          badge={canGroup ? selectedElementIds.length : undefined}
        />
        <ToolButton
          icon={<FiCopy />}
          tooltip="Desagrupar (Ctrl+Shift+G)"
          onClick={handleUngroup}
          disabled={!selectedElementId}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de Visualização */}
      <ToolGroup>
        <ToolButton
          icon={<FiZoomIn />}
          tooltip="Aumentar Zoom (+)"
          onClick={handleZoomIn}
        />
        <ToolButton
          icon={<FiZoomOut />}
          tooltip="Diminuir Zoom (-)"
          onClick={handleZoomOut}
        />
        <ToolButton
          icon={<FiMaximize2 />}
          tooltip="Zoom 100% (Ctrl+0)"
          onClick={handleZoomReset}
        />
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de Canvas */}
      <ToolGroup>
        <ToolButton
          icon={<FiGrid />}
          tooltip="Alternar Grade (Ctrl+')"
          active={gridVisible}
          onClick={toggleGrid}
        />
        {onToggleSidebar && (
          <ToolButton
            icon={<FiSidebar />}
            tooltip="Alternar Painel Lateral"
            active={isSidebarVisible}
            onClick={onToggleSidebar}
          />
        )}
      </ToolGroup>

      <ToolDivider />

      {/* Ferramentas de Ações */}
      <ToolGroup>
        <ToolButton
          icon={<FiSave />}
          tooltip="Salvar Componente"
          onClick={onSaveComponent}
          disabled={!selectedElementId}
        />
        <ToolButton
          icon={<FiEye />}
          tooltip="Preview PDF"
          onClick={onShowPreview}
        />
        {onOpenAI && (
          <ToolButton
            icon={<Sparkles className="w-5 h-5" />}
            tooltip="Gemini AI"
            onClick={onOpenAI}
          />
        )}
      </ToolGroup>

      {/* Zoom Display (Badge-style no fundo) */}
      <div className="mt-4 px-2 py-1 bg-zinc-950 rounded-md text-xs text-zinc-400 font-semibold">
        {zoom}%
      </div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          key={`media-library-${Date.now()}`} // Força remontagem toda vez que abre
          onClose={() => setShowMediaLibrary(false)}
          selectionMode={true}
          onSelect={(imageUrl) => {
            logger.debug('[PhotoshopToolbar] Imagem selecionada:', imageUrl);

            // Adicionar elemento de imagem ao catálogo
            addElement({
              type: 'image',
              position: { x: 400, y: 300 },
              size: { width: 300, height: 200 },
              style: {},
              imageUrl: imageUrl,
              visible: true,
              locked: false,
            });

            // Fechar o modal
            setShowMediaLibrary(false);
          }}
        />
      )}
    </div>
  );
};

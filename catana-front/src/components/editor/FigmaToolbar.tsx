import { type FC, useState } from 'react';
import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  Type,
  Image as ImageIcon,
  QrCode,
  Box,
  Undo2,
  Redo2,
  Layers,
  Ungroup,
  Component,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { getDefaultElementData, getDefaultElementSize } from '../../utils/elementDefaults';

interface Props {
  onSaveComponent?: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  shortcut?: string;
}

const ToolButton: FC<ToolButtonProps> = ({
  icon,
  tooltip,
  active = false,
  disabled = false,
  onClick,
  shortcut,
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
          w-9 h-9 flex items-center justify-center rounded-md transition-all duration-120
          ${active
            ? 'bg-white/[0.06] text-gray-900 animate-tool-activate'
            : 'text-gray-600/65 hover:bg-white/[0.03] hover:text-gray-900'
          }
          ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`w-4 h-4 transition-opacity duration-120 ${active ? 'opacity-100' : 'opacity-65'}`}>
          {icon}
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && !disabled && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
            <div className="flex items-center gap-2">
              <span>{tooltip}</span>
              {shortcut && (
                <span className="text-gray-400 text-[10px]">{shortcut}</span>
              )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

const ToolDivider: FC = () => (
  <div className="h-6 w-px bg-gray-300/50" />
);

const ToolGroup: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-0.5">
    {children}
  </div>
);

export const FigmaToolbar: FC<Props> = ({ onSaveComponent }) => {
  const {
    undo,
    redo,
    historyIndex,
    history,
    selectedElementIds,
    selectedElementId,
    groupElements,
    ungroupElements,
    interactionMode,
    setInteractionMode,
    activeTool,
    setActiveTool,
    getCurrentPage,
    addElement,
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canGroup = selectedElementIds.length >= 2;

  const currentPage = getCurrentPage();
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);
  const canUngroup = selectedElement?.isGroup;

  // Função para ativar ferramenta
  const handleSelectTool = (tool: string) => {
    import.meta.env.DEV && console.log('[FigmaToolbar] Ativando ferramenta:', tool);
    setActiveTool(tool);
    if (tool === 'select') {
      setInteractionMode('select');
    }

    // Se for linha, adicionar elemento diretamente
    if (tool === 'line') {
      const defaultData = getDefaultElementData('line');
      import.meta.env.DEV && console.log('[FigmaToolbar] defaultData:', defaultData);
      const newElement = {
        type: 'line' as const,
        position: { x: 100, y: 100 },
        size: getDefaultElementSize('line'),
        style: {},
        ...defaultData,
      };
      import.meta.env.DEV && console.log('[FigmaToolbar] Adding element:', newElement);
      addElement(newElement);
      // Voltar para modo de seleção
      setActiveTool('select');
      setInteractionMode('select');
    }

    // Se for QR Code, adicionar elemento diretamente
    if (tool === 'qrcode') {
      const defaultData = getDefaultElementData('qr-code');
      import.meta.env.DEV && console.log('[FigmaToolbar] QR Code defaultData:', defaultData);
      const newElement = {
        type: 'qr-code' as const,
        position: { x: 200, y: 200 },
        size: getDefaultElementSize('qr-code'),
        style: {},
        ...defaultData,
      };
      import.meta.env.DEV && console.log('[FigmaToolbar] Adding QR Code element:', newElement);
      addElement(newElement);
      // Voltar para modo de seleção
      setActiveTool('select');
      setInteractionMode('select');
    }
  };

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl px-3 py-2">
        <div className="flex items-center gap-1">
          {/* Grupo: Seleção */}
          <ToolGroup>
            <ToolButton
              icon={<MousePointer2 className="w-full h-full" />}
              tooltip="Ferramenta de Seleção"
              shortcut="V"
              active={interactionMode === 'select' && activeTool === 'select'}
              onClick={() => handleSelectTool('select')}
            />
          </ToolGroup>

          <ToolDivider />

          {/* Grupo: Criação */}
          <ToolGroup>
            <ToolButton
              icon={<Box className="w-full h-full" />}
              tooltip="Frame"
              shortcut="F"
              active={activeTool === 'frame'}
              onClick={() => handleSelectTool('frame')}
            />
            <ToolButton
              icon={<Square className="w-full h-full" />}
              tooltip="Retângulo"
              shortcut="R"
              active={activeTool === 'rectangle'}
              onClick={() => handleSelectTool('rectangle')}
            />
            <ToolButton
              icon={<Circle className="w-full h-full" />}
              tooltip="Círculo"
              shortcut="O"
              active={activeTool === 'circle'}
              onClick={() => handleSelectTool('circle')}
            />
            <ToolButton
              icon={<Minus className="w-full h-full" />}
              tooltip="Linha"
              shortcut="L"
              active={activeTool === 'line'}
              onClick={() => handleSelectTool('line')}
            />
            <ToolButton
              icon={<Type className="w-full h-full" />}
              tooltip="Texto"
              shortcut="T"
              active={activeTool === 'text'}
              onClick={() => handleSelectTool('text')}
            />
          </ToolGroup>

          <ToolDivider />

          {/* Grupo: Mídia */}
          <ToolGroup>
            <ToolButton
              icon={<ImageIcon className="w-full h-full" />}
              tooltip="Imagem"
              shortcut="I"
              active={activeTool === 'image'}
              onClick={() => handleSelectTool('image')}
            />
            <ToolButton
              icon={<QrCode className="w-full h-full" />}
              tooltip="QR Code"
              shortcut="Q"
              active={activeTool === 'qrcode'}
              onClick={() => handleSelectTool('qrcode')}
            />
          </ToolGroup>

          <ToolDivider />

          {/* Grupo: Histórico */}
          <ToolGroup>
            <ToolButton
              icon={<Undo2 className="w-full h-full" />}
              tooltip="Desfazer"
              shortcut="⌘Z"
              onClick={undo}
              disabled={!canUndo}
            />
            <ToolButton
              icon={<Redo2 className="w-full h-full" />}
              tooltip="Refazer"
              shortcut="⌘⇧Z"
              onClick={redo}
              disabled={!canRedo}
            />
          </ToolGroup>

          <ToolDivider />

          {/* Grupo: Agrupamento */}
          <ToolGroup>
            <ToolButton
              icon={<Layers className="w-full h-full" />}
              tooltip="Agrupar"
              shortcut="⌘G"
              onClick={handleGroup}
              disabled={!canGroup}
            />
            <ToolButton
              icon={<Ungroup className="w-full h-full" />}
              tooltip="Desagrupar"
              shortcut="⌘⇧G"
              onClick={handleUngroup}
              disabled={!canUngroup}
            />
          </ToolGroup>

          <ToolDivider />

          {/* Grupo: Componentes */}
          <ToolGroup>
            <ToolButton
              icon={<Component className="w-full h-full" />}
              tooltip="Salvar Componente"
              shortcut="⌘K"
              onClick={onSaveComponent}
              disabled={!selectedElementId}
            />
          </ToolGroup>
        </div>
      </div>
    </div>
  );
};

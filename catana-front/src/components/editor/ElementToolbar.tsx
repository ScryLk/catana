import { type FC } from 'react';
import {
  FiMove,
  FiCopy,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiChevronUp,
  FiChevronDown,
  FiRotateCw,
} from 'react-icons/fi';
import { type CatalogElement } from '../../types/editor';

interface ElementToolbarProps {
  element: CatalogElement;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onRotate?: () => void;
  onGroup?: () => void;
  canGroup?: boolean;
}

export const ElementToolbar: FC<ElementToolbarProps> = ({
  element,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleVisibility,
  onBringForward,
  onSendBackward,
  onRotate,
  onGroup,
  canGroup = false,
}) => {
  return (
    <div className="absolute -top-12 left-0 bg-gray-900 text-white rounded-lg shadow-xl flex items-center gap-1 p-1 z-50">
      {/* Drag Handle */}
      <div
        className="cursor-move px-2 py-1 hover:bg-gray-800 rounded flex items-center gap-1"
        title="Arrastar elemento"
      >
        <FiMove className="w-4 h-4" />
        <span className="text-xs font-medium">Mover</span>
      </div>

      <div className="w-px h-6 bg-gray-700" />

      {/* Lock/Unlock */}
      <button
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        onClick={onToggleLock}
        title={element.locked ? 'Desbloquear' : 'Bloquear'}
      >
        {element.locked ? (
          <FiLock className="w-4 h-4" />
        ) : (
          <FiUnlock className="w-4 h-4" />
        )}
      </button>

      {/* Visibility */}
      <button
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        onClick={onToggleVisibility}
        title={element.visible ? 'Ocultar' : 'Mostrar'}
      >
        {element.visible ? (
          <FiEye className="w-4 h-4" />
        ) : (
          <FiEyeOff className="w-4 h-4" />
        )}
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Bring Forward */}
      <button
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        onClick={onBringForward}
        title="Trazer para frente"
      >
        <FiChevronUp className="w-4 h-4" />
      </button>

      {/* Send Backward */}
      <button
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        onClick={onSendBackward}
        title="Enviar para trás"
      >
        <FiChevronDown className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Rotate */}
      {onRotate && (
        <button
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          onClick={onRotate}
          title="Rotacionar 90°"
        >
          <FiRotateCw className="w-4 h-4" />
        </button>
      )}

      {/* Group */}
      {canGroup && onGroup && (
        <button
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          onClick={onGroup}
          title="Agrupar elementos"
        >
          <FiLayers className="w-4 h-4" />
        </button>
      )}

      <div className="w-px h-6 bg-gray-700" />

      {/* Duplicate */}
      <button
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        onClick={onDuplicate}
        title="Duplicar"
      >
        <FiCopy className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        className="p-2 hover:bg-red-600 rounded transition-colors"
        onClick={onDelete}
        title="Deletar"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

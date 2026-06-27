import { type FC } from 'react';
import {
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiMinimize2,
} from 'react-icons/fi';

interface AlignmentToolbarProps {
  selectedCount: number;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (type: 'horizontal' | 'vertical') => void;
  onMatchSize: (dimension: 'width' | 'height' | 'both') => void;
  onArrangeGrid: () => void;
}

export const AlignmentToolbar: FC<AlignmentToolbarProps> = ({
  selectedCount,
  onAlign,
  onDistribute,
  onMatchSize,
  onArrangeGrid,
}) => {
  if (selectedCount < 2) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50">
      <div className="flex items-center gap-2">
        {/* Horizontal Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <span className="text-xs text-gray-500 font-medium px-2">Horizontal:</span>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('left')}
            title="Alinhar à esquerda"
          >
            <FiAlignLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('center')}
            title="Centralizar horizontalmente"
          >
            <FiAlignCenter className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('right')}
            title="Alinhar à direita"
          >
            <FiAlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <span className="text-xs text-gray-500 font-medium px-2">Vertical:</span>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('top')}
            title="Alinhar ao topo"
          >
            <div className="w-4 h-4 flex items-start justify-center">
              <div className="w-3 h-0.5 bg-current" />
            </div>
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('middle')}
            title="Centralizar verticalmente"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-3 h-0.5 bg-current" />
            </div>
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onAlign('bottom')}
            title="Alinhar à base"
          >
            <div className="w-4 h-4 flex items-end justify-center">
              <div className="w-3 h-0.5 bg-current" />
            </div>
          </button>
        </div>

        {/* Distribution */}
        {selectedCount >= 3 && (
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <span className="text-xs text-gray-500 font-medium px-2">Distribuir:</span>
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              onClick={() => onDistribute('horizontal')}
              title="Distribuir horizontalmente"
            >
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-current" />
                <div className="w-1 h-4 bg-current" />
                <div className="w-1 h-4 bg-current" />
              </div>
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              onClick={() => onDistribute('vertical')}
              title="Distribuir verticalmente"
            >
              <div className="flex flex-col gap-1">
                <div className="h-1 w-4 bg-current" />
                <div className="h-1 w-4 bg-current" />
                <div className="h-1 w-4 bg-current" />
              </div>
            </button>
          </div>
        )}

        {/* Match Size */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <span className="text-xs text-gray-500 font-medium px-2">Tamanho:</span>
          <button
            className="px-3 py-1 text-xs hover:bg-gray-100 rounded transition-colors font-medium"
            onClick={() => onMatchSize('width')}
            title="Igualar largura"
          >
            W
          </button>
          <button
            className="px-3 py-1 text-xs hover:bg-gray-100 rounded transition-colors font-medium"
            onClick={() => onMatchSize('height')}
            title="Igualar altura"
          >
            H
          </button>
          <button
            className="px-3 py-1 text-xs hover:bg-gray-100 rounded transition-colors font-medium"
            onClick={() => onMatchSize('both')}
            title="Igualar ambos"
          >
            WH
          </button>
        </div>

        {/* Arrange Grid */}
        <button
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors"
          onClick={onArrangeGrid}
          title="Organizar em grade"
        >
          <FiMinimize2 className="w-4 h-4" />
          <span className="text-xs font-medium">Grade</span>
        </button>
      </div>

      {/* Element count indicator */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {selectedCount} selecionados
      </div>
    </div>
  );
};

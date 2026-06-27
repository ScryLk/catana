import { type FC, useState } from 'react';
import { ChevronLeft, ChevronRight, File } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  onOpenPagesManager: () => void;
}

export const CompactPageIndicator: FC<Props> = ({ onOpenPagesManager }) => {
  const { pages, currentPageId, setCurrentPage } = useEditorStore();
  const [isHovered, setIsHovered] = useState(false);

  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const currentPageNumber = currentPageIndex + 1;
  const totalPages = pages.length;

  const canGoPrevious = currentPageIndex > 0;
  const canGoNext = currentPageIndex < totalPages - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentPage(pages[currentPageIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage(pages[currentPageIndex + 1].id);
    }
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-40 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/50 dark:border-zinc-700/50 rounded-lg shadow-lg transition-all duration-200 overflow-hidden">
        <div className="flex items-center">
          {/* Always visible: Page indicator */}
          <button
            onClick={onOpenPagesManager}
            className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors flex items-center gap-2 whitespace-nowrap"
            title="Gerenciar páginas"
          >
            <File className="w-3.5 h-3.5" />
            <span>Página {currentPageNumber} de {totalPages}</span>
          </button>

          {/* Show on hover: Navigation controls */}
          {isHovered && (
            <div className="flex items-center border-l border-gray-200/50 dark:border-zinc-700/50">
              <button
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className={`p-2 transition-colors ${
                  canGoPrevious
                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50'
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className={`p-2 transition-colors ${
                  canGoNext
                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50'
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

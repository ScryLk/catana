import { type FC } from 'react';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';

export const PageNavigation: FC = () => {
  const { pages, currentPageId, setCurrentPage, addPage, deletePage } = useEditorStore();

  const currentIndex = pages.findIndex((p) => p.id === currentPageId);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <FiChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
        {currentIndex + 1} / {pages.length}
      </span>

      <button
        onClick={goToNext}
        disabled={currentIndex === pages.length - 1}
        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <FiChevronRight className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1" />

      <button
        onClick={() => addPage()}
        className="p-1 hover:bg-primary-100 hover:text-primary-700 rounded text-gray-600"
        title="Adicionar página"
      >
        <FiPlus className="w-4 h-4" />
      </button>

      {pages.length > 1 && (
        <button
          onClick={() => deletePage(currentPageId)}
          className="p-1 hover:bg-red-100 hover:text-red-700 rounded text-gray-600"
          title="Deletar página atual"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

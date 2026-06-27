import { type FC, useState } from 'react';
import { FiPlus, FiEye, FiFilePlus, FiX, FiGrid } from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  onShowPreview: () => void;
  onShowPagesManager: () => void;
}

export const EditorFAB: FC<Props> = ({ onShowPreview, onShowPagesManager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addPage, pages } = useEditorStore();

  const handleAddPage = () => {
    addPage();
    setIsOpen(false);
  };

  const handleShowPreview = () => {
    onShowPreview();
    setIsOpen(false);
  };

  const handleShowPagesManager = () => {
    onShowPagesManager();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      {/* Menu Items */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Manage Pages Button */}
          <button
            onClick={handleShowPagesManager}
            className="group flex items-center gap-3 bg-white hover:bg-gray-50 rounded-full shadow-lg pl-4 pr-5 py-3 transition-all hover:scale-105"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:bg-orange-600 transition-colors">
              <FiGrid className="w-6 h-6" />
            </div>
            <div className="text-left pr-2">
              <div className="font-semibold text-gray-900 text-sm">Editar Páginas</div>
              <div className="text-xs text-gray-600">Gerenciar {pages.length} página(s)</div>
            </div>
          </button>

          {/* Add Page Button */}
          <button
            onClick={handleAddPage}
            className="group flex items-center gap-3 bg-white hover:bg-gray-50 rounded-full shadow-lg pl-4 pr-5 py-3 transition-all hover:scale-105"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:bg-blue-600 transition-colors">
              <FiFilePlus className="w-6 h-6" />
            </div>
            <div className="text-left pr-2">
              <div className="font-semibold text-gray-900 text-sm">Nova Página</div>
              <div className="text-xs text-gray-600">{pages.length + 1}ª página</div>
            </div>
          </button>

          {/* Preview Button */}
          <button
            onClick={handleShowPreview}
            className="group flex items-center gap-3 bg-white hover:bg-gray-50 rounded-full shadow-lg pl-4 pr-5 py-3 transition-all hover:scale-105"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:bg-green-600 transition-colors">
              <FiEye className="w-6 h-6" />
            </div>
            <div className="text-left pr-2">
              <div className="font-semibold text-gray-900 text-sm">Visualizar Catálogo</div>
              <div className="text-xs text-gray-600">{pages.length} página(s)</div>
            </div>
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl transition-all hover:scale-110 ${isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-45'
            : 'bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
          }`}
      >
        {isOpen ? <FiX className="w-7 h-7" /> : <FiPlus className="w-7 h-7" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

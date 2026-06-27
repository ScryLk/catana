import { type FC, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiSettings, FiLogOut, FiDownload, FiUser, FiChevronRight, FiRotateCcw, FiRotateCw,
  FiPackage, FiEye, FiHelpCircle
} from 'react-icons/fi';
import { LayoutPanelLeft } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { usePlugins } from '../../contexts/PluginsContext';
import { PluginsModal } from '../plugins/PluginsModal';

interface EditorHeaderProps {
  onShowPreview?: () => void;
  onToggleUnifiedPanel?: () => void;
  onDownloadPDF?: () => void;
}

export const EditorHeader: FC<EditorHeaderProps> = ({
  onShowPreview,
  onToggleUnifiedPanel,
  onDownloadPDF
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    catalogName,
    setCatalogName,
    undo,
    redo,
    history,
    historyIndex,
    setZoom,
    zoom,
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < (history.length - 1);

  const { isPluginInstalled } = usePlugins();
  const [showPluginsModal, setShowPluginsModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      {/* Left: Logo & File Name */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiHome className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-48 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            placeholder="Nome do Catálogo"
          />
        </div>
      </div>

      {/* Center: Essential Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Desfazer (Ctrl+Z)"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Refazer (Ctrl+Y)"
        >
          <FiRotateCw className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2" />

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setZoom(Math.max(25, zoom - 10))}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            -
          </button>
          <span className="text-xs font-medium w-12 text-center text-gray-600 dark:text-gray-300">
            {Math.round(zoom)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(100, zoom + 10))}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Right: Primary Actions & User */}
      <div className="flex items-center gap-3">
        {/* Plugins */}
        <button
          onClick={() => setShowPluginsModal(true)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
          title="Plugins"
        >
          <FiPackage className="w-5 h-5" />
          {isPluginInstalled('photoshop-toolbar') && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-900" />
          )}
        </button>

        {/* Preview */}
        <button
          onClick={onShowPreview}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Visualizar"
        >
          <FiEye className="w-5 h-5" />
        </button>

        {/* Export */}
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium shadow-sm"
        >
          <FiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Toggle Unified Panel */}
        <button
          onClick={onToggleUnifiedPanel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Painel Lateral"
        >
          <LayoutPanelLeft className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <FiChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>

              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                Meu Perfil
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiSettings className="w-4 h-4" />
                Configurações
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiHelpCircle className="w-4 h-4" />
                Ajuda e Suporte
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
      <PluginsModal isOpen={showPluginsModal} onClose={() => setShowPluginsModal(false)} />
    </header >
  );
};

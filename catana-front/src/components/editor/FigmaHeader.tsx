import { type FC, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  Download,
  Share2,
  MoreVertical,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Check,
  Loader2,
  Save,
  Palette,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';

interface Props {
  onShowPreview?: () => void;
  onDownloadPDF?: () => void;
  onSave?: () => void | Promise<void>;
  onOpenTheme?: () => void;
}

type CatalogStatus = 'draft' | 'published' | 'archived';

export const FigmaHeader: FC<Props> = ({ onShowPreview, onDownloadPDF, onSave, onOpenTheme }) => {
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
  const canRedo = historyIndex < history.length - 1;

  const [catalogStatus] = useState<CatalogStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(event.target as Node)) {
        setShowZoomMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // INC-01: salva o conteúdo do editor no backend (substitui o auto-save fake).
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const handleSave = async () => {
    if (!onSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      setHasSavedOnce(true);
    } finally {
      setIsSaving(false);
    }
  };

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200];

  const getStatusBadge = () => {
    const badges = {
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
      published: { label: 'Publicado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      archived: { label: 'Arquivado', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    return badges[catalogStatus];
  };

  const formatLastSaved = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 60) return 'Salvo agora';
    if (diff < 3600) return `Salvo há ${Math.floor(diff / 60)}min`;
    return `Salvo há ${Math.floor(diff / 3600)}h`;
  };

  return (
    <header className="h-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      {/* LEFT: Context & Navigation */}
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={() => navigate('/catalogs')}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
          title="Voltar para catálogos"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300/50 dark:bg-zinc-700/50" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Catálogos</span>
          <ChevronRight className="w-3 h-3" />
          <input
            type="text"
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-zinc-700 rounded px-2 py-1 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors"
            placeholder="Nome do Catálogo"
          />
        </div>

        {/* Status Badge */}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusBadge().className}`}>
          {getStatusBadge().label}
        </span>
      </div>

      {/* CENTER: Global Controls */}
      <div className="flex items-center gap-1">
        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            canUndo
              ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Desfazer (⌘Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            canRedo
              ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Refazer (⌘⇧Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300/50 dark:bg-zinc-700/50 mx-1" />

        {/* Zoom Control */}
        <div className="relative" ref={zoomMenuRef}>
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
          >
            <span>{Math.round(zoom)}%</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showZoomMenu ? 'rotate-90' : ''}`} />
          </button>

          {showZoomMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200/50 dark:border-zinc-700/50 py-1 min-w-[120px] animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 dark:border-zinc-700">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 10))}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
              {zoomLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setZoom(level);
                    setShowZoomMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center justify-between ${
                    Math.round(zoom) === level ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{level}%</span>
                  {Math.round(zoom) === level && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300/50 dark:bg-zinc-700/50 mx-1" />

        {/* Tema global */}
        {onOpenTheme && (
          <button
            onClick={onOpenTheme}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
            title="Tema global (cores e tipografia)"
          >
            <Palette className="w-4 h-4" />
          </button>
        )}

        {/* Preview Toggle */}
        <button
          onClick={onShowPreview}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
          title="Visualizar"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Indicador de salvamento */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : hasSavedOnce ? (
            <>
              <Check className="w-3 h-3 text-green-600 dark:text-green-500" />
              <span>{formatLastSaved()}</span>
            </>
          ) : null}
        </div>

        {/* Salvar no backend */}
        {onSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            title="Salvar conteúdo no servidor"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
        )}

        <div className="h-4 w-px bg-gray-300/50 dark:bg-zinc-700/50" />

        {/* Export Button */}
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        {/* Share Button (Optional) */}
        <button
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* More Menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200/50 dark:border-zinc-700/50 py-1 animate-in fade-in slide-in-from-top-1">
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Configurações
              </button>
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Ajuda
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300/50 dark:bg-zinc-700/50" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200/50 dark:border-zinc-700/50 py-1 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-700">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>

              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Meu Perfil
              </button>
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Configurações
              </button>
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Ajuda
              </button>

              <div className="border-t border-gray-100 dark:border-zinc-700 my-1" />

              <button
                onClick={logout}
                className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

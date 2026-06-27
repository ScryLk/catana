
import { type FC } from 'react';
import { Layers, Settings, Sparkles, Grid, X, Package, LayoutTemplate } from 'lucide-react';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { GeminiPanel } from './GeminiPanel';
import { ComponentsPanel } from './ComponentsPanel';
import { DiPackPanel } from '../../plugins/dipack';
import { TemplateSelector } from './TemplateSelector';

interface UnifiedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'properties' | 'layers' | 'ai' | 'library' | 'plugins' | 'templates';
  onTabChange: (tab: 'properties' | 'layers' | 'ai' | 'library' | 'plugins' | 'templates') => void;
}

export const UnifiedPanel: FC<UnifiedPanelProps> = ({
  isOpen,
  onClose,
  activeTab = 'properties',
  onTabChange
}) => {
  const handleTabClick = (tab: 'properties' | 'layers' | 'ai' | 'library' | 'plugins' | 'templates') => {
    if (activeTab === tab && isOpen) {
      onClose(); // Toggle closed if clicking active tab
    } else {
      onTabChange(tab);
      if (!isOpen) {
        // We need a way to signal "open" if it was closed. 
        // Since the parent controls 'isOpen', we might need a separate callback or just rely on the parent opening it when tab changes.
        // For now, we assume the parent will handle opening if we change tabs.
        // Actually, looking at CatalogEditor, it sets showPhotoshopSidebar(true) when tab changes.
        // But we need to make sure we don't close it immediately.
        // Let's just call onTabChange. The parent logic needs to ensure it opens.
      }
    }
  };

  return (
    <div className="flex h-full z-20 shadow-xl">
      {/* Content Area (Slide out) */}
      {isOpen && (
        <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {activeTab === 'properties' && 'Propriedades'}
              {activeTab === 'layers' && 'Camadas'}
              {activeTab === 'ai' && 'Gemini AI'}
              {activeTab === 'library' && 'Meus Componentes'}
              {activeTab === 'plugins' && 'DiPACK V2 (Atualizado)'}
              {activeTab === 'templates' && 'Meus Templates'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-50 dark:bg-zinc-950/50">
            {activeTab === 'properties' && <PropertiesPanel />}
            {activeTab === 'layers' && <LayersPanel />}
            {activeTab === 'ai' && <div className="h-full"><GeminiPanel /></div>}
            {activeTab === 'library' && <div className="h-full"><ComponentsPanel /></div>}
            {activeTab === 'plugins' && <DiPackPanel />}
            {activeTab === 'templates' && <TemplateSelector />}
          </div>
        </div>
      )}

      {/* Vertical Navigation Rail (Always Visible) */}
      <div className={`w-14 bg-white dark:bg-zinc-900 flex flex-col items-center py-4 gap-4 ${isOpen ? '' : 'border-l border-zinc-200 dark:border-zinc-800'}`}>
        <button
          onClick={() => handleTabClick('properties')}
          className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'properties' && isOpen
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300'
            }`}
        >
          <Settings className="w-5 h-5" />
          {activeTab === 'properties' && isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('ai')}
          className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'ai' && isOpen
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300'
            }`}
        >
          <Sparkles className="w-5 h-5" />
          {activeTab === 'ai' && isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('library')}
          className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'library' && isOpen
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300'
            }`}
        >
          <Grid className="w-5 h-5" />
          {activeTab === 'library' && isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('templates')}
          className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'templates' && isOpen
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300'
            }`}
        >
          <LayoutTemplate className="w-5 h-5" />
          {activeTab === 'templates' && isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
          )}
        </button>

        <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800 my-2" />

        <button
          onClick={() => handleTabClick('plugins')}
          className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'plugins' && isOpen
            ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100 shadow-sm'
            : 'text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-300'
            }`}
        >
          <Package className="w-5 h-5" />
          {activeTab === 'plugins' && isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
          )}
        </button>
      </div>
    </div>
  );
};


import { type FC, useState } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { FiPlus, FiTrash2, FiLayout, FiUser, FiDownload } from 'react-icons/fi';
import { importCatalog } from '../../services/catalogIO.service';

// Templates pré-definidos
const PREDEFINED_TEMPLATES = [
  {
    id: 'techgear-a4',
    name: 'TechGear - A4',
    description: 'Catálogo tech formato A4 (1240x1754px @ 150 DPI)',
    thumbnail: '/templates/techgear-a4-thumb.png',
    jsonUrl: '/catalogo-techgear-a4.json',
    pages: 4,
    elements: 30,
    badge: 'A4'
  },
  {
    id: 'techgear-original',
    name: 'TechGear - Grande',
    description: 'Catálogo tech formato grande (1920x2560px)',
    thumbnail: '/templates/techgear-thumb.png',
    jsonUrl: '/catalogo-techgear-2025.json',
    pages: 4,
    elements: 37,
    badge: 'HD'
  }
];

export const TemplateSelector: FC = () => {
  const { saveTemplate, deleteTemplate, getTemplatesByUser } = useTemplateStore();
  const { pages, currentPageId, addElement, importCatalogFromJSON: importToEditor, resetEditor } = useEditorStore();
  const { user } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<string | null>(null);

  const currentPage = pages.find((p) => p.id === currentPageId);

  // Filter templates for current user
  const userTemplates = user ? getTemplatesByUser(String(user.id)) : [];

  const handleSaveTemplate = () => {
    if (!currentPage || !user) return;

    const name = newTemplateName.trim() || `Template ${userTemplates.length + 1} `;
    saveTemplate(currentPage, name, String(user.id));
    setNewTemplateName('');
    setIsSaving(false);
  };

  const handleApplyTemplate = (templateId: string) => {
    // We need to find the template in the full list or just use userTemplates
    const template = userTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Add all elements from template to current page
    // We might want to clear the page first? For now, let's just append.
    // Or maybe prompt? "Replace content" vs "Append".
    // Let's append for safety, user can clear if they want.

    template.elements.forEach(element => {
      addElement({
        ...element,
        // type: template.type as any,
        // Keep position? Or offset? Keep position for full page templates.
      });
    });
  };

  const handleLoadPredefinedTemplate = async (templateId: string) => {
    const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setIsLoadingTemplate(templateId);

    try {
      // Fetch JSON from public folder
      const response = await fetch(template.jsonUrl);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const catalogData = await response.json();

      // Parse catalog JSON using catalogIO service
      const { pages: catalogPages, catalogName, settings } = importCatalog(catalogData);

      // Reset editor and import catalog
      resetEditor();
      importToEditor(catalogPages, catalogName || template.name, settings);

      console.log(`[TemplateSelector] Loaded template: ${template.name}`);
    } catch (error) {
      console.error('[TemplateSelector] Error loading template:', error);
      alert(`Erro ao carregar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoadingTemplate(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <FiUser className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Faça login para salvar templates.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Predefined Templates Section */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <FiLayout className="w-4 h-4" />
          Templates Profissionais
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {PREDEFINED_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="group relative bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleLoadPredefinedTemplate(template.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {template.name}
                      </h4>
                      {'badge' in template && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          template.badge === 'A4'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {template.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      {template.description}
                    </p>
                  </div>
                  {isLoadingTemplate === template.id ? (
                    <div className="flex items-center justify-center w-8 h-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    </div>
                  ) : (
                    <FiDownload className="w-5 h-5 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <FiLayout className="w-3 h-3" />
                    {template.pages} páginas
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    {template.elements} elementos
                  </span>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Current Page Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Salvar Página Atual
        </h3>

        {isSaving ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Nome do template..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsSaving(false)}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsSaving(true)}
            className="w-full py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 dark:text-zinc-400 text-xs font-medium hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
          >
            <FiLayout className="w-4 h-4" />
            Criar novo template
          </button>
        )}
      </div>

      {/* Templates List */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center justify-between">
          <span>Meus Templates</span>
          <span className="text-xs text-zinc-400 font-normal">{userTemplates.length} salvos</span>
        </h3>

        {userTemplates.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
            Nenhum template salvo ainda.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {userTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => handleApplyTemplate(template.id)}
              >
                {/* Thumbnail Placeholder */}
                <div className="aspect-[1/1.41] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <FiLayout className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                </div>

                {/* Info */}
                <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                    {template.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {template.elements.length} elementos
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(template.id);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Excluir template"
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

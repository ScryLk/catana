import type { FC } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { allProducts } from '../../../lib/products';

export const DiPackPanel: FC = () => {
  const { addPage, addElement, pages, deletePage } = useEditorStore();

  const handleAddTemplate = (type: string) => {
    addPage();

    setTimeout(() => {
      addElement({
        type: type as any,
        position: { x: 0, y: 0 },
        size: { width: 794, height: 1123 },
        content: {},
        style: {}
      });
    }, 100);
  };

  const handleGenerateFullCatalog = async () => {
    alert('Iniciando geração do catálogo v2...');

    // Limpar páginas vazias do início
    const emptyPages = pages.filter(p => p.elements.length === 0);
    emptyPages.forEach(p => deletePage(p.id));

    const addWithDelay = (type: string, content: any = {}, delay: number) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          // Check if we can reuse the last page (if it's empty)
          const currentState = useEditorStore.getState();
          const lastPage = currentState.pages[currentState.pages.length - 1];
          const shouldAddPage = !lastPage || lastPage.elements.length > 0;

          if (shouldAddPage) {
            addPage();
          }

          // Aguardar um tick para garantir que a página foi criada
          setTimeout(() => {
            // Pegar a página recém-criada (a última)
            const pagesAfter = useEditorStore.getState().pages;
            const targetPage = pagesAfter[pagesAfter.length - 1];

            import.meta.env.DEV && console.log('[DiPackPanel] Adicionando elemento à página:', targetPage.id, targetPage.name);

            addElement({
              type: type as any,
              position: { x: 0, y: 0 },
              size: { width: 794, height: 1123 },
              content: content,
              style: {}
            }, targetPage.id); // Passar o ID da página como segundo argumento
            resolve();
          }, 100);
        }, delay);
      });
    };

    const delay = 600;

    await addWithDelay('dipack-cover', {}, delay);
    await addWithDelay('dipack-institutional', {}, delay);

    const categories: { name: string; template: string; intro?: string }[] = [
      { name: 'Confeitaria', template: 'dipack-confeitaria', intro: 'dipack-confeitaria-intro' },
      { name: 'Açougue & Frios', template: 'dipack-acougue', intro: 'dipack-acougue-intro' },
      { name: 'Festa', template: 'dipack-festa', intro: 'dipack-festa-intro' },
      { name: 'Food Service', template: 'dipack-food-service', intro: 'dipack-food-service-intro' }
    ];

    let globalPageCount = 3;

    for (const cat of categories) {
      import.meta.env.DEV && console.log(`[DiPackPanel] Filtrando categoria: '${cat.name}'`);
      import.meta.env.DEV && console.log(`[DiPackPanel] Total produtos disponíveis: ${allProducts.length}`);

      // Debug first few products categories
      allProducts.slice(0, 3).forEach(p => import.meta.env.DEV && console.log(`[DiPackPanel] Prod Sample Cat: '${p.category}'`));

      const catProducts = allProducts.filter(p => {
        // Robust comparison avoiding whitespace issues
        return p.category?.trim() === cat.name.trim();
      });

      import.meta.env.DEV && console.log(`[DiPackPanel] Produtos encontrados para ${cat.name}: ${catProducts.length}`);

      if (cat.intro) await addWithDelay(cat.intro, {}, delay);

      if (catProducts.length > 0) {
        const chunkSize = 12;
        for (let i = 0; i < catProducts.length; i += chunkSize) {
          const chunk = catProducts.slice(i, i + chunkSize);

          // Debug data flow
          const chunkCopy = JSON.parse(JSON.stringify(chunk));

          import.meta.env.DEV && console.log(`[DiPackPanel] ADICIONANDO CHUNK DE ${chunkCopy.length} ITENS:`, chunkCopy);

          await addWithDelay(cat.template, {
            products: chunkCopy,
            pageNumber: globalPageCount
          }, delay);

          globalPageCount++;
        }
      }
    }

    await addWithDelay('dipack-back-cover', {}, delay);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Ações Rápidas */}
      <div>
        <h1 className="text-xl font-bold text-red-600 bg-yellow-200 p-2 mb-4 text-center border-4 border-red-600">
          VERSÃO V3 ATIVA (CACHE BUSTER)
        </h1>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h4>
        <button
          onClick={handleGenerateFullCatalog}
          className="w-full flex items-center justify-center gap-2 p-4 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold text-sm"
          style={{ backgroundColor: '#16a34a', border: 'none' }}
        >
          🚀 BOOM! Catálogo V3 (FINAL)
        </button>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Capas e Institucional</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddTemplate('dipack-cover')}
            className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-10 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 group-hover:border-orange-300" />
            <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 group-hover:text-orange-600">Capa</span>
          </button>
          <button
            onClick={() => handleAddTemplate('dipack-back-cover')}
            className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-10 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 group-hover:border-orange-300" />
            <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 group-hover:text-orange-600">Contra Capa</span>
          </button>
          <button
            onClick={() => handleAddTemplate('dipack-institutional')}
            className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-10 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 group-hover:border-orange-300" />
            <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 group-hover:text-orange-600">Institucional</span>
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Produtos</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddTemplate('dipack-showcase')}
            className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-10 bg-gray-100 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 group-hover:border-orange-300" />
            <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 group-hover:text-orange-600">Vitrine (24)</span>
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Segmentos</h4>
        <div className="space-y-2">
          <button
            onClick={() => handleAddTemplate('dipack-confeitaria')}
            className="w-full flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-pink-500 hover:bg-pink-50 dark:hover:border-pink-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded flex items-center justify-center text-pink-600">🎂</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-pink-600">Confeitaria</span>
          </button>
          <button
            onClick={() => handleAddTemplate('dipack-acougue')}
            className="w-full flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-red-500 hover:bg-red-50 dark:hover:border-red-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center text-red-600">🥩</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-600">Açougue</span>
          </button>
          <button
            onClick={() => handleAddTemplate('dipack-festa')}
            className="w-full flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:border-purple-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center text-purple-600">🎉</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600">Festa</span>
          </button>
          <button
            onClick={() => handleAddTemplate('dipack-food-service')}
            className="w-full flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-zinc-700 transition-all group"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600">🍽️</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600">Food Service</span>
          </button>
        </div>
      </div>
    </div>
  );
};

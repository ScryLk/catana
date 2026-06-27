/**
 * 🔄 Catalog Loader Service
 *
 * Carrega catálogos importados do backend e converte para o formato do EditorStore
 * Aplica automaticamente as regras de layout profissional
 */

import { catalogService } from './catalogService';
import { processPage, validateCatalog, generateValidationReport } from './layoutEngine.service';
import type { CatalogElement, CatalogPage } from '../types/editor';
import type { DesignTokens } from '../types/designTokens';

interface BackendPage {
  id: number;
  catalog: number;
  order: number;
  background_image: number | null;
  created_at: string;
  components?: BackendPageComponent[];
}

interface BackendPageComponent {
  id: number;
  page: number;
  component: BackendComponent;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  layer: number;
}

interface BackendComponent {
  id: number;
  name: string;
  component_type: 'text' | 'image' | 'product';
  content: any; // JSON completo do elemento original
  is_reusable: boolean;
  created_at: string;
}

interface LoadedCatalog {
  catalogName: string;
  pages: CatalogPage[];
  designTokens?: DesignTokens;
  settings?: {
    gridSize?: number;
    snapToGrid?: boolean;
    defaultZoom?: number;
  };
}

/**
 * Carrega um catálogo importado do backend e converte para formato do editor
 */
export async function loadImportedCatalog(catalogId: number): Promise<LoadedCatalog> {
  try {
    // 1. Buscar metadados do catálogo
    const catalog = await catalogService.getCatalog(catalogId);

    // 2. Buscar páginas do catálogo
    const response = await fetch(`http://localhost:8000/api/pages/?catalog=${catalogId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load pages: ${response.statusText}`);
    }

    const backendPages: BackendPage[] = await response.json();

    // 3. Para cada página, buscar seus componentes
    const pagesWithComponents = await Promise.all(
      backendPages.map(async (page) => {
        const componentsResponse = await fetch(
          `http://localhost:8000/api/page-components/?page=${page.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!componentsResponse.ok) {
          console.warn(`Failed to load components for page ${page.id}`);
          return { ...page, components: [] };
        }

        const pageComponents = await componentsResponse.json();

        // Buscar dados completos dos componentes
        const componentsWithData = await Promise.all(
          pageComponents.map(async (pc: any) => {
            const componentResponse = await fetch(
              `http://localhost:8000/api/components/${pc.component}/`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
              }
            );

            const component = await componentResponse.json();
            return {
              ...pc,
              component
            };
          })
        );

        return {
          ...page,
          components: componentsWithData
        };
      })
    );

    // 4. Buscar Design Tokens do theme (se existir)
    let designTokens: DesignTokens | undefined;
    if (catalog.theme) {
      const themeResponse = await fetch(
        `http://localhost:8000/api/themes/${catalog.theme}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (themeResponse.ok) {
        const theme = await themeResponse.json();
        designTokens = theme.styles?.designTokens;
      }
    }

    // 5. Converter para formato do EditorStore
    const editorPages: CatalogPage[] = pagesWithComponents
      .sort((a, b) => a.order - b.order)
      .map((backendPage, index) => {
        const pageId = `page-${Date.now()}-${index}`;

        // Converter componentes para elementos do editor
        const elements: CatalogElement[] = (backendPage.components || [])
          .sort((a, b) => a.layer - b.layer)
          .map((pc, elemIndex) => {
            const elementId = `element-${Date.now()}-${elemIndex}`;
            const originalElement = pc.component.content;

            // Criar elemento do editor mesclando dados originais com posicionamento
            const element: CatalogElement = {
              id: elementId,
              type: originalElement.type || 'text',
              name: originalElement.name || pc.component.name,
              pageId: pageId,

              // Geometria do PageComponent
              position: {
                x: pc.position_x,
                y: pc.position_y
              },
              size: {
                width: pc.width,
                height: pc.height
              },
              zIndex: pc.layer,
              rotation: originalElement.rotation || originalElement.transform?.rotation || 0,

              // Visibilidade
              visible: originalElement.visible ?? originalElement.visibility?.visible ?? true,
              locked: originalElement.locked ?? originalElement.visibility?.locked ?? false,

              // Estilos do elemento original
              style: originalElement.style || {},

              // Conteúdo específico por tipo
              content: originalElement.content,
              textData: originalElement.textData,
              imageData: originalElement.imageData,
              lineData: originalElement.lineData,
              productData: originalElement.productData,
              qrCodeData: originalElement.qrCodeData,

              // Grouping (se existir)
              groupId: originalElement.groupId,
              isGroup: originalElement.isGroup,
              children: originalElement.children
            };

            return element;
          });

        return {
          id: pageId,
          name: `Página ${index + 1}`,
          order: index,
          elements,
          header: undefined,
          footer: undefined
        };
      });

    return {
      catalogName: catalog.title || 'Catálogo Importado',
      pages: editorPages,
      designTokens,
      settings: {
        gridSize: 8,
        snapToGrid: true,
        defaultZoom: 75
      }
    };

  } catch (error) {
    console.error('[CatalogLoader] Error loading catalog:', error);
    throw new Error(`Failed to load catalog: ${error.message}`);
  }
}

/**
 * Verifica se um catálogo foi importado (tem elementos salvos no backend)
 */
export async function isImportedCatalog(catalogId: number): Promise<boolean> {
  try {
    const response = await fetch(
      `http://localhost:8000/api/pages/?catalog=${catalogId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );

    if (!response.ok) return false;

    const pages = await response.json();
    return pages.length > 0;
  } catch {
    return false;
  }
}

/**
 * Processa um catálogo JSON aplicando regras de layout profissional
 *
 * Esta função é usada quando importamos um JSON bruto e queremos aplicar
 * automaticamente todas as regras de posicionamento, espaçamento e tipografia.
 *
 * @param catalogJson - Catálogo em formato JSON
 * @returns Catálogo processado com regras aplicadas
 */
export function processCatalogWithLayoutRules(catalogJson: any): {
  catalog: any;
  validation: ReturnType<typeof validateCatalog>;
  report: string;
} {
  console.log('[CatalogLoader] Aplicando regras de layout ao catálogo importado...');

  // 1. Validar catálogo antes de processar
  const validation = validateCatalog(catalogJson);
  const report = generateValidationReport(catalogJson);

  console.log('[CatalogLoader] Relatório de validação:\n', report);

  // 2. Processar cada página aplicando as regras
  const processedPages = catalogJson.pages.map((page: any, pageIndex: number) => {
    console.log(`[CatalogLoader] Processando página ${pageIndex + 1}/${catalogJson.pages.length}...`);

    // Determinar tamanho da página (A4 por padrão)
    const pageSize = page.size || 'A4';

    // Processar elementos da página
    const { elements, validations, context } = processPage(page.elements || [], pageSize);

    // Log de avisos
    validations.forEach((v, elemIndex) => {
      if (v.warnings.length > 0) {
        console.warn(
          `[CatalogLoader] Página ${pageIndex + 1}, Elemento ${elemIndex + 1}:`,
          v.warnings.map(w => w.message).join('; ')
        );
      }
    });

    return {
      ...page,
      elements,
      // Preservar metadados da página
      size: pageSize,
      width: context.page.width,
      height: context.page.height,
      margin: context.page.margin
    };
  });

  const processedCatalog = {
    ...catalogJson,
    pages: processedPages,
    // Adicionar metadados de processamento
    _processing: {
      appliedRules: true,
      processedAt: new Date().toISOString(),
      version: '1.0'
    }
  };

  console.log('[CatalogLoader] ✅ Catálogo processado com sucesso!');

  return {
    catalog: processedCatalog,
    validation,
    report
  };
}

/**
 * Carrega e processa um catálogo JSON de um arquivo
 *
 * @param file - Arquivo JSON do catálogo
 * @returns Catálogo processado pronto para importação
 */
export async function loadAndProcessCatalogFile(file: File): Promise<{
  catalog: any;
  validation: ReturnType<typeof validateCatalog>;
  report: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const catalogJson = JSON.parse(text);

        // Processar com regras de layout
        const result = processCatalogWithLayoutRules(catalogJson);

        resolve(result);
      } catch (error) {
        reject(new Error(`Erro ao processar catálogo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsText(file);
  });
}

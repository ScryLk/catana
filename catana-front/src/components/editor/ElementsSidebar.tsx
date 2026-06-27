import { type FC, useState } from 'react';
import { type ElementType } from '../../types/editor';
import {
  FiBox,
  FiType,
  FiImage,
  FiLayout,
  FiStar,
  FiTool,
  FiGrid,
  FiAward,
  FiSearch,
} from 'react-icons/fi';

interface ElementCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  elements: ElementDefinition[];
}

interface ElementDefinition {
  type: ElementType;
  name: string;
  icon: string;
  description: string;
  preview?: string;
}

interface ElementsSidebarProps {
  onAddElement: (type: ElementType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const elementCategories: ElementCategory[] = [
  {
    id: 'products',
    name: 'Produtos',
    icon: <FiBox className="w-5 h-5" />,
    elements: [
      {
        type: 'product-card',
        name: 'Cartão de Produto',
        icon: '🛍️',
        description: 'Cartão individual com imagem, nome e preço',
      },
      {
        type: 'product-highlight',
        name: 'Destaque de Produto',
        icon: '⭐',
        description: 'Produto em destaque com mais informações',
      },
      {
        type: 'product-grid',
        name: 'Grade de Produtos',
        icon: '▦',
        description: 'Grade organizada de múltiplos produtos',
      },
      {
        type: 'product-list',
        name: 'Lista de Produtos',
        icon: '☰',
        description: 'Lista vertical de produtos',
      },
    ],
  },
  {
    id: 'text',
    name: 'Texto',
    icon: <FiType className="w-5 h-5" />,
    elements: [
      {
        type: 'text-title',
        name: 'Título',
        icon: '📰',
        description: 'Título grande e chamativo',
      },
      {
        type: 'text-subtitle',
        name: 'Subtítulo',
        icon: '📄',
        description: 'Subtítulo ou cabeçalho secundário',
      },
      {
        type: 'text-paragraph',
        name: 'Parágrafo',
        icon: '📝',
        description: 'Bloco de texto corrido',
      },
      {
        type: 'text-list',
        name: 'Lista',
        icon: '📋',
        description: 'Lista com marcadores',
      },
    ],
  },
  {
    id: 'media',
    name: 'Mídia',
    icon: <FiImage className="w-5 h-5" />,
    elements: [
      {
        type: 'image',
        name: 'Imagem',
        icon: '🖼️',
        description: 'Imagem simples',
      },
      {
        type: 'banner',
        name: 'Banner',
        icon: '🎨',
        description: 'Banner promocional largo',
      },
      {
        type: 'gallery',
        name: 'Galeria',
        icon: '🖼️',
        description: 'Galeria de imagens com lightbox',
      },
      {
        type: 'carousel',
        name: 'Carrossel',
        icon: '🎠',
        description: 'Carrossel de imagens animado',
      },
    ],
  },
  {
    id: 'highlights',
    name: 'Destaques',
    icon: <FiStar className="w-5 h-5" />,
    elements: [
      {
        type: 'highlight-banner',
        name: 'Banner de Destaque',
        icon: '🎯',
        description: 'Banner chamativo com CTA',
      },
      {
        type: 'highlight-callout',
        name: 'Chamada',
        icon: '💡',
        description: 'Caixa de aviso ou informação',
      },
      {
        type: 'testimonial',
        name: 'Depoimento',
        icon: '💬',
        description: 'Citação de cliente com avaliação',
      },
    ],
  },
  {
    id: 'technical',
    name: 'Técnico',
    icon: <FiTool className="w-5 h-5" />,
    elements: [
      {
        type: 'technical-specs',
        name: 'Especificações',
        icon: '📊',
        description: 'Tabela de especificações técnicas',
      },
      {
        type: 'feature-list',
        name: 'Lista de Recursos',
        icon: '✓',
        description: 'Grid de recursos e benefícios',
      },
      {
        type: 'data-table',
        name: 'Tabela de Dados',
        icon: '📋',
        description: 'Tabela customizável',
      },
    ],
  },
  {
    id: 'interactive',
    name: 'Interativo',
    icon: <FiGrid className="w-5 h-5" />,
    elements: [
      {
        type: 'qr-code',
        name: 'QR Code',
        icon: '⚃',
        description: 'QR Code personalizável para links e informações',
      },
      {
        type: 'icon-grid',
        name: 'Grade de Ícones',
        icon: '⚡',
        description: 'Grid de ícones com descrições',
      },
    ],
  },
  {
    id: 'certificates',
    name: 'Certificações',
    icon: <FiAward className="w-5 h-5" />,
    elements: [
      {
        type: 'certification-badge',
        name: 'Selo de Certificação',
        icon: '🏆',
        description: 'Selo ISO, CE, ROHS, etc.',
      },
    ],
  },
  {
    id: 'layout',
    name: 'Layout',
    icon: <FiLayout className="w-5 h-5" />,
    elements: [
      {
        type: 'footer',
        name: 'Rodapé',
        icon: '📑',
        description: 'Rodapé com links e informações',
      },
      {
        type: 'divider',
        name: 'Divisor',
        icon: '—',
        description: 'Linha divisória',
      },
    ],
  },
];

export const ElementsSidebar: FC<ElementsSidebarProps> = ({
  onAddElement,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = elementCategories.map((category) => ({
    ...category,
    elements: category.elements.filter(
      (element) =>
        element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        element.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.elements.length > 0);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed left-16 top-14 h-screen w-80 bg-gray-800 border-r border-gray-700 shadow-xl z-30
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-200">Elementos</h2>
              <button
                onClick={onToggle}
                className="w-8 h-8 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar elementos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === category.id ? null : category.id
                    )
                  }
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-400">{category.icon}</div>
                    <span className="font-medium text-gray-200 text-sm">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {category.elements.length}
                  </span>
                </button>

                {/* Elements */}
                {(activeCategory === category.id || searchQuery) && (
                  <div className="mt-2 space-y-1 ml-2">
                    {category.elements.map((element) => (
                      <button
                        key={element.type}
                        onClick={() => onAddElement(element.type)}
                        className="w-full flex items-start gap-2 p-2 bg-gray-700/30 hover:bg-gray-700 rounded-lg transition-colors text-left group"
                      >
                        <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {element.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-200 text-xs mb-0.5">
                            {element.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {element.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Nenhum elemento encontrado
                </p>
              </div>
            )}
          </div>

          {/* Footer tip */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 <strong>Dica:</strong> Arraste elementos para o canvas ou clique para adicionar
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/20 z-40"
        />
      )}
    </>
  );
};

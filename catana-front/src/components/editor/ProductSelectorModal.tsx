import { type FC, useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiX, FiCheck, FiShoppingBag } from 'react-icons/fi';
import { productService, type ProductReference } from '../../services/productService';
import { useAuthStore } from '../../store/authStore';

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ProductReference) => void;
  organizationId?: number;
  sedeId?: number;
}

export const ProductSelectorModal: FC<ProductSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  organizationId,
  sedeId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductReference | null>(null);
  const { user } = useAuthStore();

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProductSelectorModal] Loading products...');

      const results = await productService.searchForEditor({
        query: searchQuery || undefined,
        limit: 20,
        organization: organizationId,
        sede: sedeId,
      });

      console.log('[ProductSelectorModal] Products loaded:', results.length);
      setProducts(results);
    } catch (err: any) {
      console.error('[ProductSelectorModal] Error loading products:', err);

      if (err.response?.status === 401) {
        setError('Você precisa estar autenticado.');
      } else if (err.response?.status === 403) {
        setError('Sem permissão de acesso.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Erro de conexão com o servidor.');
      } else {
        setError('Erro ao carregar produtos.');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: ProductReference) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelect(selectedProduct);
      onClose();
      setSelectedProduct(null);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    } else {
      setSelectedProduct(null);
      setSearchQuery('');
    }
  }, [isOpen, searchQuery, organizationId, sedeId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiPackage className="w-6 h-6" />
            Selecionar Produto
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <FiShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? 'Nenhum produto encontrado com esse termo.'
                  : 'Nenhum produto disponível.'}
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`group relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-primary-400 hover:shadow-sm'
                  }`}
                >
                  {/* Selection Indicator */}
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <FiCheck className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-3 overflow-hidden">
                    {product.cover_url ? (
                      <img
                        src={product.cover_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      SKU: {product.sku}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {product.currency === 'BRL' ? 'R$' : product.currency}{' '}
                        {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.stock !== undefined && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
                        </span>
                      )}
                    </div>
                    {product.category_name && (
                      <div className="mt-2">
                        <span className="inline-block text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded">
                          {product.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {selectedProduct ? (
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {selectedProduct.name} selecionado
              </span>
            ) : (
              <span>Selecione um produto para continuar</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedProduct}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                selectedProduct
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-zinc-300 dark:bg-zinc-600 cursor-not-allowed'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

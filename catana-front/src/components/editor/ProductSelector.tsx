import { type FC, useEffect, useState } from 'react';
import { FiSearch, FiTag, FiPlus } from 'react-icons/fi';
import { productService } from '../../services/productService';
import { categoryService, type Category } from '../../services/categoryService';
import type { Product } from '../../services/productService';
import { CategoryTreeSelect } from '../products/CategoryTreeSelect';
import { CategoryModal } from '../products/CategoryModal';

export const ProductSelector: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const storedSede = localStorage.getItem('active_sede');
      const storedOrg = localStorage.getItem('active_organization');
      const sedeId = storedSede ? JSON.parse(storedSede).id : undefined;
      const orgId = storedOrg ? JSON.parse(storedOrg).id : undefined;

      const cats = await categoryService.getCategories({ sede: sedeId, organization: orgId });
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const storedSede = localStorage.getItem('active_sede');
      const storedOrg = localStorage.getItem('active_organization');
      const sedeId = storedSede ? JSON.parse(storedSede).id : undefined;
      const orgId = storedOrg ? JSON.parse(storedOrg).id : undefined;

      const { products: data } = await productService.getProducts({
        search: searchTerm,
        category: selectedCategoryId || undefined,
        sede: sedeId,
        organization: orgId
      });
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (data: { name: string; description: string; parent: string | null }) => {
    try {
      const storedSede = localStorage.getItem('active_sede');
      const storedOrg = localStorage.getItem('active_organization');
      const sedeId = storedSede ? JSON.parse(storedSede).id : undefined;
      const orgId = storedOrg ? JSON.parse(storedOrg).id : undefined;

      await categoryService.createCategory({
        ...data,
        sede: sedeId,
        organization: orgId
      });

      await loadCategories();
      // Optionally select the new category if we had the ID, but createCategory returns the new category
      // const newCat = await categoryService.createCategory(...)
      // setSelectedCategoryId(newCat.id);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    e.dataTransfer.setData('componentType', 'product-card');
    e.dataTransfer.setData('productData', JSON.stringify(product));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter */}
      <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 rounded-lg text-sm transition-all"
          />
        </div>

        <div className="w-full">
          <CategoryTreeSelect
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onCreateNew={() => setIsCategoryModalOpen(true)}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Carregando produtos...</span>
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.id}
              draggable
              onDragStart={(e) => handleDragStart(e, product)}
              className="group bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {product.currency} {product.price.toFixed(2)}
                    </span>
                    {product.stock < 10 && (
                      <span className="text-[10px] font-bold text-red-500">
                        Restam {product.stock}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiTag className="w-3 h-3" />
                      {product.sku}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drag Hint */}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <FiPlus className="w-3 h-3 mr-1" />
                Arrastar para adicionar
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleCreateCategory}
        categories={categories}
      />
    </div>
  );
};

import { type FC } from 'react';
import { type ProductData, type ProductCardVariant } from '../../../types/editor';

interface ProductCardProps {
  data: ProductData;
  variant: ProductCardVariant;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ProductCard: FC<ProductCardProps> = ({
  data,
  variant,
  isSelected = false,
  onSelect,
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(price);
  };

  const renderCompact = () => (
    <div
      className={`
        relative bg-white rounded-2xl shadow-soft border-2 transition-all hover:shadow-medium
        ${isSelected ? 'border-primary-500 shadow-medium ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300'}
      `}
      onClick={onSelect}
    >
      {data.badge && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft">
            {data.badge}
          </span>
        </div>
      )}
      <div className="aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
          {data.name}
        </h3>
        {data.sku && (
          <p className="text-xs text-gray-500 mb-2">SKU: {data.sku}</p>
        )}
        <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          {formatPrice(data.price, data.currency)}
        </p>
        <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-xl transition-all shadow-soft hover:shadow-medium">
          Ver Detalhes
        </button>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex gap-4 p-4">
        <div className="relative flex-shrink-0">
          {data.badge && (
            <div className="absolute -top-2 -right-2 z-10">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {data.badge}
              </span>
            </div>
          )}
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={data.image}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{data.name}</h3>
          {data.sku && (
            <p className="text-sm text-gray-500 mb-2">SKU: {data.sku}</p>
          )}
          {data.category && (
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mb-2">
              {data.category}
            </span>
          )}
          {data.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {data.description}
            </p>
          )}
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-primary-600">
              {formatPrice(data.price, data.currency)}
            </p>
          </div>
        </div>
      </div>
      {data.specs && data.specs.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
          <div className="grid grid-cols-2 gap-2">
            {data.specs.slice(0, 4).map((spec, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{spec.label}:</span>
                <span className="ml-1 font-medium text-gray-900">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFeatured = () => (
    <div
      className={`
        relative bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 rounded-3xl shadow-strong border-2 transition-all overflow-hidden
        ${isSelected ? 'border-primary-500 shadow-2xl ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300 hover:shadow-xl'}
      `}
      onClick={onSelect}
    >
      {data.badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-medium animate-pulse">
            {data.badge}
          </span>
        </div>
      )}
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6">
        <div className="mb-4">
          {data.category && (
            <span className="inline-block bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border border-primary-200">
              {data.category}
            </span>
          )}
          <h3 className="font-bold text-2xl text-gray-900 mb-2">{data.name}</h3>
          {data.sku && (
            <p className="text-sm text-gray-500 mb-2">Código: {data.sku}</p>
          )}
          {data.description && (
            <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">{data.description}</p>
          )}
        </div>

        {data.specs && data.specs.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Especificações
            </h4>
            <div className="space-y-2">
              {data.specs.map((spec, index) => (
                <div key={index} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-600">{spec.label}</span>
                  <span className="font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500 mb-1">Preço</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {formatPrice(data.price, data.currency)}
            </p>
          </div>
          <button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-soft hover:shadow-medium">
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );

  const renderGridItem = () => (
    <div
      className={`
        relative bg-white rounded-lg shadow border-2 transition-all group
        ${isSelected ? 'border-primary-500 shadow-lg' : 'border-gray-200 hover:border-primary-300 hover:shadow-md'}
      `}
      onClick={onSelect}
    >
      {data.badge && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {data.badge}
          </span>
        </div>
      )}
      <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        {data.category && (
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mb-2">
            {data.category}
          </span>
        )}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {data.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-primary-600">
            {formatPrice(data.price, data.currency)}
          </p>
          {data.sku && (
            <span className="text-xs text-gray-400">#{data.sku}</span>
          )}
        </div>
      </div>
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'detailed':
      return renderDetailed();
    case 'featured':
      return renderFeatured();
    case 'grid-item':
      return renderGridItem();
    default:
      return renderCompact();
  }
};


import type { FC } from 'react';
import { DiPackShowcase } from '../plugins/dipack/templates/DiPackShowcase';
import { allProducts } from '../lib/products';

export const CatalogShowcase: FC = () => {
  // Adaptar a estrutura de `allProducts` para a esperada por `DiPackShowcase`
  const showcaseProducts = allProducts.map((p, index) => ({
    id: index + 1, // O DiPackShowcase espera um 'id' numérico
    code: p.code,
    description: p.name, // Usando 'name' como 'description'
    internalDimensions: p.internalDimensions || '',
    externalDimensions: p.externalDimensions || '',
    unitsPerBox: p.caixa || '',
    imageUrl: p.imageUrl,
    isNew: true, // Apenas para visualização
  }));

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <DiPackShowcase
          products={showcaseProducts}
          isEditable={false} // Importante: modo de visualização
          lineTitle="Catálogo Completo"
        />
      </div>
    </div>
  );
};

import type { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DiPackAcougueProps {
  width?: number;
  height?: number;
  productsRange?: 'page1' | 'page2';
  pageNumber?: number;
  qrCodeBaseUrl?: string;
  products?: {
    code: string;
    name: string;
    material: string;
    imageUrl?: string;
    internalDimensions?: string;
    externalDimensions?: string;
    category?: string;
  }[];
}

/**
 * Componente de Catálogo de Açougue DiPACK
 * Template moderno com produtos de açougue e frios
 */
export const DiPackAcougueV2: FC<DiPackAcougueProps> = ({
  width = 794,
  height = 1123,

  qrCodeBaseUrl = 'https://dipack.netlify.app/',
  pageNumber = 1,
  products: propsProducts
}) => {
  // Usar produtos passados via props
  const products = propsProducts ?? [];

  return (
    <div
      className="DiPackAcougue relative bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: '32px',
        paddingBottom: '80px',
        margin: 0,
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {/* Título da seção */}
      <div className="relative mb-6">
        <h1 className="text-4xl font-bold mb-2" style={{ letterSpacing: '0.02em' }}>
          <span className="block" style={{ color: '#f5a623' }}>Açougue & Frios</span>
        </h1>
        <div className="h-1.5 w-32" style={{ background: 'linear-gradient(90deg, #f5a623 0%, #fbbf24 100%)' }} />
      </div>

      {/* Grid de produtos */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6">
        {products.map((product) => (
          <div
            key={product.code}
            className="flex bg-white rounded-xl p-3 h-32 relative overflow-hidden border border-gray-100 shadow-sm"
          >
            {/* Imagem do Produto */}
            <div className="w-24 flex-shrink-0 flex items-center justify-center mr-3">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-2xl opacity-20">
                  📦
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 flex flex-col justify-center relative">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REF</span>
                <span className="text-sm font-black text-[#1a1a1a]">{product.code}</span>
              </div>

              <h3 className="text-xs font-bold text-[#1a1a1a] leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>

              <p className="text-[10px] text-gray-500 mb-1 leading-tight">
                <span className="font-bold text-gray-400">Mat:</span> {product.material}
              </p>

              {(product.internalDimensions || product.externalDimensions) && (
                <div className="flex flex-col gap-0.5">
                  {product.internalDimensions && (
                    <p className="text-[10px] text-gray-500 leading-tight">
                      <span className="font-bold text-gray-400">Int:</span> {product.internalDimensions}
                    </p>
                  )}
                  {product.externalDimensions && (
                    <p className="text-[10px] text-gray-500 leading-tight">
                      <span className="font-bold text-gray-400">Ext:</span> {product.externalDimensions}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="absolute bottom-2 right-2 bg-white p-0.5 rounded shadow-sm border border-gray-100">
              <QRCodeSVG
                value={`${qrCodeBaseUrl}catalogo#${product.code}`}
                size={32}
                level="M"
                fgColor="#1a1a1a"
                bgColor="#FFFFFF"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer com logo e número de página */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8">
        <img src="/dipack2.png" alt="DiPACK" className="h-8 object-contain opacity-60" />
        <span className="text-sm text-gray-400 font-medium">Página {pageNumber}</span>
      </div>
    </div>
  );
};

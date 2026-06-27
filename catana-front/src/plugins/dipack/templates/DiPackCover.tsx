import type { FC } from 'react';

interface DiPackCoverProps {
  width?: number | string;
  height?: number | string;
}

/**
 * Componente de Capa para Catálogo DiPACK Embalagens
 * Estilo profissional com cores da marca (amarelo-ouro #f5a623 e cinza grafite #1a1a1a)
 */
export const DiPackCover: FC<DiPackCoverProps> = ({
  width = 794,
  height = 1123
}) => {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    >
      {/* Textura de fundo - linhas geométricas */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
              <path
                d="M50 0L93.3 25L93.3 75L50 100L6.7 75L6.7 25Z"
                fill="none"
                stroke="#f5a623"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Linhas douradas decorativas superiores */}
      <div className="absolute top-0 left-0 right-0 h-2 opacity-60" style={{ background: 'linear-gradient(to right, transparent, #f5a623, transparent)' }} />
      <div className="absolute top-3 left-0 right-0 h-0.5 opacity-40" style={{ background: 'linear-gradient(to right, transparent, #f5a623, transparent)' }} />

      {/* Área central do logo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16">
        {/* Logo placeholder - substituir por upload de imagem */}
        <div className="w-full max-w-2xl mb-16 p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl backdrop-blur-sm" style={{ borderColor: 'rgba(245, 166, 35, 0.3)' }}>
          <div className="aspect-[3/1] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl" style={{ borderColor: 'rgba(245, 166, 35, 0.5)' }}>
            <div className="text-center">
              <img className='w-52 h-52' src="/dipack3.png" alt="DiPack Logo" />
            </div>
          </div>
        </div>

        {/* Título do catálogo */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-white tracking-wide">
            Catálogo de Mostruários de Embalagens
          </h1>
          <div className="h-1 w-32 mx-auto" style={{ background: 'linear-gradient(to right, transparent, #f5a623, transparent)' }} />
        </div>

        {/* Subtítulo/versão */}
        <div className="text-center">
          <p className="text-2xl text-gray-300 font-light tracking-wider">
            Versão 2025/2026
          </p>
        </div>
      </div>

      {/* Linhas douradas decorativas inferiores */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-16" style={{ background: 'linear-gradient(to top, rgba(245, 166, 35, 0.2), transparent)' }} />
        <div className="h-3" style={{ background: '#f5a623' }} />
      </div>

      {/* Elementos decorativos nos cantos */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: 'rgba(245, 166, 35, 0.5)' }} />
      <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: 'rgba(245, 166, 35, 0.5)' }} />
      <div className="absolute bottom-24 left-8 w-20 h-20 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: 'rgba(245, 166, 35, 0.5)' }} />
      <div className="absolute bottom-24 right-8 w-20 h-20 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: 'rgba(245, 166, 35, 0.5)' }} />
    </div>
  );
};

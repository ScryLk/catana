import type { FC } from 'react';

interface DiPackFooterProps {
  width?: number;
  pageNumber?: number;
}

/**
 * Componente de Rodapé padrão para páginas DiPACK
 * Reutilizável em todas as páginas do catálogo
 */
export const DiPackFooter: FC<DiPackFooterProps> = ({
  width = 800,
  pageNumber = 1
}) => {
  return (
    <div
      className="bg-white py-3 px-6"
      style={{ width: `${width}px` }}
    >
      <div className="flex items-center justify-between">
        {/* Logo e tagline */}
        <div className="flex items-center gap-3">
          <div className="h-10 px-4 flex items-center justify-center" style={{ background: '#f5a623' }}>
            <span className="text-white text-sm font-bold tracking-wider">DiPACK</span>
          </div>
          <span className="text-xs text-gray-600 italic">entregue o seu melhor.</span>
        </div>

        {/* Número da página */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Página</span>
          <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1">
            {String(pageNumber).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

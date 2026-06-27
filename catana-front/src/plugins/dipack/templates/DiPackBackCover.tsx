import type { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DiPackBackCoverProps {
  width?: number | string;
  height?: number | string;
  qrCodeUrl?: string;
}

/**
 * Componente de Contracapa para Catálogo DiPACK Embalagens
 * Inclui frase inspiracional e QR Code para catálogo digital
 */
export const DiPackBackCover: FC<DiPackBackCoverProps> = ({
  width = 794,
  height = 1123,
  qrCodeUrl = 'https://dipack.netlify.app/'
}) => {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    >
      {/* Borda amarela superior */}
      <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#f5a623' }} />

      {/* Textura de fundo */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #f5a623 0, #f5a623 2px, transparent 2px, transparent 60px)`,
        }} />
      </div>

      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 py-20">
        {/* Frase inspiracional */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            <span style={{ color: '#f5a623' }}>
              Segurança, praticidade e valor
            </span>
            <br />
            Para o seu produto
          </h2>
          <div className="h-1 w-48 mx-auto rounded-full" style={{ background: 'linear-gradient(to right, transparent, #f5a623, transparent)' }} />
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-3xl p-8" style={{ borderColor: 'rgba(245, 166, 35, 0.3)' }}>
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold text-gray-700">Acesse nosso catálogo digital</p>
          </div>

          {/* QR Code placeholder */}
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG
              value={qrCodeUrl}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#1a1a1a"
              bgColor="#ffffff"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Escaneie para mais informações</p>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="mt-16 text-center space-y-3">
          <div className="text-gray-300 space-y-1">
            <p className="text-sm">
              <span className="font-semibold" style={{ color: '#f5a623' }}>📞</span>
              {' '}(55) 3375-4397
            </p>
            <p className="text-sm">
              <span className="font-semibold" style={{ color: '#f5a623' }}>📧</span>
              {' '}dipackembalagens@gmail.com
            </p>
            <p className="text-sm">
              <span className="font-semibold" style={{ color: '#f5a623' }}>🌐</span>
              {' '}lucaskepler.live
            </p>
          </div>
        </div>

        {/* Patrocinadores */}
        <div className="mt-12 w-full">
          <p className="text-center text-xs text-gray-500 mb-4">Nossos parceiros</p>
          <div className="flex items-center justify-center gap-x-6">
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/fibraform.png" alt="Fibraform" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/goodfilm.png" alt="Goodfilm" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/libreplast.png" alt="Libreplast" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/liplast.png" alt="Liplast" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/meiwa.png" alt="Meiwa" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/novapack.png" alt="Novapack" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/papersul.png" alt="Papersul" className="h-8 object-contain" />
            </div>
            <div className="bg-white rounded-lg p-2">
              <img src="/patrocinadores/talge.png" alt="Talge" className="h-8 object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Elementos decorativos nos cantos */}
      <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 rounded-tl-2xl" style={{ borderColor: 'rgba(245, 166, 35, 0.4)' }} />
      <div className="absolute top-8 right-8 w-24 h-24 border-r-2 border-t-2 rounded-tr-2xl" style={{ borderColor: 'rgba(245, 166, 35, 0.4)' }} />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-l-2 border-b-2 rounded-bl-2xl" style={{ borderColor: 'rgba(245, 166, 35, 0.4)' }} />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 rounded-br-2xl" style={{ borderColor: 'rgba(245, 166, 35, 0.4)' }} />

      {/* Borda amarela inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-3" style={{ background: '#f5a623' }} />
    </div>
  );
};

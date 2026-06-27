import type { FC } from 'react';

interface DiPackConfeiteriaIntroProps {
  width?: number;
  height?: number;
}

/**
 * Página de Introdução/Apresentação do Catálogo de Confeitaria DiPACK
 * Destaca benefícios, aplicações e diferenciais das embalagens PET
 */
export const DiPackConfeiteriaIntro: FC<DiPackConfeiteriaIntroProps> = ({
  width = 794,
  height = 1123,
}) => {
  return (
    <div
      className="DiPackConfeiteriaIntro relative bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: '32px',
        margin: 0,
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {/* Header com Logo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="block" style={{ color: '#f5a623' }}>Confeitaria</span>
          </h1>
          <div className="h-1.5 w-32" style={{ background: 'linear-gradient(90deg, #f5a623 0%, #fbbf24 100%)' }} />
        </div>
        <div className="w-32 h-32">
          <img src="/dipack2.png" alt="DiPack" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Texto de Introdução */}
      <div className="mb-8">
        <p className="text-lg text-gray-700 leading-relaxed mb-3">
          Nossa linha de <strong>embalagens PET para confeitaria</strong> foi desenvolvida especialmente
          para atender às necessidades do setor alimentício, oferecendo <strong>segurança</strong>,
          <strong> praticidade</strong> e <strong>apresentação impecável</strong> para seus produtos.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Com designs modernos e funcionalidade excepcional, nossas embalagens garantem a
          proteção ideal para doces, tortas, bolos e sobremesas, mantendo o frescor e
          realçando a beleza de suas criações.
        </p>
      </div>

      {/* Diferenciais - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Card 1 */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.6) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src="/icons/confeitaria/segurancaalimentarnofundo.png" alt="Segurança Alimentar" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Segurança Alimentar</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Material PET cristal atóxico, livre de BPA, aprovado pela ANVISA para contato direto com alimentos
              </p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.6) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src="/icons/confeitaria/transparenciacristalinanofundo.png" alt="Visual Premium" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Visual Premium</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Transparência cristalina que realça cores e apresentação dos produtos, valorizando suas criações
              </p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.6) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src="/icons/confeitaria/sustentabilidadenofundo.png" alt="Sustentabilidade" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sustentabilidade</h3>
              <p className="text-sm text-gray-600 leading-snug">
                100% reciclável, contribuindo para a preservação ambiental e economia circular
              </p>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.6) 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src="/icons/confeitaria/versatilidade.png" alt="Praticidade" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Praticidade</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Empilháveis, leves e resistentes. Fácil armazenamento e transporte otimizado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Especificações Técnicas */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        }}
      >
        <h2 className="text-lg font-bold text-white mb-3">
          Especificações Técnicas
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Material:</strong> PET cristal e PET reciclável
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Espessura:</strong> 0.20mm a 0.45mm
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Temperatura:</strong> -18°C a +70°C
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Certificações:</strong> ANVISA, FDA approved
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Características:</strong> Atóxico, BPA Free
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Reciclável:</strong> 100% (Código 1)
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-12 right-12 border-t border-gray-200 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/dipack2.png" alt="DiPack" className="h-10 w-auto" />
          <div className="h-8 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">DiPACK Embalagens - Linha Confeitaria PET</span>
        </div>
        <span className="text-xs text-gray-400">www.dipackembalagens.com</span>
      </div>
    </div>
  );
};

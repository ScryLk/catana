import type { FC } from 'react';

interface DiPackFoodServiceIntroProps {
  width?: number;
  height?: number;
}

/**
 * Página de Introdução/Apresentação do Catálogo de Food Service DiPACK
 * Destaca benefícios, aplicações e diferenciais das embalagens PET para food service
 */
export const DiPackFoodServiceIntro: FC<DiPackFoodServiceIntroProps> = ({
  width = 794,
  height = 1123,
}) => {
  return (
    <div
      className="DiPackFoodServiceIntro relative bg-white"
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
            <span className="block" style={{ color: '#f5a623' }}>Food <span className="mx-1">Service</span></span>
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
          Nossa linha de <strong>embalagens PET para Food Service</strong> foi desenvolvida especialmente
          para atender às necessidades de restaurantes, lanchonetes, delivery e serviços de alimentação, oferecendo <strong>praticidade</strong>,
          <strong> segurança</strong> e <strong>versatilidade</strong> para seus produtos.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Com designs funcionais e alta resistência, nossas embalagens garantem a
          proteção ideal para refeições, porções e alimentos prontos, mantendo a qualidade e
          criando uma experiência positiva para seus clientes.
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
              <img src="/icons/foodservice/versatilidade.png" alt="Versatilidade" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Versatilidade</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Embalagens adaptáveis para diversos tipos de alimentos, de porções frias a pratos quentes
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
              <img src="/icons/foodservice/vedacao.png" alt="Vedação Hermética" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Vedação Hermética</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Tampa com fechamento seguro que evita vazamentos e mantém o frescor durante o transporte
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
              <img src="/icons/foodservice/altaresistencia.png" alt="Alta Resistência" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Alta Resistência</h3>
              <p className="text-sm text-gray-600 leading-snug">
                Material robusto que suporta empilhamento e transporte sem comprometer a integridade do produto
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
              <img src="/icons/foodservice/sustentabilidadenofundo.png" alt="Sustentabilidade" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sustentabilidade</h3>
              <p className="text-sm text-gray-600 leading-snug">
                100% reciclável e reutilizável, contribuindo para operações mais conscientes e sustentáveis
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
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Especificações Técnicas
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Material:</strong> PET cristal e EPS
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f5a623' }}>●</span>
            <span className="text-sm text-gray-300">
              <strong className="text-white">Espessura:</strong> 0.25mm a 0.50mm
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
              <strong className="text-white">Modelos:</strong> Diversos tamanhos e capacidades
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
          <span className="text-xs text-gray-500 font-medium">DiPACK Embalagens - Food Service PET</span>
        </div>
        <span className="text-xs text-gray-400">www.dipackembalagens.com</span>
      </div>
    </div>
  );
};

import type { FC } from 'react';
import { FiAward, FiTrendingUp, FiHeart } from 'react-icons/fi';

interface DiPackInstitutionalProps {
  width?: number;
  height?: number;
}

/**
 * Componente de Página Institucional para DiPACK Embalagens
 * Apresenta missão, visão e valores com ícones
 */
export const DiPackInstitutional: FC<DiPackInstitutionalProps> = ({
  width = 794,
  height = 1123
}) => {
  return (
    <div
      className="relative bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: '48px',
        margin: 0,
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {/* Background pattern sutil */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #f5a623 0, #f5a623 1px, transparent 1px, transparent 50px)`,
          backgroundSize: '70px 70px'
        }} />
      </div>

      {/* Título da página */}
      <div className="relative mb-12">
        <div className="inline-block">
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#f5a623', letterSpacing: '0.02em' }}>Sobre a DiPACK</h2>
          <div className="h-1" style={{ background: '#f5a623' }} />
        </div>
      </div>

      {/* Texto institucional - área editável */}
      <div className="relative p-8 mb-8">
        <p className="text-gray-700 leading-relaxed text-lg">
          <span className="font-semibold text-gray-900">A DiPACK Embalagens</span> é referência no
          mercado de soluções em embalagens industriais, oferecendo produtos de alta qualidade
          e design inovador. Nossa missão é entregar o melhor em embalagens para cada cliente,
          combinando tecnologia, sustentabilidade e excelência em atendimento.
        </p>
      </div>

      {/* Grid de 3 colunas: Missão, Visão, Valores */}
      <div className="relative grid grid-cols-3 gap-0">
        {/* Missão */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ backgroundColor: '#f5a623' }}>
              <FiAward className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Missão</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fornecer soluções em embalagens de excelência, garantindo qualidade,
            inovação e sustentabilidade em cada produto.
          </p>
        </div>

        {/* Visão */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ backgroundColor: '#f5a623' }}>
              <FiTrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Visão</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Ser a marca mais reconhecida e confiável no segmento de embalagens,
            liderando em inovação e satisfação do cliente.
          </p>
        </div>

        {/* Valores */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ backgroundColor: '#f5a623' }}>
              <FiHeart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Valores</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Qualidade, compromisso com o cliente, inovação contínua,
            responsabilidade ambiental e ética profissional.
          </p>
        </div>
      </div>

      {/* Ícones ilustrativos - Design, Tecnologia, Sustentabilidade */}
      <div className="relative mt-12 grid grid-cols-3 gap-0">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 flex items-center justify-center mb-3">
            <img src="/public/icons/design.png" alt="" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Design</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 flex items-center justify-center mb-3">
            <img src="/public/icons/tecnologia.png" alt="" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Tecnologia</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 flex items-center justify-center mb-3">
            <img src="/public/icons/sustentabilidade.png" alt="" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Sustentabilidade</span>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-12 right-12 border-t border-gray-200 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/dipack2.png" alt="DiPack" className="h-10 w-auto" />
          <div className="h-8 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">DiPACK Embalagens - Institucional</span>
        </div>
        <span className="text-xs text-gray-400">www.dipackembalagens.com</span>
      </div>
    </div>
  );
};

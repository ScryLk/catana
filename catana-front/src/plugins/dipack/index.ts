import { pluginRegistry } from '../registry';
import { DiPackCover } from './templates/DiPackCover';
import { DiPackInstitutional } from './templates/DiPackInstitutional';
import { DiPackShowcase } from './templates/DiPackShowcase';
import { DiPackFooter } from './templates/DiPackFooter';
import { DiPackBackCover } from './templates/DiPackBackCover';
import { DiPackConfeitariaV2 } from './templates/DiPackConfeitariaV2';
import { DiPackConfeiteriaIntro } from './templates/DiPackConfeiteriaIntro';
import { DiPackAcougueV2 } from './templates/DiPackAcougueV2';
import { DiPackAcougueIntro } from './templates/DiPackAcougueIntro';
import { DiPackFestaV2 } from './templates/DiPackFestaV2';
import { DiPackFestaIntro } from './templates/DiPackFestaIntro';
import { DiPackFoodServiceV2 } from './templates/DiPackFoodServiceV2';
import { DiPackFoodServiceIntro } from './templates/DiPackFoodServiceIntro';
import { DiPackPanel } from './panel/DiPackPanel';

export const DIPACK_PLUGIN_ID = 'dipack';

export const registerDiPackPlugin = () => {
    pluginRegistry.register('dipack-cover', DiPackCover);
    pluginRegistry.register('dipack-institutional', DiPackInstitutional);
    pluginRegistry.register('dipack-showcase', DiPackShowcase);
    pluginRegistry.register('dipack-footer', DiPackFooter);
    pluginRegistry.register('dipack-back-cover', DiPackBackCover);
    pluginRegistry.register('dipack-confeitaria', DiPackConfeitariaV2);
    pluginRegistry.register('dipack-confeitaria-intro', DiPackConfeiteriaIntro);
    pluginRegistry.register('dipack-acougue', DiPackAcougueV2);
    pluginRegistry.register('dipack-acougue-intro', DiPackAcougueIntro);
    pluginRegistry.register('dipack-festa', DiPackFestaV2);
    pluginRegistry.register('dipack-festa-intro', DiPackFestaIntro);
    pluginRegistry.register('dipack-food-service', DiPackFoodServiceV2);
    pluginRegistry.register('dipack-food-service-intro', DiPackFoodServiceIntro);
};

// Template metadata for the editor
export const DIPACK_TEMPLATES = {
    cover: {
        id: 'dipack-cover',
        name: 'Capa DiPACK',
        category: 'template',
        description: 'Capa profissional para catálogo DiPACK Embalagens',
        icon: '📘',
        defaultSize: { width: 800, height: 1100 }
    },
    institutional: {
        id: 'dipack-institutional',
        name: 'Página Institucional',
        category: 'template',
        description: 'Apresentação da empresa com missão, visão e valores',
        icon: '🏢',
        defaultSize: { width: 800, height: 1100 }
    },
    showcase: {
        id: 'dipack-showcase',
        name: 'Mostruário de Produtos',
        category: 'template',
        description: 'Grid de produtos com espaços para imagens e especificações',
        icon: '📦',
        defaultSize: { width: 800, height: 1100 }
    },
    footer: {
        id: 'dipack-footer',
        name: 'Rodapé DiPACK',
        category: 'template',
        description: 'Rodapé padrão com logo e numeração de página',
        icon: '📄',
        defaultSize: { width: 800, height: 60 }
    },
    backCover: {
        id: 'dipack-back-cover',
        name: 'Contracapa DiPACK',
        category: 'template',
        description: 'Contracapa com QR Code e informações de contato',
        icon: '📕',
        defaultSize: { width: 800, height: 1100 }
    },
    confeitaria: {
        id: 'dipack-confeitaria',
        name: 'Catálogo Confeitaria',
        category: 'template',
        description: 'Catálogo de produtos para confeitaria PET',
        icon: '🧁',
        defaultSize: { width: 800, height: 1130 }
    },
    confeiteriaIntro: {
        id: 'dipack-confeitaria-intro',
        name: 'Apresentação Confeitaria',
        category: 'template',
        description: 'Página de introdução do catálogo de confeitaria com benefícios e aplicações',
        icon: '📄',
        defaultSize: { width: 800, height: 1130 }
    },
    acougue: {
        id: 'dipack-acougue',
        name: 'Catálogo Açougue',
        category: 'template',
        description: 'Catálogo de produtos para açougue e frios PET',
        icon: '🥩',
        defaultSize: { width: 800, height: 1130 }
    },
    acougueIntro: {
        id: 'dipack-acougue-intro',
        name: 'Apresentação Açougue',
        category: 'template',
        description: 'Página de introdução do catálogo de açougue com benefícios e especificações',
        icon: '📄',
        defaultSize: { width: 800, height: 1130 }
    },
    festa: {
        id: 'dipack-festa',
        name: 'Catálogo Linha de Festa',
        category: 'template',
        description: 'Catálogo de produtos para festas e eventos PET',
        icon: '🎉',
        defaultSize: { width: 800, height: 1130 }
    },
    festaIntro: {
        id: 'dipack-festa-intro',
        name: 'Apresentação Linha de Festa',
        category: 'template',
        description: 'Página de introdução do catálogo de festas com benefícios e especificações',
        icon: '📄',
        defaultSize: { width: 800, height: 1130 }
    },
    foodService: {
        id: 'dipack-food-service',
        name: 'Catálogo Food Service',
        category: 'template',
        description: 'Catálogo de produtos para food service e delivery PET',
        icon: '🍱',
        defaultSize: { width: 800, height: 1130 }
    },
    foodServiceIntro: {
        id: 'dipack-food-service-intro',
        name: 'Apresentação Food Service',
        category: 'template',
        description: 'Página de introdução do catálogo de food service com benefícios e especificações',
        icon: '📄',
        defaultSize: { width: 800, height: 1130 }
    }
} as const;

export { DiPackPanel };

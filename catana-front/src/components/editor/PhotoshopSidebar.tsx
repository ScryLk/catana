import { type FC, useState, useEffect } from 'react';
import {
  FiLayers,
  FiSliders,
  FiImage,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiSquare,
  FiCircle,
  FiType,
  FiChevronRight,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiCopy,
  FiFolder,
  FiSave,
} from 'react-icons/fi';
import { useEditorStore } from '../../store/editorStore';

import { type ElementType, type CatalogElement } from '../../types/editor';
import { getDefaultElementData, getDefaultElementSize } from '../../utils/elementDefaults';
import { MediaLibrary } from './MediaLibrary';
import { ProductCountModal } from './ProductCountModal';
import { Tooltip } from '../ui/Tooltip';
import { SaveComponentModal } from './SaveComponentModal';

interface PhotoshopSidebarProps {
  side?: 'left' | 'right';
  defaultTab?: TabType;
  onClose?: () => void;
}

type TabType = 'elements' | 'layers' | 'properties' | 'page-settings';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'elements', label: 'Elementos', icon: <FiSquare /> },
  { id: 'layers', label: 'Camadas', icon: <FiLayers /> },
  { id: 'properties', label: 'Propriedades', icon: <FiSliders /> },
  { id: 'page-settings', label: 'Página', icon: <FiFileText /> },
];

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: FC<AccordionSectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-200">{title}</span>
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
      {isOpen && <div className="px-4 py-3 bg-gray-800/50">{children}</div>}
    </div>
  );
};

interface ElementButtonProps {
  icon: React.ReactNode;
  label: string;
  type: ElementType;
  onClick: (type: ElementType) => void;
}

const ElementButton: FC<ElementButtonProps> = ({ icon, label, type, onClick }) => {
  return (
    <button
      onClick={() => onClick(type)}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-700/50 hover:bg-primary-600/80 rounded-lg transition-all duration-200 group"
    >
      <div className="text-2xl text-gray-300 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-xs text-gray-300 group-hover:text-white font-medium transition-colors">
        {label}
      </span>
    </button>
  );
};

const ElementsPanel: FC = () => {
  const { addElement } = useEditorStore();
  const [showProductCountModal, setShowProductCountModal] = useState(false);

  const handleAddElement = (type: ElementType) => {
    // Se for mostruário, abrir modal para escolher quantidade
    if (type === 'dipack-showcase') {
      setShowProductCountModal(true);
      return;
    }

    const defaultData = getDefaultElementData(type);

    addElement({
      type,
      position: { x: 0, y: 0 },
      size: getDefaultElementSize(type),
      style: {},
      ...defaultData,
    });
  };

  const handleConfirmProductCount = (count: number) => {
    const defaultData = getDefaultElementData('dipack-showcase');

    // Criar produtos de acordo com a quantidade escolhida
    const products = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      code: `REF-${String(i + 1).padStart(4, '0')}`,
      description: 'Descrição do produto',
      internalDimensions: '00 x 00 x 00 cm',
      externalDimensions: '00 x 00 x 00 cm',
      unitsPerBox: '00 unidades',
      isNew: true,
    }));

    addElement({
      type: 'dipack-showcase',
      position: { x: 0, y: 0 },
      size: getDefaultElementSize('dipack-showcase'),
      style: {},
      ...defaultData,
      content: {
        ...defaultData.content,
        productCount: count,
        products,
      },
    });
  };

  const handleGenerateConfeitariaCatalog = () => {
    const { clearCurrentPage, addPage, addElement } = useEditorStore.getState();

    // Confirmar com o usuário
    if (!confirm('Isso vai criar um catálogo completo de confeitaria com múltiplas páginas e todos os produtos PET. Deseja continuar?')) {
      return;
    }

    // Limpar página atual
    clearCurrentPage();

    // Página 1: Embalagens PF-08 a PF-32B (9 produtos)
    addElement({
      type: 'dipack-confeitaria',
      position: { x: 0, y: 0 },
      size: { width: 800, height: 1130 },
      style: {},
      content: {
        pageNumber: 1,
        productsRange: 'page1',
      },
      visible: true,
      locked: false,
    });

    // Criar Página 2: PF-50 a PF-80 + início dos Potes
    setTimeout(() => {
      addPage('Confeitaria - Página 2');
      setTimeout(() => {
        addElement({
          type: 'dipack-confeitaria',
          position: { x: 0, y: 0 },
          size: { width: 800, height: 1130 },
          style: {},
          content: {
            pageNumber: 2,
            productsRange: 'page2',
          },
          visible: true,
          locked: false,
        });
      }, 50);
    }, 100);

    // Mensagem de sucesso
    setTimeout(() => {
      alert('✨ Catálogo de Confeitaria criado com sucesso!\n\n📚 Contém 2 páginas:\n- Página 1: Embalagens PF-08 a PF-32B (9 produtos)\n- Página 2: PF-50 a PF-80 + Potes PET (9 produtos)\n\n💡 Total: 18 produtos sem botões NEW!');
    }, 300);
  };

  const handleGenerateSampleCatalog = () => {
    const { clearCurrentPage, addPage } = useEditorStore.getState();

    // Confirmar com o usuário
    if (!confirm('Isso vai criar um catálogo exemplo completo com 9 páginas e múltiplas categorias. Deseja continuar?')) {
      return;
    }

    // Limpar página atual
    clearCurrentPage();

    // CATEGORIA 1: Linha Organizadores Premium (20 produtos)
    const organizadoresProducts = [
      { id: 1, code: 'ORG-0001', description: 'Organizador Multiuso Pequeno', internalDimensions: '15 x 10 x 08 cm', externalDimensions: '16 x 11 x 09 cm', unitsPerBox: '50 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop' },
      { id: 2, code: 'ORG-0002', description: 'Organizador Multiuso Médio', internalDimensions: '25 x 15 x 12 cm', externalDimensions: '26 x 16 x 13 cm', unitsPerBox: '30 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop' },
      { id: 3, code: 'ORG-0003', description: 'Organizador Multiuso Grande', internalDimensions: '40 x 30 x 20 cm', externalDimensions: '41 x 31 x 21 cm', unitsPerBox: '20 unidades', isNew: true, badgeText: 'BEST', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop' },
      { id: 4, code: 'ORG-0004', description: 'Organizador de Maquiagem', internalDimensions: '20 x 15 x 10 cm', externalDimensions: '21 x 16 x 11 cm', unitsPerBox: '40 unidades', isNew: true, badgeText: 'TOP', badgeColor: '#ec4899', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' },
      { id: 5, code: 'ORG-0005', description: 'Organizador de Bijuterias', internalDimensions: '18 x 12 x 05 cm', externalDimensions: '19 x 13 x 06 cm', unitsPerBox: '60 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop' },
      { id: 6, code: 'ORG-0006', description: 'Organizador Empilhável', internalDimensions: '30 x 20 x 15 cm', externalDimensions: '31 x 21 x 16 cm', unitsPerBox: '25 unidades', isNew: true, badgeText: 'PROMO', badgeColor: '#ef4444', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
      { id: 7, code: 'ORG-0007', description: 'Organizador com Rodas', internalDimensions: '35 x 25 x 18 cm', externalDimensions: '36 x 26 x 20 cm', unitsPerBox: '15 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&sat=-100' },
      { id: 8, code: 'ORG-0008', description: 'Organizador de Escritório', internalDimensions: '22 x 18 x 08 cm', externalDimensions: '23 x 19 x 09 cm', unitsPerBox: '35 unidades', isNew: true, badgeText: 'TOP', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop' },
      { id: 9, code: 'ORG-0009', description: 'Organizador de Ferramentas', internalDimensions: '45 x 30 x 25 cm', externalDimensions: '46 x 31 x 26 cm', unitsPerBox: '12 unidades', isNew: true, badgeText: 'FORTE', badgeColor: '#8b5cf6', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop' },
      { id: 10, code: 'ORG-0010', description: 'Organizador Infantil', internalDimensions: '28 x 22 x 16 cm', externalDimensions: '29 x 23 x 17 cm', unitsPerBox: '24 unidades', isNew: true, badgeText: 'KIDS', badgeColor: '#f59e0b', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=60' },
      { id: 11, code: 'ORG-0011', description: 'Organizador de Calçados', internalDimensions: '32 x 20 x 12 cm', externalDimensions: '33 x 21 x 13 cm', unitsPerBox: '20 unidades', isNew: true, badgeText: 'ECO', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=120' },
      { id: 12, code: 'ORG-0012', description: 'Organizador de Roupas', internalDimensions: '35 x 28 x 10 cm', externalDimensions: '36 x 29 x 11 cm', unitsPerBox: '18 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&sat=-50' },
      { id: 13, code: 'ORG-0013', description: 'Organizador Modulável', internalDimensions: '20 x 20 x 20 cm', externalDimensions: '21 x 21 x 21 cm', unitsPerBox: '30 unidades', isNew: true, badgeText: 'VERSÁTIL', badgeColor: '#06b6d4', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=180' },
      { id: 14, code: 'ORG-0014', description: 'Organizador com Tampa', internalDimensions: '38 x 26 x 22 cm', externalDimensions: '39 x 27 x 23 cm', unitsPerBox: '16 unidades', isNew: true, badgeText: 'PREMIUM', badgeColor: '#6366f1', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=240' },
      { id: 15, code: 'ORG-0015', description: 'Organizador Transparente', internalDimensions: '30 x 20 x 15 cm', externalDimensions: '31 x 21 x 16 cm', unitsPerBox: '22 unidades', isNew: true, badgeText: 'CRYSTAL', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&sat=-100' },
      { id: 16, code: 'ORG-0016', description: 'Organizador com Divisórias', internalDimensions: '28 x 18 x 06 cm', externalDimensions: '29 x 19 x 07 cm', unitsPerBox: '40 unidades', isNew: true, badgeText: '12 DIV', badgeColor: '#84cc16', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&hue=90' },
      { id: 17, code: 'ORG-0017', description: 'Organizador de Banheiro', internalDimensions: '25 x 15 x 10 cm', externalDimensions: '26 x 16 x 11 cm', unitsPerBox: '28 unidades', isNew: true, badgeText: 'ANTI-UMID', badgeColor: '#14b8a6', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop&hue=150' },
      { id: 18, code: 'ORG-0018', description: 'Organizador de Geladeira', internalDimensions: '32 x 16 x 08 cm', externalDimensions: '33 x 17 x 09 cm', unitsPerBox: '24 unidades', isNew: true, badgeText: 'FOOD', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=180' },
      { id: 19, code: 'ORG-0019', description: 'Organizador Suspenso', internalDimensions: '40 x 10 x 60 cm', externalDimensions: '41 x 11 x 61 cm', unitsPerBox: '10 unidades', isNew: true, badgeText: 'PORTA', badgeColor: '#f97316', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&hue=30' },
      { id: 20, code: 'ORG-0020', description: 'Organizador de Fios', internalDimensions: '15 x 10 x 05 cm', externalDimensions: '16 x 11 x 06 cm', unitsPerBox: '80 unidades', isNew: true, badgeText: 'TECH', badgeColor: '#8b5cf6', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=270' },
    ];

    // CATEGORIA 2: Linha Potes e Recipientes (16 produtos)
    const potesProducts = [
      { id: 1, code: 'POT-0001', description: 'Pote Hermético 500ml', internalDimensions: '12 x 12 x 08 cm', externalDimensions: '13 x 13 x 09 cm', unitsPerBox: '48 unidades', isNew: true, badgeText: 'BEST', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&hue=100' },
      { id: 2, code: 'POT-0002', description: 'Pote Hermético 1L', internalDimensions: '15 x 15 x 12 cm', externalDimensions: '16 x 16 x 13 cm', unitsPerBox: '36 unidades', isNew: true, badgeText: 'TOP', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=200' },
      { id: 3, code: 'POT-0003', description: 'Pote Hermético 2L', internalDimensions: '20 x 20 x 15 cm', externalDimensions: '21 x 21 x 16 cm', unitsPerBox: '24 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=40' },
      { id: 4, code: 'POT-0004', description: 'Pote Quadrado 300ml', internalDimensions: '10 x 10 x 06 cm', externalDimensions: '11 x 11 x 07 cm', unitsPerBox: '60 unidades', isNew: true, badgeText: 'PROMO', badgeColor: '#ef4444', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=10' },
      { id: 5, code: 'POT-0005', description: 'Pote Retangular 800ml', internalDimensions: '18 x 12 x 08 cm', externalDimensions: '19 x 13 x 09 cm', unitsPerBox: '40 unidades', isNew: true, badgeText: 'ECO', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop&hue=140' },
      { id: 6, code: 'POT-0006', description: 'Pote com Tampa Click 1.5L', internalDimensions: '18 x 18 x 14 cm', externalDimensions: '19 x 19 x 15 cm', unitsPerBox: '30 unidades', isNew: true, badgeText: 'CLICK', badgeColor: '#8b5cf6', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&hue=260' },
      { id: 7, code: 'POT-0007', description: 'Pote Empilhável 600ml', internalDimensions: '14 x 14 x 09 cm', externalDimensions: '15 x 15 x 10 cm', unitsPerBox: '45 unidades', isNew: true, badgeText: 'STACK', badgeColor: '#06b6d4', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&hue=180' },
      { id: 8, code: 'POT-0008', description: 'Pote Redondo 1.2L', internalDimensions: '16 x 16 x 13 cm', externalDimensions: '17 x 17 x 14 cm', unitsPerBox: '32 unidades', isNew: true, badgeText: 'NEW', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&hue=50' },
      { id: 9, code: 'POT-0009', description: 'Pote com Trava 2.5L', internalDimensions: '22 x 22 x 16 cm', externalDimensions: '23 x 23 x 17 cm', unitsPerBox: '20 unidades', isNew: true, badgeText: 'LOCK', badgeColor: '#ec4899', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=320' },
      { id: 10, code: 'POT-0010', description: 'Pote Microondas 750ml', internalDimensions: '15 x 12 x 10 cm', externalDimensions: '16 x 13 x 11 cm', unitsPerBox: '38 unidades', isNew: true, badgeText: 'MICRO', badgeColor: '#f97316', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=20' },
      { id: 11, code: 'POT-0011', description: 'Pote Congelador 1.8L', internalDimensions: '20 x 15 x 14 cm', externalDimensions: '21 x 16 x 15 cm', unitsPerBox: '28 unidades', isNew: true, badgeText: 'FREEZE', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&hue=220' },
      { id: 12, code: 'POT-0012', description: 'Pote Organizador Multiuso 400ml', internalDimensions: '12 x 10 x 08 cm', externalDimensions: '13 x 11 x 09 cm', unitsPerBox: '50 unidades', isNew: true, badgeText: 'MULTI', badgeColor: '#84cc16', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=90' },
      { id: 13, code: 'POT-0013', description: 'Pote Transparente 900ml', internalDimensions: '16 x 14 x 11 cm', externalDimensions: '17 x 15 x 12 cm', unitsPerBox: '35 unidades', isNew: true, badgeText: 'CRYSTAL', badgeColor: '#14b8a6', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop&hue=160' },
      { id: 14, code: 'POT-0014', description: 'Pote Premium com Válvula 1.3L', internalDimensions: '18 x 16 x 12 cm', externalDimensions: '19 x 17 x 13 cm', unitsPerBox: '26 unidades', isNew: true, badgeText: 'PREMIUM', badgeColor: '#6366f1', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&hue=240' },
      { id: 15, code: 'POT-0015', description: 'Pote Colorido 550ml', internalDimensions: '14 x 12 x 09 cm', externalDimensions: '15 x 13 x 10 cm', unitsPerBox: '42 unidades', isNew: true, badgeText: 'COLOR', badgeColor: '#f59e0b', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&hue=60' },
      { id: 16, code: 'POT-0016', description: 'Pote Mini 200ml', internalDimensions: '08 x 08 x 05 cm', externalDimensions: '09 x 09 x 06 cm', unitsPerBox: '80 unidades', isNew: true, badgeText: 'MINI', badgeColor: '#ec4899', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&hue=300' },
    ];

    // CATEGORIA 3: Linha Garrafas e Squeeze (12 produtos)
    const garrafasProducts = [
      { id: 1, code: 'GAR-0001', description: 'Garrafa Sport 500ml', internalDimensions: '07 x 07 x 20 cm', externalDimensions: '08 x 08 x 21 cm', unitsPerBox: '48 unidades', isNew: true, badgeText: 'SPORT', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=210' },
      { id: 2, code: 'GAR-0002', description: 'Garrafa Térmica 750ml', internalDimensions: '08 x 08 x 25 cm', externalDimensions: '09 x 09 x 26 cm', unitsPerBox: '36 unidades', isNew: true, badgeText: 'THERMO', badgeColor: '#ef4444', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=5' },
      { id: 3, code: 'GAR-0003', description: 'Squeeze Infantil 400ml', internalDimensions: '06 x 06 x 18 cm', externalDimensions: '07 x 07 x 19 cm', unitsPerBox: '60 unidades', isNew: true, badgeText: 'KIDS', badgeColor: '#f59e0b', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&hue=50' },
      { id: 4, code: 'GAR-0004', description: 'Garrafa Flip Top 1L', internalDimensions: '09 x 09 x 28 cm', externalDimensions: '10 x 10 x 29 cm', unitsPerBox: '30 unidades', isNew: true, badgeText: 'FLIP', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=130' },
      { id: 5, code: 'GAR-0005', description: 'Squeeze com Canudo 600ml', internalDimensions: '07 x 07 x 22 cm', externalDimensions: '08 x 08 x 23 cm', unitsPerBox: '45 unidades', isNew: true, badgeText: 'STRAW', badgeColor: '#ec4899', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop&hue=310' },
      { id: 6, code: 'GAR-0006', description: 'Garrafa Reutilizável 800ml', internalDimensions: '08 x 08 x 26 cm', externalDimensions: '09 x 09 x 27 cm', unitsPerBox: '40 unidades', isNew: true, badgeText: 'ECO', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&hue=150' },
      { id: 7, code: 'GAR-0007', description: 'Squeeze Academia 900ml', internalDimensions: '08 x 08 x 27 cm', externalDimensions: '09 x 09 x 28 cm', unitsPerBox: '35 unidades', isNew: true, badgeText: 'GYM', badgeColor: '#8b5cf6', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&hue=270' },
      { id: 8, code: 'GAR-0008', description: 'Garrafa Premium 1.2L', internalDimensions: '09 x 09 x 30 cm', externalDimensions: '10 x 10 x 31 cm', unitsPerBox: '28 unidades', isNew: true, badgeText: 'PREMIUM', badgeColor: '#6366f1', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&hue=250' },
      { id: 9, code: 'GAR-0009', description: 'Squeeze Colorido 550ml', internalDimensions: '07 x 07 x 21 cm', externalDimensions: '08 x 08 x 22 cm', unitsPerBox: '50 unidades', isNew: true, badgeText: 'COLOR', badgeColor: '#f97316', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=30' },
      { id: 10, code: 'GAR-0010', description: 'Garrafa Infusor 700ml', internalDimensions: '08 x 08 x 24 cm', externalDimensions: '09 x 09 x 25 cm', unitsPerBox: '38 unidades', isNew: true, badgeText: 'INFUSOR', badgeColor: '#14b8a6', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=170' },
      { id: 11, code: 'GAR-0011', description: 'Squeeze Transparente 650ml', internalDimensions: '07 x 07 x 23 cm', externalDimensions: '08 x 08 x 24 cm', unitsPerBox: '42 unidades', isNew: true, badgeText: 'CRYSTAL', badgeColor: '#06b6d4', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&hue=190' },
      { id: 12, code: 'GAR-0012', description: 'Garrafa com Alça 850ml', internalDimensions: '08 x 08 x 26 cm', externalDimensions: '09 x 09 x 27 cm', unitsPerBox: '32 unidades', isNew: true, badgeText: 'HANDLE', badgeColor: '#84cc16', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=100' },
    ];

    // CATEGORIA 4: Linha Cestos e Caixas (8 produtos)
    const cestosProducts = [
      { id: 1, code: 'CES-0001', description: 'Cesto Organizador Grande', internalDimensions: '45 x 35 x 25 cm', externalDimensions: '46 x 36 x 26 cm', unitsPerBox: '12 unidades', isNew: true, badgeText: 'GRANDE', badgeColor: '#3b82f6', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop&hue=220' },
      { id: 2, code: 'CES-0002', description: 'Cesto Vazado Médio', internalDimensions: '35 x 28 x 20 cm', externalDimensions: '36 x 29 x 21 cm', unitsPerBox: '18 unidades', isNew: true, badgeText: 'VAZADO', badgeColor: '#10b981', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&hue=140' },
      { id: 3, code: 'CES-0003', description: 'Caixa Empilhável com Tampa', internalDimensions: '40 x 30 x 22 cm', externalDimensions: '41 x 31 x 23 cm', unitsPerBox: '15 unidades', isNew: true, badgeText: 'STACK', badgeColor: '#f5a623', imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=400&fit=crop&hue=40' },
      { id: 4, code: 'CES-0004', description: 'Cesto Roupa Suja 60L', internalDimensions: '50 x 40 x 30 cm', externalDimensions: '51 x 41 x 31 cm', unitsPerBox: '10 unidades', isNew: true, badgeText: 'ROUPA', badgeColor: '#8b5cf6', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&hue=270' },
      { id: 5, code: 'CES-0005', description: 'Caixa Multiuso com Alças', internalDimensions: '38 x 28 x 18 cm', externalDimensions: '39 x 29 x 19 cm', unitsPerBox: '20 unidades', isNew: true, badgeText: 'ALÇAS', badgeColor: '#ec4899', imageUrl: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&h=400&fit=crop&hue=320' },
      { id: 6, code: 'CES-0006', description: 'Cesto Organizador com Rodas', internalDimensions: '42 x 32 x 28 cm', externalDimensions: '43 x 33 x 30 cm', unitsPerBox: '14 unidades', isNew: true, badgeText: 'RODAS', badgeColor: '#f97316', imageUrl: 'https://images.unsplash.com/photo-1611081695776-e50c4c1e5c4e?w=400&h=400&fit=crop&hue=25' },
      { id: 7, code: 'CES-0007', description: 'Caixa Transparente Premium', internalDimensions: '36 x 26 x 20 cm', externalDimensions: '37 x 27 x 21 cm', unitsPerBox: '16 unidades', isNew: true, badgeText: 'CRYSTAL', badgeColor: '#14b8a6', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&hue=180' },
      { id: 8, code: 'CES-0008', description: 'Cesto Infantil Colorido', internalDimensions: '32 x 24 x 16 cm', externalDimensions: '33 x 25 x 17 cm', unitsPerBox: '22 unidades', isNew: true, badgeText: 'KIDS', badgeColor: '#f59e0b', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&hue=60' },
    ];

    // Página 1: Capa
    const coverData = getDefaultElementData('dipack-cover');
    addElement({
      type: 'dipack-cover',
      position: { x: 0, y: 0 },
      size: getDefaultElementSize('dipack-cover'),
      style: {},
      ...coverData,
      content: {
        ...coverData.content,
        title: 'Coleção Primavera 2025',
        subtitle: 'Embalagens Sustentáveis & Inovadoras',
      },
    });

    // Criar Página 2 e adicionar Institucional
    setTimeout(() => {
      addPage('Institucional');
      setTimeout(() => {
        const instData = getDefaultElementData('dipack-institutional');
        addElement({
          type: 'dipack-institutional',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-institutional'),
          style: {},
          ...instData,
        });
      }, 50);
    }, 100);

    // Criar Página 3 e adicionar Mostruário - ORGANIZADORES (20 produtos)
    setTimeout(() => {
      addPage('Organizadores');
      setTimeout(() => {
        const showcaseData = getDefaultElementData('dipack-showcase');
        addElement({
          type: 'dipack-showcase',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-showcase'),
          style: {},
          ...showcaseData,
          content: {
            lineTitle: 'Linha Organizadores Premium',
            productCount: 20,
            products: organizadoresProducts,
          },
        });
      }, 50);
    }, 250);

    // Criar Página 4 e adicionar Mostruário - POTES (16 produtos)
    setTimeout(() => {
      addPage('Potes e Recipientes');
      setTimeout(() => {
        const showcaseData = getDefaultElementData('dipack-showcase');
        addElement({
          type: 'dipack-showcase',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-showcase'),
          style: {},
          ...showcaseData,
          content: {
            lineTitle: 'Linha Potes e Recipientes',
            productCount: 16,
            products: potesProducts,
          },
        });
      }, 50);
    }, 400);

    // Criar Página 5 e adicionar Mostruário - GARRAFAS (12 produtos)
    setTimeout(() => {
      addPage('Garrafas e Squeeze');
      setTimeout(() => {
        const showcaseData = getDefaultElementData('dipack-showcase');
        addElement({
          type: 'dipack-showcase',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-showcase'),
          style: {},
          ...showcaseData,
          content: {
            lineTitle: 'Linha Garrafas e Squeeze',
            productCount: 12,
            products: garrafasProducts,
          },
        });
      }, 50);
    }, 550);

    // Criar Página 6 e adicionar Mostruário - CESTOS (8 produtos)
    setTimeout(() => {
      addPage('Cestos e Caixas');
      setTimeout(() => {
        const showcaseData = getDefaultElementData('dipack-showcase');
        addElement({
          type: 'dipack-showcase',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-showcase'),
          style: {},
          ...showcaseData,
          content: {
            lineTitle: 'Linha Cestos e Caixas',
            productCount: 8,
            products: cestosProducts,
          },
        });
      }, 50);
    }, 700);

    // Criar Página 7 e adicionar Contracapa
    setTimeout(() => {
      addPage('Contracapa');
      setTimeout(() => {
        const backCoverData = getDefaultElementData('dipack-back-cover');
        addElement({
          type: 'dipack-back-cover',
          position: { x: 0, y: 0 },
          size: getDefaultElementSize('dipack-back-cover'),
          style: {},
          ...backCoverData,
        });
      }, 50);
    }, 850);

    // Mensagem de sucesso
    setTimeout(() => {
      alert('✨ Catálogo exemplo criado com sucesso!\n\n📚 Contém 7 páginas:\n- Página 1: Capa\n- Página 2: Institucional\n- Página 3: Organizadores (20 produtos)\n- Página 4: Potes e Recipientes (16 produtos)\n- Página 5: Garrafas e Squeeze (12 produtos)\n- Página 6: Cestos e Caixas (8 produtos)\n- Página 7: Contracapa\n\n💡 Use as abas laterais para navegar entre as páginas!\n💡 Você pode editar todos os elementos clicando neles!');
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <AccordionSection title="Formas" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon={<FiSquare />}
            label="Retângulo"
            type="shape-rectangle"
            onClick={handleAddElement}
          />
          <ElementButton
            icon={<FiCircle />}
            label="Círculo"
            type="shape-circle"
            onClick={handleAddElement}
          />
          <ElementButton
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="14" x2="14" y2="2" /></svg>}
            label="Linha"
            type="line"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Texto" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon={<FiType />}
            label="Título"
            type="text-title"
            onClick={handleAddElement}
          />
          <ElementButton
            icon={<FiType />}
            label="Subtítulo"
            type="text-subtitle"
            onClick={handleAddElement}
          />
          <ElementButton
            icon={<FiType />}
            label="Parágrafo"
            type="text-paragraph"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Produtos" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon="🛍️"
            label="Card Produto"
            type="product-card"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="✨"
            label="Destaque"
            type="product-highlight"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📋"
            label="Lista"
            type="product-list"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🎯"
            label="Grid"
            type="product-grid"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Mídia" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon={<FiImage />}
            label="Imagem"
            type="image"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🖼️"
            label="Banner"
            type="banner"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🎠"
            label="Carrossel"
            type="carousel"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🖼️"
            label="Galeria"
            type="gallery"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Interativo" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon="📱"
            label="QR Code"
            type="qr-code"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="⭐"
            label="Badge"
            type="certification-badge"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🎯"
            label="Ícone Grid"
            type="icon-grid"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Técnico" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon="⚙️"
            label="Specs"
            type="technical-specs"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📊"
            label="Tabela"
            type="data-table"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="✓"
            label="Features"
            type="feature-list"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Layout" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon="🎨"
            label="Divisor"
            type="divider"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📦"
            label="Footer"
            type="footer"
            onClick={handleAddElement}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Templates DiPACK" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <ElementButton
            icon="📘"
            label="Capa DiPACK"
            type="dipack-cover"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="🏢"
            label="Institucional"
            type="dipack-institutional"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📦"
            label="Mostruário"
            type="dipack-showcase"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📄"
            label="Rodapé DiPACK"
            type="dipack-footer"
            onClick={handleAddElement}
          />
          <ElementButton
            icon="📕"
            label="Contracapa"
            type="dipack-back-cover"
            onClick={handleAddElement}
          />
        </div>

        {/* Botão Catálogo Exemplo */}
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          <button
            onClick={handleGenerateSampleCatalog}
            className="w-full px-4 py-3 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">✨</span>
            <span>Gerar Catálogo Exemplo</span>
          </button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Cria um catálogo completo com 20 produtos de exemplo
          </p>

          {/* Botão Catálogo Confeitaria */}
          <button
            onClick={handleGenerateConfeitariaCatalog}
            className="w-full px-4 py-3 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">🧁</span>
            <span>Gerar Produtos Confeitaria</span>
          </button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Cria catálogo de produtos PET para confeitaria
          </p>
        </div>
      </AccordionSection>

      {/* Modal para escolher quantidade de produtos */}
      <ProductCountModal
        isOpen={showProductCountModal}
        onClose={() => setShowProductCountModal(false)}
        onConfirm={handleConfirmProductCount}
      />
    </div>
  );
};

const LayersPanelInline: FC = () => {
  const { getCurrentPage, selectedElementIds, setSelectedElement, toggleSelectElement, updateElement, deleteElement, duplicateElement, groupElements, ungroupElements } = useEditorStore();
  const currentPage = getCurrentPage();
  const elements = currentPage?.elements || [];

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => deleteElement(id));
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => duplicateElement(id));
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey && selectedElementIds.length > 1) {
        e.preventDefault();
        groupElements(selectedElementIds);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G' && selectedElementIds.length === 1) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedElementIds[0]);
        if (element?.isGroup) {
          ungroupElements(selectedElementIds[0]);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.map((el) => el.id);
        useEditorStore.setState({ selectedElementIds: allIds });
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (contextMenu) {
          setContextMenu(null);
        } else if (selectedElementIds.length > 0) {
          useEditorStore.setState({ selectedElementIds: [], selectedElementId: null });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, elements, deleteElement, duplicateElement, groupElements, ungroupElements, contextMenu]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const getElementIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'product-card': '📦',
      'product-highlight': '⭐',
      'product-list': '📋',
      'product-grid': '🔲',
      'text-title': '📝',
      'text-subtitle': '📄',
      'text-paragraph': '📃',
      'text-list': '📑',
      'shape-rectangle': '⬛',
      'shape-circle': '⚫',
      'shape-triangle': '🔺',
      'shape-line': '➖',
      'image': '🖼️',
      'uploaded-image': '🖼️',
      'qr-code': '📱',
      'banner': '🎨',
    };
    return iconMap[type] || '📄';
  };

  const getElementName = (el: CatalogElement) => {
    if (el.isGroup) {
      const children = elements.filter((child) => child.groupId === el.id);
      return el.name || `Grupo (${children.length})`;
    }
    return el.name || el.type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderElement = (element: CatalogElement, depth: number = 0) => {
    const isSelected = selectedElementIds.includes(element.id);
    const isGroup = element.isGroup;
    const isExpanded = expandedGroups.has(element.id);
    const children = isGroup ? elements.filter((el) => el.groupId === element.id) : [];

    const elementName = getElementName(element).toLowerCase();
    if (searchQuery && !elementName.includes(searchQuery.toLowerCase())) {
      return null;
    }

    return (
      <div key={element.id} className="group/item">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700/50 cursor-pointer transition-all select-none ${
            isSelected ? 'bg-primary-600/20 ring-1 ring-primary-500 ring-inset' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={(e) => {
            if (e.shiftKey) {
              toggleSelectElement(element.id);
            } else {
              setSelectedElement(element.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, elementId: element.id });
            if (!selectedElementIds.includes(element.id)) {
              setSelectedElement(element.id);
            }
          }}
        >
          <div className={`flex-shrink-0 ${isSelected || selectedElementIds.length > 1 ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} transition-opacity`}>
            <div
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-500 hover:border-gray-400'
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {isGroup ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup(element.id);
              }}
              className="p-0.5 hover:bg-gray-600 rounded flex-shrink-0 transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <FiChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-3.5" />
          )}

          <span className="text-sm flex-shrink-0 opacity-70">
            {isGroup ? <FiLayers className="w-3.5 h-3.5 text-gray-400" /> : getElementIcon(element.type)}
          </span>

          {isGroup && editingGroupId === element.id ? (
            <input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              onBlur={() => {
                if (editingGroupName.trim()) {
                  updateElement(element.id, { name: editingGroupName.trim() });
                }
                setEditingGroupId(null);
                setEditingGroupName('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingGroupName.trim()) {
                    updateElement(element.id, { name: editingGroupName.trim() });
                  }
                  setEditingGroupId(null);
                  setEditingGroupName('');
                } else if (e.key === 'Escape') {
                  setEditingGroupId(null);
                  setEditingGroupName('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-xs px-1 py-0.5 border border-primary-500 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 text-xs truncate transition-colors ${
                isSelected ? 'text-white font-medium' : 'text-gray-300 font-normal'
              }`}
              onDoubleClick={(e) => {
                if (isGroup) {
                  e.stopPropagation();
                  setEditingGroupId(element.id);
                  setEditingGroupName(getElementName(element));
                }
              }}
            >
              {getElementName(element)}
            </span>
          )}

          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
            <Tooltip text={element.visible !== false ? 'Ocultar' : 'Mostrar'} position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { visible: !element.visible });
                }}
                className="p-0.5 hover:bg-gray-600 rounded transition-colors"
              >
                {element.visible !== false ? (
                  <FiEye className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <FiEyeOff className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </Tooltip>
            <Tooltip text={element.locked ? 'Desbloquear' : 'Bloquear'} position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { locked: !element.locked });
                }}
                className="p-0.5 hover:bg-gray-600 rounded transition-colors"
              >
                {element.locked ? (
                  <FiLock className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <FiUnlock className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        {isGroup && isExpanded && children.map((child) => renderElement(child, depth + 1))}
      </div>
    );
  };

  const topLevelElements = elements
    .filter((el) => !el.groupId || el.isGroup)
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar componentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-200 placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto">
        {topLevelElements.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-700/50 rounded-full flex items-center justify-center">
              <FiLayers className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Nenhum componente</p>
            <p className="text-xs text-gray-500">
              Arraste elementos da sidebar<br />ou use as ferramentas da toolbar
            </p>
          </div>
        ) : (
          <div className="py-1">
            {topLevelElements.map((element) => renderElement(element))}
          </div>
        )}
      </div>

      {/* Multi-Select Action Bar */}
      {selectedElementIds.length > 1 && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 border-t border-primary-800 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full px-2 py-1">
              <span className="text-xs font-semibold text-white">
                {selectedElementIds.length} selecionados
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip text="Criar Grupo" position="top">
              <button
                onClick={() => groupElements(selectedElementIds)}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded transition-all text-xs font-medium"
              >
                <FiFolder className="w-3 h-3" />
                Agrupar
              </button>
            </Tooltip>
            <Tooltip text="Salvar como Componente" position="top">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded transition-all text-xs font-medium"
              >
                <FiSave className="w-3 h-3" />
                Salvar
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Footer - Shortcuts */}
      <div className="bg-gray-900 border-t border-gray-700 px-3 py-1.5">
        {selectedElementIds.length === 0 ? (
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-[10px] font-mono">Shift</kbd> + Click = Seleção múltipla
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-primary-400">
              {selectedElementIds.length} {selectedElementIds.length === 1 ? 'selecionado' : 'selecionados'}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded font-mono">Del</kbd>
              <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded font-mono">⌘D</kbd>
              {selectedElementIds.length > 1 && (
                <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded font-mono">⌘G</kbd>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-1 z-[9999] min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              duplicateElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
          >
            <FiCopy className="w-4 h-4 text-gray-400" />
            <span>Duplicar</span>
            <span className="ml-auto text-xs text-gray-500">Ctrl+D</span>
          </button>

          {selectedElementIds.length > 1 && (
            <>
              <button
                onClick={() => {
                  groupElements(selectedElementIds);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <FiFolder className="w-4 h-4 text-gray-400" />
                <span>Agrupar Seleção</span>
                <span className="ml-auto text-xs text-gray-500">Ctrl+G</span>
              </button>

              <button
                onClick={() => {
                  setIsSaveModalOpen(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <FiSave className="w-4 h-4 text-gray-400" />
                <span>Salvar como Componente</span>
              </button>
            </>
          )}

          {selectedElementIds.length === 1 && elements.find(el => el.id === contextMenu.elementId)?.isGroup && (
            <button
              onClick={() => {
                ungroupElements(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <FiLayers className="w-4 h-4 text-gray-400" />
              <span>Desagrupar</span>
              <span className="ml-auto text-xs text-gray-500">Ctrl+Shift+G</span>
            </button>
          )}

          <div className="border-t border-gray-700 my-1" />

          <button
            onClick={() => {
              updateElement(contextMenu.elementId, { visible: false });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
          >
            <FiEyeOff className="w-4 h-4 text-gray-400" />
            <span>Ocultar</span>
          </button>

          <button
            onClick={() => {
              updateElement(contextMenu.elementId, { locked: true });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 transition-colors"
          >
            <FiLock className="w-4 h-4 text-gray-400" />
            <span>Bloquear</span>
          </button>

          <div className="border-t border-gray-700 my-1" />

          <button
            onClick={() => {
              if (confirm(`Deletar "${getElementName(elements.find(el => el.id === contextMenu.elementId)!)}\"?`)) {
                deleteElement(contextMenu.elementId);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Deletar</span>
            <span className="ml-auto text-xs text-red-500">Del</span>
          </button>
        </div>
      )}

      {/* Save Component Modal */}
      <SaveComponentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </div>
  );
};

const PropertiesPanel: FC = () => {
  const { selectedElementIds, getCurrentPage, updateElement } = useEditorStore();

  const currentPage = getCurrentPage();
  const selectedElement = currentPage?.elements.find(el => el.id === selectedElementIds[0]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const handleSelectImage = (assetIdOrUrl: string) => {
    import.meta.env.DEV && console.log('[PhotoshopSidebar] handleSelectImage chamado com:', assetIdOrUrl);
    import.meta.env.DEV && console.log('[PhotoshopSidebar] selectedElement:', selectedElement);

    if (!selectedElement) {
      console.error('[PhotoshopSidebar] Nenhum elemento selecionado!');
      return;
    }

    // Se for uma URL (começa com http), usar imageUrl
    if (assetIdOrUrl.startsWith('http')) {
      import.meta.env.DEV && console.log('[PhotoshopSidebar] É uma URL, atualizando com imageUrl...');
      updateElement(selectedElement.id, {
        imageUrl: assetIdOrUrl,
        type: 'image', // Atualizar para tipo 'image'
      });
    } else {
      // Se não, é um assetId local
      import.meta.env.DEV && console.log('[PhotoshopSidebar] É um assetId local, atualizando content...');
      updateElement(selectedElement.id, {
        content: {
          assetId: assetIdOrUrl,
        },
      });
    }
    setShowMediaLibrary(false);
  };

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FiSliders size={48} className="mb-4 opacity-30" />
        <p className="text-sm text-center px-4">Selecione um elemento para ver suas propriedades</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <AccordionSection title="Transformação" defaultOpen={true}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    position: { ...selectedElement.position, x: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    position: { ...selectedElement.position, y: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Largura</label>
              <input
                type="number"
                value={Math.round(selectedElement.size.width)}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    size: { ...selectedElement.size, width: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Altura</label>
              <input
                type="number"
                value={Math.round(selectedElement.size.height)}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    size: { ...selectedElement.size, height: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Aparência" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Opacidade</label>
            <input
              type="range"
              min="0"
              max="100"
              value={(selectedElement.style?.opacity || 1) * 100}
              onChange={(e) => {
                updateElement(selectedElement.id, {
                  style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 }
                });
              }}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-right">
              {Math.round((selectedElement.style?.opacity || 1) * 100)}%
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cor de Fundo</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.style?.backgroundColor || '#FFFFFF'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, backgroundColor: e.target.value }
                  });
                }}
                className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedElement.style?.backgroundColor || '#FFFFFF'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, backgroundColor: e.target.value }
                  });
                }}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-primary-500 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Espessura da Borda</label>
            <input
              type="number"
              value={selectedElement.style?.borderWidth || 0}
              onChange={(e) => {
                updateElement(selectedElement.id, {
                  style: { ...selectedElement.style, borderWidth: Number(e.target.value) }
                });
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              placeholder="0 px"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cor da Borda</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.style?.borderColor || '#000000'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, borderColor: e.target.value }
                  });
                }}
                className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedElement.style?.borderColor || '#000000'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, borderColor: e.target.value }
                  });
                }}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-primary-500 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bordas Arredondadas</label>
            <input
              type="number"
              value={selectedElement.style?.borderRadius || 0}
              onChange={(e) => {
                updateElement(selectedElement.id, {
                  style: { ...selectedElement.style, borderRadius: Number(e.target.value) }
                });
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              placeholder="0 px"
            />
          </div>
        </div>
      </AccordionSection>

      {/* Branding Section */}
      <AccordionSection title="Branding" defaultOpen={false}>
        <div className="space-y-3">
          {/* Brand Font */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Fonte da Marca</label>
            <select
              value={(selectedElement as any).branding?.fontFamily || selectedElement.style?.fontFamily || 'Arial'}
              onChange={(e) => {
                updateElement(selectedElement.id, {
                  branding: { ...(selectedElement as any).branding, fontFamily: e.target.value },
                  style: { ...selectedElement.style, fontFamily: e.target.value }
                });
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Poppins">Poppins</option>
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tamanho</label>
              <input
                type="number"
                min="8"
                max="200"
                value={(selectedElement as any).branding?.fontSize || selectedElement.style?.fontSize || 16}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    branding: { ...(selectedElement as any).branding, fontSize: Number(e.target.value) },
                    style: { ...selectedElement.style, fontSize: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Peso</label>
              <select
                value={(selectedElement as any).branding?.fontWeight || selectedElement.style?.fontWeight || 'normal'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    branding: { ...(selectedElement as any).branding, fontWeight: e.target.value },
                    style: { ...selectedElement.style, fontWeight: e.target.value }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              >
                <option value="300">Light</option>
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="800">ExtraBold</option>
              </select>
            </div>
          </div>

          {/* Brand Colors Palette */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Paleta de Cores da Marca</label>
            <div className="grid grid-cols-3 gap-2">
              {/* Primary Color */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Primária</label>
                <input
                  type="color"
                  value={(selectedElement as any).branding?.primaryColor || '#3b82f6'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, primaryColor: e.target.value }
                    });
                  }}
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Secundária</label>
                <input
                  type="color"
                  value={(selectedElement as any).branding?.secondaryColor || '#10b981'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, secondaryColor: e.target.value }
                    });
                  }}
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Destaque</label>
                <input
                  type="color"
                  value={(selectedElement as any).branding?.accentColor || '#f59e0b'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, accentColor: e.target.value }
                    });
                  }}
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Background Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Tipo de Fundo</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    branding: { ...(selectedElement as any).branding, backgroundType: 'solid' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).branding?.backgroundType === 'solid' || !(selectedElement as any).branding?.backgroundType
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sólido
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    branding: { ...(selectedElement as any).branding, backgroundType: 'gradient' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).branding?.backgroundType === 'gradient'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Gradiente
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    branding: { ...(selectedElement as any).branding, backgroundType: 'image' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).branding?.backgroundType === 'image'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Imagem
              </button>
            </div>
          </div>

          {/* Gradient Options */}
          {(selectedElement as any).branding?.backgroundType === 'gradient' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cor 1</label>
                <input
                  type="color"
                  value={(selectedElement as any).branding?.gradientStart || '#3b82f6'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, gradientStart: e.target.value }
                    });
                  }}
                  className="w-full h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cor 2</label>
                <input
                  type="color"
                  value={(selectedElement as any).branding?.gradientEnd || '#8b5cf6'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, gradientEnd: e.target.value }
                    });
                  }}
                  className="w-full h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Border & Shadow */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Bordas e Sombras</label>
            <div className="space-y-2">
              {/* Border Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-gray-300">Ativar Borda</span>
                <input
                  type="checkbox"
                  checked={(selectedElement as any).branding?.showBorder || false}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, showBorder: e.target.checked }
                    });
                  }}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
              </label>

              {/* Shadow Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-gray-300">Ativar Sombra</span>
                <input
                  type="checkbox"
                  checked={(selectedElement as any).branding?.showShadow || false}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      branding: { ...(selectedElement as any).branding, showShadow: e.target.checked },
                      style: {
                        ...selectedElement.style,
                        boxShadow: e.target.checked ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                      }
                    });
                  }}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          {/* Price Highlight (for product elements) */}
          {selectedElement.type.includes('product') && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Destaque de Preço/Promoção</label>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-300">Destacar Preço</span>
                  <input
                    type="checkbox"
                    checked={(selectedElement as any).branding?.highlightPrice || false}
                    onChange={(e) => {
                      updateElement(selectedElement.id, {
                        branding: { ...(selectedElement as any).branding, highlightPrice: e.target.checked }
                      });
                    }}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                {(selectedElement as any).branding?.highlightPrice && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cor do Destaque</label>
                    <input
                      type="color"
                      value={(selectedElement as any).branding?.priceHighlightColor || '#ef4444'}
                      onChange={(e) => {
                        updateElement(selectedElement.id, {
                          branding: { ...(selectedElement as any).branding, priceHighlightColor: e.target.value }
                        });
                      }}
                      className="w-full h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={() => {
                // Apply branding to all similar elements
                const currentBranding = (selectedElement as any).branding;
                if (currentBranding) {
                  // This would need to be implemented in the store
                  alert('Aplicar branding a elementos similares - funcionalidade em desenvolvimento');
                }
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-xs font-medium transition-colors"
            >
              Aplicar a Elementos Similares
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Image Properties - Only show for image elements */}
      {(selectedElement.type === 'uploaded-image' || selectedElement.type === 'image') && (
        <AccordionSection title="Propriedades da Imagem" defaultOpen={true}>
          <div className="space-y-3">
            {/* Image Selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Selecionar Imagem</label>
              <button
                onClick={() => setShowMediaLibrary(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Trocar Imagem
              </button>
            </div>

            {/* Object Fit */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ajuste da Imagem</label>
              <select
                value={selectedElement.style?.objectFit || 'cover'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, objectFit: e.target.value as any }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              >
                <option value="cover">Preencher (Cover)</option>
                <option value="contain">Ajustar (Contain)</option>
                <option value="fill">Esticar (Fill)</option>
                <option value="none">Original (None)</option>
                <option value="scale-down">Reduzir (Scale Down)</option>
              </select>
            </div>

            {/* Filter Brightness */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Brilho</label>
              <input
                type="range"
                min="0"
                max="200"
                value={selectedElement.style?.brightness || 100}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, brightness: Number(e.target.value) }
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-right">
                {selectedElement.style?.brightness || 100}%
              </div>
            </div>

            {/* Filter Contrast */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Contraste</label>
              <input
                type="range"
                min="0"
                max="200"
                value={selectedElement.style?.contrast || 100}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, contrast: Number(e.target.value) }
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-right">
                {selectedElement.style?.contrast || 100}%
              </div>
            </div>

            {/* Filter Saturation */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Saturação</label>
              <input
                type="range"
                min="0"
                max="200"
                value={selectedElement.style?.saturate || 100}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, saturate: Number(e.target.value) }
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-right">
                {selectedElement.style?.saturate || 100}%
              </div>
            </div>

            {/* Filter Grayscale */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Escala de Cinza</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.style?.grayscale || 0}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, grayscale: Number(e.target.value) }
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-right">
                {selectedElement.style?.grayscale || 0}%
              </div>
            </div>

            {/* Filter Blur */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Desfoque</label>
              <input
                type="range"
                min="0"
                max="20"
                value={selectedElement.style?.blur || 0}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, blur: Number(e.target.value) }
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-right">
                {selectedElement.style?.blur || 0}px
              </div>
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={() => {
                updateElement(selectedElement.id, {
                  style: {
                    ...selectedElement.style,
                    brightness: 100,
                    contrast: 100,
                    saturate: 100,
                    grayscale: 0,
                    blur: 0,
                  }
                });
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm transition-colors"
            >
              Resetar Filtros
            </button>
          </div>
        </AccordionSection>
      )}

      {/* Text Properties - Only show for text elements */}
      {selectedElement.type.includes('text') && (
        <AccordionSection title="Texto" defaultOpen={true}>
          <div className="space-y-3">
            {/* Text Content */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Conteúdo</label>
              <textarea
                value={selectedElement.content?.text || ''}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    content: { ...selectedElement.content, text: e.target.value }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500 resize-none"
                rows={4}
                placeholder="Digite o texto aqui..."
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fonte</label>
              <select
                value={selectedElement.style?.fontFamily || 'Arial'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, fontFamily: e.target.value }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tamanho da Fonte</label>
              <input
                type="number"
                value={selectedElement.style?.fontSize || 16}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, fontSize: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="16 px"
                min="8"
                max="200"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cor do Texto</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedElement.style?.textColor || '#000000'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textColor: e.target.value }
                    });
                  }}
                  className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.style?.textColor || '#000000'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textColor: e.target.value }
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-primary-500 font-mono uppercase"
                />
              </div>
            </div>

            {/* Text Style Buttons */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Estilo</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const currentWeight = selectedElement.style?.fontWeight;
                    updateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        fontWeight: currentWeight === 'bold' ? 'normal' : 'bold'
                      }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm font-bold transition-colors
                    ${selectedElement.style?.fontWeight === 'bold'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  B
                </button>
                <button
                  onClick={() => {
                    const currentStyle = selectedElement.style?.fontStyle;
                    updateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        fontStyle: currentStyle === 'italic' ? 'normal' : 'italic'
                      }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm italic transition-colors
                    ${selectedElement.style?.fontStyle === 'italic'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  I
                </button>
                <button
                  onClick={() => {
                    const currentDecoration = selectedElement.style?.textDecoration;
                    updateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        textDecoration: currentDecoration === 'underline' ? 'none' : 'underline'
                      }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm underline transition-colors
                    ${selectedElement.style?.textDecoration === 'underline'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  U
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Alinhamento</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'left' }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm transition-colors
                    ${selectedElement.style?.textAlign === 'left'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'center' }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm transition-colors
                    ${selectedElement.style?.textAlign === 'center'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  ↔
                </button>
                <button
                  onClick={() => {
                    updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, textAlign: 'right' }
                    });
                  }}
                  className={`
                    px-3 py-2 rounded text-sm transition-colors
                    ${selectedElement.style?.textAlign === 'right'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  →
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Altura da Linha</label>
              <input
                type="number"
                step="0.1"
                value={selectedElement.style?.lineHeight || 1.5}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, lineHeight: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="1.5"
                min="0.5"
                max="3"
              />
            </div>

            {/* Letter Spacing */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Espaçamento entre Letras</label>
              <input
                type="number"
                step="0.5"
                value={selectedElement.style?.letterSpacing || 0}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, letterSpacing: Number(e.target.value) }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="0 px"
                min="-5"
                max="20"
              />
            </div>
          </div>
        </AccordionSection>
      )}

      {/* QR Code Properties - Only show for QR Code elements */}
      {selectedElement.type === 'qr-code' && (
        <AccordionSection title="QR Code" defaultOpen={true}>
          <div className="space-y-3">
            {/* QR Code Data/URL */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL ou Texto</label>
              <input
                type="text"
                value={selectedElement.qrCodeData?.data || ''}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    qrCodeData: {
                      ...selectedElement.qrCodeData,
                      data: e.target.value,
                      color: selectedElement.qrCodeData?.color || '#000000',
                      backgroundColor: selectedElement.qrCodeData?.backgroundColor || '#FFFFFF',
                      errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                    }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="https://exemplo.com"
              />
            </div>

            {/* QR Code Color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cor do QR Code</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedElement.qrCodeData?.color || '#000000'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        data: selectedElement.qrCodeData?.data || '',
                        color: e.target.value,
                        backgroundColor: selectedElement.qrCodeData?.backgroundColor || '#FFFFFF',
                        errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                      }
                    });
                  }}
                  className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.qrCodeData?.color || '#000000'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        data: selectedElement.qrCodeData?.data || '',
                        color: e.target.value,
                        backgroundColor: selectedElement.qrCodeData?.backgroundColor || '#FFFFFF',
                        errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                      }
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cor de Fundo</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedElement.qrCodeData?.backgroundColor || '#FFFFFF'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        data: selectedElement.qrCodeData?.data || '',
                        color: selectedElement.qrCodeData?.color || '#000000',
                        backgroundColor: e.target.value,
                        errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                      }
                    });
                  }}
                  className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.qrCodeData?.backgroundColor || '#FFFFFF'}
                  onChange={(e) => {
                    updateElement(selectedElement.id, {
                      qrCodeData: {
                        ...selectedElement.qrCodeData,
                        data: selectedElement.qrCodeData?.data || '',
                        color: selectedElement.qrCodeData?.color || '#000000',
                        backgroundColor: e.target.value,
                        errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                      }
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500 font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Error Correction Level */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nível de Correção de Erro</label>
              <select
                value={selectedElement.qrCodeData?.errorCorrection || 'M'}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    qrCodeData: {
                      ...selectedElement.qrCodeData,
                      data: selectedElement.qrCodeData?.data || '',
                      color: selectedElement.qrCodeData?.color || '#000000',
                      backgroundColor: selectedElement.qrCodeData?.backgroundColor || '#FFFFFF',
                      errorCorrection: e.target.value as 'L' | 'M' | 'Q' | 'H',
                    }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              >
                <option value="L">Baixo (L) - 7%</option>
                <option value="M">Médio (M) - 15%</option>
                <option value="Q">Alto (Q) - 25%</option>
                <option value="H">Muito Alto (H) - 30%</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Maior correção permite ler o QR Code mesmo com danos
              </p>
            </div>

            {/* Logo URL (optional) */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Logo (URL opcional)</label>
              <input
                type="text"
                value={selectedElement.qrCodeData?.logo || ''}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    qrCodeData: {
                      ...selectedElement.qrCodeData,
                      data: selectedElement.qrCodeData?.data || '',
                      color: selectedElement.qrCodeData?.color || '#000000',
                      backgroundColor: selectedElement.qrCodeData?.backgroundColor || '#FFFFFF',
                      errorCorrection: selectedElement.qrCodeData?.errorCorrection || 'M',
                      logo: e.target.value || undefined,
                    }
                  });
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Logo aparece no centro do QR Code
              </p>
            </div>
          </div>
        </AccordionSection>
      )}

      {/* Layout Section */}
      <AccordionSection title="Layout" defaultOpen={false}>
        <div className="space-y-3">
          {/* Grid Layout */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Grid de Colunas</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  onClick={() => {
                    updateElement(selectedElement.id, {
                      layout: { ...(selectedElement as any).layout, columns: cols }
                    });
                  }}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    (selectedElement as any).layout?.columns === cols
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cols} {cols === 1 ? 'Col' : 'Cols'}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Espaçamento Interno (Padding)</label>
            <input
              type="number"
              min="0"
              value={(selectedElement as any).layout?.padding || 0}
              onChange={(e) => {
                updateElement(selectedElement.id, {
                  layout: { ...(selectedElement as any).layout, padding: Number(e.target.value) }
                });
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              placeholder="0 px"
            />
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Alinhamento</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, alignment: 'left' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.alignment === 'left'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Esquerda"
              >
                ⬅
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, alignment: 'center' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.alignment === 'center'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Centro"
              >
                ↔
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, alignment: 'right' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.alignment === 'right'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Direita"
              >
                ➡
              </button>
            </div>
          </div>

          {/* Z-Index (Layer Order) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ordem de Camadas (Z-Index)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={selectedElement.zIndex || 0}
                onChange={(e) => {
                  updateElement(selectedElement.id, {
                    zIndex: Number(e.target.value)
                  });
                }}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    zIndex: (selectedElement.zIndex || 0) + 1
                  });
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                title="Trazer para frente"
              >
                +
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    zIndex: Math.max(0, (selectedElement.zIndex || 0) - 1)
                  });
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                title="Enviar para trás"
              >
                -
              </button>
            </div>
          </div>

          {/* Width Mode */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Modo de Largura</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, widthMode: 'fixed' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.widthMode !== 'auto'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fixa
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, widthMode: 'auto' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.widthMode === 'auto'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Height Mode */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Modo de Altura</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, heightMode: 'fixed' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.heightMode !== 'auto'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fixa
              </button>
              <button
                onClick={() => {
                  updateElement(selectedElement.id, {
                    layout: { ...(selectedElement as any).layout, heightMode: 'auto' }
                  });
                }}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  (selectedElement as any).layout?.heightMode === 'auto'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Auto
              </button>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Info" defaultOpen={false}>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Tipo:</span>
            <span className="text-gray-200">{selectedElement.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ID:</span>
            <span className="text-gray-200 font-mono">{selectedElement.id.slice(0, 8)}...</span>
          </div>
        </div>
      </AccordionSection>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          key={`media-library-${Date.now()}`} // Força remontagem toda vez que abre
          onSelect={handleSelectImage}
          onClose={() => setShowMediaLibrary(false)}
          selectionMode={true}
        />
      )}
    </div>
  );
};

const PageSettingsPanel: FC = () => {
  const { pages, currentPageId, togglePageHeader, togglePageFooter, updatePageHeader, catalogName, setCatalogName } = useEditorStore();
  const currentPage = pages.find(p => p.id === currentPageId);

  if (!currentPage) return null;

  return (
    <div className="flex flex-col pb-8">
      <AccordionSection title="Cabeçalho" defaultOpen={true}>
        <div className="space-y-3">
          {/* Enable/Disable Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ativar Cabeçalho</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentPage.header?.enabled || false}
                onChange={(e) => {
                  togglePageHeader(currentPage.id, e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {currentPage.header?.enabled && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Altura (px)</label>
                <input
                  type="number"
                  value={currentPage.header.height}
                  onChange={(e) => {
                    updatePageHeader(currentPage.id, { height: Number(e.target.value) });
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                  min="30"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Alinhamento</label>
                <select
                  value={currentPage.header.alignment}
                  onChange={(e) => {
                    updatePageHeader(currentPage.id, { alignment: e.target.value as any });
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                  <option value="space-between">Espaçado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentPage.header.backgroundColor}
                    onChange={(e) => {
                      updatePageHeader(currentPage.id, { backgroundColor: e.target.value });
                    }}
                    className="w-12 h-8 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentPage.header.backgroundColor}
                    onChange={(e) => {
                      updatePageHeader(currentPage.id, { backgroundColor: e.target.value });
                    }}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-primary-500 font-mono"
                    placeholder="#F3F4F6"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Campos Dinâmicos</label>
                  <button
                    onClick={() => {
                      const newField = {
                        id: crypto.randomUUID(),
                        type: 'custom-text' as const,
                        value: 'Novo campo',
                        prefix: '',
                        suffix: '',
                      };
                      updatePageHeader(currentPage.id, {
                        fields: [...(currentPage.header?.fields || []), newField],
                      });
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-primary-400 hover:text-primary-300 transition-colors"
                    title="Adicionar campo"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {currentPage.header.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between bg-gray-900 rounded px-2 py-1.5">
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newFields = [...currentPage.header!.fields];
                          newFields[index] = { ...field, type: e.target.value as any };
                          updatePageHeader(currentPage.id, { fields: newFields });
                        }}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-primary-500"
                      >
                        <option value="page-number">Número da Página</option>
                        <option value="total-pages">Total de Páginas</option>
                        <option value="page-of-total">Página X de Y</option>
                        <option value="catalog-name">Nome do Catálogo</option>
                        <option value="line-name">Nome da Linha</option>
                        <option value="version">Versão</option>
                        <option value="date">Data</option>
                        <option value="custom-text">Texto Personalizado</option>
                      </select>
                      <button
                        onClick={() => {
                          const newFields = currentPage.header!.fields.filter((f) => f.id !== field.id);
                          updatePageHeader(currentPage.id, { fields: newFields });
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300 transition-colors ml-2"
                        title="Remover"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Rodapé" defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ativar Rodapé</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentPage.footer?.enabled || false}
                onChange={(e) => {
                  togglePageFooter(currentPage.id, e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Configurações similares ao cabeçalho estarão disponíveis quando ativado.
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Informações Gerais" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome do Catálogo</label>
            <input
              type="text"
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              placeholder="Ex: Catálogo DiPACK 2025"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Aparece nos campos dinâmicos do cabeçalho e rodapé
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome da Linha</label>
            <input
              type="text"
              placeholder="Ex: Linha Premium"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Versão do Catálogo</label>
            <input
              type="text"
              defaultValue="1.0"
              placeholder="Ex: 1.0"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </AccordionSection>
    </div>
  );
};

export const PhotoshopSidebar: FC<PhotoshopSidebarProps> = ({
  side = 'right',
  defaultTab = 'layers',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [isExpanded, setIsExpanded] = useState(true);
  const [width, setWidth] = useState(320);

  // Atualizar aba ativa quando defaultTab mudar
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'elements':
        return <ElementsPanel />;
      case 'layers':
        return <LayersPanelInline />;
      case 'properties':
        return <PropertiesPanel />;
      case 'page-settings':
        return <PageSettingsPanel />;
      default:
        return null;
    }
  };

  const sidebarWidth = isExpanded ? width : 48;

  return (
    <div
      className={`
        fixed top-14 h-[calc(100vh-3.5rem)] bg-gray-800 border-gray-700 flex flex-col z-30 shadow-2xl
        ${side === 'left' ? 'left-16 border-r' : 'right-0 border-l'}
      `}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700 bg-gray-900">
        {isExpanded && (
          <h3 className="text-sm font-semibold text-gray-200">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Fechar"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-3 transition-colors relative
              ${activeTab === tab.id
                ? 'bg-gray-800 text-primary-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'
              }
              ${!isExpanded && 'flex-col text-xs'}
            `}
            title={tab.label}
          >
            <span className="text-lg">{tab.icon}</span>
            {isExpanded && <span className="text-xs font-medium">{tab.label}</span>}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto text-gray-300">
          {renderContent()}
        </div>
      )}

      {/* Resize Handle (only when expanded and on right side) */}
      {isExpanded && side === 'right' && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500/50 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = width;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const diff = startX - moveEvent.clientX;
              const newWidth = Math.max(280, Math.min(600, startWidth + diff));
              setWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </div>
  );
};

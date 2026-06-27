import { type FC, useRef, useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAssetStore } from '../../store/assetStore';
import { useComponentStore } from '../../store/componentStore';
import { useUIContext } from '../../contexts/UIContext';
import { ContextMenu } from './ContextMenu';
import { QRCode } from './elements/QRCode';
import { HeaderFooter } from './HeaderFooter';
import { SmartGuides, type Guide } from './SmartGuides';
import type { CatalogElement } from '../../types/editor';
import { FiCopy, FiTrash2, FiEye, FiEyeOff, FiLock, FiUnlock, FiLayers, FiImage, FiDownload } from 'react-icons/fi';
import { BsBoxes, BsGrid3X3 } from 'react-icons/bs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getDefaultElementData, getDefaultElementSize } from '../../utils/elementDefaults';
import { calculateAlignmentGuides, snapToGuides, type AlignmentGuide } from '../../utils/smartGuidesUtils';
import { pluginRegistry } from '../../plugins/registry';

interface CanvasElementProps {
  element: CatalogElement;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  zoom: number;
  pan: { x: number; y: number };
  allElements: CatalogElement[];
  onShowGuides: (guides: AlignmentGuide[]) => void;
  onHideGuides: () => void;
}

const CanvasElement: FC<CanvasElementProps> = ({ element, isSelected, onSelect, onContextMenu, onDoubleClick, zoom, pan, allElements, onShowGuides, onHideGuides }) => {
  const { updateElement, snapToGrid, gridSize, selectedElementIds } = useEditorStore();
  const { getAsset } = useAssetStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw'>('se');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0
  });
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isEditingText, setIsEditingText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStart.x) / zoom;
        const deltaY = (e.clientY - dragStart.y) / zoom;

        // Calculate new position
        let newX = snapToGridValue(dragStart.elementX + deltaX);
        let newY = snapToGridValue(dragStart.elementY + deltaY);

        // Create a temporary element with the new position for alignment calculation
        const tempElement: CatalogElement = {
          ...element,
          position: { x: newX, y: newY }
        };

        // Calculate alignment guides
        const guides = calculateAlignmentGuides(tempElement, allElements, zoom);

        // Show guides
        if (guides.length > 0) {
          onShowGuides(guides);

          // Snap to guides if available
          const snappedPosition = snapToGuides(tempElement, guides);
          newX = snappedPosition.x;
          newY = snappedPosition.y;
        } else {
          onHideGuides();
        }

        updateElement(element.id, {
          position: {
            x: newX,
            y: newY,
          },
        });
      }

      if (isResizing) {
        const deltaX = (e.clientX - resizeStart.x) / zoom;
        const deltaY = (e.clientY - resizeStart.y) / zoom;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.startX;
        let newY = resizeStart.startY;

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(50, resizeStart.width + deltaX);
            newHeight = Math.max(50, resizeStart.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(50, resizeStart.width - deltaX);
            newHeight = Math.max(50, resizeStart.height + deltaY);
            newX = resizeStart.startX + deltaX;
            break;
          case 'ne':
            newWidth = Math.max(50, resizeStart.width + deltaX);
            newHeight = Math.max(50, resizeStart.height - deltaY);
            newY = resizeStart.startY + deltaY;
            break;
          case 'nw':
            newWidth = Math.max(50, resizeStart.width - deltaX);
            newHeight = Math.max(50, resizeStart.height - deltaY);
            newX = resizeStart.startX + deltaX;
            newY = resizeStart.startY + deltaY;
            break;
        }

        updateElement(element.id, {
          size: {
            width: snapToGridValue(newWidth),
            height: snapToGridValue(newHeight),
          },
          position: {
            x: snapToGridValue(newX),
            y: snapToGridValue(newY),
          },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      onHideGuides(); // Hide guides when drag/resize ends
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, element.id, updateElement, snapToGrid, gridSize, resizeDirection, zoom, allElements, onShowGuides, onHideGuides, element]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // Se o clique foi em um elemento editável ou área de imagem, não interceptar
    const target = e.target as HTMLElement;
    const isEditableElement = target.isContentEditable ||
      target.closest('[contenteditable="true"]') ||
      target.hasAttribute('data-editable') ||
      target.closest('[data-editable="true"]') ||
      target.classList.contains('cursor-text') ||
      target.closest('.cursor-text');

    const isImageArea = target.closest('[data-image-area="true"]');

    if (isEditableElement || isImageArea) {
      // Permitir propagação para elementos editáveis e áreas de imagem
      return;
    }

    e.stopPropagation();

    // Detectar duplo clique
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;

    if (timeSinceLastClick < 300) {
      // Duplo clique detectado
      // Se for elemento de texto, ativar edição inline
      if (element.type === 'text-paragraph' || element.type === 'text-title' || element.type === 'text-subtitle' || element.type === 'text-list') {
        setIsEditingText(true);
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.select();
        }, 0);
      } else {
        onDoubleClick();
      }
      setLastClickTime(0);
      return;
    }

    setLastClickTime(currentTime);
    // Pass the event to onSelect so it can check for shiftKey
    onSelect(e);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: element.position.x,
      elementY: element.position.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    onSelect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
      startX: element.position.x,
      startY: element.position.y,
    });
  };

  const getElementContent = () => {
    const baseStyle = {
      backgroundColor: element.style?.backgroundColor,
      borderColor: element.style?.borderColor,
      borderWidth: element.style?.borderWidth ? `${element.style.borderWidth}px` : undefined,
      borderStyle: element.style?.borderStyle,
      borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
      padding: element.style?.padding ? `${element.style.padding}px` : undefined,
      opacity: element.style?.opacity,
      boxShadow: element.style?.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined,
    };

    // Log para debug
    if (element.type.includes('confeitaria')) {
      console.log('[InfiniteCanvas] Renderizando elemento tipo:', element.type, 'Content:', element.content);
    }

    switch (element.type) {
      case 'product-card':
        return (
          <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col" style={baseStyle}>
            <div className="flex-1 bg-gray-200 rounded mb-3 flex items-center justify-center text-4xl">
              🖼️
            </div>
            <div className="h-2 bg-gray-300 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-500 rounded mt-2"></div>
          </div>
        );
      case 'product-highlight':
        return (
          <div className="w-full h-full bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-center" style={baseStyle}>
            <span className="text-5xl">🌟</span>
          </div>
        );
      case 'text-title':
        return (
          <div className="w-full h-full flex items-center justify-center bg-transparent" style={baseStyle}>
            {isEditingText ? (
              <textarea
                ref={textareaRef}
                value={element.content?.text || 'Título da Seção'}
                onChange={(e) => {
                  updateElement(element.id, {
                    content: { ...element.content, text: e.target.value }
                  });
                }}
                onBlur={() => setIsEditingText(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingText(false);
                    e.currentTarget.blur();
                  }
                }}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-2xl font-bold"
                style={{
                  fontFamily: element.style.fontFamily,
                  fontSize: element.style.fontSize ? `${element.style.fontSize}px` : undefined,
                  fontWeight: element.style.fontWeight,
                  color: element.style.textColor || '#1F2937',
                  textAlign: element.style.textAlign,
                }}
              />
            ) : (
              <h2
                className="text-2xl font-bold"
                style={{
                  fontFamily: element.style.fontFamily,
                  fontSize: element.style.fontSize ? `${element.style.fontSize}px` : undefined,
                  fontWeight: element.style.fontWeight,
                  color: element.style.textColor || '#1F2937',
                  textAlign: element.style.textAlign,
                }}
              >
                {element.content?.text || 'Título da Seção'}
              </h2>
            )}
          </div>
        );
      case 'text-paragraph':
      case 'text-subtitle':
      case 'text-list':
        return (
          <div
            className="w-full h-full flex items-center bg-transparent p-2"
            style={{
              ...baseStyle,
              backgroundColor: element.style.backgroundColor || 'transparent',
            }}
          >
            {isEditingText ? (
              <textarea
                ref={textareaRef}
                value={element.content?.text || 'Digite seu texto aqui'}
                onChange={(e) => {
                  updateElement(element.id, {
                    content: { ...element.content, text: e.target.value }
                  });
                }}
                onBlur={() => setIsEditingText(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingText(false);
                    e.currentTarget.blur();
                  }
                }}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{
                  fontFamily: element.style.fontFamily || 'Arial',
                  fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '16px',
                  fontWeight: element.style.fontWeight || 'normal',
                  fontStyle: element.style.fontStyle || 'normal',
                  textDecoration: element.style.textDecoration || 'none',
                  color: element.style.textColor || '#1F2937',
                  textAlign: element.style.textAlign || 'left',
                  lineHeight: element.style.lineHeight || 1.5,
                  letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}px` : '0',
                  margin: 0,
                }}
              />
            ) : (
              <p
                style={{
                  fontFamily: element.style.fontFamily || 'Arial',
                  fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '16px',
                  fontWeight: element.style.fontWeight || 'normal',
                  fontStyle: element.style.fontStyle || 'normal',
                  textDecoration: element.style.textDecoration || 'none',
                  color: element.style.textColor || '#1F2937',
                  textAlign: element.style.textAlign || 'left',
                  lineHeight: element.style.lineHeight || 1.5,
                  letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}px` : '0',
                  width: '100%',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {element.content?.text || 'Digite seu texto aqui'}
              </p>
            )}
          </div>
        );
      case 'banner':
        return (
          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center" style={baseStyle}>
            <span className="text-white text-xl font-bold">Banner Promocional</span>
          </div>
        );
      case 'shape-rectangle':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: element.style.backgroundColor || '#E5E7EB',
              borderWidth: element.style.borderWidth ? `${element.style.borderWidth}px` : '0',
              borderStyle: element.style.borderStyle || 'solid',
              borderColor: element.style.borderColor || '#000000',
              borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
              opacity: element.style.opacity,
            }}
          />
        );
      case 'shape-circle':
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: element.style.backgroundColor || '#E5E7EB',
              borderWidth: element.style.borderWidth ? `${element.style.borderWidth}px` : '0',
              borderStyle: element.style.borderStyle || 'solid',
              borderColor: element.style.borderColor || '#000000',
              opacity: element.style.opacity,
            }}
          />
        );
      case 'shape-line':
        const lineStyle = element.style.lineStyle || 'solid';
        const lineColor = element.style.backgroundColor || '#000000';
        const lineHeight = element.size.height;
        const hasStartArrow = element.style.startArrow || false;
        const hasEndArrow = element.style.endArrow || false;
        const arrowSize = element.style.arrowSize || 10;

        // Cálculo do padrão de dash baseado no estilo
        let strokeDasharray = 'none';
        if (lineStyle === 'dashed') {
          strokeDasharray = `${lineHeight * 4} ${lineHeight * 2}`;
        } else if (lineStyle === 'dotted') {
          strokeDasharray = `${lineHeight} ${lineHeight}`;
        }

        return (
          <svg
            width="100%"
            height="100%"
            style={{
              opacity: element.style.opacity,
            }}
          >
            {/* Definição das pontas de seta */}
            <defs>
              <marker
                id={`arrow-start-${element.id}`}
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize / 2}
                refY={arrowSize / 2}
                orient="auto-start-reverse"
              >
                <polygon
                  points={`0,0 ${arrowSize},${arrowSize / 2} 0,${arrowSize}`}
                  fill={lineColor}
                />
              </marker>
              <marker
                id={`arrow-end-${element.id}`}
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize / 2}
                refY={arrowSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0,0 ${arrowSize},${arrowSize / 2} 0,${arrowSize}`}
                  fill={lineColor}
                />
              </marker>
            </defs>

            {/* Linha principal */}
            <line
              x1={hasStartArrow ? arrowSize : 0}
              y1="50%"
              x2={hasEndArrow ? `calc(100% - ${arrowSize}px)` : '100%'}
              y2="50%"
              stroke={lineColor}
              strokeWidth={lineHeight}
              strokeDasharray={strokeDasharray}
              strokeLinecap={element.style.borderRadius ? 'round' : 'butt'}
              markerStart={hasStartArrow ? `url(#arrow-start-${element.id})` : undefined}
              markerEnd={hasEndArrow ? `url(#arrow-end-${element.id})` : undefined}
            />
          </svg>
        );
      case 'image':
        // Novo tipo para imagens da API que usam imageUrl direto
        console.log('🟢🟢🟢 [InfiniteCanvas] Renderizando tipo "image"!', element);
        console.log('🟢 imageUrl:', element.imageUrl);

        // Build CSS filter string
        const imageFilters = [];
        if (element.style?.brightness !== undefined && element.style.brightness !== 100) {
          imageFilters.push(`brightness(${element.style.brightness} %)`);
        }
        if (element.style?.contrast !== undefined && element.style.contrast !== 100) {
          imageFilters.push(`contrast(${element.style.contrast} %)`);
        }
        if (element.style?.saturate !== undefined && element.style.saturate !== 100) {
          imageFilters.push(`saturate(${element.style.saturate} %)`);
        }
        if (element.style?.grayscale !== undefined && element.style.grayscale !== 0) {
          imageFilters.push(`grayscale(${element.style.grayscale} %)`);
        }
        if (element.style?.blur !== undefined && element.style.blur !== 0) {
          imageFilters.push(`blur(${element.style.blur}px)`);
        }
        const imageFilterStyle = imageFilters.length > 0 ? imageFilters.join(' ') : undefined;

        return (
          <div className="w-full h-full overflow-hidden" style={baseStyle}>
            {element.imageUrl ? (
              <img
                src={element.imageUrl}
                alt="Imagem do catálogo"
                className="w-full h-full"
                style={{
                  pointerEvents: 'none',
                  objectFit: element.style?.objectFit || 'cover',
                  filter: imageFilterStyle,
                }}
                onLoad={() => console.log('✅ [InfiniteCanvas] Imagem carregada:', element.imageUrl)}
                onError={(_e) => {
                  console.error('❌ [InfiniteCanvas] Erro ao carregar imagem:', element.imageUrl);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <span className="text-gray-400 text-sm">URL de imagem não definida</span>
              </div>
            )}
          </div>
        );

      case 'uploaded-image':
        const asset = element.content?.assetId ? getAsset(element.content.assetId) : null;

        // Build CSS filter string
        const filters = [];
        if (element.style?.brightness !== undefined && element.style.brightness !== 100) {
          filters.push(`brightness(${element.style.brightness} %)`);
        }
        if (element.style?.contrast !== undefined && element.style.contrast !== 100) {
          filters.push(`contrast(${element.style.contrast} %)`);
        }
        if (element.style?.saturate !== undefined && element.style.saturate !== 100) {
          filters.push(`saturate(${element.style.saturate} %)`);
        }
        if (element.style?.grayscale !== undefined && element.style.grayscale !== 0) {
          filters.push(`grayscale(${element.style.grayscale} %)`);
        }
        if (element.style?.blur !== undefined && element.style.blur !== 0) {
          filters.push(`blur(${element.style.blur}px)`);
        }
        const filterStyle = filters.length > 0 ? filters.join(' ') : undefined;

        return (
          <div className="w-full h-full overflow-hidden" style={baseStyle}>
            {asset ? (
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full"
                style={{
                  pointerEvents: 'none',
                  objectFit: element.style?.objectFit || 'cover',
                  filter: filterStyle,
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <span className="text-gray-400 text-sm">Imagem não encontrada</span>
              </div>
            )}
          </div>
        );
      case 'qr-code':
        if (element.qrCodeData) {
          return (
            <QRCode
              data={element.qrCodeData}
              size={element.size}
              isSelected={isSelected}
            />
          );
        }
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={baseStyle}>
            <span className="text-gray-500 text-sm">Configure o QR Code</span>
          </div>
        );

      default:
        // Try to get from plugin registry
        const PluginComponent = pluginRegistry.get(element.type);

        if (PluginComponent) {
          return (
            <div className="w-full h-full" style={baseStyle}>
              <PluginComponent
                width={element.size.width}
                height={element.size.height}
                {...(element.content || {})}
                isEditable={true}
                onLineTitleChange={(newTitle: string) => updateElement(element.id, { content: { ...element.content, lineTitle: newTitle } })}
                onProductChange={(productId: any, field: any, value: any) => {
                  const products = element.content?.products || [];
                  const updatedProducts = products.map((p: any) => {
                    if (p.id === productId) {
                      let parsedValue: any = value;
                      if (field === 'scale') parsedValue = parseFloat(value);
                      else if (field === 'isNew') parsedValue = value === 'true';
                      else if (field === 'x' || field === 'y') parsedValue = parseFloat(value);
                      return { ...p, [field]: parsedValue };
                    }
                    return p;
                  });
                  updateElement(element.id, { content: { ...element.content, products: updatedProducts } });
                }}
                onImageUpload={(productId: any, file: any) => {
                  const imageUrl = URL.createObjectURL(file);
                  const products = element.content?.products || [];
                  const updatedProducts = products.map((p: any) => p.id === productId ? { ...p, imageUrl } : p);
                  updateElement(element.id, { content: { ...element.content, products: updatedProducts } });
                }}
                onProductsReorder={(newProducts: any) => updateElement(element.id, { content: { ...element.content, products: newProducts } })}
                onProductDelete={(productId: any) => {
                  const products = element.content?.products || [];
                  const updatedProducts = products.filter((p: any) => p.id !== productId);
                  updateElement(element.id, { content: { ...element.content, products: updatedProducts } });
                }}
                onProductDuplicate={(productId: any) => {
                  const products = element.content?.products || [];
                  const productToDuplicate = products.find((p: any) => p.id === productId);
                  if (productToDuplicate) {
                    const maxId = Math.max(...products.map((p: any) => p.id), 0);
                    const newProduct = { ...productToDuplicate, id: maxId + 1, code: `${productToDuplicate.code} -COPY` };
                    updateElement(element.id, { content: { ...element.content, products: [...products, newProduct] } });
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={baseStyle}>
            <span className="text-gray-500 text-sm">{element.type}</span>
          </div>
        );
    }
  };

  const screenX = element.position.x * zoom + pan.x;
  const screenY = element.position.y * zoom + pan.y;
  const screenWidth = element.size.width * zoom;
  const screenHeight = element.size.height * zoom;

  // Templates DiPACK não devem ter select-none para permitir edição inline
  const isDiPackTemplate = element.type.startsWith('dipack-');

  // Templates DiPACK com tamanho A4 fixo não devem ser redimensionáveis
  const isFixedSizeTemplate = ['dipack-cover', 'dipack-institutional', 'dipack-showcase', 'dipack-back-cover', 'dipack-confeitaria'].includes(element.type);

  return (
    <div
      className={`absolute ${!isDiPackTemplate ? 'select-none' : ''} ${isDragging ? 'cursor-grabbing' : isDiPackTemplate ? 'cursor-default' : 'cursor-grab'} ${isSelected ? (element.isGroup ? 'ring-2 ring-blue-400 ring-dashed' : 'ring-2 ring-primary-500') : ''
        } group`}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenWidth}px`,
        height: `${screenHeight}px`,
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
      title={element.name || element.type}
    >
      {/* Group Indicator - visual badge when group is selected */}
      {element.isGroup && isSelected && (
        <div className="absolute -top-7 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none z-50 shadow-md">
          <FiLayers className="w-3 h-3" />
          <span className="font-medium">Grupo</span>
        </div>
      )}

      {/* Element Name Label - sempre visível com cor discreta */}
      {element.name && (
        <div className="absolute -top-6 left-0 text-gray-400 text-xs px-1 pointer-events-none whitespace-nowrap z-50 select-none">
          {element.name}
        </div>
      )}

      {/* Render group children if this is a group */}
      {element.isGroup && element.children && (
        <>
          {element.children.map((childId) => {
            const childElement = useEditorStore.getState().getCurrentPage()?.elements.find(el => el.id === childId);
            if (!childElement) return null;

            return (
              <CanvasElement
                key={childId}
                element={childElement}
                isSelected={selectedElementIds.includes(childId)}
                zoom={zoom}
                pan={{ x: 0, y: 0 }} // Children use relative positioning
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
                allElements={allElements}
                onShowGuides={onShowGuides}
                onHideGuides={onHideGuides}
              />
            );
          })}
        </>
      )}

      {!element.isGroup && getElementContent()}

      {/* Selection Handles - Não mostrar para templates de tamanho fixo */}
      {isSelected && !isFixedSizeTemplate && (
        <>
          <div
            className="absolute -right-1 -bottom-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nwse-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          <div
            className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nesw-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -left-1 -top-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nwse-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -left-1 -bottom-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nesw-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
        </>
      )}
    </div>
  );
};

export const InfiniteCanvas: FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    getCurrentPage,
    gridVisible,
    selectedElementIds,
    setSelectedElement,
    toggleSelectElement,
    selectMultipleElements,
    addElement,
    deleteElement,
    duplicateElement,
    updateElement,
    groupElements,
    ungroupElements,
    pages,
    catalogName,
    zoom,
    interactionMode,
    setInteractionMode,
    activeTool,
    setActiveTool,
  } = useEditorStore();

  const { toggleUI, toggleComments } = useUIContext();

  const currentPage = getCurrentPage();
  const elements = currentPage?.elements || [];
  const currentPageIndex = pages.findIndex(p => p.id === currentPage?.id);
  const totalPages = pages.length;

  // Debug: Log quando mudar de página
  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('[InfiniteCanvas] Mudança de página detectada');
    console.log('[InfiniteCanvas] Página atual:', currentPage?.name, 'ID:', currentPage?.id);
    console.log('[InfiniteCanvas] Total de páginas:', pages.length);
    console.log('[InfiniteCanvas] Elementos na página atual:', elements.length);
    if (elements.length > 0) {
      console.log('[InfiniteCanvas] Detalhes dos elementos:');
      elements.forEach((e, i) => {
        console.log(`  ${i + 1}.Tipo: ${e.type}, ID: ${e.id.substring(0, 20)}..., PageID: ${e.pageId} `);
      });
    } else {
      console.log('[InfiniteCanvas] ⚠️ NENHUM elemento encontrado nesta página!');
    }
    console.log('═══════════════════════════════════════');
  }, [currentPage?.id]);

  // Tamanho fixo A4 (mesmo dos templates DiPACK)
  const FIXED_PAGE_WIDTH = 794;
  const FIXED_PAGE_HEIGHT = 1123;
  const zoomDecimal = zoom / 100; // Converter de porcentagem (25-100) para decimal (0.25-1.0)

  // Pan state para permitir navegação
  const [pan, setPan] = useState({
    x: (window.innerWidth - FIXED_PAGE_WIDTH * zoomDecimal) / 2,
    y: Math.max(100, (window.innerHeight - FIXED_PAGE_HEIGHT * zoomDecimal) / 2)
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);
  const [smartGuides, setSmartGuides] = useState<AlignmentGuide[]>([]);

  // Recentralizar quando a janela redimensiona
  useEffect(() => {
    const handleResize = () => {
      setPan({
        x: (window.innerWidth - FIXED_PAGE_WIDTH * zoomDecimal) / 2,
        y: Math.max(100, (window.innerHeight - FIXED_PAGE_HEIGHT * zoomDecimal) / 2)
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomDecimal]);

  // Recentralizar quando mudar de página
  useEffect(() => {
    console.log('[InfiniteCanvas] Recentralizando canvas para nova página...');
    setPan({
      x: (window.innerWidth - FIXED_PAGE_WIDTH * zoomDecimal) / 2,
      y: Math.max(100, (window.innerHeight - FIXED_PAGE_HEIGHT * zoomDecimal) / 2)
    });
  }, [currentPage?.id]);

  // Recentralizar quando o zoom mudar
  useEffect(() => {
    setPan({
      x: (window.innerWidth - FIXED_PAGE_WIDTH * zoomDecimal) / 2,
      y: Math.max(100, (window.innerHeight - FIXED_PAGE_HEIGHT * zoomDecimal) / 2)
    });
  }, [zoom]);

  // Handle panning com mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }

      if (isSelecting && selectionStart) {
        const currentX = e.clientX;
        const currentY = e.clientY;

        setSelectionBox({
          x: Math.min(selectionStart.x, currentX),
          y: Math.min(selectionStart.y, currentY),
          width: Math.abs(currentX - selectionStart.x),
          height: Math.abs(currentY - selectionStart.y),
        });
      }
    };

    const handleMouseUp = () => {
      if (isSelecting && selectionBox) {
        // Find elements within selection box
        const selectedIds = elements
          .filter((el) => {
            if (el.isGroup) return false;
            const screenX = el.position.x * zoomDecimal + pan.x;
            const screenY = el.position.y * zoomDecimal + pan.y;
            const screenWidth = el.size.width * zoomDecimal;
            const screenHeight = el.size.height * zoomDecimal;

            const elRight = screenX + screenWidth;
            const elBottom = screenY + screenHeight;
            const boxRight = selectionBox.x + selectionBox.width;
            const boxBottom = selectionBox.y + selectionBox.height;

            return (
              screenX < boxRight &&
              elRight > selectionBox.x &&
              screenY < boxBottom &&
              elBottom > selectionBox.y
            );
          })
          .map((el) => el.id);

        if (selectedIds.length > 0) {
          selectMultipleElements(selectedIds);
        }
      }

      setIsPanning(false);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
    };

    if (isPanning || isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, isSelecting, panStart, selectionStart, selectionBox, pan, elements, zoomDecimal, selectMultipleElements]);

  // Handle scroll wheel navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!canvasRef.current) return;

      // Prevent default scroll behavior
      e.preventDefault();

      // Pan with mouse wheel
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when typing in input fields or contentEditable elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Delete selected elements (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(id => deleteElement(id));
        return;
      }

      // Duplicate (Cmd/Ctrl + D)
      if (cmdOrCtrl && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(id => duplicateElement(id));
        return;
      }

      // Group (Cmd/Ctrl + G)
      if (cmdOrCtrl && e.key === 'g' && !e.shiftKey && selectedElementIds.length >= 2) {
        e.preventDefault();
        groupElements(selectedElementIds);
        return;
      }

      // Ungroup (Cmd/Ctrl + Shift + G)
      if (cmdOrCtrl && e.shiftKey && e.key === 'G' && selectedElementIds.length === 1) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedElementIds[0]);
        if (element?.isGroup) {
          ungroupElements(element.id);
        }
        return;
      }

      // Toggle visibility (Cmd/Ctrl + Shift + H)
      if (cmdOrCtrl && e.shiftKey && e.key === 'H' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element) {
            updateElement(id, { visible: element.visible === false ? true : false });
          }
        });
        return;
      }

      // Toggle lock (Cmd/Ctrl + Shift + L)
      if (cmdOrCtrl && e.shiftKey && e.key === 'L' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element) {
            updateElement(id, { locked: !element.locked });
          }
        });
        return;
      }

      // Select all (Cmd/Ctrl + A)
      if (cmdOrCtrl && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.filter(el => !el.groupId || el.isGroup).map(el => el.id);
        selectMultipleElements(allIds);
        return;
      }

      // Deselect all (Escape)
      if (e.key === 'Escape' && selectedElementIds.length > 0) {
        e.preventDefault();
        setSelectedElement(null);
        return;
      }

      // Toggle UI (Cmd/Ctrl + \)
      if (cmdOrCtrl && e.key === '\\') {
        e.preventDefault();
        toggleUI();
        return;
      }

      // Toggle Comments (Shift + C)
      if (e.shiftKey && e.key === 'C' && !cmdOrCtrl) {
        e.preventDefault();
        toggleComments();
        return;
      }

      // Ferramenta de Seleção (V)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        useEditorStore.getState().setInteractionMode('select');
        return;
      }

      // Ferramenta de Movimentação (H)
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        useEditorStore.getState().setInteractionMode('pan');
        return;
      }

      // Ferramenta de Linha (L)
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        useEditorStore.getState().setActiveTool('line');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementIds, elements, deleteElement, duplicateElement, groupElements, ungroupElements, updateElement, setSelectedElement, selectMultipleElements, toggleUI, toggleComments]);


  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId: null
    });
  };

  const handleElementContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Select element if not already selected
    if (!selectedElementIds.includes(elementId)) {
      setSelectedElement(elementId);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Close context menu on any click
    if (contextMenu) {
      setContextMenu(null);
    }

    // Middle mouse button = Pan
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left click on canvas background
    if (e.button === 0 && e.target === canvasRef.current) {
      // Se estiver em modo pan, sempre move o canvas
      if (interactionMode === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Se uma ferramenta de desenho estiver ativa, criar o elemento
      if (activeTool !== 'select' && activeTool !== 'move') {
        const worldX = (e.clientX - pan.x) / zoomDecimal;
        const worldY = (e.clientY - pan.y) / zoomDecimal;

        console.log('[InfiniteCanvas] Criando elemento na posição:', { worldX, worldY, clientX: e.clientX, clientY: e.clientY, pan, zoomDecimal });

        const elementData: any = {
          position: { x: worldX, y: worldY },
          style: {},
          visible: true,
          locked: false,
        };

        // Configurar elemento baseado na ferramenta ativa
        switch (activeTool) {
          case 'rectangle':
            elementData.type = 'shape-rectangle';
            elementData.size = { width: 200, height: 150 };
            elementData.style = {
              backgroundColor: '#f6f3f4',
              borderRadius: 8,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: '#000000',
            };
            break;
          case 'circle':
            elementData.type = 'shape-circle';
            elementData.size = { width: 150, height: 150 };
            elementData.style = {
              backgroundColor: '#f6f3f4',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: '#000000',
            };
            break;
          case 'line':
            elementData.type = 'shape-line';
            elementData.size = { width: 200, height: 2 };
            elementData.style = {
              backgroundColor: '#000000',
              borderRadius: 0,
            };
            break;
          case 'text':
            elementData.type = 'text-paragraph';
            elementData.size = { width: 300, height: 100 };
            elementData.content = { text: 'Digite seu texto aqui' };
            elementData.style = {
              fontSize: 16,
              textColor: '#1F2937',
            };
            break;
          case 'image':
            elementData.type = 'uploaded-image';
            elementData.size = { width: 300, height: 200 };
            elementData.content = {
              imageUrl: 'https://via.placeholder.com/300x200?text=Imagem',
            };
            break;
          case 'qrcode':
            elementData.type = 'qr-code';
            elementData.size = { width: 200, height: 200 };
            elementData.qrCodeData = {
              destinationType: 'url',
              data: '',
              customUrl: '',
              color: '#000000',
              backgroundColor: '#FFFFFF',
              errorCorrection: 'M',
              margin: 4,
              quality: 'medium',
              trackScans: false,
            };
            break;
        }

        // Adicionar elemento e voltar para ferramenta de seleção
        addElement(elementData);
        setActiveTool('select');
        setInteractionMode('select');
        return;
      }

      // Modo select: comportamento normal
      // If Shift is pressed, do box selection
      if (e.shiftKey) {
        setIsSelecting(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
      } else {
        // Ctrl/Cmd + drag = Pan (mesmo em modo select)
        if (e.ctrlKey || e.metaKey) {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
        } else {
          // Otherwise deselect all
          setSelectedElement(null);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');

    if (!componentType || !canvasRef.current) return;

    // Convert screen coordinates to world coordinates (zoom fixo = 1)
    const worldX = (e.clientX - pan.x) / zoomDecimal;
    const worldY = (e.clientY - pan.y) / zoomDecimal;

    let width = 200;
    let height = 260;

    if (componentType.includes('text')) {
      width = 300;
      height = 50;
    } else if (componentType === 'banner') {
      width = 480;
      height = 160;
    } else if (componentType.startsWith('shape')) {
      width = 100;
      height = 100;
    } else if (componentType === 'uploaded-image') {
      const assetId = e.dataTransfer.getData('assetId');
      const { getAsset } = useAssetStore.getState();
      const asset = getAsset(assetId);

      if (asset) {
        const maxWidth = 400;
        const maxHeight = 400;
        const aspectRatio = asset.width && asset.height ? asset.width / asset.height : 1;

        if (asset.width && asset.height) {
          if (asset.width > asset.height) {
            width = Math.min(asset.width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(asset.height, maxHeight);
            width = height * aspectRatio;
          }
        } else {
          width = 300;
          height = 300;
        }
      }

      addElement({
        type: componentType as any,
        position: { x: worldX, y: worldY },
        size: { width, height },
        style: {},
        content: { assetId: e.dataTransfer.getData('assetId') },
        visible: true,
        locked: false,
      });
      return;
    } else if (componentType === 'custom-component') {
      const componentId = e.dataTransfer.getData('componentId');
      const { components } = useComponentStore.getState();
      const component = components.find((c) => c.id === componentId);

      if (component) {
        component.elements.forEach((element) => {
          addElement({
            ...element,
            componentId: component.id,
            componentName: component.name,
            position: {
              x: worldX + (element.position?.x || 0),
              y: worldY + (element.position?.y || 0),
            },
          });
        });
        return;
      }
    }

    // Criar elemento com dados padrão
    const defaultData = getDefaultElementData(componentType as any);
    const defaultSize = getDefaultElementSize(componentType as any);

    addElement({
      type: componentType as any,
      position: { x: worldX, y: worldY },
      size: defaultSize,
      style: {},
      ...defaultData,
      visible: true,
      locked: false,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Função auxiliar para aguardar carregamento de todas as imagens
  const waitForImagesToLoad = async (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll('img'));

    if (images.length === 0) {
      return Promise.resolve();
    }

    const imagePromises = images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Timeout ao carregar imagem:', img.src);
          resolve(); // Resolve anyway to not block the export
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          console.warn('Erro ao carregar imagem:', img.src);
          resolve(); // Resolve anyway to not block the export
        };
      });
    });

    await Promise.all(imagePromises);
  };

  // Exportar TODAS as páginas do catálogo para PDF com alta fidelidade
  const exportDiPackTemplates = async () => {
    try {
      const { pages, currentPageId, setCurrentPage } = useEditorStore.getState();
      const sortedPages = [...pages].sort((a, b) => a.order - b.order);
      const originalPageId = currentPageId;

      if (sortedPages.length === 0) {
        alert('Nenhuma página encontrada no catálogo.');
        return;
      }

      console.log(`Iniciando exportação de ${sortedPages.length} páginas...`);

      // Configurar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      let totalTemplatesExported = 0;

      // Iterar por cada página
      for (let pageIndex = 0; pageIndex < sortedPages.length; pageIndex++) {
        const page = sortedPages[pageIndex];

        console.log(`Processando página ${pageIndex + 1}/${sortedPages.length}: ${page.name}`);

        // Verificar se a página tem templates DiPACK
        const hasDiPackTemplates = page.elements.some(el => el.type?.startsWith('dipack-'));

        if (!hasDiPackTemplates) {
          console.warn(`Página "${page.name}" não possui templates DiPACK, pulando...`);
          continue;
        }

        // Mudar para a página
        setCurrentPage(page.id);

        // Aguardar renderização e carregamento de imagens
        await new Promise(resolve => setTimeout(resolve, 800));

        // Buscar templates DiPACK renderizados
        const dipackShowcases = Array.from(document.querySelectorAll('[class*="DiPackShowcase"]'));
        const dipackCovers = Array.from(document.querySelectorAll('[class*="DiPackCover"]'));
        const dipackInstitutional = Array.from(document.querySelectorAll('[class*="DiPackInstitutional"]'));
        const dipackBackCovers = Array.from(document.querySelectorAll('[class*="DiPackBackCover"]'));
        const dipackConfeitaria = Array.from(document.querySelectorAll('[class*="DiPackConfeitaria"]'));

        const pageTemplates = [
          ...dipackCovers,
          ...dipackInstitutional,
          ...dipackShowcases,
          ...dipackConfeitaria,
          ...dipackBackCovers
        ];

        console.log(`Encontrados ${pageTemplates.length} templates na página "${page.name}"`, {
          showcases: dipackShowcases.length,
          covers: dipackCovers.length,
          institutional: dipackInstitutional.length,
          confeitaria: dipackConfeitaria.length,
          backCovers: dipackBackCovers.length,
        });

        // Processar cada template da página
        for (let i = 0; i < pageTemplates.length; i++) {
          const originalElement = pageTemplates[i] as HTMLElement;

          console.log(`Capturando template ${i + 1}/${pageTemplates.length} da página "${page.name}"...`);
          console.log('Elemento original:', {
            className: originalElement.className,
            tagName: originalElement.tagName,
          });

          // Criar um container temporário fora do canvas transformado
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'fixed';
          tempContainer.style.top = '-9999px';
          tempContainer.style.left = '-9999px';
          tempContainer.style.width = '800px';
          tempContainer.style.height = '1130px';
          tempContainer.style.zIndex = '-1';
          tempContainer.style.backgroundColor = '#ffffff';
          document.body.appendChild(tempContainer);

          // Clonar o elemento original
          const clonedElement = originalElement.cloneNode(true) as HTMLElement;
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'relative';
          clonedElement.style.width = '800px';
          clonedElement.style.height = '1130px';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '0';

          tempContainer.appendChild(clonedElement);

          // Aguardar renderização do clone
          await new Promise(resolve => setTimeout(resolve, 500));

          // Aguardar carregamento de todas as imagens no clone
          await waitForImagesToLoad(tempContainer);

          // Log das dimensões
          console.log('Dimensões do container temporário:', {
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight,
            clonedWidth: clonedElement.offsetWidth,
            clonedHeight: clonedElement.offsetHeight,
          });

          // Capturar como imagem
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 800,
            height: 1130,
          });

          console.log('Canvas gerado:', {
            width: canvas.width,
            height: canvas.height,
          });

          // Remover container temporário
          document.body.removeChild(tempContainer);

          const imgData = canvas.toDataURL('image/jpeg', 1.0);

          // Adicionar página ao PDF (exceto na primeira iteração)
          if (totalTemplatesExported > 0) {
            pdf.addPage();
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          totalTemplatesExported++;
        }
      }

      // Retornar à página original
      setCurrentPage(originalPageId);

      if (totalTemplatesExported === 0) {
        alert('Nenhum template DiPACK encontrado em nenhuma página.\n\nAdicione templates usando o painel "Templates DiPACK" à direita.');
        return;
      }

      // Salvar
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`Catalogo-DiPACK-${timestamp}.pdf`);

      console.log(`✅ Exportação concluída! ${totalTemplatesExported} templates de ${sortedPages.length} páginas exportados.`);

    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert(`Erro ao exportar PDF:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Get context menu items based on selection
  const getContextMenuItems = () => {
    console.log('[ContextMenu] getContextMenuItems called, contextMenu:', contextMenu);
    if (!contextMenu) return [];

    const { elementId } = contextMenu;
    console.log('[ContextMenu] Element ID:', elementId);

    // Canvas context menu (no element selected)
    if (!elementId) {
      return [
        {
          label: 'Exportar Todas as Páginas (PDF)',
          icon: <FiImage />,
          onClick: () => exportDiPackTemplates(),
        },
        {
          label: 'Show/Hide UI',
          icon: <FiEye />,
          shortcut: '⌘ \\',
          onClick: () => toggleUI(),
          separator: true,
        },
        {
          label: 'Show/Hide comments',
          icon: <FiLayers />,
          shortcut: '⇧ C',
          onClick: () => toggleComments(),
        },
        {
          label: 'Actions...',
          shortcut: '⌘ K',
          onClick: () => alert('Command Palette em desenvolvimento!'),
        },
      ];
    }

    // Element context menu
    const element = elements.find(el => el.id === elementId);
    if (!element) return [];

    const isGroup = element.isGroup;
    const canGroup = selectedElementIds.length >= 2;
    const isDiPackTemplate = element.type?.includes('dipack-');

    const menuItems = [
      {
        label: 'Duplicate',
        icon: <FiCopy />,
        shortcut: '⌘ D',
        onClick: () => {
          console.log('[ContextMenu] Duplicating element:', elementId);
          duplicateElement(elementId);
        },
      },
      {
        label: 'Delete',
        icon: <FiTrash2 />,
        shortcut: 'Del',
        onClick: () => {
          console.log('[ContextMenu] Deleting element:', elementId);
          deleteElement(elementId);
        },
        separator: !isDiPackTemplate,
      },
    ];

    // Adicionar opção de exportar se for um template DiPACK
    if (isDiPackTemplate) {
      menuItems.push({
        label: 'Exportar como PDF',
        icon: <FiDownload className="w-4 h-4" />,
        onClick: async () => {
          await exportDiPackTemplates();
        },
        separator: true,
        shortcut: '',
      });
    }

    return [
      ...menuItems,
      {
        label: canGroup ? 'Group selection' : 'Group',
        icon: <BsBoxes />,
        shortcut: '⌘ G',
        onClick: () => {
          console.log('[ContextMenu] Grouping elements:', selectedElementIds);
          groupElements(selectedElementIds);
        },
        disabled: !canGroup,
      },
      {
        label: 'Ungroup',
        icon: <BsGrid3X3 />,
        shortcut: '⌘ ⇧ G',
        onClick: () => {
          console.log('[ContextMenu] Ungrouping element:', elementId);
          ungroupElements(elementId);
        },
        disabled: !isGroup,
        separator: true,
      },
      {
        label: element.visible === false ? 'Show layer' : 'Hide layer',
        icon: element.visible === false ? <FiEye /> : <FiEyeOff />,
        shortcut: '⌘ ⇧ H',
        onClick: () => {
          console.log('[ContextMenu] Toggling visibility for:', elementId, 'Current:', element.visible);
          updateElement(elementId, { visible: element.visible === false ? true : false });
        },
      },
      {
        label: element.locked ? 'Unlock layer' : 'Lock layer',
        icon: element.locked ? <FiUnlock /> : <FiLock />,
        shortcut: '⌘ ⇧ L',
        onClick: () => {
          console.log('[ContextMenu] Toggling lock for:', elementId, 'Current:', element.locked);
          updateElement(elementId, { locked: !element.locked });
        },
      },
    ];
  };

  // Draw infinite grid
  const gridSize = 20;
  const gridPattern = gridVisible ? (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern
          id="grid"
          width={gridSize * zoomDecimal}
          height={gridSize * zoomDecimal}
          patternUnits="userSpaceOnUse"
          x={pan.x % (gridSize * zoomDecimal)}
          y={pan.y % (gridSize * zoomDecimal)}
        >
          <circle cx="0.5" cy="0.5" r="0.5" fill="#d1d5db" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  ) : null;

  // Catalog page dimensions (A4 size - igual aos templates DiPACK)
  const catalogWidth = FIXED_PAGE_WIDTH; // 800px
  const catalogHeight = FIXED_PAGE_HEIGHT; // 1130px
  const catalogX = 0;
  const catalogY = 0;

  // Convert to screen coordinates (zoom fixo = 1)
  const screenCatalogX = catalogX * zoomDecimal + pan.x;
  const screenCatalogY = catalogY * zoomDecimal + pan.y;
  const screenCatalogWidth = catalogWidth * zoomDecimal;
  const screenCatalogHeight = catalogHeight * zoomDecimal;

  // Definir cursor baseado no modo
  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (interactionMode === 'pan') return 'cursor-grab';
    return 'cursor-default';
  };

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full bg-gray-200 relative overflow-hidden ${getCursorClass()}`}
      onMouseDown={handleMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleCanvasContextMenu}
    >
      {/* Grid */}
      {gridPattern}

      {/* Catalog Page Area */}
      <div
        className="absolute bg-white shadow-strong pointer-events-none border border-gray-300 rounded-lg"
        style={{
          left: `${screenCatalogX}px`,
          top: `${screenCatalogY}px`,
          width: `${screenCatalogWidth}px`,
          height: `${screenCatalogHeight}px`,
        }}
      >
        {/* Page Label */}
        <div className="absolute -top-10 left-0 text-xs font-medium text-gray-700 bg-white px-3 py-1.5 rounded-xl shadow-soft border border-gray-200">
          {catalogName || 'Catálogo Novo'} - Página {currentPageIndex + 1} - {catalogWidth} × {catalogHeight}px
        </div>

        {/* Header */}
        {currentPage?.header?.enabled && (
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              transform: `scale(${zoomDecimal})`,
              transformOrigin: 'top left',
              width: `${catalogWidth}px`,
            }}
          >
            <HeaderFooter
              config={currentPage.header}
              type="header"
              currentPage={currentPageIndex + 1}
              totalPages={totalPages}
              catalogName={catalogName}
            />
          </div>
        )}

        {/* Footer */}
        {currentPage?.footer?.enabled && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              transform: `scale(${zoomDecimal})`,
              transformOrigin: 'bottom left',
              width: `${catalogWidth}px`,
            }}
          >
            <HeaderFooter
              config={currentPage.footer}
              type="footer"
              currentPage={currentPageIndex + 1}
              totalPages={totalPages}
              catalogName={catalogName}
            />
          </div>
        )}
      </div>

      {/* Elements */}
      {elements.map((element) => {
        console.log('[InfiniteCanvas] Renderizando elemento:', element.id, element.type, element.position);
        if (element.groupId && !element.isGroup) return null;

        return (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElementIds.includes(element.id)}
            zoom={zoomDecimal}
            pan={pan}
            allElements={elements}
            onShowGuides={setSmartGuides}
            onHideGuides={() => setSmartGuides([])}
            onSelect={(e) => {
              if (e?.shiftKey) {
                toggleSelectElement(element.id);
              } else {
                setSelectedElement(element.id);
              }
            }}
            onContextMenu={(e) => handleElementContextMenu(e, element.id)}
            onDoubleClick={() => {
              // Selecionar elemento e abrir painel de propriedades
              setSelectedElement(element.id);
              // Disparar evento customizado para abrir o painel de propriedades
              window.dispatchEvent(new CustomEvent('openPropertiesPanel'));
            }}
          />
        );
      })}

      {/* Selection Box */}
      {selectionBox && (
        <div
          className="absolute border-2 border-primary-500 bg-primary-100/20 pointer-events-none"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}

      {/* Smart Guides */}
      <SmartGuides
        guides={smartGuides}
        canvasWidth={FIXED_PAGE_WIDTH}
        canvasHeight={FIXED_PAGE_HEIGHT}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

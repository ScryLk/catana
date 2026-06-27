import type { FC } from 'react';
import { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAssetStore } from '../../store/assetStore';
import { useComponentStore } from '../../store/componentStore';
import type { CatalogElement, LineData } from '../../types/editor';
import { QRCode } from './elements/QRCode';
import { Line } from './elements/Line';


interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  zoom: number;
}

const Ruler: FC<RulerProps> = ({ orientation, zoom }) => {
  const steps = orientation === 'horizontal' ? 80 : 60;
  const marks = [];

  for (let i = 0; i <= steps; i++) {
    const position = (i * 100 * zoom) / 100;
    const isMajor = i % 10 === 0;

    marks.push(
      <div
        key={i}
        className={`absolute ${orientation === 'horizontal' ? 'h-full' : 'w-full'}`}
        style={{
          [orientation === 'horizontal' ? 'left' : 'top']: `${position}px`,
          [orientation === 'horizontal' ? 'width' : 'height']: '1px',
        }}
      >
        <div
          className={`bg-gray-400 ${isMajor
            ? orientation === 'horizontal'
              ? 'h-3 w-px'
              : 'w-3 h-px'
            : orientation === 'horizontal'
              ? 'h-2 w-px'
              : 'w-2 h-px'
            }`}
        />
        {isMajor && (
          <span className="absolute text-[9px] text-gray-600" style={{
            [orientation === 'horizontal' ? 'left' : 'top']: '2px',
            [orientation === 'horizontal' ? 'top' : 'left']: '0px'
          }}>
            {i * 10}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-100 border-gray-300 ${orientation === 'horizontal'
        ? 'h-6 border-b flex-shrink-0'
        : 'w-6 border-r flex-shrink-0'
        } relative`}
    >
      {marks}
    </div>
  );
};

interface CanvasElementProps {
  element: CatalogElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
}

const CanvasElement: FC<CanvasElementProps> = ({ element, isSelected, onDragStart }) => {
  const { updateElement, snapToGrid, gridSize } = useEditorStore();
  const { getAsset } = useAssetStore();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw'>('se');
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0
  });



  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        const deltaX = e.clientX - resizeStart.startX;
        const deltaY = e.clientY - resizeStart.startY;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.x;
        let newY = resizeStart.y;

        if (resizeDirection.includes('e')) newWidth += deltaX;
        if (resizeDirection.includes('w')) {
          newWidth -= deltaX;
          newX += deltaX;
        }
        if (resizeDirection.includes('s')) newHeight += deltaY;
        if (resizeDirection.includes('n')) {
          newHeight -= deltaY;
          newY += deltaY;
        }

        // Apply grid snap to size
        if (snapToGrid) {
          newWidth = Math.round(newWidth / gridSize) * gridSize;
          newHeight = Math.round(newHeight / gridSize) * gridSize;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        if (newWidth > 20 && newHeight > 20) {
          updateElement(element.id, {
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, resizeDirection, element.id, updateElement, snapToGrid, gridSize]);

  const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  // Render content based on type
  const renderContent = () => {
    switch (element.type) {
      case 'text-title':
      case 'text-subtitle':
      case 'text-paragraph':
      case 'text-list':
        return (
          <div
            style={{
              color: element.style?.textColor || '#000000',
              fontSize: `${element.style?.fontSize || 16}px`,
              fontFamily: element.style?.fontFamily || 'Inter',
              fontWeight: element.style?.fontWeight || 'normal',
              textAlign: (element.style?.textAlign as any) || 'left',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap'
            }}
          >
            {element.content}
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-full overflow-hidden" style={{
            ...element.style,
          }}>
            {element.imageUrl ? (
              <img
                src={element.imageUrl}
                alt="Imagem do catálogo"
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
                onLoad={() => console.log('[EditorCanvas] Imagem carregada com sucesso:', element.imageUrl)}
                onError={(e) => {
                  console.error('[EditorCanvas] Erro ao carregar imagem:', element.imageUrl);
                  e.currentTarget.style.display = 'none';
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
        // Se tem imageUrl, usar ela (imagem da API)
        if (element.imageUrl) {
          return (
            <div className="w-full h-full overflow-hidden" style={{
              ...element.style,
            }}>
              <img
                src={element.imageUrl}
                alt="Imagem do catálogo"
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
                onError={(e) => {
                  console.error('[EditorCanvas] Erro ao carregar imagem da API:', element.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          );
        }
        // Senão, usar asset local
        const asset = element.content?.assetId ? getAsset(element.content.assetId) : null;
        return (
          <div className="w-full h-full overflow-hidden" style={{
            ...element.style,
          }}>
            {asset ? (
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
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
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={{
            ...element.style,
          }}>
            <span className="text-gray-500 text-sm">Configure o QR Code</span>
          </div>
        );
      case 'line':
        console.log('[EditorCanvas] Line element:', element);
        console.log('[EditorCanvas] Has lineData:', !!element.lineData);
        if (element.lineData) {
          return (
            <Line
              data={element.lineData}
              isSelected={isSelected}
              isLocked={element.locked ?? false}
              elementPosition={element.position}
              onChange={(newData: LineData) => updateElement(element.id, { lineData: newData })}
            />
          );
        }
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={{
            ...element.style,
          }}>
            <span className="text-gray-500 text-sm">line</span>
          </div>
        );
      default:
        console.log('[EditorCanvas] Tipo não reconhecido:', element.type, 'element:', element);
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={{
            ...element.style,
          }}>
            <span className="text-gray-500 text-sm">{element.type}</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`absolute select-none ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        zIndex: element.zIndex,
      }}
      onMouseDown={(e) => onDragStart(e, element.id)}
    >
      {renderContent()}

      {/* Selection Handles */}
      {isSelected && (
        <>
          {/* Bottom-right */}
          <div
            className="absolute -right-1 -bottom-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nwse-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          {/* Top-right */}
          <div
            className="absolute -right-1 -top-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nesw-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          {/* Top-left */}
          <div
            className="absolute -left-1 -top-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nwse-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          {/* Bottom-left */}
          <div
            className="absolute -left-1 -bottom-1 w-3 h-3 bg-white border-2 border-primary-500 rounded-sm cursor-nesw-resize hover:scale-150 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
        </>
      )}
    </div>
  );
};

export const EditorCanvas: FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    getCurrentPage,
    zoom,
    gridVisible,

    selectedElementIds,
    setSelectedElement,
    toggleSelectElement,
    selectMultipleElements,
    addElement
  } = useEditorStore();
  const currentPage = getCurrentPage();
  const elements = currentPage?.elements || [];

  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      if (!e.shiftKey) {
        setSelectedElement(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setIsSelecting(true);
      setSelectionStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSelecting && selectionStart && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

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
            if (el.isGroup) return false; // Skip group elements themselves
            const elRight = el.position.x + el.size.width;
            const elBottom = el.position.y + el.size.height;
            const boxRight = selectionBox.x + selectionBox.width;
            const boxBottom = selectionBox.y + selectionBox.height;

            return (
              el.position.x < boxRight &&
              elRight > selectionBox.x &&
              el.position.y < boxBottom &&
              elBottom > selectionBox.y
            );
          })
          .map((el) => el.id);

        if (selectedIds.length > 0) {
          selectMultipleElements(selectedIds);
        }
      }

      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
    };

    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, selectionStart, selectionBox, elements]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');

    if (!componentType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Default sizes based on component type
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
    } else if (componentType === 'product-card') {
      width = 240;
      height = 320;

      const productDataStr = e.dataTransfer.getData('productData');
      if (productDataStr) {
        try {
          const productData = JSON.parse(productDataStr);

          addElement({
            type: 'product-card',
            position: { x, y },
            size: { width, height },
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 12,
              shadow: true,
              padding: 16,
            },
            productData: {
              name: productData.name,
              image: productData.image,
              price: productData.price,
              currency: productData.currency,
              description: productData.description,
              sku: productData.sku,
              category: productData.category,
              specs: productData.specs,
            },
            visible: true,
            locked: false,
          });
          return;
        } catch (err) {
          console.error('Failed to parse product data:', err);
        }
      }
    } else if (componentType === 'uploaded-image') {
      const assetId = e.dataTransfer.getData('assetId');
      const { getAsset } = useAssetStore.getState();
      const asset = getAsset(assetId);

      if (asset) {
        // Calculate size maintaining aspect ratio
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
        position: { x, y },
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
        // Add all elements from the component
        component.elements.forEach((element) => {
          addElement({
            ...element,
            position: {
              x: x + (element.position?.x || 0),
              y: y + (element.position?.y || 0),
            },
          });
        });
        return;
      }
    }

    addElement({
      type: componentType as any,
      position: { x, y },
      size: { width, height },
      style: {},
      visible: true,
      locked: false,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Horizontal Ruler */}
      <div className="flex">
        <div className="w-6 h-6 bg-gray-200 border-b border-r border-gray-300 flex-shrink-0" />
        <Ruler orientation="horizontal" zoom={zoom} />
      </div>

      {/* Canvas Area with Vertical Ruler */}
      <div className="flex flex-1 overflow-hidden">
        <Ruler orientation="vertical" zoom={zoom} />

        <div className="flex-1 overflow-auto p-8" onClick={handleCanvasClick}>
          <div
            ref={canvasRef}
            id="editor-canvas-content"
            className="bg-white shadow-lg mx-auto relative"
            style={{
              width: `${800 * (zoom / 100)}px`,
              height: `${1130 * (zoom / 100)}px`,
              backgroundImage: gridVisible
                ? `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
   linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: gridVisible ? '20px 20px' : 'auto',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseDown={handleMouseDown}
          >
            {/* Render Elements */}
            {elements.map((element) => {
              // Don't render child elements of groups, they're rendered by the group
              if (element.groupId && !element.isGroup) {
                return null;
              }

              return (
                <CanvasElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={(e) => {
                    if (e?.shiftKey) {
                      toggleSelectElement(element.id);
                    } else {
                      setSelectedElement(element.id);
                    }
                  }}
                  onDragStart={() => { }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

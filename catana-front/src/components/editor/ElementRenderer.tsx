import { type FC } from 'react';
import type { CatalogElement, LineData } from '../../types/editor';
import type { Camera, ViewportRect } from '../../utils/lineCoordinates';
import { QRCode } from './elements/QRCode';
import { LineFigma } from './elements/LineFigma';
import { ImageFigma } from './elements/ImageFigma';
import { pluginRegistry } from '../../plugins/registry';
import { useEditorStore } from '../../store/editorStore';
import { resolveElementTokens } from '../../utils/themeResolve';

interface ElementRendererProps {
  element: CatalogElement;
  isPDF?: boolean; // Flag to indicate if rendering for PDF export
  isSelected?: boolean; // Flag to indicate if element is selected
  onResizeStateChange?: (elementId: string, isResizing: boolean) => void; // Callback when line resize state changes
  camera?: Camera; // Camera state for line coordinate conversion
  viewportRect?: ViewportRect; // Viewport bounds for line coordinate conversion
}

/**
 * Renders a catalog element with all its styles and content.
 * Used both in the canvas and for PDF export.
 */
export const ElementRenderer: FC<ElementRendererProps> = ({
  element: rawElement,
  isPDF = false,
  isSelected = false,
  onResizeStateChange,
  camera,
  viewportRect
}) => {
  // Hooks para atualizar e selecionar elementos
  const updateElement = useEditorStore(state => state.updateElement);
  const setSelectedElement = useEditorStore(state => state.setSelectedElement);
  const designTokens = useEditorStore(state => state.designTokens);

  // INC-06: resolve referências $tokens.* contra o tema global antes de renderizar.
  const element = resolveElementTokens(rawElement, designTokens);

  // Build border properties
  const buildBorderStyle = () => {
    if (element.style?.borderWidth && element.style.borderWidth > 0) {
      const borderProps = {
        borderWidth: `${element.style.borderWidth}px`,
        borderStyle: element.style.borderStyle || 'solid',
        borderColor: element.style.borderColor || '#000000',
      };

      // Debug log
      if (!isPDF) {
        import.meta.env.DEV && console.log('[ElementRenderer] Building border:', {
          element: element.id,
          type: element.type,
          borderProps,
          rawStyle: element.style,
        });
      }

      return borderProps;
    }
    return {};
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: element.style?.fontFamily,
    fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
    fontWeight: element.style?.fontWeight,
    color: element.style?.textColor,
    backgroundColor: element.style?.backgroundColor,
    // NOTE: opacity is handled by the wrapper, not here
    ...buildBorderStyle(),
    borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
    boxSizing: 'border-box', // Ensure border is included in element size
  };

  // Debug baseStyle
  if (!isPDF && element.style?.borderWidth) {
    import.meta.env.DEV && console.log('[ElementRenderer] Applied baseStyle:', {
      element: element.id,
      baseStyle,
    });
  }

  // Build CSS filter string for images
  const buildImageFilters = () => {
    const filters = [];
    if (element.style?.brightness !== undefined && element.style.brightness !== 100) {
      filters.push(`brightness(${element.style.brightness}%)`);
    }
    if (element.style?.contrast !== undefined && element.style.contrast !== 100) {
      filters.push(`contrast(${element.style.contrast}%)`);
    }
    if (element.style?.saturate !== undefined && element.style.saturate !== 100) {
      filters.push(`saturate(${element.style.saturate}%)`);
    }
    if (element.style?.grayscale !== undefined && element.style.grayscale !== 0) {
      filters.push(`grayscale(${element.style.grayscale}%)`);
    }
    if (element.style?.blur !== undefined && element.style.blur !== 0) {
      filters.push(`blur(${element.style.blur}px)`);
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  switch (element.type) {
    // Text Elements
    case 'text-title':
      return (
        <div className="w-full h-full flex items-center justify-center" style={baseStyle}>
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: element.style?.fontFamily,
              fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
              fontWeight: element.style?.fontWeight,
              color: element.style?.textColor || '#1F2937',
              textAlign: element.style?.textAlign,
            }}
          >
            {element.content?.text || 'Título da Seção'}
          </h2>
        </div>
      );

    case 'text-paragraph':
    case 'text-subtitle':
    case 'text-list':
      return (
        <div
          className="w-full h-full flex items-center p-2"
          style={baseStyle}
        >
          <p
            style={{
              fontFamily: element.style?.fontFamily || 'Arial',
              fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : '16px',
              fontWeight: element.style?.fontWeight || 'normal',
              fontStyle: element.style?.fontStyle || 'normal',
              textDecoration: element.style?.textDecoration || 'none',
              color: element.style?.textColor || '#1F2937',
              textAlign: element.style?.textAlign || 'left',
              lineHeight: element.style?.lineHeight || 1.5,
              letterSpacing: element.style?.letterSpacing ? `${element.style.letterSpacing}px` : '0',
              width: '100%',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {element.content?.text || 'Digite seu texto aqui'}
          </p>
        </div>
      );

    // Product Elements
    case 'product-card':
      return (
        <div
          className="w-full h-full p-4 flex flex-col"
          style={{
            ...baseStyle,
            backgroundColor: baseStyle.backgroundColor || 'white',
          }}
        >
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
        <div
          className="w-full h-full p-4 flex items-center justify-center"
          style={{
            ...baseStyle,
            backgroundColor: baseStyle.backgroundColor || '#f0fdf4',
          }}
        >
          <span className="text-5xl">🌟</span>
        </div>
      );

    // Image Elements
    case 'image':
    case 'uploaded-image':
      // Se tem imageData (novo sistema) e não está em modo PDF, usar ImageFigma
      if (element.imageData && camera && viewportRect && !isPDF) {
        return (
          <ImageFigma
            data={element.imageData}
            position={element.position}
            size={element.size}
            camera={camera}
            viewportRect={viewportRect}
            isSelected={isSelected}
            isLocked={element.locked || false}
            onChange={(updates) => {
              // Atualizar position, size e/ou imageData
              updateElement(element.id, updates);
            }}
            onSelect={() => {
              import.meta.env.DEV && console.log('[ElementRenderer] Image clicked, selecting element:', element.id);
              setSelectedElement(element.id);
            }}
            onDelete={() => {
              useEditorStore.getState().deleteElement(element.id);
            }}
            onCommit={() => {
              import.meta.env.DEV && console.log('[ElementRenderer] Image committed');
            }}
          />
        );
      }

      // Fallback: sistema antigo (imageUrl) ou modo PDF
      if (!element.imageUrl) {
        return (
          <div
            className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400"
            style={baseStyle}
          >
            🖼️
          </div>
        );
      }
      return (
        <img
          src={element.imageUrl}
          alt={element.content?.alt || ''}
          crossOrigin="anonymous"
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.style?.objectFit || 'cover',
            filter: buildImageFilters(),
            ...buildBorderStyle(),
            borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
            boxSizing: 'border-box',
          }}
        />
      );

    case 'banner':
      return (
        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center" style={baseStyle}>
          <span className="text-white text-xl font-bold">Banner Promocional</span>
        </div>
      );

    // Shape Elements
    case 'shape-rectangle':
    case 'shape-square':
    case 'shape-frame':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: element.style?.backgroundColor || '#E5E7EB',
            ...buildBorderStyle(),
            borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
            boxSizing: 'border-box',
          }}
        />
      );

    case 'shape-circle':
      return (
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: element.style?.backgroundColor || '#E5E7EB',
            ...buildBorderStyle(),
            boxSizing: 'border-box',
          }}
        />
      );

    case 'shape-line':
      const lineData = element.content || {};
      const x1 = lineData.x1 || 0;
      const y1 = lineData.y1 || 0;
      const x2 = lineData.x2 || element.size.width;
      const y2 = lineData.y2 || 0;

      const strokeColor = lineData.strokeColor || '#000000';
      const strokeWidth = lineData.strokeWidth || 2;
      const strokeCap = lineData.cap || 'round';
      const startArrow = lineData.startArrow || 'none';
      const endArrow = lineData.endArrow || 'none';
      const arrowSizeMap: Record<'small' | 'medium' | 'large', number> = { small: 8, medium: 12, large: 16 };
      const arrowSizeKey = lineData.arrowSize as 'small' | 'medium' | 'large' | undefined;
      const arrowSizePx = (arrowSizeKey && arrowSizeMap[arrowSizeKey]) || 12;

      // Dash pattern
      let dashArray = undefined;
      if (lineData.dashPattern && lineData.dashPattern.length > 0) {
        dashArray = lineData.dashPattern.join(',');
      }

      // Calcular posições relativas ao bounding box do elemento
      const relX1 = x1 - element.position.x;
      const relY1 = y1 - element.position.y;
      const relX2 = x2 - element.position.x;
      const relY2 = y2 - element.position.y;

      // Helper para criar markers de seta
      const createArrowMarker = (id: string, type: string) => {
        if (type === 'arrow') {
          return (
            <marker
              id={id}
              markerWidth={arrowSizePx}
              markerHeight={arrowSizePx}
              refX={arrowSizePx * 0.8}
              refY={arrowSizePx / 2}
              orient="auto"
            >
              <path
                d={`M 0 0 L ${arrowSizePx} ${arrowSizePx / 2} L 0 ${arrowSizePx} Z`}
                fill={strokeColor}
              />
            </marker>
          );
        } else if (type === 'circle') {
          return (
            <marker
              id={id}
              markerWidth={arrowSizePx}
              markerHeight={arrowSizePx}
              refX={arrowSizePx / 2}
              refY={arrowSizePx / 2}
              orient="auto"
            >
              <circle cx={arrowSizePx / 2} cy={arrowSizePx / 2} r={arrowSizePx / 3} fill={strokeColor} />
            </marker>
          );
        } else if (type === 'diamond') {
          return (
            <marker
              id={id}
              markerWidth={arrowSizePx}
              markerHeight={arrowSizePx}
              refX={arrowSizePx / 2}
              refY={arrowSizePx / 2}
              orient="auto"
            >
              <path
                d={`M ${arrowSizePx / 2} 0 L ${arrowSizePx} ${arrowSizePx / 2} L ${arrowSizePx / 2} ${arrowSizePx} L 0 ${arrowSizePx / 2} Z`}
                fill={strokeColor}
              />
            </marker>
          );
        }
        return null;
      };

      return (
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            {startArrow !== 'none' && createArrowMarker(`arrow-start-${element.id}`, startArrow)}
            {endArrow !== 'none' && createArrowMarker(`arrow-end-${element.id}`, endArrow)}
          </defs>
          <line
            x1={relX1}
            y1={relY1}
            x2={relX2}
            y2={relY2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinecap={strokeCap}
            opacity={lineData.opacity || 1}
            markerStart={startArrow !== 'none' ? `url(#arrow-start-${element.id})` : undefined}
            markerEnd={endArrow !== 'none' ? `url(#arrow-end-${element.id})` : undefined}
          />
        </svg>
      );

    // QR Code
    case 'qr-code':
      return (
        <QRCode
          data={element.qrCodeData || {
            destinationType: 'url',
            data: '',
            customUrl: '',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            errorCorrection: 'M',
            margin: 4,
            quality: 'medium',
            trackScans: false,
          }}
          size={element.size}
          isSelected={isSelected}
          onSelect={() => setSelectedElement(element.id)}
          isPDF={isPDF}
        />
      );

    // Line (native Figma-like line tool)
    case 'line':
      if (element.lineData && camera && viewportRect) {
        return (
          <LineFigma
            data={element.lineData}
            isSelected={isSelected}
            isLocked={element.locked || false}
            camera={camera}
            viewportRect={viewportRect}
            onChange={(newData: LineData) => {
              // ✅ Linhas agora usam coordenadas absolutas de world
              // Apenas atualizar os dados da linha
              updateElement(element.id, { lineData: newData });
            }}
            onSelect={() => {
              import.meta.env.DEV && console.log('[ElementRenderer] Line clicked, selecting element:', element.id);
              setSelectedElement(element.id);
            }}
            onDelete={() => {
              // Remove element from store
              useEditorStore.getState().deleteElement(element.id);
            }}
            onCommit={() => {
              // Commit to history (optional callback for future undo/redo)
              import.meta.env.DEV && console.log('[ElementRenderer] Line committed');
            }}
            onResizeStateChange={(isResizing) => {
              onResizeStateChange?.(element.id, isResizing);
            }}
          />
        );
      }
      return (
        <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
          <span className="text-gray-500 text-sm">Configure a linha</span>
        </div>
      );

    // Fallback for unknown types
    default:
      // Try to get from plugin registry
      const PluginComponent = pluginRegistry.get(element.type);
      if (PluginComponent) {
        return <PluginComponent {...(element.content || {})} />;
      }

      return (
        <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center" style={baseStyle}>
          <span className="text-gray-400 text-sm">
            {element.type}
          </span>
        </div>
      );
  }
};

/**
 * 🖼️ ImageFigma - Componente de Imagem Profissional
 *
 * Comportamento Figma-like:
 * - Drag move a imagem livremente (1:1 com cursor)
 * - Resize a partir dos handles (cantos apenas no MVP)
 * - Proporção mantida por padrão (Shift força proporção sempre)
 * - Snapshot imutável no início da interação
 * - Sem deltas acumulados
 * - Performance otimizada com RAF
 *
 * State Machine:
 * - idle: Nenhuma interação
 * - dragging: Arrastando a imagem
 * - resizing: Redimensionando via handle
 */

import { type FC, useState, useRef, useEffect } from 'react';
import type { ImageData, Position, Size } from '../../../types/editor';
import type { Camera, ViewportRect } from '../../../utils/lineCoordinates';

interface ImageFigmaProps {
  data: ImageData;
  position: Position;
  size: Size;
  camera: Camera;
  viewportRect: ViewportRect;
  isSelected: boolean;
  isLocked: boolean;
  onChange: (newData: { position?: Position; size?: Size; imageData?: ImageData }) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onCommit?: () => void;
}

type InteractionMode = 'idle' | 'dragging' | 'resizing';
type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw'; // Apenas cantos no MVP

export const ImageFigma: FC<ImageFigmaProps> = ({
  data,
  position,
  size,
  camera,
  isSelected,
  isLocked,
  onChange,
  onSelect,
  onDelete,
  onCommit,
}) => {
  // ========================================
  // STATE
  // ========================================

  const [mode, setMode] = useState<InteractionMode>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Preview local (atualizado durante interação)
  const [previewState, setPreviewState] = useState<{
    position: Position;
    size: Size;
  } | null>(null);

  // Snapshot imutável para drag
  const dragSnapshotRef = useRef<{
    positionInitial: Position;
    mouseInitial: Position;
  } | null>(null);

  // Snapshot imutável para resize
  const resizeSnapshotRef = useRef<{
    handle: ResizeHandle;
    positionInitial: Position;
    sizeInitial: Size;
    mouseInitial: Position;
    aspectRatio: number; // Para manter proporção
  } | null>(null);

  // Estado atual (preview ou data original)
  const currentPosition = previewState?.position || position;
  const currentSize = previewState?.size || size;

  // ========================================
  // CÁLCULOS GEOMÉTRICOS
  // ========================================

  const zoomDecimal = camera.zoom / 100;

  const getHandleCursor = (handle: ResizeHandle): string => {
    const cursors: Record<ResizeHandle, string> = {
      nw: 'nwse-resize',
      ne: 'nesw-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };
    return mode === 'resizing' ? 'grabbing' : cursors[handle];
  };

  const bodyCursor = mode === 'dragging' ? 'grabbing' : (isSelected && !isLocked ? 'move' : 'pointer');

  // ========================================
  // DRAG (MOVER IMAGEM)
  // ========================================

  const handleBodyPointerDown = (e: React.PointerEvent) => {
    // Sempre parar propagação para não conflitar com FigmaCanvas
    e.stopPropagation();

    import.meta.env.DEV && console.log('[ImageFigma] PointerDown - isLocked:', isLocked, 'isSelected:', isSelected);

    if (isLocked || !isSelected) {
      import.meta.env.DEV && console.log('[ImageFigma] Calling onSelect');
      onSelect?.();
      return;
    }

    import.meta.env.DEV && console.log('[ImageFigma] Starting drag mode');

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // 🎯 Usar o MESMO sistema de coordenadas do FigmaCanvas (viewportToCanvas)
    const zoomDecimal = camera.zoom / 100;
    const mouseCanvas = {
      x: (e.clientX - camera.x) / zoomDecimal,
      y: (e.clientY - camera.y) / zoomDecimal,
    };

    import.meta.env.DEV && console.log('[ImageFigma] Drag snapshot:', { position, mouseCanvas });

    dragSnapshotRef.current = {
      positionInitial: { ...position },
      mouseInitial: mouseCanvas,
    };

    setMode('dragging');
  };

  // ========================================
  // RESIZE (HANDLES)
  // ========================================

  const handleHandlePointerDown = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (isLocked) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const zoomDecimal = camera.zoom / 100;
    const mouseCanvas = {
      x: (e.clientX - camera.x) / zoomDecimal,
      y: (e.clientY - camera.y) / zoomDecimal,
    };

    resizeSnapshotRef.current = {
      handle,
      positionInitial: { ...position },
      sizeInitial: { ...size },
      mouseInitial: mouseCanvas,
      aspectRatio: size.width / size.height,
    };

    setMode('resizing');
  };

  // ========================================
  // POINTER MOVE (RAF)
  // ========================================

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Atualizar Shift sempre
      setIsShiftPressed(e.shiftKey);

      if (mode === 'idle') return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        // 🎯 Converter coordenadas de screen para canvas usando o MESMO sistema do FigmaCanvas (viewportToCanvas)
        const zoomDecimal = camera.zoom / 100;
        const mouseCanvas = {
          x: (e.clientX - camera.x) / zoomDecimal,
          y: (e.clientY - camera.y) / zoomDecimal,
        };

        // DRAG
        if (mode === 'dragging' && dragSnapshotRef.current) {
          const snapshot = dragSnapshotRef.current;

          const dx = mouseCanvas.x - snapshot.mouseInitial.x;
          const dy = mouseCanvas.y - snapshot.mouseInitial.y;

          const newPosition: Position = {
            x: snapshot.positionInitial.x + dx,
            y: snapshot.positionInitial.y + dy,
          };

          setPreviewState({
            position: newPosition,
            size: currentSize,
          });
        }

        // RESIZE
        if (mode === 'resizing' && resizeSnapshotRef.current) {
          const snapshot = resizeSnapshotRef.current;

          const dx = mouseCanvas.x - snapshot.mouseInitial.x;
          const dy = mouseCanvas.y - snapshot.mouseInitial.y;

          const newPosition = { ...snapshot.positionInitial };
          const newSize = { ...snapshot.sizeInitial };

          // Aplicar resize baseado no handle
          switch (snapshot.handle) {
            case 'nw': // Canto superior esquerdo
              newPosition.x = snapshot.positionInitial.x + dx;
              newPosition.y = snapshot.positionInitial.y + dy;
              newSize.width = snapshot.sizeInitial.width - dx;
              newSize.height = snapshot.sizeInitial.height - dy;
              break;
            case 'ne': // Canto superior direito
              newPosition.y = snapshot.positionInitial.y + dy;
              newSize.width = snapshot.sizeInitial.width + dx;
              newSize.height = snapshot.sizeInitial.height - dy;
              break;
            case 'se': // Canto inferior direito
              newSize.width = snapshot.sizeInitial.width + dx;
              newSize.height = snapshot.sizeInitial.height + dy;
              break;
            case 'sw': // Canto inferior esquerdo
              newPosition.x = snapshot.positionInitial.x + dx;
              newSize.width = snapshot.sizeInitial.width - dx;
              newSize.height = snapshot.sizeInitial.height + dy;
              break;
          }

          // Manter proporção se aspectRatioLocked OU Shift pressionado
          if (data.aspectRatioLocked || e.shiftKey) {
            const aspectRatio = snapshot.aspectRatio;

            // Usar a maior mudança para determinar o novo tamanho
            const widthChange = Math.abs(newSize.width - snapshot.sizeInitial.width);
            const heightChange = Math.abs(newSize.height - snapshot.sizeInitial.height);

            if (widthChange > heightChange) {
              // Ajustar altura baseado na largura
              const oldHeight = newSize.height;
              newSize.height = newSize.width / aspectRatio;

              // Corrigir posição Y para handles superiores
              if (snapshot.handle === 'nw' || snapshot.handle === 'ne') {
                newPosition.y = newPosition.y + (oldHeight - newSize.height);
              }
            } else {
              // Ajustar largura baseado na altura
              const oldWidth = newSize.width;
              newSize.width = newSize.height * aspectRatio;

              // Corrigir posição X para handles esquerdos
              if (snapshot.handle === 'nw' || snapshot.handle === 'sw') {
                newPosition.x = newPosition.x + (oldWidth - newSize.width);
              }
            }
          }

          // Aplicar tamanho mínimo
          const MIN_SIZE = 20;
          if (newSize.width < MIN_SIZE) newSize.width = MIN_SIZE;
          if (newSize.height < MIN_SIZE) newSize.height = MIN_SIZE;

          setPreviewState({
            position: newPosition,
            size: newSize,
          });
        }
      });
    };

    const handlePointerUp = () => {
      if (mode === 'idle') return;

      // Commit único
      if (previewState) {
        onChange({
          position: previewState.position,
          size: previewState.size,
        });
        onCommit?.();
      }

      // Limpar estado
      setPreviewState(null);
      dragSnapshotRef.current = null;
      resizeSnapshotRef.current = null;
      setMode('idle');
      setIsShiftPressed(false);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    if (mode !== 'idle') {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [mode, data, camera, position, size, currentSize, onChange, onCommit, previewState]);

  // ========================================
  // ATALHOS DE TECLADO
  // ========================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      // Esc: cancelar interação
      if (e.key === 'Escape' && mode !== 'idle') {
        setPreviewState(null);
        dragSnapshotRef.current = null;
        resizeSnapshotRef.current = null;
        setMode('idle');
        setIsShiftPressed(false);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      }

      // Delete: remover imagem
      if ((e.key === 'Delete' || e.key === 'Backspace') && mode === 'idle' && !isLocked) {
        onDelete?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, mode, isLocked, onDelete]);

  // ========================================
  // RENDER
  // ========================================

  const handleSize = 8; // Tamanho do handle em px (ajustado por zoom)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isLocked || mode !== 'idle' ? 'none' : 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container posicionado absolutamente no canvas */}
      <div
        style={{
          position: 'absolute',
          left: currentPosition.x,
          top: currentPosition.y,
          width: currentSize.width,
          height: currentSize.height,
          cursor: bodyCursor,
          pointerEvents: 'auto',
        }}
        onPointerDown={handleBodyPointerDown}
      >
      {/* Imagem */}
      <img
        src={data.src}
        alt={data.alt || 'Image'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: data.objectFit,
          opacity: data.opacity,
          borderRadius: `${data.borderRadius}px`,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* Bounding box quando selecionada */}
      {isSelected && !isLocked && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '2px solid #3b82f6',
              pointerEvents: 'none',
              borderRadius: `${data.borderRadius}px`,
            }}
          />

          {/* Resize Handles (cantos apenas) */}
          {['nw', 'ne', 'se', 'sw'].map((handle) => {
            const h = handle as ResizeHandle;
            const positions: Record<ResizeHandle, React.CSSProperties> = {
              nw: { top: -handleSize / 2, left: -handleSize / 2 },
              ne: { top: -handleSize / 2, right: -handleSize / 2 },
              se: { bottom: -handleSize / 2, right: -handleSize / 2 },
              sw: { bottom: -handleSize / 2, left: -handleSize / 2 },
            };

            return (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  width: handleSize,
                  height: handleSize,
                  backgroundColor: hoveredHandle === h || mode === 'resizing' ? '#3b82f6' : 'white',
                  border: '2px solid #3b82f6',
                  borderRadius: '50%',
                  cursor: getHandleCursor(h),
                  pointerEvents: 'all',
                  transition: 'all 0.15s ease',
                  ...positions[h],
                }}
                onPointerDown={(e) => handleHandlePointerDown(e, h)}
                onMouseEnter={() => setHoveredHandle(h)}
                onMouseLeave={() => setHoveredHandle(null)}
              />
            );
          })}

          {/* Indicador de proporção travada */}
          {(data.aspectRatioLocked || isShiftPressed) && mode === 'resizing' && (
            <div
              style={{
                position: 'absolute',
                top: -30 / zoomDecimal,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: 11,
                fontFamily: 'Inter, system-ui',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              🔒 Proporção Travada
            </div>
          )}

          {/* Dimensões */}
          <div
            style={{
              position: 'absolute',
              bottom: -25 / zoomDecimal,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: 11,
              fontFamily: 'Inter, system-ui',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {Math.round(currentSize.width)} × {Math.round(currentSize.height)}
          </div>
        </>
      )}

      {/* Hover indicator */}
      {isHovered && !isSelected && !isLocked && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px solid #3b82f6',
            opacity: 0.5,
            pointerEvents: 'none',
            borderRadius: `${data.borderRadius}px`,
          }}
        />
      )}

      {/* Locked indicator */}
      {isLocked && isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: 12,
            fontFamily: 'Inter, system-ui',
            fontWeight: 600,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          🔒 Bloqueado
        </div>
      )}

      {/* Error state */}
      {data.loadingState === 'error' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fef2f2',
            border: '2px dashed #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#dc2626',
            fontSize: 12,
            fontFamily: 'Inter, system-ui',
            borderRadius: `${data.borderRadius}px`,
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div>Erro ao carregar imagem</div>
          {data.errorMessage && <div style={{ fontSize: 10, marginTop: 4 }}>{data.errorMessage}</div>}
        </div>
      )}
      </div>
    </div>
  );
};

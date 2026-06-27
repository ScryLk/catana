/**
 * 🎯 LineFigma - Componente de Linha Profissional (RECRIADO DO ZERO)
 *
 * Comportamento Figma-like:
 * - Endpoint sempre colado ao cursor durante resize
 * - Âncora completamente fixa
 * - Drag move ambos os pontos igualmente
 * - Coordenadas absolutas em world space
 * - Sem deltas acumulados, sem hacks
 * - Performance otimizada com RAF
 *
 * State Machine:
 * - idle: Nenhuma interação
 * - resizing: Arrastando um handle (start ou end)
 * - dragging: Arrastando o corpo da linha
 */

import { type FC, useState, useRef, useEffect } from 'react';
import type { LineData } from '../../../types/editor';
import {
  applyAngleSnap,
  distance,
  angle,
  type Camera,
  type ViewportRect,
  type Point,
} from '../../../utils/lineCoordinates';

interface LineFigmaProps {
  data: LineData;
  camera: Camera;
  viewportRect: ViewportRect;
  isSelected: boolean;
  isLocked: boolean;
  onChange: (newData: LineData) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onCommit?: () => void;
  onResizeStateChange?: (isResizing: boolean) => void;
}

type InteractionMode = 'idle' | 'resizing' | 'dragging';
type ActiveHandle = 'start' | 'end' | null;

export const LineFigma: FC<LineFigmaProps> = ({
  data,
  camera,
  viewportRect,
  isSelected,
  isLocked,
  onChange,
  onSelect,
  onDelete,
  onCommit,
  onResizeStateChange,
}) => {
  // ========================================
  // STATE
  // ========================================

  const [mode, setMode] = useState<InteractionMode>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<ActiveHandle>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Preview local (atualizado durante interação)
  const [previewLine, setPreviewLine] = useState<LineData | null>(null);

  // Snapshot imutável para resize
  const resizeSnapshotRef = useRef<{
    activeHandle: 'start' | 'end';
    anchorPoint: Point; // Ponto fixo em world (endpoint oposto)
  } | null>(null);

  // Snapshot imutável para drag
  const dragSnapshotRef = useRef<{
    startInitial: Point;
    endInitial: Point;
    mouseInitial: Point;
  } | null>(null);

  // Linha atual (preview ou data)
  const currentLine = previewLine || data;

  // ========================================
  // CÁLCULOS GEOMÉTRICOS
  // ========================================

  const lineLength = distance(currentLine.start, currentLine.end);
  const lineAngle = angle(currentLine.start, currentLine.end);

  const getDashArray = (style: string, width: number): string => {
    switch (style) {
      case 'dashed':
        return `${width * 4} ${width * 2}`;
      case 'dotted':
        return `${width} ${width * 1.5}`;
      default:
        return '0';
    }
  };

  const getCursorForAngle = (degrees: number): string => {
    const normalized = ((degrees % 180) + 180) % 180;
    if (normalized < 22.5 || normalized >= 157.5) return 'ew-resize';
    if (normalized >= 22.5 && normalized < 67.5) return 'nwse-resize';
    if (normalized >= 67.5 && normalized < 112.5) return 'ns-resize';
    return 'nesw-resize';
  };

  const handleCursor = mode === 'resizing' ? 'grabbing' : getCursorForAngle(lineAngle);
  const bodyCursor = mode === 'dragging' ? 'grabbing' : (isSelected && !isLocked ? 'move' : 'pointer');

  // ========================================
  // RESIZE (HANDLES)
  // ========================================

  const handleHandlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
    if (isLocked) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Determinar âncora (endpoint oposto que fica fixo)
    const anchorPoint = handle === 'start' ? data.end : data.start;

    resizeSnapshotRef.current = {
      activeHandle: handle,
      anchorPoint,
    };

    setMode('resizing');
    onResizeStateChange?.(true);
  };

  // ========================================
  // DRAG (CORPO DA LINHA)
  // ========================================

  const handleBodyPointerDown = (e: React.PointerEvent) => {
    if (isLocked || !isSelected) {
      onSelect?.();
      return;
    }

    e.stopPropagation();

    // 🎯 Usar o MESMO sistema de coordenadas do FigmaCanvas (viewportToCanvas)
    const zoomDecimal = camera.zoom / 100;
    const mouseCanvas = {
      x: (e.clientX - camera.x) / zoomDecimal,
      y: (e.clientY - camera.y) / zoomDecimal,
    };

    dragSnapshotRef.current = {
      startInitial: { ...data.start },
      endInitial: { ...data.end },
      mouseInitial: mouseCanvas,
    };

    setMode('dragging');
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

        // RESIZE
        if (mode === 'resizing' && resizeSnapshotRef.current) {
          const snapshot = resizeSnapshotRef.current;

          // 🎯 REGRA FUNDAMENTAL: Endpoint = posição do mouse (1:1)
          let newActivePoint = mouseCanvas;

          // Aplicar snap de ângulo se Shift pressionado
          if (e.shiftKey) {
            newActivePoint = applyAngleSnap(mouseCanvas, snapshot.anchorPoint);
          }

          // ✅ Endpoint ativo está SEMPRE colado ao cursor
          const newLine: LineData = {
            ...data,
            start: snapshot.activeHandle === 'start' ? newActivePoint : snapshot.anchorPoint,
            end: snapshot.activeHandle === 'end' ? newActivePoint : snapshot.anchorPoint,
          };

          setPreviewLine(newLine);
        }

        // DRAG
        if (mode === 'dragging' && dragSnapshotRef.current) {
          const snapshot = dragSnapshotRef.current;

          const dx = mouseCanvas.x - snapshot.mouseInitial.x;
          const dy = mouseCanvas.y - snapshot.mouseInitial.y;

          const newLine: LineData = {
            ...data,
            start: {
              x: snapshot.startInitial.x + dx,
              y: snapshot.startInitial.y + dy,
            },
            end: {
              x: snapshot.endInitial.x + dx,
              y: snapshot.endInitial.y + dy,
            },
          };

          setPreviewLine(newLine);
        }
      });
    };

    const handlePointerUp = () => {
      if (mode === 'idle') return;

      // Commit único
      if (previewLine) {
        onChange(previewLine);
        onCommit?.();
      }

      // Limpar estado
      setPreviewLine(null);
      resizeSnapshotRef.current = null;
      dragSnapshotRef.current = null;
      setMode('idle');
      setIsShiftPressed(false);
      onResizeStateChange?.(false);

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
  }, [mode, data, camera, viewportRect, onChange, onCommit, previewLine]);

  // ========================================
  // ATALHOS DE TECLADO
  // ========================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      // Esc: cancelar interação
      if (e.key === 'Escape' && mode !== 'idle') {
        setPreviewLine(null);
        resizeSnapshotRef.current = null;
        dragSnapshotRef.current = null;
        setMode('idle');
        setIsShiftPressed(false);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      }

      // Delete: remover linha
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

  // Calcular viewBox do SVG
  const padding = 40;
  const minX = Math.min(currentLine.start.x, currentLine.end.x) - padding;
  const minY = Math.min(currentLine.start.y, currentLine.end.y) - padding;
  const maxX = Math.max(currentLine.start.x, currentLine.end.x) + padding;
  const maxY = Math.max(currentLine.start.y, currentLine.end.y) + padding;
  const width = maxX - minX;
  const height = maxY - minY;

  const zoomDecimal = camera.zoom / 100;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        // Durante resize/drag, desabilitar pointer events no SVG
        // Os eventos são capturados no document via useEffect
        pointerEvents: isLocked || mode !== 'idle' ? 'none' : 'auto',
      }}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hit area (linha grossa invisível para melhor clique) */}
      <line
        x1={currentLine.start.x}
        y1={currentLine.start.y}
        x2={currentLine.end.x}
        y2={currentLine.end.y}
        stroke="transparent"
        strokeWidth={Math.max(20 / zoomDecimal, currentLine.strokeWidth * 3)}
        strokeLinecap={currentLine.cap}
        style={{
          pointerEvents: 'stroke',
          cursor: bodyCursor,
        }}
        onPointerDown={handleBodyPointerDown}
      />

      {/* Hover indicator */}
      {isHovered && !isSelected && !isLocked && (
        <line
          x1={currentLine.start.x}
          y1={currentLine.start.y}
          x2={currentLine.end.x}
          y2={currentLine.end.y}
          stroke="#3b82f6"
          strokeWidth={currentLine.strokeWidth + 2 / zoomDecimal}
          strokeOpacity={0.5}
          strokeLinecap={currentLine.cap}
          strokeDasharray={getDashArray(currentLine.style, currentLine.strokeWidth)}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Main Line */}
      <line
        x1={currentLine.start.x}
        y1={currentLine.start.y}
        x2={currentLine.end.x}
        y2={currentLine.end.y}
        stroke={currentLine.strokeColor}
        strokeWidth={currentLine.strokeWidth}
        strokeOpacity={currentLine.opacity}
        strokeLinecap={currentLine.cap}
        strokeDasharray={getDashArray(currentLine.style, currentLine.strokeWidth)}
        style={{ pointerEvents: 'none' }}
      />

      {/* Handles (apenas quando selecionada e não locked) */}
      {isSelected && !isLocked && (
        <>
          {/* Start Handle */}
          <circle
            cx={currentLine.start.x}
            cy={currentLine.start.y}
            r={(hoveredHandle === 'start' || mode === 'resizing' ? 7 : 6) / zoomDecimal}
            fill={hoveredHandle === 'start' || mode === 'resizing' ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={2 / zoomDecimal}
            style={{
              pointerEvents: 'all',
              cursor: handleCursor,
              transition: 'all 0.15s ease',
            }}
            onPointerDown={(e) => handleHandlePointerDown(e, 'start')}
            onMouseEnter={() => setHoveredHandle('start')}
            onMouseLeave={() => setHoveredHandle(null)}
          />

          {/* End Handle */}
          <circle
            cx={currentLine.end.x}
            cy={currentLine.end.y}
            r={(hoveredHandle === 'end' || mode === 'resizing' ? 7 : 6) / zoomDecimal}
            fill={hoveredHandle === 'end' || mode === 'resizing' ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={2 / zoomDecimal}
            style={{
              pointerEvents: 'all',
              cursor: handleCursor,
              transition: 'all 0.15s ease',
            }}
            onPointerDown={(e) => handleHandlePointerDown(e, 'end')}
            onMouseEnter={() => setHoveredHandle('end')}
            onMouseLeave={() => setHoveredHandle(null)}
          />

          {/* Snap indicator */}
          {isShiftPressed && mode === 'resizing' && (
            <text
              x={(currentLine.start.x + currentLine.end.x) / 2}
              y={(currentLine.start.y + currentLine.end.y) / 2 - 25 / zoomDecimal}
              fill="#10b981"
              fontSize={11 / zoomDecimal}
              fontFamily="Inter, system-ui"
              fontWeight="600"
              textAnchor="middle"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              ⇄ SNAP: {Math.round(lineAngle)}°
            </text>
          )}

          {/* Length & angle indicator */}
          <text
            x={(currentLine.start.x + currentLine.end.x) / 2}
            y={(currentLine.start.y + currentLine.end.y) / 2 - 10 / zoomDecimal}
            fill="#3b82f6"
            fontSize={12 / zoomDecimal}
            fontFamily="Inter, system-ui"
            textAnchor="middle"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {Math.round(lineLength)}px @ {Math.round(lineAngle)}°
          </text>
        </>
      )}

      {/* Locked indicator */}
      {isLocked && isSelected && (
        <text
          x={(currentLine.start.x + currentLine.end.x) / 2}
          y={(currentLine.start.y + currentLine.end.y) / 2 - 10 / zoomDecimal}
          fill="#ef4444"
          fontSize={11 / zoomDecimal}
          fontFamily="Inter, system-ui"
          fontWeight="600"
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          🔒 Bloqueado
        </text>
      )}
    </svg>
  );
};

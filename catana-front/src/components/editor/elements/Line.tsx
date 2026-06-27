/**
 * 🎯 Componente Linha - Editor Catana (Figma-like)
 *
 * Comportamento profissional equivalente ao Figma:
 * - Endpoint sempre colado ao cursor durante resize
 * - Âncora completamente fixa (ponto oposto)
 * - Preview local + commit único no pointerup
 * - State Machine para interações exclusivas
 * - Conversão de coordenadas centralizada
 * - Performance otimizada com RAF
 * - Atalhos: Shift (snap), Esc (cancelar), Delete (remover)
 */

import { type FC, useState, useEffect, useRef } from 'react';
import type { LineData } from '../../../types/editor';
import { applyAngleSnap, getAngle, getDistance, type Point } from '../../../utils/coordinateUtils';

interface LineProps {
  data: LineData;
  isSelected: boolean;
  isLocked: boolean;
  elementPosition: { x: number; y: number }; // Posição do elemento no canvas
  onChange: (newData: LineData) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onCommit?: () => void; // Commit único no final
  onResizeStateChange?: (isResizing: boolean) => void; // Notifica quando resize inicia/termina
}

type InteractionMode = 'idle' | 'resizing' | 'dragging';

export const Line: FC<LineProps> = ({
  data,
  isSelected,
  isLocked,
  elementPosition,
  onChange,
  onSelect,
  onDelete,
  onCommit,
  onResizeStateChange
}) => {
  // State Machine
  const [mode, setMode] = useState<InteractionMode>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<'start' | 'end' | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  // Preview local (atualizado durante interação, não commitado)
  const [previewLine, setPreviewLine] = useState<LineData | null>(null);

  // Snapshot imutável para resize
  const resizeSnapshotRef = useRef<{
    anchorPoint: Point; // Âncora em coordenadas relativas (não muda)
    anchorPointAbsolute: Point; // Âncora em coordenadas absolutas de mundo
    activeHandle: 'start' | 'end';
    initialStart: Point;
    initialEnd: Point;
    wrapperRect: DOMRect;
    elementPosition: { x: number; y: number }; // Position congelada no início do resize
  } | null>(null);

  // Snapshot imutável para drag
  const dragSnapshotRef = useRef<{
    initialStart: Point;
    initialEnd: Point;
    mouse0: Point;
    wrapperRect: DOMRect;
  } | null>(null);

  // Linha atual (preview ou data)
  const currentLine = previewLine || data;

  // ========================================
  // CÁLCULOS DE RENDERIZAÇÃO
  // ========================================

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

  // Calcular bounding box com padding
  const padding = 20;
  const minX = Math.min(currentLine.start.x, currentLine.end.x);
  const minY = Math.min(currentLine.start.y, currentLine.end.y);
  const offset = { x: minX - padding, y: minY - padding };

  // Pontos ajustados para o SVG (relativos ao wrapper)
  const adjustedStart = {
    x: currentLine.start.x - offset.x,
    y: currentLine.start.y - offset.y,
  };
  const adjustedEnd = {
    x: currentLine.end.x - offset.x,
    y: currentLine.end.y - offset.y,
  };

  const length = getDistance(currentLine.start, currentLine.end);
  const angle = getAngle(currentLine.start, currentLine.end);

  // Cursor baseado no ângulo
  const getCursorForAngle = (angle: number): string => {
    const normalizedAngle = ((angle % 180) + 180) % 180;
    if (normalizedAngle < 22.5 || normalizedAngle >= 157.5) return 'ew-resize';
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'nwse-resize';
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'ns-resize';
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'nesw-resize';
    return 'move';
  };

  const handleCursor = mode === 'resizing' ? 'grabbing' : getCursorForAngle(angle);
  const bodyCursor = mode === 'dragging' ? 'grabbing' : (isSelected && !isLocked ? 'move' : 'pointer');

  // ========================================
  // RESIZE (HANDLES)
  // ========================================

  const handleHandleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
    if (isLocked) return;

    e.stopPropagation();

    if (!svgRef.current?.parentElement) return;

    const padding = 20;

    // ⚡ NOVA ABORDAGEM: Trabalhar APENAS com coordenadas ABSOLUTAS
    // element.position é IMUTÁVEL - NUNCA muda durante resize

    // Converter pontos da linha para coordenadas ABSOLUTAS de mundo
    const startAbsolute = {
      x: elementPosition.x + data.start.x,
      y: elementPosition.y + data.start.y,
    };

    const endAbsolute = {
      x: elementPosition.x + data.end.x,
      y: elementPosition.y + data.end.y,
    };

    // Determinar qual ponto é a âncora (FIXA) e qual é ativo (MOVE)
    const anchorPointAbsolute = handle === 'start' ? endAbsolute : startAbsolute;

    // Capturar wrapper rect CONGELADO
    const wrapper = svgRef.current.parentElement;
    const wrapperRect = wrapper.getBoundingClientRect();

    // Salvar snapshot imutável
    resizeSnapshotRef.current = {
      anchorPoint: handle === 'start' ? { ...data.end } : { ...data.start }, // Não usado mais
      anchorPointAbsolute, // Âncora em mundo absoluto (NUNCA muda)
      activeHandle: handle,
      initialStart: { ...data.start },
      initialEnd: { ...data.end },
      wrapperRect,
      elementPosition: { ...elementPosition }, // Position FIXA (NUNCA muda)
    };

    console.log('🎯 [RESIZE START - NOVA ABORDAGEM]', {
      handle,
      elementPosition, // FIXO
      startAbsolute,
      endAbsolute,
      anchorPointAbsolute, // FIXO durante resize
    });

    setMode('resizing');
    onResizeStateChange?.(true); // Notifica que resize começou
  };

  // ========================================
  // DRAG (CORPO DA LINHA)
  // ========================================

  const handleBodyMouseDown = (e: React.MouseEvent) => {
    if (isLocked || !isSelected) {
      onSelect?.();
      return;
    }

    e.stopPropagation();

    if (!svgRef.current?.parentElement) return;

    const wrapper = svgRef.current.parentElement;
    const wrapperRect = wrapper.getBoundingClientRect();

    // Converter mouse de screen para wrapper-local
    const mouseRelativeToWrapper = {
      x: e.clientX - wrapperRect.left,
      y: e.clientY - wrapperRect.top,
    };

    // Converter para world space
    const initialMinX = Math.min(data.start.x, data.end.x);
    const initialMinY = Math.min(data.start.y, data.end.y);
    const initialOffset = { x: initialMinX - padding, y: initialMinY - padding };

    const mouse0 = {
      x: mouseRelativeToWrapper.x + initialOffset.x,
      y: mouseRelativeToWrapper.y + initialOffset.y,
    };

    dragSnapshotRef.current = {
      initialStart: { ...data.start },
      initialEnd: { ...data.end },
      mouse0,
      wrapperRect,
    };

    setMode('dragging');
  };

  // ========================================
  // MOUSE MOVE (RAF)
  // ========================================

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Atualizar Shift sempre
      setIsShiftPressed(e.shiftKey);

      if (mode === 'idle') return;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        // RESIZE
        if (mode === 'resizing' && resizeSnapshotRef.current) {
          const snapshot = resizeSnapshotRef.current;

          // ⚡ SOLUÇÃO DEFINITIVA: Ignorar wrapper completamente
          // Calcular mouse em coordenadas ABSOLUTAS DE MUNDO usando APENAS clientX/clientY
          // e converter usando a posição FIXA do elemento

          // Primeiro, pegar a posição atual do wrapper no DOM (pode ter mudado visualmente)
          const currentWrapper = svgRef.current?.parentElement;
          if (!currentWrapper) return;

          const currentWrapperRect = currentWrapper.getBoundingClientRect();

          // Mouse relativo ao wrapper ATUAL (visual)
          const mouseRelativeToWrapper = {
            x: e.clientX - currentWrapperRect.left,
            y: e.clientY - currentWrapperRect.top,
          };

          // Converter para coordenadas absolutas de mundo usando position FIXA
          let mouseAbsolute = {
            x: snapshot.elementPosition.x + mouseRelativeToWrapper.x,
            y: snapshot.elementPosition.y + mouseRelativeToWrapper.y,
          };

          // Aplicar snap de ângulo se Shift pressionado (ambos em coordenadas absolutas)
          if (e.shiftKey) {
            mouseAbsolute = applyAngleSnap(mouseAbsolute, snapshot.anchorPointAbsolute);
          }

          // Definir os pontos em coordenadas ABSOLUTAS
          let newStartAbsolute: Point;
          let newEndAbsolute: Point;

          if (snapshot.activeHandle === 'start') {
            // Arrastando START, END é a âncora (FIXA)
            newStartAbsolute = mouseAbsolute;
            newEndAbsolute = snapshot.anchorPointAbsolute;
          } else {
            // Arrastando END, START é a âncora (FIXA)
            newStartAbsolute = snapshot.anchorPointAbsolute;
            newEndAbsolute = mouseAbsolute;
          }

          // ⚡ Converter de ABSOLUTO para RELATIVO a elementPosition (FIXO)
          // elementPosition NUNCA muda, então sempre usamos o mesmo offset
          const newLineData: LineData = {
            ...data,
            start: {
              x: newStartAbsolute.x - snapshot.elementPosition.x,
              y: newStartAbsolute.y - snapshot.elementPosition.y,
            },
            end: {
              x: newEndAbsolute.x - snapshot.elementPosition.x,
              y: newEndAbsolute.y - snapshot.elementPosition.y,
            },
          };

          console.log('📍 [RESIZE MOVE - NOVA ABORDAGEM]', {
            mouseAbsolute,
            anchorPointAbsolute: snapshot.anchorPointAbsolute, // FIXO
            elementPosition: snapshot.elementPosition, // FIXO
            newLineRelative: { start: newLineData.start, end: newLineData.end },
            newLineAbsolute: { start: newStartAbsolute, end: newEndAbsolute },
          });

          // Atualizar preview local (não commita ainda)
          setPreviewLine(newLineData);
        }

        // DRAG
        if (mode === 'dragging' && dragSnapshotRef.current) {
          const snapshot = dragSnapshotRef.current;

          // Converter mouse de screen para wrapper-local
          const mouseRelativeToWrapper = {
            x: e.clientX - snapshot.wrapperRect.left,
            y: e.clientY - snapshot.wrapperRect.top,
          };

          // Calcular offset inicial
          const initialMinX = Math.min(snapshot.initialStart.x, snapshot.initialEnd.x);
          const initialMinY = Math.min(snapshot.initialStart.y, snapshot.initialEnd.y);
          const initialOffset = { x: initialMinX - padding, y: initialMinY - padding };

          // Mouse atual em world space
          const mouseCurrent = {
            x: mouseRelativeToWrapper.x + initialOffset.x,
            y: mouseRelativeToWrapper.y + initialOffset.y,
          };

          // Delta
          const dx = mouseCurrent.x - snapshot.mouse0.x;
          const dy = mouseCurrent.y - snapshot.mouse0.y;

          // Aplicar delta aos pontos originais
          const newLineData: LineData = {
            ...data,
            start: {
              x: snapshot.initialStart.x + dx,
              y: snapshot.initialStart.y + dy,
            },
            end: {
              x: snapshot.initialEnd.x + dx,
              y: snapshot.initialEnd.y + dy,
            },
          };

          setPreviewLine(newLineData);
        }
      });
    };

    const handleMouseUp = () => {
      if (mode === 'idle') return;

      const wasResizing = mode === 'resizing';

      // Commit único
      if (previewLine) {
        console.log('✅ [RESIZE END - COMMIT]', {
          elementPosition,
          finalLine: { start: previewLine.start, end: previewLine.end },
          wasResizing,
        });
        onChange(previewLine);
        onCommit?.();
      }

      // Limpar estado
      setPreviewLine(null);
      resizeSnapshotRef.current = null;
      dragSnapshotRef.current = null;
      setMode('idle');
      setIsShiftPressed(false);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      // Notifica que resize terminou
      if (wasResizing) {
        onResizeStateChange?.(false);
      }
    };

    if (mode !== 'idle') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [mode, data, onChange, onCommit, previewLine]);

  // ========================================
  // ATALHOS DE TECLADO
  // ========================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      // Esc: cancelar interação
      if (e.key === 'Escape' && mode !== 'idle') {
        const wasResizing = mode === 'resizing';

        setPreviewLine(null);
        resizeSnapshotRef.current = null;
        dragSnapshotRef.current = null;
        setMode('idle');
        setIsShiftPressed(false);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }

        // Notifica que resize foi cancelado
        if (wasResizing) {
          onResizeStateChange?.(false);
        }
      }

      // Delete: remover linha
      if ((e.key === 'Delete' || e.key === 'Backspace') && mode === 'idle' && !isLocked) {
        onDelete?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, mode, isLocked, onDelete, onResizeStateChange]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{
        overflow: 'visible',
        pointerEvents: isLocked ? 'none' : 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hit area (linha grossa transparente) */}
      <line
        x1={adjustedStart.x}
        y1={adjustedStart.y}
        x2={adjustedEnd.x}
        y2={adjustedEnd.y}
        stroke="transparent"
        strokeWidth={Math.max(20, currentLine.strokeWidth * 5)}
        strokeLinecap={currentLine.cap}
        style={{
          pointerEvents: 'stroke',
          cursor: bodyCursor,
        }}
        onMouseDown={handleBodyMouseDown}
      />

      {/* Hover indicator */}
      {isHovered && !isSelected && !isLocked && (
        <line
          x1={adjustedStart.x}
          y1={adjustedStart.y}
          x2={adjustedEnd.x}
          y2={adjustedEnd.y}
          stroke="#3b82f6"
          strokeWidth={currentLine.strokeWidth + 2}
          strokeOpacity={0.5}
          strokeLinecap={currentLine.cap}
          strokeDasharray={getDashArray(currentLine.style, currentLine.strokeWidth)}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Main Line */}
      <line
        x1={adjustedStart.x}
        y1={adjustedStart.y}
        x2={adjustedEnd.x}
        y2={adjustedEnd.y}
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
            cx={adjustedStart.x}
            cy={adjustedStart.y}
            r={hoveredHandle === 'start' || mode === 'resizing' ? 7 : 6}
            fill={hoveredHandle === 'start' || mode === 'resizing' ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={2}
            style={{
              pointerEvents: 'all',
              cursor: handleCursor,
              transition: 'all 0.15s ease',
            }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'start')}
            onMouseEnter={() => setHoveredHandle('start')}
            onMouseLeave={() => setHoveredHandle(null)}
          />

          {/* End Handle */}
          <circle
            cx={adjustedEnd.x}
            cy={adjustedEnd.y}
            r={hoveredHandle === 'end' || mode === 'resizing' ? 7 : 6}
            fill={hoveredHandle === 'end' || mode === 'resizing' ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={2}
            style={{
              pointerEvents: 'all',
              cursor: handleCursor,
              transition: 'all 0.15s ease',
            }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'end')}
            onMouseEnter={() => setHoveredHandle('end')}
            onMouseLeave={() => setHoveredHandle(null)}
          />

          {/* Snap indicator */}
          {isShiftPressed && mode === 'resizing' && (
            <text
              x={(adjustedStart.x + adjustedEnd.x) / 2}
              y={(adjustedStart.y + adjustedEnd.y) / 2 - 25}
              fill="#10b981"
              fontSize="11"
              fontFamily="Inter, system-ui"
              fontWeight="600"
              textAnchor="middle"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              ⇄ SNAP: {Math.round(angle)}°
            </text>
          )}

          {/* Length & angle indicator */}
          <text
            x={(adjustedStart.x + adjustedEnd.x) / 2}
            y={(adjustedStart.y + adjustedEnd.y) / 2 - 10}
            fill="#3b82f6"
            fontSize="12"
            fontFamily="Inter, system-ui"
            textAnchor="middle"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {Math.round(length)}px @ {Math.round(angle)}°
          </text>
        </>
      )}

      {/* Locked indicator */}
      {isLocked && isSelected && (
        <text
          x={(adjustedStart.x + adjustedEnd.x) / 2}
          y={(adjustedStart.y + adjustedEnd.y) / 2 - 10}
          fill="#ef4444"
          fontSize="11"
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

/**
 * FigmaCanvas V2 - Canvas completo com TODAS as funcionalidades
 * Incluindo resize completo (ETAPA 8)
 */

import { type FC, useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { Position, Size } from '../../types/editor';
import {
  viewportToCanvas,
  canvasToViewport,
  pointInBounds,
  snapPositionToGrid,
  maintainAspectRatio,
  calculateIntersection,
} from '../../utils/canvasHelpers';
import {
  findTopElementAtPoint,
  reparent,
  getTopLevelElements,
  sortByZIndex,
} from '../../utils/hierarchyHelpers';
import { ElementRenderer } from './ElementRenderer';

const DRAG_THRESHOLD = 3;
const MIN_SIZE = 10;
const CONTAINER_THRESHOLD = 50;

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface SelectionState {
  elementIds: string[];
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  dragStart: Position | null;
  initialPositions: Map<string, Position>;
  initialSize: Size | null;
  initialPosition: Position | null;
}

export const FigmaCanvasV2: FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    pages,
    currentPageId,
    zoom,
    setZoom,
    gridVisible,
    snapToGrid: snapEnabled,
    gridSize,
    selectedElementIds,
    setSelectedElement,
    selectMultipleElements,
    toggleSelectElement,
    clearSelection,
    updateElement,
    addElement,
    activeTool,
    setActiveTool,
    interactionMode,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);
  const elements = currentPage?.elements || [];

  const [pan, setPan] = useState<Position>({ x: 400, y: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [selection, setSelection] = useState<SelectionState>({
    elementIds: selectedElementIds,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragStart: null,
    initialPositions: new Map(),
    initialSize: null,
    initialPosition: null,
  });

  // Sincronizar seleção do store com estado local
  useEffect(() => {
    setSelection(prev => ({ ...prev, elementIds: selectedElementIds }));
  }, [selectedElementIds]);
  const [marquee, setMarquee] = useState<{ start: Position | null; current: Position | null }>({
    start: null,
    current: null,
  });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [potentialContainer, setPotentialContainer] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Estado para congelar wrappers durante resize de linhas
  const [frozenWrappers, setFrozenWrappers] = useState<Map<string, { left: number; top: number; width: number; height: number }>>(new Map());

  // 🔒 Estado para BLOQUEAR position durante resize (ABSOLUTO - NÃO PODE MOVER)
  const [lockedPositions, setLockedPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Estado para criação de linha
  const [lineCreation, setLineCreation] = useState<{
    isCreating: boolean;
    startPos: Position | null;
    currentPos: Position | null;
  }>({
    isCreating: false,
    startPos: null,
    currentPos: null,
  });

  // Estado de modo de interação para evitar conflitos
  type InteractionMode = 'idle' | 'panning' | 'dragging' | 'resizing' | 'marquee' | 'creating-line';
  const [mode, setMode] = useState<InteractionMode>('idle');

  // DragOverlay - Preview instantâneo sem re-render
  const [dragPreview, setDragPreview] = useState<{
    elementIds: string[];
    offset: Position;
    currentPointer: Position;
  } | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<Position | null>(null);

  const zoomDecimal = zoom / 100;

  // RAF Loop para drag suave
  useEffect(() => {
    if (!dragPreview) return;

    const updateDragPreview = () => {
      if (lastPointerPosRef.current) {
        setDragPreview(prev =>
          prev ? { ...prev, currentPointer: lastPointerPosRef.current! } : null
        );
      }
      rafIdRef.current = requestAnimationFrame(updateDragPreview);
    };

    rafIdRef.current = requestAnimationFrame(updateDragPreview);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [!!dragPreview]);

  // GESTO 1: Pan temporário com Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Callback para congelar/descongelar wrapper durante resize de linha
  const handleLineResizeStateChange = useCallback((elementId: string, isResizing: boolean) => {
    if (isResizing) {
      // CONGELAR: calcular e salvar wrapper atual + BLOQUEAR POSITION
      const element = elements.find(el => el.id === elementId);
      if (element?.type === 'line' && element.lineData) {
        const padding = 20;
        const { start, end } = element.lineData;

        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        const frozenWrapper = {
          left: element.position.x + minX - padding,
          top: element.position.y + minY - padding,
          width: (maxX - minX) + (padding * 2),
          height: (maxY - minY) + (padding * 2),
        };

        console.log('🔒 [WRAPPER FROZEN + POSITION LOCKED]', {
          elementId,
          frozenWrapper,
          elementPosition: element.position,
          lineData: { start, end },
        });

        setFrozenWrappers(prev => new Map(prev).set(elementId, frozenWrapper));

        // ⚡ BLOQUEAR POSITION - Salvar position atual como ABSOLUTAMENTE IMUTÁVEL
        setLockedPositions(prev => new Map(prev).set(elementId, { ...element.position }));
      }
    } else {
      // DESCONGELAR: remover wrapper salvo + DESBLOQUEAR POSITION
      console.log('🔓 [WRAPPER UNFROZEN + POSITION UNLOCKED]', { elementId });
      setFrozenWrappers(prev => {
        const newMap = new Map(prev);
        newMap.delete(elementId);
        return newMap;
      });

      // ⚡ DESBLOQUEAR POSITION
      setLockedPositions(prev => {
        const newMap = new Map(prev);
        newMap.delete(elementId);
        return newMap;
      });
    }
  }, [elements]);

  // ⚡ FORÇAR position travada - Se element.position tentar mudar durante resize, FORCE de volta
  useEffect(() => {
    lockedPositions.forEach((lockedPos, elementId) => {
      const element = elements.find(el => el.id === elementId);
      if (element) {
        // Se a position atual for diferente da travada, FORCE de volta
        if (element.position.x !== lockedPos.x || element.position.y !== lockedPos.y) {
          console.log('⚠️ [POSITION FORCED BACK]', {
            elementId,
            attempted: element.position,
            forcedTo: lockedPos,
          });
          updateElement(elementId, { position: lockedPos });
        }
      }
    });
  }, [elements, lockedPositions, updateElement]);

  // GESTO 2: Pan com scroll/trackpad (2 dedos)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Ctrl/Cmd + Scroll = Zoom
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY;
        const zoomChange = delta > 0 ? 5 : -5;
        const newZoom = Math.max(25, Math.min(200, zoom + zoomChange));
        setZoom(newZoom);
      } else {
        // Scroll normal = Pan
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom]);

  // Helper: Criar elemento
  const createElementAtPosition = (position: Position) => {
    const elementData: any = {
      type: 'shape-rectangle',
      position,
      size: { width: 200, height: 150 },
      style: {
        backgroundColor: '#f6f3f4',
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '#000000',
      },
      visible: true,
      locked: false,
    };

    switch (activeTool) {
      case 'circle':
        elementData.type = 'shape-circle';
        elementData.size = { width: 150, height: 150 };
        break;
      case 'text':
        elementData.type = 'text-paragraph';
        elementData.size = { width: 300, height: 100 };
        elementData.content = { text: 'Digite seu texto' };
        elementData.style = { fontSize: 16, textColor: '#1F2937' };
        break;
      case 'image':
        elementData.type = 'image';
        elementData.size = { width: 300, height: 200 };
        elementData.imageData = {
          src: 'https://placehold.co/300x200/e2e8f0/64748b?text=Nova+Imagem', // Placeholder temporário
          alt: 'Nova imagem',
          opacity: 1,
          borderRadius: 0,
          objectFit: 'cover' as const,
          aspectRatioLocked: true,
          originalWidth: 300,
          originalHeight: 200,
          loadingState: 'loaded' as const,
        };
        elementData.style = {
          backgroundColor: 'transparent',
        };
        break;
    }

    addElement(elementData);
    setActiveTool('select');
  };

  // ETAPA 8: Handle resize
  const handleResizeHandlePointerDown = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      if (selectedElementIds.length !== 1) return;

      const element = elements.find((el) => el.id === selectedElementIds[0]);
      if (!element) return;

      setMode('resizing');
      setSelection((prev) => ({
        ...prev,
        isResizing: true,
        resizeHandle: handle,
        dragStart: { x: e.clientX, y: e.clientY },
        initialSize: { ...element.size },
        initialPosition: { ...element.position },
      }));
    },
    [selectedElementIds, elements]
  );


  // Canvas pointer down
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      console.log('[FigmaCanvasV2] 🖱️ handleCanvasPointerDown - activeTool:', activeTool, 'interactionMode:', interactionMode);

      if (e.button !== 0) return;

      // Capturar pointer events para não perder eventos fora do canvas
      e.currentTarget.setPointerCapture(e.pointerId);

      const canvasPos = viewportToCanvas(e.clientX, e.clientY, pan, zoomDecimal);

      // GESTO: Pan temporário com Space + Drag
      if (isSpacePressed) {
        setMode('panning');
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Pan (modo dedicado - será removido)
      if (interactionMode === 'pan') {
        setMode('panning');
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Criar linha com click+drag
      if (activeTool === 'line') {
        setMode('creating-line');
        setLineCreation({
          isCreating: true,
          startPos: canvasPos,
          currentPos: canvasPos,
        });
        return;
      }

      // Criar outros elementos
      if (activeTool !== 'select' && activeTool !== 'move') {
        createElementAtPosition(canvasPos);
        return;
      }

      // Hit test
      const clickedElement = findTopElementAtPoint(canvasPos, elements, zoomDecimal);
      console.log('[FigmaCanvasV2] === CLICK DEBUG ===');
      console.log('[FigmaCanvasV2] Canvas position:', canvasPos);
      console.log('[FigmaCanvasV2] Elements count:', elements.length);
      console.log('[FigmaCanvasV2] Clicked element:', clickedElement);
      console.log('[FigmaCanvasV2] Current selectedElementIds:', selectedElementIds);

      if (clickedElement) {
        console.log('[FigmaCanvasV2] ✅ Element clicked! Type:', clickedElement.type, 'ID:', clickedElement.id);
        if (e.shiftKey) {
          console.log('[FigmaCanvasV2] Shift key pressed, toggling selection');
          toggleSelectElement(clickedElement.id);
        } else {
          // Determinar quais elementos serão arrastados
          const elementsToDrag = selectedElementIds.includes(clickedElement.id)
            ? selectedElementIds
            : [clickedElement.id];

          // Se não estava selecionado, selecionar agora
          if (!selectedElementIds.includes(clickedElement.id)) {
            console.log('[FigmaCanvasV2] 🔵 Element not selected, calling setSelectedElement with:', clickedElement.id);
            setSelectedElement(clickedElement.id);
            console.log('[FigmaCanvasV2] setSelectedElement called, waiting for state update...');
          } else {
            console.log('[FigmaCanvasV2] Element already selected');
          }

          setSelection((prev) => ({
            ...prev,
            dragStart: canvasPos,
            initialPositions: new Map(
              elementsToDrag.map((id) => {
                const el = elements.find((e) => e.id === id);
                return [id, el ? { ...el.position } : { x: 0, y: 0 }];
              })
            ),
          }));
        }
      } else {
        if (e.shiftKey) {
          setMode('marquee');
          setMarquee({ start: { x: e.clientX, y: e.clientY }, current: { x: e.clientX, y: e.clientY } });
        } else {
          setSelectedElement(null);
        }
      }
    },
    [pan, zoomDecimal, elements, selectedElementIds, activeTool, interactionMode, isSpacePressed]
  );

  // Pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvasPos = viewportToCanvas(e.clientX, e.clientY, pan, zoomDecimal);

      // Criação de linha
      if (mode === 'creating-line' && lineCreation.isCreating && lineCreation.startPos) {
        let endPos = canvasPos;

        // Shift: travar ângulos em incrementos de 45°
        if (e.shiftKey) {
          const dx = canvasPos.x - lineCreation.startPos.x;
          const dy = canvasPos.y - lineCreation.startPos.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          // Arredondar para o ângulo mais próximo (0, 45, 90, 135, 180, -45, -90, -135)
          const snapAngle = Math.round(angle / 45) * 45;
          const distance = Math.hypot(dx, dy);

          endPos = {
            x: lineCreation.startPos.x + Math.cos(snapAngle * Math.PI / 180) * distance,
            y: lineCreation.startPos.y + Math.sin(snapAngle * Math.PI / 180) * distance,
          };
        }

        setLineCreation(prev => ({ ...prev, currentPos: endPos }));
        return;
      }

      // Panning - NUNCA executa lógica de drag de elemento
      if (mode === 'panning' || isPanning) {
        setPan((prev) => ({
          x: prev.x + (e.clientX - panStart.x),
          y: prev.y + (e.clientY - panStart.y),
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // ETAPA 8: Resizing (apenas para elementos normais, não linhas)
      // Linhas usam seu próprio sistema de resize via handles circulares
      if (selection.isResizing && selection.resizeHandle && selection.initialSize && selection.initialPosition) {
        const deltaX = e.clientX - (selection.dragStart?.x || 0);
        const deltaY = e.clientY - (selection.dragStart?.y || 0);
        const deltaCanvasX = deltaX / zoomDecimal;
        const deltaCanvasY = deltaY / zoomDecimal;

        let newWidth = selection.initialSize.width;
        let newHeight = selection.initialSize.height;
        let newX = selection.initialPosition.x;
        let newY = selection.initialPosition.y;

        const handle = selection.resizeHandle;

        // Calcular novo tamanho baseado no handle
        if (handle.includes('e')) newWidth = Math.max(MIN_SIZE, selection.initialSize.width + deltaCanvasX);
        if (handle.includes('w')) {
          newWidth = Math.max(MIN_SIZE, selection.initialSize.width - deltaCanvasX);
          newX = selection.initialPosition.x + selection.initialSize.width - newWidth;
        }
        if (handle.includes('s')) newHeight = Math.max(MIN_SIZE, selection.initialSize.height + deltaCanvasY);
        if (handle.includes('n')) {
          newHeight = Math.max(MIN_SIZE, selection.initialSize.height - deltaCanvasY);
          newY = selection.initialPosition.y + selection.initialSize.height - newHeight;
        }

        // ETAPA 8: Shift para manter proporção
        if (e.shiftKey) {
          const aspectRatioSize = maintainAspectRatio(
            newWidth,
            newHeight,
            selection.initialSize.width,
            selection.initialSize.height,
            true
          );
          newWidth = aspectRatioSize.width;
          newHeight = aspectRatioSize.height;
        }

        updateElement(selectedElementIds[0], {
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        });
        return;
      }

      // Marquee
      if (marquee.start) {
        setMarquee((prev) => ({ ...prev, current: { x: e.clientX, y: e.clientY } }));
        return;
      }

      // Dragging - Preview com RAF (sem updateElement)
      if (selection.dragStart && !selection.isDragging) {
        const distance = Math.hypot(canvasPos.x - selection.dragStart.x, canvasPos.y - selection.dragStart.y);
        if (distance > DRAG_THRESHOLD) {
          setMode('dragging');
          setSelection((prev) => ({ ...prev, isDragging: true }));

          // Iniciar DragPreview
          setDragPreview({
            elementIds: selectedElementIds,
            offset: {
              x: canvasPos.x - selection.dragStart.x,
              y: canvasPos.y - selection.dragStart.y,
            },
            currentPointer: { x: e.clientX, y: e.clientY },
          });
        }
      }

      if (selection.isDragging && selection.dragStart) {
        // Apenas atualizar posição do ponteiro (RAF vai aplicar o transform)
        lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

        // Container detection (apenas visual, não move elemento)
        const dx = canvasPos.x - selection.dragStart.x;
        const dy = canvasPos.y - selection.dragStart.y;

        if (selectedElementIds.length === 1) {
          const draggedEl = elements.find((el) => el.id === selectedElementIds[0]);
          if (draggedEl) {
            const newPos = snapPositionToGrid(
              {
                x: (selection.initialPositions.get(selectedElementIds[0])?.x || 0) + dx,
                y: (selection.initialPositions.get(selectedElementIds[0])?.y || 0) + dy,
              },
              gridSize,
              snapEnabled
            );

            const draggedBounds = {
              x: newPos.x,
              y: newPos.y,
              width: draggedEl.size.width,
              height: draggedEl.size.height,
            };

            let bestContainer: string | null = null;
            let maxIntersection = 0;

            elements.forEach((el) => {
              if (el.id === draggedEl.id || selectedElementIds.includes(el.id)) return;

              const containerBounds = {
                x: el.position.x,
                y: el.position.y,
                width: el.size.width,
                height: el.size.height,
              };
              const intersection = calculateIntersection(draggedBounds, containerBounds);

              if (intersection >= CONTAINER_THRESHOLD && intersection > maxIntersection) {
                maxIntersection = intersection;
                bestContainer = el.id;
              }
            });

            setPotentialContainer(bestContainer);
          }
        }
      }

      // Hover
      const hoveredEl = findTopElementAtPoint(canvasPos, elements, zoomDecimal);
      setHoveredElementId(hoveredEl?.id || null);
    },
    [pan, zoomDecimal, isPanning, panStart, marquee, selection, selectedElementIds, elements]
  );

  // Pointer up
  const handlePointerUp = useCallback(() => {
    // Finalizar criação de linha
    if (mode === 'creating-line' && lineCreation.isCreating && lineCreation.startPos && lineCreation.currentPos) {
      const distance = Math.hypot(
        lineCreation.currentPos.x - lineCreation.startPos.x,
        lineCreation.currentPos.y - lineCreation.startPos.y
      );

      // Só criar linha se tiver comprimento mínimo (evitar linhas de 1px acidentais)
      if (distance > 5) {
        // ✅ NOVO: Usar LineData com coordenadas ABSOLUTAS de world
        const newElement = {
          type: 'line',
          position: { x: 0, y: 0 }, // Não usado mais, mas necessário para compatibilidade
          size: { width: 100, height: 100 }, // Não usado mais, mas necessário para compatibilidade
          lineData: {
            // 📍 Coordenadas ABSOLUTAS em world space
            start: { x: lineCreation.startPos.x, y: lineCreation.startPos.y },
            end: { x: lineCreation.currentPos.x, y: lineCreation.currentPos.y },
            // 🎨 Estilo visual
            strokeColor: '#000000',
            strokeWidth: 2,
            opacity: 1,
            style: 'solid' as const,
            cap: 'round' as const,
            startArrow: 'none' as const,
            endArrow: 'none' as const,
          },
          style: {
            opacity: 1,
          },
          visible: true,
          locked: false,
        };

        addElement(newElement as any);
        setActiveTool('select');
      }

      setLineCreation({ isCreating: false, startPos: null, currentPos: null });
      setMode('idle');
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (marquee.start && marquee.current) {
      const box = {
        x: Math.min(marquee.start.x, marquee.current.x),
        y: Math.min(marquee.start.y, marquee.current.y),
        width: Math.abs(marquee.current.x - marquee.start.x),
        height: Math.abs(marquee.current.y - marquee.start.y),
      };

      const selected = elements.filter((el) => {
        const screenPos = canvasToViewport(el.position.x, el.position.y, pan, zoomDecimal);
        return pointInBounds({ x: screenPos.x, y: screenPos.y }, box);
      });

      selectMultipleElements(selected.map((el) => el.id));
      setMarquee({ start: null, current: null });
      return;
    }

    // COMMIT FINAL - Aplicar posições ao soltar
    if (selection.isDragging && selection.dragStart && dragPreview) {
      const canvasStartPos = viewportToCanvas(
        dragPreview.currentPointer.x,
        dragPreview.currentPointer.y,
        pan,
        zoomDecimal
      );
      const dx = canvasStartPos.x - selection.dragStart.x;
      const dy = canvasStartPos.y - selection.dragStart.y;

      // Commit final: atualizar posições no store (uma única vez)
      selectedElementIds.forEach((id) => {
        // ⛔ NÃO atualizar position se elemento está em resize (linha)
        if (frozenWrappers.has(id)) {
          console.log('⛔ [DRAG PREVENTED] Elemento em resize, não atualizar position:', id);
          return;
        }

        const initial = selection.initialPositions.get(id);
        if (initial) {
          const newPos = snapPositionToGrid(
            { x: initial.x + dx, y: initial.y + dy },
            gridSize,
            snapEnabled
          );
          updateElement(id, { position: newPos });
        }
      });

      // Reparenting se necessário
      if (potentialContainer && selectedElementIds.length === 1) {
        const draggedId = selectedElementIds[0];
        const draggedEl = elements.find((el) => el.id === draggedId);

        if (draggedEl && !draggedEl.groupId) {
          const updatedElements = reparent(elements, draggedId, potentialContainer, draggedEl.groupId || null);
          updatedElements.forEach((el) => {
            if (el.id === draggedId || el.id === potentialContainer) {
              updateElement(el.id, el);
            }
          });
        }
      }

      setPotentialContainer(null);
      setDragPreview(null);
      lastPointerPosRef.current = null;
    }

    setSelection((prev) => ({
      ...prev,
      isDragging: false,
      isResizing: false,
      dragStart: null,
      resizeHandle: null,
      initialPositions: new Map(),
      initialSize: null,
      initialPosition: null,
    }));

    // Resetar modo
    setMode('idle');
  }, [mode, isPanning, marquee, selection, potentialContainer, selectedElementIds, elements, pan, zoomDecimal, dragPreview, gridSize, snapEnabled]);

  const renderMarquee = () => {
    if (!marquee.start || !marquee.current) return null;

    const box = {
      x: Math.min(marquee.start.x, marquee.current.x),
      y: Math.min(marquee.start.y, marquee.current.y),
      width: Math.abs(marquee.current.x - marquee.start.x),
      height: Math.abs(marquee.current.y - marquee.start.y),
    };

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
        style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
      />
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full bg-gray-100 relative overflow-hidden ${
        isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        // Converter coordenadas do clique para coordenadas do canvas
        const canvasPos = viewportToCanvas(e.clientX, e.clientY, pan, zoomDecimal);

        // Hit test para encontrar o elemento clicado
        const clickedElement = findTopElementAtPoint(canvasPos, elements, zoomDecimal);

        if (clickedElement) {
          setSelectedElement(clickedElement.id);
        } else {
          clearSelection();
        }
      }}
    >
      {/* VIEWPORT - Área visível do canvas */}
      {/* Grid de fundo (movimenta com pan) */}
      {gridVisible && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
            backgroundSize: `${gridSize * zoomDecimal}px ${gridSize * zoomDecimal}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />
      )}

      {/* WORLD TRANSFORM - Todos os elementos do mundo dentro de um transform único */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomDecimal})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Página/artboard (no world space) */}
        <div
          className="absolute bg-white shadow-lg pointer-events-none"
          style={{ left: 0, top: 0, width: 800, height: 1130 }}
        />

        {/* Elementos (no world space - coordenadas reais) */}
        {sortByZIndex(getTopLevelElements(elements)).map((element) => {
          const isSelected = selectedElementIds.includes(element.id);
          const isHovered = hoveredElementId === element.id;
          const isContainer = potentialContainer === element.id;
          // Linhas e imagens gerenciam próprio drag - não aplicar dragOffset do wrapper
          const isDragging = dragPreview && dragPreview.elementIds.includes(element.id) && element.type !== 'line' && !(element.type === 'image' && element.imageData);

          // Calcular offset de drag para este elemento
          let dragOffset = { x: 0, y: 0 };
          if (isDragging && selection.dragStart && dragPreview) {
            const currentCanvasPos = viewportToCanvas(
              dragPreview.currentPointer.x,
              dragPreview.currentPointer.y,
              pan,
              zoomDecimal
            );
            dragOffset = {
              x: currentCanvasPos.x - selection.dragStart.x,
              y: currentCanvasPos.y - selection.dragStart.y,
            };
          }

          // Calcular dimensões do wrapper baseado no tipo de elemento
          let wrapperStyle = {
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height,
          };

          // Para linhas, calcular bounding box baseado nos pontos start/end
          if (element.type === 'line' && element.lineData) {
            // Se a linha está sendo redimensionada, usar wrapper CONGELADO
            const frozenWrapper = frozenWrappers.get(element.id);
            if (frozenWrapper) {
              console.log('✅ [WRAPPER] Usando FROZEN wrapper:', {
                elementId: element.id,
                frozenWrapper,
                currentLineData: element.lineData,
                currentPosition: element.position,
              });
              wrapperStyle = frozenWrapper;
            } else {
              // Calcular normalmente
              const padding = 20; // Padding para facilitar a seleção
              const { start, end } = element.lineData;

              const minX = Math.min(start.x, end.x);
              const maxX = Math.max(start.x, end.x);
              const minY = Math.min(start.y, end.y);
              const maxY = Math.max(start.y, end.y);

              // ✅ NOVO: Para linhas com coordenadas absolutas, não somar element.position
              // As coordenadas start/end já estão em world space
              wrapperStyle = {
                left: minX - padding,
                top: minY - padding,
                width: (maxX - minX) + (padding * 2),
                height: (maxY - minY) + (padding * 2),
              };
            }
          }

          return (
            <div
              key={element.id}
              className={`
                absolute transition-all duration-150
                ${isSelected && !isDragging ? 'animate-select-pulse' : ''}
                ${isContainer ? 'ring-2 ring-green-500 ring-opacity-60' : ''}
              `}
              style={{
                left: wrapperStyle.left,
                top: wrapperStyle.top,
                width: wrapperStyle.width,
                height: wrapperStyle.height,
                // CAMADA 1: Outline persistente e clara para selecionados (não mostrar para linhas e imagens)
                outline: (element.type === 'line' || (element.type === 'image' && element.imageData))
                  ? 'none'
                  : isSelected
                    ? '2px solid #3b82f6'
                    : isHovered
                      ? '1px solid #93c5fd'
                      : 'none',
                outlineOffset: '-1px',
                // Linhas: pointerEvents none (LineFigma usa SVG que cobre tudo)
                // Imagens: pointerEvents auto MAS sem handlers no wrapper (ImageFigma gerencia)
                // Outros: pointerEvents auto com handlers normais
                pointerEvents: element.type === 'line'
                  ? 'none'
                  : 'auto',
                cursor: (element.type === 'line' || (element.type === 'image' && element.imageData))
                  ? 'default'
                  : isSelected
                    ? (selection.isDragging ? 'grabbing' : 'grab')
                    : 'pointer',
                // Aplicar transform durante drag (GPU accelerated)
                transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
                transition: isDragging ? 'none' : 'transform 150ms',
                willChange: isDragging ? 'transform' : 'auto',
              }}
              // 🎯 Para imagens com imageData: bloquear propagação de eventos para o canvas
              onPointerDown={(element.type === 'image' && element.imageData) ? (e) => {
                console.log('[FigmaCanvasV2] Wrapper interceptou pointerDown na imagem, bloqueando propagação');
                e.stopPropagation();
              } : undefined}
            >
              <ElementRenderer
                element={element}
                isPDF={false}
                isSelected={isSelected}
                onResizeStateChange={handleLineResizeStateChange}
                camera={{ x: pan.x, y: pan.y, zoom }}
                viewportRect={
                  canvasRef.current
                    ? {
                        left: canvasRef.current.getBoundingClientRect().left,
                        top: canvasRef.current.getBoundingClientRect().top,
                        width: canvasRef.current.getBoundingClientRect().width,
                        height: canvasRef.current.getBoundingClientRect().height,
                      }
                    : { left: 0, top: 0, width: 0, height: 0 }
                }
              />

              {/* CAMADA 1: Handles de resize - para selecionados */}
              {/* Handles para elementos normais (não linhas nem imagens com imageData) */}
              {isSelected && selectedElementIds.length === 1 && !selection.isResizing && element.type !== 'line' && !(element.type === 'image' && element.imageData) && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner handles */}
                  <div
                    className="resize-handle absolute -top-1 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'nw')}
                  />
                  <div
                    className="resize-handle absolute -top-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'ne')}
                  />
                  <div
                    className="resize-handle absolute -bottom-1 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'sw')}
                  />
                  <div
                    className="resize-handle absolute -bottom-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'se')}
                  />

                  {/* Side handles */}
                  <div
                    className="resize-handle absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-ns-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'n')}
                  />
                  <div
                    className="resize-handle absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-ns-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 's')}
                  />
                  <div
                    className="resize-handle absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-ew-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'w')}
                  />
                  <div
                    className="resize-handle absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-sm pointer-events-auto cursor-ew-resize animate-handle-appear"
                    onPointerDown={(e) => handleResizeHandlePointerDown(e, 'e')}
                  />
                </div>
              )}

              {/* Linhas usam seus próprios handles circulares do componente Line.tsx */}
            </div>
          );
        })}
      </div>

      {/* Preview de linha durante criação */}
      {lineCreation.isCreating && lineCreation.startPos && lineCreation.currentPos && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomDecimal})`,
            transformOrigin: '0 0',
          }}
        >
          <line
            x1={lineCreation.startPos.x}
            y1={lineCreation.startPos.y}
            x2={lineCreation.currentPos.x}
            y2={lineCreation.currentPos.y}
            stroke="#3b82f6"
            strokeWidth={2 / zoomDecimal}
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* Endpoint markers */}
          <circle
            cx={lineCreation.startPos.x}
            cy={lineCreation.startPos.y}
            r={4 / zoomDecimal}
            fill="#3b82f6"
            opacity={0.5}
          />
          <circle
            cx={lineCreation.currentPos.x}
            cy={lineCreation.currentPos.y}
            r={4 / zoomDecimal}
            fill="#3b82f6"
            opacity={0.5}
          />
        </svg>
      )}

      {/* Marquee - fora do world transform (viewport space) */}
      {renderMarquee()}
    </div>
  );
};

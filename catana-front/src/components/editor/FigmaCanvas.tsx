/**
 * FigmaCanvas - Canvas estilo Figma com interações profissionais
 * Implementa todas as 12 etapas do roadmap
 */

import { type FC, useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { CatalogElement, Position, Size } from '../../types/editor';
import {
  viewportToCanvas,
  canvasToViewport,
  getElementBounds,
  getCombinedBounds,
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

// Constantes
const DRAG_THRESHOLD = 3; // pixels
const MIN_SIZE = 10; // tamanho mínimo para resize
const CONTAINER_THRESHOLD = 50; // % de interseção para considerar container

type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

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

interface MarqueeState {
  start: Position | null;
  current: Position | null;
}

export const FigmaCanvas: FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    pages,
    currentPageId,
    zoom,
    gridVisible,
    snapToGrid: snapEnabled,
    gridSize,
    selectedElementIds,
    setSelectedElement,
    selectMultipleElements,
    toggleSelectElement,
    updateElement,
    addElement,
    deleteElement,
    groupElements,
    ungroupElements,
    activeTool,
    setActiveTool,
    interactionMode,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);
  const elements = currentPage?.elements || [];

  // Estados locais
  const [pan, setPan] = useState<Position>({ x: 400, y: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  const [selection, setSelection] = useState<SelectionState>({
    elementIds: [],
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragStart: null,
    initialPositions: new Map(),
    initialSize: null,
    initialPosition: null,
  });

  const [marquee, setMarquee] = useState<MarqueeState>({
    start: null,
    current: null,
  });

  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [potentialContainer, setPotentialContainer] = useState<string | null>(null);

  const zoomDecimal = zoom / 100;

  // Sincronizar seleção com store
  useEffect(() => {
    if (JSON.stringify(selection.elementIds.sort()) !== JSON.stringify(selectedElementIds.sort())) {
      setSelection((prev) => ({ ...prev, elementIds: selectedElementIds }));
    }
  }, [selectedElementIds]);

  // ETAPA 3 & 4: Seleção e Multi-seleção
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return; // Apenas botão esquerdo

      const canvasPos = viewportToCanvas(e.clientX, e.clientY, pan, zoomDecimal);

      // Pan com espaço ou modo pan
      if (e.code === 'Space' || interactionMode === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Criar elemento com ferramenta ativa
      if (activeTool !== 'select' && activeTool !== 'move') {
        createElementAtPosition(canvasPos);
        return;
      }

      // Hit test
      const clickedElement = findTopElementAtPoint(canvasPos, elements, zoomDecimal);

      if (clickedElement) {
        // ETAPA 4: Multi-seleção com Shift
        if (e.shiftKey) {
          toggleSelectElement(clickedElement.id);
        } else {
          if (!selectedElementIds.includes(clickedElement.id)) {
            setSelectedElement(clickedElement.id);
          }
          // Preparar para drag
          setSelection((prev) => ({
            ...prev,
            dragStart: canvasPos,
            initialPositions: new Map(
              selectedElementIds.map((id) => {
                const el = elements.find((e) => e.id === id);
                return [id, el ? { ...el.position } : { x: 0, y: 0 }];
              })
            ),
          }));
        }
      } else {
        // ETAPA 4: Marquee selection
        if (e.shiftKey) {
          setMarquee({
            start: { x: e.clientX, y: e.clientY },
            current: { x: e.clientX, y: e.clientY },
          });
        } else {
          setSelectedElement(null);
        }
      }
    },
    [pan, zoomDecimal, elements, selectedElementIds, activeTool, interactionMode]
  );

  // ETAPA 5: Drag & Move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvasPos = viewportToCanvas(e.clientX, e.clientY, pan, zoomDecimal);

      // Panning
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Marquee selection
      if (marquee.start) {
        setMarquee((prev) => ({
          ...prev,
          current: { x: e.clientX, y: e.clientY },
        }));
        return;
      }

      // Dragging
      if (selection.dragStart && !selection.isDragging) {
        const distance = Math.hypot(
          canvasPos.x - selection.dragStart.x,
          canvasPos.y - selection.dragStart.y
        );

        // ETAPA 5: Threshold anti-acidente
        if (distance > DRAG_THRESHOLD) {
          setSelection((prev) => ({ ...prev, isDragging: true }));
        }
      }

      if (selection.isDragging && selection.dragStart) {
        const dx = canvasPos.x - selection.dragStart.x;
        const dy = canvasPos.y - selection.dragStart.y;

        // ETAPA 6: Detectar containers potenciais
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

            // Encontrar container potencial
            let bestContainer: string | null = null;
            let maxIntersection = 0;

            elements.forEach((el) => {
              if (
                el.id === draggedEl.id ||
                el.groupId === draggedEl.id ||
                selectedElementIds.includes(el.id)
              ) {
                return;
              }

              const containerBounds = getElementBounds(el.position, el.size);
              const intersection = calculateIntersection(draggedBounds, containerBounds);

              if (intersection >= CONTAINER_THRESHOLD && intersection > maxIntersection) {
                maxIntersection = intersection;
                bestContainer = el.id;
              }
            });

            setPotentialContainer(bestContainer);
          }
        }

        // Atualizar posições
        selectedElementIds.forEach((id) => {
          const initial = selection.initialPositions.get(id);
          if (initial) {
            const newPos = snapPositionToGrid(
              {
                x: initial.x + dx,
                y: initial.y + dy,
              },
              gridSize,
              snapEnabled
            );
            updateElement(id, { position: newPos });
          }
        });
      }

      // Hover feedback
      const hoveredEl = findTopElementAtPoint(canvasPos, elements, zoomDecimal);
      setHoveredElementId(hoveredEl?.id || null);
    },
    [pan, zoomDecimal, isPanning, panStart, marquee, selection, selectedElementIds, elements]
  );

  // ETAPA 5 & 6: Finalizar drag
  const handlePointerUp = useCallback(() => {
    // Finalizar panning
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Finalizar marquee
    if (marquee.start && marquee.current) {
      const marqueeBox = {
        x: Math.min(marquee.start.x, marquee.current.x),
        y: Math.min(marquee.start.y, marquee.current.y),
        width: Math.abs(marquee.current.x - marquee.start.x),
        height: Math.abs(marquee.current.y - marquee.start.y),
      };

      const selected = elements.filter((el) => {
        const screenPos = canvasToViewport(el.position.x, el.position.y, pan, zoomDecimal);
        const screenSize = {
          width: el.size.width * zoomDecimal,
          height: el.size.height * zoomDecimal,
        };

        return pointInBounds(
          { x: screenPos.x + screenSize.width / 2, y: screenPos.y + screenSize.height / 2 },
          marqueeBox
        );
      });

      selectMultipleElements(selected.map((el) => el.id));
      setMarquee({ start: null, current: null });
      return;
    }

    // ETAPA 6: Aplicar container se houver
    if (selection.isDragging && potentialContainer && selectedElementIds.length === 1) {
      const draggedId = selectedElementIds[0];
      const draggedEl = elements.find((el) => el.id === draggedId);

      if (draggedEl && !draggedEl.groupId) {
        // Reparentar
        const updatedElements = reparent(
          elements,
          draggedId,
          potentialContainer,
          draggedEl.groupId || null
        );

        // Atualizar no store
        updatedElements.forEach((el) => {
          if (el.id === draggedId || el.id === potentialContainer) {
            updateElement(el.id, el);
          }
        });
      }
      setPotentialContainer(null);
    }

    // Resetar estado de drag
    setSelection((prev) => ({
      ...prev,
      isDragging: false,
      dragStart: null,
      initialPositions: new Map(),
    }));
  }, [isPanning, marquee, selection, potentialContainer, selectedElementIds, elements, pan, zoomDecimal]);

  // Helper para criar elementos
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
      case 'rectangle':
        // Já configurado acima
        break;
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
    }

    addElement(elementData);
    setActiveTool('select');
  };

  // Renderizar bounding box combinada
  const renderSelectionBox = () => {
    const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));
    if (selectedElements.length === 0) return null;

    const bounds = getCombinedBounds(selectedElements);
    if (!bounds) return null;

    const screenPos = canvasToViewport(bounds.x, bounds.y, pan, zoomDecimal);
    const screenSize = {
      width: bounds.width * zoomDecimal,
      height: bounds.height * zoomDecimal,
    };

    return (
      <div
        className="absolute pointer-events-none border-2 border-blue-500"
        style={{
          left: screenPos.x,
          top: screenPos.y,
          width: screenSize.width,
          height: screenSize.height,
        }}
      >
        {/* ETAPA 8: Resize handles */}
        {selectedElements.length === 1 && (
          <>
            {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandle[]).map((handle) => (
              <div
                key={handle}
                className="absolute w-2 h-2 bg-white border border-blue-500 pointer-events-auto cursor-pointer"
                style={getHandleStyle(handle)}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
    const offset = -4;
    const positions: Record<ResizeHandle, React.CSSProperties> = {
      nw: { top: offset, left: offset, cursor: 'nwse-resize' },
      n: { top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      ne: { top: offset, right: offset, cursor: 'nesw-resize' },
      e: { top: '50%', right: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' },
      se: { bottom: offset, right: offset, cursor: 'nwse-resize' },
      s: { bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      sw: { bottom: offset, left: offset, cursor: 'nesw-resize' },
      w: { top: '50%', left: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    };
    return positions[handle];
  };

  // Renderizar marquee
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
        style={{
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
        }}
      />
    );
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-100 relative overflow-hidden cursor-default"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Grid */}
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

      {/* Page area */}
      <div
        className="absolute bg-white shadow-lg"
        style={{
          left: pan.x,
          top: pan.y,
          width: 800 * zoomDecimal,
          height: 1130 * zoomDecimal,
        }}
      />

      {/* Elements */}
      {sortByZIndex(getTopLevelElements(elements)).map((element) => {
        const screenPos = canvasToViewport(element.position.x, element.position.y, pan, zoomDecimal);
        const isSelected = selectedElementIds.includes(element.id);
        const isHovered = hoveredElementId === element.id;
        const isContainer = potentialContainer === element.id;

        return (
          <div
            key={element.id}
            className={`absolute ${isContainer ? 'ring-2 ring-green-500' : ''}`}
            style={{
              left: screenPos.x,
              top: screenPos.y,
              width: element.size.width * zoomDecimal,
              height: element.size.height * zoomDecimal,
              outline: isHovered && !isSelected ? '1px solid #3b82f6' : 'none',
            }}
          >
            <ElementRenderer element={element} isPDF={false} />
          </div>
        );
      })}

      {/* Selection box */}
      {renderSelectionBox()}

      {/* Marquee */}
      {renderMarquee()}
    </div>
  );
};

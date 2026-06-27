import { type Position, type Size, type CatalogElement } from '../types/editor';
import { type Guide } from '../components/editor/SmartGuides';

export interface SnapResult {
  position: Position;
  guides: Guide[];
}

export const SNAP_THRESHOLD = 8; // pixels

/**
 * Calcula a posição com snap e as guias a serem exibidas
 */
export function calculateSnap(
  element: CatalogElement,
  newPosition: Position,
  allElements: CatalogElement[],
  snapToGrid: boolean,
  gridSize: number
): SnapResult {
  let finalPosition = { ...newPosition };
  const guides: Guide[] = [];

  // Snap to grid
  if (snapToGrid) {
    finalPosition.x = Math.round(finalPosition.x / gridSize) * gridSize;
    finalPosition.y = Math.round(finalPosition.y / gridSize) * gridSize;
  }

  // Snap to other elements
  const otherElements = allElements.filter((el) => el.id !== element.id && el.visible);

  // Calculate edges of the moving element
  const elementEdges = {
    left: finalPosition.x,
    right: finalPosition.x + element.size.width,
    centerX: finalPosition.x + element.size.width / 2,
    top: finalPosition.y,
    bottom: finalPosition.y + element.size.height,
    centerY: finalPosition.y + element.size.height / 2,
  };

  let snappedX = false;
  let snappedY = false;

  // Check for snapping to other elements
  for (const other of otherElements) {
    const otherEdges = {
      left: other.position.x,
      right: other.position.x + other.size.width,
      centerX: other.position.x + other.size.width / 2,
      top: other.position.y,
      bottom: other.position.y + other.size.height,
      centerY: other.position.y + other.size.height / 2,
    };

    // Horizontal snapping
    if (!snappedX) {
      // Left edge to left edge
      if (Math.abs(elementEdges.left - otherEdges.left) < SNAP_THRESHOLD) {
        finalPosition.x = otherEdges.left;
        guides.push({
          type: 'vertical',
          position: otherEdges.left,
          color: '#f59e0b',
          label: 'Alinhar à esquerda',
        });
        snappedX = true;
      }
      // Right edge to right edge
      else if (Math.abs(elementEdges.right - otherEdges.right) < SNAP_THRESHOLD) {
        finalPosition.x = otherEdges.right - element.size.width;
        guides.push({
          type: 'vertical',
          position: otherEdges.right,
          color: '#f59e0b',
          label: 'Alinhar à direita',
        });
        snappedX = true;
      }
      // Left edge to right edge
      else if (Math.abs(elementEdges.left - otherEdges.right) < SNAP_THRESHOLD) {
        finalPosition.x = otherEdges.right;
        guides.push({
          type: 'vertical',
          position: otherEdges.right,
          color: '#10b981',
        });
        snappedX = true;
      }
      // Right edge to left edge
      else if (Math.abs(elementEdges.right - otherEdges.left) < SNAP_THRESHOLD) {
        finalPosition.x = otherEdges.left - element.size.width;
        guides.push({
          type: 'vertical',
          position: otherEdges.left,
          color: '#10b981',
        });
        snappedX = true;
      }
      // Center to center
      else if (Math.abs(elementEdges.centerX - otherEdges.centerX) < SNAP_THRESHOLD) {
        finalPosition.x = otherEdges.centerX - element.size.width / 2;
        guides.push({
          type: 'vertical',
          position: otherEdges.centerX,
          color: '#3b82f6',
          label: 'Centralizar',
        });
        snappedX = true;
      }
    }

    // Vertical snapping
    if (!snappedY) {
      // Top edge to top edge
      if (Math.abs(elementEdges.top - otherEdges.top) < SNAP_THRESHOLD) {
        finalPosition.y = otherEdges.top;
        guides.push({
          type: 'horizontal',
          position: otherEdges.top,
          color: '#f59e0b',
          label: 'Alinhar ao topo',
        });
        snappedY = true;
      }
      // Bottom edge to bottom edge
      else if (Math.abs(elementEdges.bottom - otherEdges.bottom) < SNAP_THRESHOLD) {
        finalPosition.y = otherEdges.bottom - element.size.height;
        guides.push({
          type: 'horizontal',
          position: otherEdges.bottom,
          color: '#f59e0b',
          label: 'Alinhar à base',
        });
        snappedY = true;
      }
      // Top edge to bottom edge
      else if (Math.abs(elementEdges.top - otherEdges.bottom) < SNAP_THRESHOLD) {
        finalPosition.y = otherEdges.bottom;
        guides.push({
          type: 'horizontal',
          position: otherEdges.bottom,
          color: '#10b981',
        });
        snappedY = true;
      }
      // Bottom edge to top edge
      else if (Math.abs(elementEdges.bottom - otherEdges.top) < SNAP_THRESHOLD) {
        finalPosition.y = otherEdges.top - element.size.height;
        guides.push({
          type: 'horizontal',
          position: otherEdges.top,
          color: '#10b981',
        });
        snappedY = true;
      }
      // Center to center
      else if (Math.abs(elementEdges.centerY - otherEdges.centerY) < SNAP_THRESHOLD) {
        finalPosition.y = otherEdges.centerY - element.size.height / 2;
        guides.push({
          type: 'horizontal',
          position: otherEdges.centerY,
          color: '#3b82f6',
          label: 'Centralizar',
        });
        snappedY = true;
      }
    }

    if (snappedX && snappedY) break;
  }

  return { position: finalPosition, guides };
}

/**
 * Calcula o redimensionamento com snap
 */
export function calculateResizeSnap(
  newSize: Size,
  snapToGrid: boolean,
  gridSize: number
): Size {
  if (!snapToGrid) return newSize;

  return {
    width: Math.round(newSize.width / gridSize) * gridSize,
    height: Math.round(newSize.height / gridSize) * gridSize,
  };
}

/**
 * Desenha a grade no canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number,
  color: string = '#e5e7eb'
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

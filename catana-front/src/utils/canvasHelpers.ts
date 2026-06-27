/**
 * Canvas Helpers - Sistema de coordenadas e conversões
 * Parte da ETAPA 1: Fundação do Canvas
 */

import type { Position, Size } from '../types/editor';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Converte coordenadas de viewport para canvas space
 */
export const viewportToCanvas = (
  viewportX: number,
  viewportY: number,
  pan: Position,
  zoom: number
): Position => {
  return {
    x: (viewportX - pan.x) / zoom,
    y: (viewportY - pan.y) / zoom,
  };
};

/**
 * Converte coordenadas de canvas space para viewport
 */
export const canvasToViewport = (
  canvasX: number,
  canvasY: number,
  pan: Position,
  zoom: number
): Position => {
  return {
    x: canvasX * zoom + pan.x,
    y: canvasY * zoom + pan.y,
  };
};

/**
 * Calcula bounding box de um elemento
 */
export const getElementBounds = (position: Position, size: Size): Bounds => {
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
};

/**
 * Calcula bounding box combinada de múltiplos elementos
 */
export const getCombinedBounds = (elements: Array<{ position: Position; size: Size }>): Bounds | null => {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    const bounds = getElementBounds(el.position, el.size);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Verifica se um ponto está dentro de um bounds
 */
export const pointInBounds = (point: Position, bounds: Bounds): boolean => {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
};

/**
 * Calcula interseção entre dois bounds (retorna área em %)
 */
export const calculateIntersection = (bounds1: Bounds, bounds2: Bounds): number => {
  const x1 = Math.max(bounds1.x, bounds2.x);
  const y1 = Math.max(bounds1.y, bounds2.y);
  const x2 = Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
  const y2 = Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersectionArea = (x2 - x1) * (y2 - y1);
  const bounds1Area = bounds1.width * bounds1.height;

  return (intersectionArea / bounds1Area) * 100;
};

/**
 * Verifica se bounds1 está completamente dentro de bounds2
 */
export const isFullyContained = (bounds1: Bounds, bounds2: Bounds): boolean => {
  return (
    bounds1.x >= bounds2.x &&
    bounds1.y >= bounds2.y &&
    bounds1.x + bounds1.width <= bounds2.x + bounds2.width &&
    bounds1.y + bounds1.height <= bounds2.y + bounds2.height
  );
};

/**
 * Snap value to grid
 */
export const snapToGrid = (value: number, gridSize: number, enabled: boolean): number => {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap position to grid
 */
export const snapPositionToGrid = (
  position: Position,
  gridSize: number,
  enabled: boolean
): Position => {
  return {
    x: snapToGrid(position.x, gridSize, enabled),
    y: snapToGrid(position.y, gridSize, enabled),
  };
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Calcula novo tamanho mantendo aspect ratio
 */
export const maintainAspectRatio = (
  newWidth: number,
  newHeight: number,
  originalWidth: number,
  originalHeight: number,
  lockRatio: boolean
): Size => {
  if (!lockRatio) {
    return { width: newWidth, height: newHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  // Usar a maior mudança proporcional
  const widthChange = Math.abs(newWidth - originalWidth);
  const heightChange = Math.abs(newHeight - originalHeight);

  if (widthChange > heightChange) {
    return {
      width: newWidth,
      height: newWidth / aspectRatio,
    };
  } else {
    return {
      width: newHeight * aspectRatio,
      height: newHeight,
    };
  }
};

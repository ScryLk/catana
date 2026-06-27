import { type CatalogElement, type Position } from '../types/editor';

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom';

export type DistributionType =
  | 'horizontal'
  | 'vertical';

/**
 * Alinha múltiplos elementos
 */
export function alignElements(
  elements: CatalogElement[],
  alignType: AlignmentType
): Map<string, Position> {
  if (elements.length < 2) return new Map();

  const updates = new Map<string, Position>();

  switch (alignType) {
    case 'left': {
      const minX = Math.min(...elements.map((el) => el.position.x));
      elements.forEach((el) => {
        updates.set(el.id, { x: minX, y: el.position.y });
      });
      break;
    }

    case 'center': {
      const centerX =
        elements.reduce((sum, el) => sum + el.position.x + el.size.width / 2, 0) /
        elements.length;
      elements.forEach((el) => {
        updates.set(el.id, {
          x: centerX - el.size.width / 2,
          y: el.position.y,
        });
      });
      break;
    }

    case 'right': {
      const maxX = Math.max(...elements.map((el) => el.position.x + el.size.width));
      elements.forEach((el) => {
        updates.set(el.id, {
          x: maxX - el.size.width,
          y: el.position.y,
        });
      });
      break;
    }

    case 'top': {
      const minY = Math.min(...elements.map((el) => el.position.y));
      elements.forEach((el) => {
        updates.set(el.id, { x: el.position.x, y: minY });
      });
      break;
    }

    case 'middle': {
      const centerY =
        elements.reduce((sum, el) => sum + el.position.y + el.size.height / 2, 0) /
        elements.length;
      elements.forEach((el) => {
        updates.set(el.id, {
          x: el.position.x,
          y: centerY - el.size.height / 2,
        });
      });
      break;
    }

    case 'bottom': {
      const maxY = Math.max(...elements.map((el) => el.position.y + el.size.height));
      elements.forEach((el) => {
        updates.set(el.id, {
          x: el.position.x,
          y: maxY - el.size.height,
        });
      });
      break;
    }
  }

  return updates;
}

/**
 * Distribui elementos uniformemente
 */
export function distributeElements(
  elements: CatalogElement[],
  distributionType: DistributionType
): Map<string, Position> {
  if (elements.length < 3) return new Map();

  const updates = new Map<string, Position>();
  const sorted = [...elements];

  if (distributionType === 'horizontal') {
    // Sort by X position
    sorted.sort((a, b) => a.position.x - b.position.x);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalWidth = sorted.reduce((sum, el) => sum + el.size.width, 0);
    const availableSpace =
      last.position.x + last.size.width - first.position.x - totalWidth;
    const spacing = availableSpace / (sorted.length - 1);

    let currentX = first.position.x + first.size.width + spacing;

    for (let i = 1; i < sorted.length - 1; i++) {
      const el = sorted[i];
      updates.set(el.id, {
        x: currentX,
        y: el.position.y,
      });
      currentX += el.size.width + spacing;
    }
  } else {
    // Sort by Y position
    sorted.sort((a, b) => a.position.y - b.position.y);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalHeight = sorted.reduce((sum, el) => sum + el.size.height, 0);
    const availableSpace =
      last.position.y + last.size.height - first.position.y - totalHeight;
    const spacing = availableSpace / (sorted.length - 1);

    let currentY = first.position.y + first.size.height + spacing;

    for (let i = 1; i < sorted.length - 1; i++) {
      const el = sorted[i];
      updates.set(el.id, {
        x: el.position.x,
        y: currentY,
      });
      currentY += el.size.height + spacing;
    }
  }

  return updates;
}

/**
 * Centraliza elementos no canvas
 */
export function centerInCanvas(
  elements: CatalogElement[],
  canvasWidth: number,
  canvasHeight: number
): Map<string, Position> {
  if (elements.length === 0) return new Map();

  const updates = new Map<string, Position>();

  // Calculate bounding box of all elements
  const minX = Math.min(...elements.map((el) => el.position.x));
  const maxX = Math.max(...elements.map((el) => el.position.x + el.size.width));
  const minY = Math.min(...elements.map((el) => el.position.y));
  const maxY = Math.max(...elements.map((el) => el.position.y + el.size.height));

  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;

  // Calculate offset to center
  const offsetX = (canvasWidth - groupWidth) / 2 - minX;
  const offsetY = (canvasHeight - groupHeight) / 2 - minY;

  elements.forEach((el) => {
    updates.set(el.id, {
      x: el.position.x + offsetX,
      y: el.position.y + offsetY,
    });
  });

  return updates;
}

/**
 * Iguala dimensões dos elementos
 */
export function matchSize(
  elements: CatalogElement[],
  dimension: 'width' | 'height' | 'both',
  referenceElement?: CatalogElement
): Map<string, { width: number; height: number }> {
  if (elements.length < 2) return new Map();

  const updates = new Map<string, { width: number; height: number }>();
  const reference = referenceElement || elements[0];

  elements.forEach((el) => {
    if (el.id === reference.id) return;

    const newSize = { ...el.size };

    if (dimension === 'width' || dimension === 'both') {
      newSize.width = reference.size.width;
    }
    if (dimension === 'height' || dimension === 'both') {
      newSize.height = reference.size.height;
    }

    updates.set(el.id, newSize);
  });

  return updates;
}

/**
 * Organiza elementos em grade
 */
export function arrangeInGrid(
  elements: CatalogElement[],
  columns: number,
  spacing: number
): Map<string, Position> {
  if (elements.length === 0) return new Map();

  const updates = new Map<string, Position>();
  const sorted = [...elements].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });

  const startX = Math.min(...sorted.map((el) => el.position.x));
  const startY = Math.min(...sorted.map((el) => el.position.y));

  // Calculate column width (use the widest element)
  const columnWidth = Math.max(...sorted.map((el) => el.size.width));

  sorted.forEach((el, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = startX + col * (columnWidth + spacing);
    const y = startY + row * (el.size.height + spacing);

    updates.set(el.id, { x, y });
  });

  return updates;
}

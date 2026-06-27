import type { CatalogElement } from '../types/editor';
import type { Guide } from '../components/editor/SmartGuides';

export interface AlignmentGuide extends Guide {
  snapPosition?: number;
}

const SNAP_THRESHOLD = 8; // pixels

export const calculateAlignmentGuides = (
  movingElement: CatalogElement,
  allElements: CatalogElement[],
  zoom: number = 1
): AlignmentGuide[] => {
  const guides: AlignmentGuide[] = [];
  const threshold = SNAP_THRESHOLD / zoom;

  // Get bounds of moving element
  const movingBounds = {
    left: movingElement.position.x,
    right: movingElement.position.x + movingElement.size.width,
    top: movingElement.position.y,
    bottom: movingElement.position.y + movingElement.size.height,
    centerX: movingElement.position.x + movingElement.size.width / 2,
    centerY: movingElement.position.y + movingElement.size.height / 2,
  };

  // Check alignment with other elements
  allElements.forEach((element) => {
    // Skip the moving element itself and elements in the same group
    if (element.id === movingElement.id || element.groupId === movingElement.id) {
      return;
    }

    // Skip if element is hidden or locked
    if (element.visible === false || element.locked) {
      return;
    }

    const bounds = {
      left: element.position.x,
      right: element.position.x + element.size.width,
      top: element.position.y,
      bottom: element.position.y + element.size.height,
      centerX: element.position.x + element.size.width / 2,
      centerY: element.position.y + element.size.height / 2,
    };

    // Vertical alignment guides (left, center, right)
    // Left edges align
    if (Math.abs(movingBounds.left - bounds.left) < threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.left,
        color: '#f59e0b',
        snapPosition: bounds.left,
      });
    }

    // Right edges align
    if (Math.abs(movingBounds.right - bounds.right) < threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.right,
        color: '#f59e0b',
        snapPosition: bounds.right - movingElement.size.width,
      });
    }

    // Centers align (vertical)
    if (Math.abs(movingBounds.centerX - bounds.centerX) < threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.centerX,
        color: '#8b5cf6',
        snapPosition: bounds.centerX - movingElement.size.width / 2,
      });
    }

    // Moving left edge aligns with target right edge
    if (Math.abs(movingBounds.left - bounds.right) < threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.right,
        color: '#10b981',
        snapPosition: bounds.right,
      });
    }

    // Moving right edge aligns with target left edge
    if (Math.abs(movingBounds.right - bounds.left) < threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.left,
        color: '#10b981',
        snapPosition: bounds.left - movingElement.size.width,
      });
    }

    // Horizontal alignment guides (top, middle, bottom)
    // Top edges align
    if (Math.abs(movingBounds.top - bounds.top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.top,
        color: '#f59e0b',
        snapPosition: bounds.top,
      });
    }

    // Bottom edges align
    if (Math.abs(movingBounds.bottom - bounds.bottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.bottom,
        color: '#f59e0b',
        snapPosition: bounds.bottom - movingElement.size.height,
      });
    }

    // Centers align (horizontal)
    if (Math.abs(movingBounds.centerY - bounds.centerY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.centerY,
        color: '#8b5cf6',
        snapPosition: bounds.centerY - movingElement.size.height / 2,
      });
    }

    // Moving top edge aligns with target bottom edge
    if (Math.abs(movingBounds.top - bounds.bottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.bottom,
        color: '#10b981',
        snapPosition: bounds.bottom,
      });
    }

    // Moving bottom edge aligns with target top edge
    if (Math.abs(movingBounds.bottom - bounds.top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.top,
        color: '#10b981',
        snapPosition: bounds.top - movingElement.size.height,
      });
    }
  });

  // Remove duplicate guides at the same position
  const uniqueGuides = guides.reduce((acc, guide) => {
    const exists = acc.find(
      (g) => g.type === guide.type && Math.abs(g.position - guide.position) < 1
    );
    if (!exists) {
      acc.push(guide);
    }
    return acc;
  }, [] as AlignmentGuide[]);

  return uniqueGuides;
};

export const snapToGuides = (
  movingElement: CatalogElement,
  guides: AlignmentGuide[]
): { x: number; y: number } => {
  let x = movingElement.position.x;
  let y = movingElement.position.y;

  // Find the closest vertical guide
  const verticalGuide = guides.find((g) => g.type === 'vertical' && g.snapPosition !== undefined);
  if (verticalGuide && verticalGuide.snapPosition !== undefined) {
    x = verticalGuide.snapPosition;
  }

  // Find the closest horizontal guide
  const horizontalGuide = guides.find((g) => g.type === 'horizontal' && g.snapPosition !== undefined);
  if (horizontalGuide && horizontalGuide.snapPosition !== undefined) {
    y = horizontalGuide.snapPosition;
  }

  return { x, y };
};

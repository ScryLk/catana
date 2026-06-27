import type { CatalogElement, Position, Size } from '../types/editor';

export interface SnapLine {
  orientation: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export interface SnapResult {
  x: number | null;
  y: number | null;
  lines: SnapLine[];
}

const SNAP_THRESHOLD = 5;

export const calculateSnap = (
  activeElement: { id: string; position: Position; size: Size },
  otherElements: CatalogElement[]
): SnapResult => {
  const result: SnapResult = { x: null, y: null, lines: [] };

  const activeRect = {
    left: activeElement.position.x,
    center: activeElement.position.x + activeElement.size.width / 2,
    right: activeElement.position.x + activeElement.size.width,
    top: activeElement.position.y,
    middle: activeElement.position.y + activeElement.size.height / 2,
    bottom: activeElement.position.y + activeElement.size.height,
  };

  // Check against other elements
  otherElements.forEach((el) => {
    if (el.id === activeElement.id) return;

    const targetRect = {
      left: el.position.x,
      center: el.position.x + el.size.width / 2,
      right: el.position.x + el.size.width,
      top: el.position.y,
      middle: el.position.y + el.size.height / 2,
      bottom: el.position.y + el.size.height,
    };

    // Vertical Snapping (X-axis alignment)
    // Left-Left, Left-Right, Right-Left, Right-Right, Center-Center
    const verticalChecks = [
      { val: activeRect.left, target: targetRect.left, type: 'left' },
      { val: activeRect.left, target: targetRect.right, type: 'left' },
      { val: activeRect.right, target: targetRect.left, type: 'right' },
      { val: activeRect.right, target: targetRect.right, type: 'right' },
      { val: activeRect.center, target: targetRect.center, type: 'center' },
    ];

    verticalChecks.forEach((check) => {
      if (Math.abs(check.val - check.target) < SNAP_THRESHOLD) {
        const snapDelta = check.target - check.val;
        if (result.x === null || Math.abs(snapDelta) < Math.abs(result.x)) {
          result.x = snapDelta;
          // Create visual line
          const startY = Math.min(activeRect.top, targetRect.top);
          const endY = Math.max(activeRect.bottom, targetRect.bottom);
          result.lines.push({
            orientation: 'vertical',
            position: check.target,
            start: startY - 20,
            end: endY + 20,
          });
        }
      }
    });

    // Horizontal Snapping (Y-axis alignment)
    const horizontalChecks = [
      { val: activeRect.top, target: targetRect.top, type: 'top' },
      { val: activeRect.top, target: targetRect.bottom, type: 'top' },
      { val: activeRect.bottom, target: targetRect.top, type: 'bottom' },
      { val: activeRect.bottom, target: targetRect.bottom, type: 'bottom' },
      { val: activeRect.middle, target: targetRect.middle, type: 'middle' },
    ];

    horizontalChecks.forEach((check) => {
      if (Math.abs(check.val - check.target) < SNAP_THRESHOLD) {
        const snapDelta = check.target - check.val;
        if (result.y === null || Math.abs(snapDelta) < Math.abs(result.y)) {
          result.y = snapDelta;
          // Create visual line
          const startX = Math.min(activeRect.left, targetRect.left);
          const endX = Math.max(activeRect.right, targetRect.right);
          result.lines.push({
            orientation: 'horizontal',
            position: check.target,
            start: startX - 20,
            end: endX + 20,
          });
        }
      }
    });
  });

  return result;
};

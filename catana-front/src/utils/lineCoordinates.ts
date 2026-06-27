/**
 * 🎯 Conversão de Coordenadas para Linhas
 *
 * Sistema de coordenadas limpo e previsível:
 * - Screen: coordenadas do navegador (clientX, clientY)
 * - World: coordenadas absolutas do canvas infinito
 * - Viewport: área visível do canvas
 *
 * NUNCA misturar screen e world no mesmo cálculo!
 */

export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  x: number; // Pan horizontal
  y: number; // Pan vertical
  zoom: number; // 0.25 a 4.0 (25% a 400%)
}

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Converter coordenadas de screen para world
 *
 * @param screenX - Coordenada X da tela (clientX)
 * @param screenY - Coordenada Y da tela (clientY)
 * @param viewportRect - DOMRect do canvas
 * @param camera - Estado da câmera (pan + zoom)
 * @returns Ponto em coordenadas de world space
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewportRect: ViewportRect,
  camera: Camera
): Point {
  // 1. Converter screen para viewport (relativo ao canvas)
  const viewportX = screenX - viewportRect.left;
  const viewportY = screenY - viewportRect.top;

  // 2. Aplicar zoom inverso
  const zoomDecimal = camera.zoom / 100;
  const unzoomedX = viewportX / zoomDecimal;
  const unzoomedY = viewportY / zoomDecimal;

  // 3. Aplicar pan inverso
  const worldX = unzoomedX - camera.x;
  const worldY = unzoomedY - camera.y;

  return { x: worldX, y: worldY };
}

/**
 * Converter coordenadas de world para screen
 *
 * @param worldX - Coordenada X do mundo
 * @param worldY - Coordenada Y do mundo
 * @param viewportRect - DOMRect do canvas
 * @param camera - Estado da câmera (pan + zoom)
 * @returns Ponto em coordenadas de screen space
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewportRect: ViewportRect,
  camera: Camera
): Point {
  // 1. Aplicar pan
  const pannedX = worldX + camera.x;
  const pannedY = worldY + camera.y;

  // 2. Aplicar zoom
  const zoomDecimal = camera.zoom / 100;
  const zoomedX = pannedX * zoomDecimal;
  const zoomedY = pannedY * zoomDecimal;

  // 3. Converter viewport para screen
  const screenX = zoomedX + viewportRect.left;
  const screenY = zoomedY + viewportRect.top;

  return { x: screenX, y: screenY };
}

/**
 * Calcular distância entre dois pontos
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcular ângulo entre dois pontos (em graus)
 * Retorna ângulo de p1 para p2
 */
export function angle(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Aplicar snap de ângulo (0°, 45°, 90°, etc.)
 *
 * @param mousePoint - Ponto do mouse em world
 * @param anchorPoint - Ponto fixo (âncora)
 * @param snapIncrement - Incremento de snap em graus (padrão: 45°)
 * @returns Ponto ajustado com snap
 */
export function applyAngleSnap(
  mousePoint: Point,
  anchorPoint: Point,
  snapIncrement = 45
): Point {
  const dx = mousePoint.x - anchorPoint.x;
  const dy = mousePoint.y - anchorPoint.y;
  const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Arredondar para o ângulo mais próximo
  const snappedAngle = Math.round(currentAngle / snapIncrement) * snapIncrement;
  const dist = distance(anchorPoint, mousePoint);

  // Calcular novo ponto
  const radians = snappedAngle * Math.PI / 180;
  return {
    x: anchorPoint.x + Math.cos(radians) * dist,
    y: anchorPoint.y + Math.sin(radians) * dist,
  };
}

/**
 * Normalizar vetor (transformar em vetor unitário)
 */
export function normalize(vector: Point): Point {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

/**
 * Projetar ponto em uma direção
 *
 * @param point - Ponto a projetar
 * @param anchor - Ponto de origem
 * @param direction - Vetor de direção (normalizado)
 * @returns Distância projetada
 */
export function projectPointOnDirection(
  point: Point,
  anchor: Point,
  direction: Point
): number {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  return dx * direction.x + dy * direction.y;
}

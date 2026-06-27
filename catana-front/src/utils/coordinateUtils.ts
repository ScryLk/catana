/**
 * 🧭 Coordinate Conversion Utilities
 *
 * Centraliza toda a lógica de conversão entre espaços de coordenadas.
 * NUNCA misture screen/world no mesmo cálculo - use estas funções.
 */

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Converte coordenadas de tela (screen space) para mundo (world space)
 *
 * @param screenX - Coordenada X da tela (clientX)
 * @param screenY - Coordenada Y da tela (clientY)
 * @param camera - Estado da câmera (posição e zoom)
 * @param viewport - Bounding rect do canvas
 * @returns Ponto em coordenadas de mundo
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  viewport: Viewport
): Point {
  // 1. Converter de screen para canvas-local
  const canvasX = screenX - viewport.left;
  const canvasY = screenY - viewport.top;

  // 2. Aplicar transformação inversa da câmera
  const worldX = (canvasX / camera.zoom) + camera.x;
  const worldY = (canvasY / camera.zoom) + camera.y;

  return { x: worldX, y: worldY };
}

/**
 * Converte coordenadas de mundo (world space) para tela (screen space)
 *
 * @param worldX - Coordenada X do mundo
 * @param worldY - Coordenada Y do mundo
 * @param camera - Estado da câmera (posição e zoom)
 * @param viewport - Bounding rect do canvas
 * @returns Ponto em coordenadas de tela
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  viewport: Viewport
): Point {
  // 1. Aplicar transformação da câmera
  const canvasX = (worldX - camera.x) * camera.zoom;
  const canvasY = (worldY - camera.y) * camera.zoom;

  // 2. Converter de canvas-local para screen
  const screenX = canvasX + viewport.left;
  const screenY = canvasY + viewport.top;

  return { x: screenX, y: screenY };
}

/**
 * Aplica snap de ângulo (0°, 45°, 90°, 135°, 180°, etc.)
 *
 * @param mouseWorld - Posição do mouse em world space
 * @param anchor - Ponto fixo (âncora)
 * @param snapIncrement - Incremento em graus (padrão: 45°)
 * @returns Ponto com snap aplicado
 */
export function applyAngleSnap(
  mouseWorld: Point,
  anchor: Point,
  snapIncrement: number = 45
): Point {
  const dx = mouseWorld.x - anchor.x;
  const dy = mouseWorld.y - anchor.y;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const distance = Math.sqrt(dx * dx + dy * dy);

  const snappedAngle = Math.round(angle / snapIncrement) * snapIncrement;
  const rad = snappedAngle * (Math.PI / 180);

  return {
    x: anchor.x + distance * Math.cos(rad),
    y: anchor.y + distance * Math.sin(rad),
  };
}

/**
 * Calcula o ângulo entre dois pontos (em graus)
 */
export function getAngle(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calcula a distância entre dois pontos
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

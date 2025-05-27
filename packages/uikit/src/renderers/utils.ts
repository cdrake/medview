// src/renderers/utils.ts

import type { Vec2, Color } from '../types.js'

/**
 * Converts screen pixel coordinates to WebGL clip space [-1, 1].
 * @param x - The x-coordinate in pixels.
 * @param y - The y-coordinate in pixels.
 * @param canvas - The HTMLCanvasElement.
 * @returns A tuple [ndcX, ndcY] in normalized device coordinates.
 */
export function toNDC(x: number, y: number, canvas: HTMLCanvasElement): [number, number] {
  const ndcX = (x / canvas.width) * 2 - 1
  const ndcY = 1 - (y / canvas.height) * 2
  return [ndcX, ndcY]
}

/**
 * Converts a Vec2 point to WebGL clip space [-1, 1].
 * @param point - The [x, y] point in pixels.
 * @param canvas - The HTMLCanvasElement.
 * @returns A tuple [ndcX, ndcY] in normalized device coordinates.
 */
export function toNDCVec2(point: Vec2, canvas: HTMLCanvasElement): [number, number] {
  return toNDC(point[0], point[1], canvas)
}

/**
 * Computes a contrasting outer color (white or black) for a given color.
 * Uses a simple threshold on the color vector length.
 * @param color - The base color as [r, g, b, a].
 * @returns A contrasting Color [r, g, b, a].
 */
export function calculateOuterColor(color: Color): Color {
  const [r, g, b, a] = color
  const rgbLength = Math.sqrt(r * r + g * g + b * b)
  // If the color is bright, use black; otherwise use white
  const outer = rgbLength >= 0.1 ? 0 : 1
  return [outer, outer, outer, a]
}

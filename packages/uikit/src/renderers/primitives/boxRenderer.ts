// src/renderers/primitives/boxRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Vec4, Color } from '../../types.js'

/**
 * Configuration for drawing an oriented box with outline.
 */
export interface BoxConfig {
  boxStart: Vec2      // [x, y] canvas coordinates of box start
  boxEnd: Vec2        // [x, y] canvas coordinates of box end
  boxThickness: number // Thickness of the box edges (in pixels)
  fillColor?: Color    // Fill RGBA color
  outlineColor?: Color // Outline RGBA color
  outlineThickness?: number // Outline thickness (in pixels)
}

/**
 * Draws a filled, oriented box using the box shader.
 */
export function drawBox(
  gl: WebGL2RenderingContext,
  {
    boxStart,
    boxEnd,
    boxThickness,
    fillColor = [0.0, 0.0, 1.0, 1.0],
    outlineColor = [1.0, 1.0, 1.0, 1.0],
    outlineThickness = 1.0
  }: BoxConfig
): void {
  const shader = UIKRenderer.boxShader
  if (!shader) {
    throw new Error('boxShader undefined')
  }

  shader.use(gl)

  // Device Pixel Ratio
  const dpr = window.devicePixelRatio || 1
  const canvasRect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect()

  // Scale to device pixels
  const canvasWidth  = canvasRect.width  * dpr
  const canvasHeight = canvasRect.height * dpr

  // Convert points to NDC [-1,1]
  const startNDC: Vec2 = [
    ((boxStart[0] * dpr - canvasRect.left * dpr) / canvasWidth)  * 2 - 1,
    -(((boxStart[1] * dpr - canvasRect.top  * dpr) / canvasHeight) * 2 - 1)
  ]
  const endNDC: Vec2 = [
    ((boxEnd[0]   * dpr - canvasRect.left * dpr) / canvasWidth)  * 2 - 1,
    -(((boxEnd[1]   * dpr - canvasRect.top  * dpr) / canvasHeight) * 2 - 1)
  ]

  // Convert thickness to NDC (relative to canvas height)
  const thicknessNDC = (boxThickness * dpr / canvasHeight) * 2
  const outlineNDC   = (outlineThickness * dpr / canvasHeight) * 2

  // Set uniforms
  gl.uniform2f(shader.uniforms.iResolution, canvasWidth, canvasHeight)
  gl.uniform2f(shader.uniforms.boxStart, ...startNDC)
  gl.uniform2f(shader.uniforms.boxEnd,   ...endNDC)
  gl.uniform1f(shader.uniforms.boxThickness, thicknessNDC)
  gl.uniform1f(shader.uniforms.outlineThickness, outlineNDC)
  gl.uniform4fv(shader.uniforms.fillColor,    fillColor as Float32List)
  gl.uniform4fv(shader.uniforms.outlineColor, outlineColor as Float32List)

  // Draw full-screen quad stripped through box shader
  gl.bindVertexArray(UIKRenderer.fullScreenVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

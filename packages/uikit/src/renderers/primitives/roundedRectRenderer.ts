// src/renderers/primitives/roundedRectRenderer.ts

import { vec4 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec4, Color } from '../../types.js'

/**
 * Configuration for drawing a rounded rectangle with optional gradient.
 */
export interface RoundedRectConfig {
  bounds: Vec4
  fillColor: Color
  outlineColor: Color
  bottomColor?: Color
  cornerRadius?: number
  thickness?: number
}

/**
 * Draws a rounded rectangle with fill, border, and optional gradient.
 */
export function drawRoundedRect(
  gl: WebGL2RenderingContext,
  {
    bounds,
    fillColor,
    outlineColor,
    bottomColor = fillColor,
    cornerRadius = -1,
    thickness = 10
  }: RoundedRectConfig
): void {
  
  const shader = UIKRenderer.roundedRectShader
  if (!shader) {
    throw new Error('roundedRectShader undefined')
  }
  shader.use(gl)

  // Enable blending for transparent corners
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Compute effective corner radius
  const radius = cornerRadius === -1 ? thickness * 2 : cornerRadius

  // Convert bounds to vec4 if needed
  const rectParams = Array.isArray(bounds)
    ? vec4.fromValues(bounds[0], bounds[1], bounds[2], bounds[3])
    : bounds

  // Set shader uniforms
  gl.uniform1f(shader.uniforms.thickness, thickness)
  gl.uniform1f(shader.uniforms.cornerRadius, radius)
  gl.uniform4fv(shader.uniforms.borderColor, outlineColor as Float32List)
  gl.uniform4fv(shader.uniforms.topColor, fillColor as Float32List)
  gl.uniform4fv(shader.uniforms.bottomColor, bottomColor as Float32List)
  gl.uniform2fv(shader.uniforms.canvasWidthHeight, [
    (gl.canvas as HTMLCanvasElement).width,
    (gl.canvas as HTMLCanvasElement).height
  ])
  gl.uniform4fv(shader.uniforms.leftTopWidthHeight, rectParams as Float32List)

  // Draw the rectangle strip
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

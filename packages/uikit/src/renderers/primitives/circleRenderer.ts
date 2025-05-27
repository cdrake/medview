// src/renderers/primitives/circleRenderer.ts

import { vec4 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec4, Vec2, Color } from '../../types.js'

/**
 * Configuration for drawing a filled or partial circle with optional shadow.
 */
export interface CircleConfig {
  leftTopWidthHeight: Vec4
  circleColor?: Color
  shadowColor?: Color
  shadowOffset?: Vec2
  shadowBlur?: number
  fillPercent?: number
  z?: number
}

/**
 * Draws a circle (or ring segment) within a given bounding box.
 */
export function drawCircle(
  gl: WebGL2RenderingContext,
  {
    leftTopWidthHeight,
    circleColor = [1, 1, 1, 1],
    shadowColor = [0, 0, 0, 0],
    shadowOffset = [0, 0],
    shadowBlur = 0,
    fillPercent = 1,
    z = 0
  }: CircleConfig
): void {
  const shader = UIKRenderer.circleShader
  if(!shader) {
    throw new Error('circleShader undefined')
  }

  shader.use(gl)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Set circle-specific uniforms
  gl.uniform4fv(shader.uniforms.circleColor, circleColor as Float32List)
  gl.uniform4fv(shader.uniforms.shadowColor, shadowColor as Float32List)
  gl.uniform2fv(shader.uniforms.shadowOffset, shadowOffset as Float32List)
  gl.uniform1f(shader.uniforms.shadowBlur, shadowBlur)

  // Pass canvas dimensions
  gl.uniform2fv(shader.uniforms.canvasWidthHeight, [
    (gl.canvas as HTMLCanvasElement).width,
    (gl.canvas as HTMLCanvasElement).height
  ])

  // Convert leftTopWidthHeight to vec4 if needed
  const rectParams =
    Array.isArray(leftTopWidthHeight)
      ? vec4.fromValues(
          leftTopWidthHeight[0],
          leftTopWidthHeight[1],
          leftTopWidthHeight[2],
          leftTopWidthHeight[3]
        )
      : leftTopWidthHeight

  gl.uniform4fv(shader.uniforms.leftTopWidthHeight, rectParams as Float32List)
  gl.uniform1f(shader.uniforms.fillPercent, fillPercent)
  gl.uniform1f(shader.uniforms.z, z)

  // Draw quad strip
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

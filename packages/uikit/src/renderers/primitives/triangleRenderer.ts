// src/renderers/primitives/triangleRenderer.ts

import { vec2 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import { toNDC } from '../utils.js'
import type { Vec2, Color } from '../../types.js'

/**
 * Configuration for drawing a triangle terminator (arrowhead)
 */
export interface TriangleConfig {
  headPoint: Vec2
  baseMidPoint: Vec2
  baseLength: number
  color: Color
  z?: number
}

/**
 * Draws a filled triangle given head and base parameters.
 */
export function drawTriangle(
  gl: WebGL2RenderingContext,
  {
    headPoint,
    baseMidPoint,
    baseLength,
    color,
    z = 0
  }: TriangleConfig
): void {
  const canvas = gl.canvas as HTMLCanvasElement

  // Convert to normalized device coordinates
  const [hx, hy] = toNDC(headPoint[0], headPoint[1], canvas)
  const [bx, by] = toNDC(baseMidPoint[0], baseMidPoint[1], canvas)

  if (!UIKRenderer.triangleVertexBuffer) {
    console.error('Triangle vertex buffer not initialized')
    return
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, UIKRenderer.triangleVertexBuffer)

  // Direction vector from base midpoint to head
  const direction = vec2.sub(vec2.create(), [hx, hy] as Vec2, [bx, by] as Vec2)
  vec2.normalize(direction, direction)

  // Perpendicular unit vector
  const perp: Vec2 = [-direction[1], direction[0]]

  // Normalize base length to NDC space
  const nlX = (baseLength / canvas.width) * 2
  const nlY = (baseLength / canvas.height) * 2
  const halfX = perp[0] * (nlX / 2)
  const halfY = perp[1] * (nlY / 2)

  const leftX = bx - halfX
  const leftY = by - halfY
  const rightX = bx + halfX
  const rightY = by + halfY

  // Upload vertex positions: head, left, right
  const verts = new Float32Array([hx, hy, leftX, leftY, rightX, rightY])
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts)

  // Use the triangle shader
  const shader = UIKRenderer.triangleShader
  shader.use(gl)

  // Bind position attribute
  const loc = shader.uniforms.a_position as GLuint
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  // Set uniforms
  gl.uniform1f(shader.uniforms.u_antialiasing, baseLength * 0.01)
  gl.uniform2f(shader.uniforms.u_canvasSize, canvas.width, canvas.height)
  gl.uniform4fv(shader.uniforms.u_color, color as Float32List)
  gl.uniform1f(shader.uniforms.u_z, z)

  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, 3)

  // Cleanup
  gl.bindVertexArray(null)
}

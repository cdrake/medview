// src/renderers/primitives/lineRenderer.ts

import { vec2 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec4, Color } from '../../types.js'
import { LineTerminator, LineStyle } from '../../types.js'
import { drawTriangle } from './triangleRenderer.js'
import { drawCircle } from './circleRenderer.js'

/** Configuration for drawing a line */
export interface LineConfig {
  startEnd: Vec4
  thickness?: number
  color?: Color
  terminator?: LineTerminator
  style?: LineStyle
  dashDotLength?: number
}

/**
 * Draws a line (solid, dashed, or dotted) with optional terminators.
 */
export function drawLine(
  gl: WebGL2RenderingContext,
  {
    startEnd,
    thickness = 1,
    color = [1, 0, 0, 1],
    terminator = LineTerminator.NONE,
    style = LineStyle.SOLID,
    dashDotLength = 5
  }: LineConfig
): void {
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Unpack start/end
  let [startX, startY, endX, endY] = startEnd
  // Direction unit vector
  const dir = vec2.sub(vec2.create(), [endX, endY], [startX, startY])
  vec2.normalize(dir, dir)

  const termSize = thickness * 3
  // Shorten line for terminator
  let adjEndX = endX
  let adjEndY = endY
  if (terminator !== LineTerminator.NONE) {
    adjEndX -= dir[0] * (termSize / 2)
    adjEndY -= dir[1] * (termSize / 2)
  }

  // Dashed or dotted
  if (style === LineStyle.DASHED || style === LineStyle.DOTTED) {
    const totalLen = vec2.distance([startX, startY], [adjEndX, adjEndY])
    const spacing = style === LineStyle.DASHED ? dashDotLength * 1.5 : dashDotLength * 2
    const segments = Math.floor(totalLen / spacing)

    for (let i = 0; i <= segments; i++) {
      const px = startX + dir[0] * i * spacing
      const py = startY + dir[1] * i * spacing
      if (i === segments) {
        // last segment or dot
        if (style === LineStyle.DASHED) {
          drawSegment(gl, { segmentCoords: [px, py, adjEndX, adjEndY], thickness, color })
        } else {
          drawCircle(gl, { leftTopWidthHeight: [adjEndX - dashDotLength/2, adjEndY - dashDotLength/2, dashDotLength, dashDotLength], circleColor: color })
        }
      } else {
        if (style === LineStyle.DASHED) {
          const nx = px + dir[0] * dashDotLength
          const ny = py + dir[1] * dashDotLength
          drawSegment(gl, { segmentCoords: [px, py, nx, ny], thickness, color })
        } else {
          drawCircle(gl, { leftTopWidthHeight: [px - dashDotLength/2, py - dashDotLength/2, dashDotLength, dashDotLength], circleColor: color })
        }
      }
    }
  } else {
    // Solid line
    const shader = UIKRenderer.lineShader
    if(!shader) {
        throw new Error('Line shader not defined')
    }
    shader.use(gl)
    gl.uniform4fv(shader.uniforms.lineColor, color as Float32List)
    gl.uniform2fv(shader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
    gl.uniform1f(shader.uniforms.thickness, thickness)
    gl.uniform4fv(shader.uniforms.startXYendXY, [startX, startY, adjEndX, adjEndY] as Float32List)

    gl.bindVertexArray(UIKRenderer.genericVAO)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null)
  }

  // Draw terminator if requested
  switch (terminator) {
    case LineTerminator.ARROW:
      drawTriangle(gl, { headPoint: [endX, endY], baseMidPoint: [adjEndX, adjEndY], baseLength: termSize, color })
      break
    case LineTerminator.CIRCLE:
      drawCircle(gl, { leftTopWidthHeight: [endX - termSize/2, endY - termSize/2, termSize, termSize], circleColor: color })
      break
    case LineTerminator.RING:
      drawCircle(gl, { leftTopWidthHeight: [endX - termSize/2, endY - termSize/2, termSize, termSize], circleColor: color, fillPercent: 0.5 })
      break
  }
}

/**
 * Helper to draw a solid line segment.
 */
function drawSegment(
  gl: WebGL2RenderingContext,
  { segmentCoords, thickness, color }: { segmentCoords: Vec4; thickness: number; color: Color }
): void {
  const shader = UIKRenderer.lineShader
  if(!shader) {
    throw new Error('Line shader not initialized')
  }
  shader.use(gl)
  gl.uniform4fv(shader.uniforms.lineColor, color as Float32List)
  gl.uniform1f(shader.uniforms.thickness, thickness)
  gl.uniform4fv(shader.uniforms.startXYendXY, segmentCoords as Float32List)

  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

// src/renderers/composites/colorbarRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import { drawRoundedRect } from '../primitives/roundedRectRenderer.js'
import { drawLine } from '../primitives/lineRenderer.js'
import { drawText } from '../primitives/textRenderer.js'
import { tickSpacing } from '../../utilities/graph-utilities.js'
import { UIKFont } from '../../assets/uikfont.js'
import type { Vec2, Color } from '../../types.js'
import { HorizontalAlignment } from '../../types.js'

/**
 * Configuration for rendering a color bar with gradient, ticks, and labels.
 */
export interface ColorbarConfig {
  position: Vec2          // Top-left corner [x, y]
  size: Vec2              // [width, height]
  gradientTexture: WebGLTexture
  minMax: [number, number]
  tickLength?: number
  tickColor?: Color
  labelColor?: Color
  font: UIKFont
  labelAlignment?: HorizontalAlignment
  labelOffset?: number
}

/**
 * Draws a color bar with optional outline, gradient, tick marks, and labels.
 */
export function drawColorbar(
  gl: WebGL2RenderingContext,
  {
    position,
    size,
    gradientTexture,
    minMax,
    tickLength = 5,
    tickColor = [0, 0, 0, 1],
    labelColor = [0, 0, 0, 1],
    font,
    labelAlignment = HorizontalAlignment.CENTER,
    labelOffset = 5
  }: ColorbarConfig
): void {
  const [x, y] = position
  const [width, height] = size

  // Outline rectangle slightly larger
  drawRoundedRect(gl, {
    bounds: [x - 5, y - 5, width + 10, height + 10] as [number, number, number, number],
    fillColor: [0, 0, 0, 0],
    outlineColor: tickColor,
    cornerRadius: 0,
    thickness: 1
  })

  // Draw gradient background
  const shader = UIKRenderer.colorbarShader
  shader.use(gl)
  gl.uniform2fv(shader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
  gl.uniform4fv(shader.uniforms.leftTopWidthHeight, [x, y, width, height] as Float32List)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, gradientTexture)
  gl.uniform1i(shader.uniforms.gradientTexture, 0)
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)

  // Tick marks and labels
  const [step, start, end] = tickSpacing(minMax[0], minMax[1])
  for (let value = start; value <= end; value += step) {
    const frac = (value - minMax[0]) / (minMax[1] - minMax[0])
    const tickX = x + frac * width

    // Draw tick mark
    drawLine(gl, {
      startEnd: [tickX, y + height, tickX, y + height + tickLength],
      thickness: 1,
      color: tickColor
    })

    // Draw label
    const label = value.toFixed(1)
    const textWidth = font.getTextWidth(label, 1.0)
    let labelX = tickX
    switch (labelAlignment) {
      case HorizontalAlignment.CENTER:
        labelX -= textWidth / 2
        break
      case HorizontalAlignment.RIGHT:
        labelX -= textWidth
        break
      case HorizontalAlignment.LEFT:
      default:
        break
    }
    const labelY = y + height + tickLength + labelOffset

    // Draw label using text renderer
    drawText(gl, {
      font,
      position: [labelX, labelY],
      text: label,
      scale: 0.5,
      color: labelColor
    })

  }
}

// src/renderers/composites/textBoxRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import { drawRoundedRect } from '../primitives/roundedRectRenderer.js'
import { drawTextCenteredOn } from '../primitives/textRenderer.js'
import { drawLine } from '../primitives/lineRenderer.js'
import { UIKFont } from '../../assets/uikfont.js'
import type { Vec2, Color } from '../../types.js'

/**
 * Configuration for drawing a text box with background and centered text.
 */
export interface TextBoxConfig {
  font: UIKFont
  xy: Vec2                // Top-left corner of the box
  text: string            // Text to render inside the box
  textColor?: Color       // Color of the text
  outlineColor?: Color    // Color of the box outline
  fillColor?: Color       // Background fill color
  margin?: number         // Padding around text
  roundness?: number      // Corner roundness (0 to 1)
  scale?: number          // Text scale multiplier
  maxWidth?: number       // Maximum text width for wrapping
}

/**
 * Draws a text box with centered text and a dividing line.
 */
export function drawTextBox(
  gl: WebGL2RenderingContext,
  {
    font,
    xy,
    text,
    textColor = [0, 0, 0, 1],
    outlineColor = [1, 1, 1, 1],
    fillColor = [0, 0, 0, 0.3],
    margin = 15,
    roundness = 0,
    scale = 1,
    maxWidth = 0
  }: TextBoxConfig
): void {
  // Adjust for device pixel ratio
  const dpr = window.devicePixelRatio || 1
  scale *= dpr

  // Text dimensions
  const textHeight = font.getTextHeight(text, scale)
  const wrappedSize = font.getWordWrappedSize(text, scale, maxWidth)

  // Box dimensions
  const width = wrappedSize[0] + 2 * margin * scale + textHeight
  const height = wrappedSize[1] + 4 * margin * scale

  const bounds = [xy[0], xy[1], width, height] as [number, number, number, number]

  // Draw rounded background
  drawRoundedRect(gl, {
    bounds,
    fillColor,
    outlineColor,
    cornerRadius: (Math.min(1, roundness) / 2) * Math.min(width, height),
    thickness: 5
  })

  // Center line separator
  const midY = xy[1] + height / 2
  drawLine(gl, {
    startEnd: [xy[0], midY, xy[0] + width, midY],
    color: outlineColor,
    thickness: 1
  })

  // Draw centered text
  const centerX = xy[0] + width / 2
  const centerY = xy[1] + height / 2
  drawTextCenteredOn(gl, {
    font,
    xy: [centerX, centerY],
    str: text,
    scale,
    color: textColor,
    maxWidth,
    isOutline: true,
    outlineColor
  })
}

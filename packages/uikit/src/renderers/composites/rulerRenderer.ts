// src/renderers/composites/rulerRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import { tickSpacing } from '../../utilities/graph-utilities.js'
import type { Vec2, Color } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'
import { LineTerminator } from '../../types.js'

/**
 * Configuration for drawing a ruler with length text, units, and hash marks.
 */
export interface RulerConfig {
  renderer: UIKRenderer
  pointA: Vec2         // Start point of the ruler
  pointB: Vec2         // End point of the ruler
  length: number       // Length value to display
  units: string        // Units to display alongside the length
  font: UIKFont        // Font object for rendering text
  textColor?: Color    // Color of the text. Defaults to red.
  outlineColor?: Color // Outline/label color. Defaults to white.
  lineColor?: Color    // Color of the ruler lines. Defaults to black.
  lineThickness?: number       // Thickness of the ruler lines. Defaults to 1.
  offset?: number            // Offset distance for parallel line and text. Defaults to 40.
  scale?: number            // Scale factor for text size. Defaults to 1.0.
  showTickmarkNumbers?: boolean // Whether to draw tick numbers. Defaults to true.
}

/**
 * Draws a ruler with length text, units, and hash marks.
 */
export function drawRuler({
  renderer,
  pointA,
  pointB,
  length,
  units,
  font,
  textColor = [1, 0, 0, 1],
  outlineColor = [1, 1, 1, 1],
  lineColor = [0, 0, 0, 1],
  lineThickness = 1,
  offset = 40,
  scale = 1.0,
  showTickmarkNumbers = true
}: RulerConfig): void {
  const deltaX = pointB[0] - pointA[0]
  const deltaY = pointB[1] - pointA[1]
  const actualLength = Math.hypot(deltaX, deltaY)
  let angle = Math.atan2(deltaY, deltaX)

  // Midpoint for label placement
  const midX = (pointA[0] + pointB[0]) / 2
  const midY = (pointA[1] + pointB[1]) / 2
  const text = length.toFixed(2)

  // Determine text dimensions
  const textW = font.getTextWidth(text, scale)
  const textH = font.getTextHeight(text, scale)
  const halfW = textW / 2
  const halfH = textH / 2

  // Calculate base text position above ruler
  let textPos: Vec2 = [
    midX - halfW * Math.cos(angle) + (halfH + offset) * Math.sin(angle),
    midY - halfW * Math.sin(angle) - (halfH + offset) * Math.cos(angle)
  ]

  // Flip if upside-down
  if (angle > Math.PI/2 || angle < -Math.PI/2) {
    angle += Math.PI
    textPos = [
      midX - halfW * Math.cos(angle) + (halfH + offset) * Math.sin(angle),
      midY - halfW * Math.sin(angle) - (halfH + offset) * Math.cos(angle)
    ]
  }

  // Draw length label
  renderer.drawRotatedText({ font, xy: textPos, str: text, scale, color: textColor, outlineColor, rotation: angle })

  // Draw units next to length
  const us = scale / 2
  const uW = font.getTextWidth(units, us)
  const unitsPos: Vec2 = [
    textPos[0] + (textW + uW/4) * Math.cos(angle),
    textPos[1] + (textW + uW/4) * Math.sin(angle)
  ]
  renderer.drawRotatedText({ font, xy: unitsPos, str: units, scale: us, color: textColor, outlineColor, rotation: angle })

  // Parallel line offset above original
  const pxA: Vec2 = [pointA[0] + (offset * deltaY)/actualLength, pointA[1] - (offset * deltaX)/actualLength]
  const pxB: Vec2 = [pointB[0] + (offset * deltaY)/actualLength, pointB[1] - (offset * deltaX)/actualLength]
  renderer.drawLine({ startEnd: [pxA[0], pxA[1], pxB[0], pxB[1]], thickness: lineThickness, color: lineColor })

  // Arrow connectors back to endpoints
  renderer.drawLine({ startEnd: [pxA[0], pxA[1], pointA[0], pointA[1]], thickness: lineThickness, color: lineColor, terminator: LineTerminator.ARROW })
  renderer.drawLine({ startEnd: [pxB[0], pxB[1], pointB[0], pointB[1]], thickness: lineThickness, color: lineColor, terminator: LineTerminator.ARROW })

  // Hash marks along ruler
  const numMarks = Math.floor(length)
  const hashLen = 8
  const offPar = offset/4
  for (let i=1; i<=numMarks; i++) {
    const t = i/length
    const x0 = pointA[0] + t*deltaX
    const y0 = pointA[1] + t*deltaY
    const isMajor = i % 5 === 0
    const hLen = isMajor? hashLen*2 : hashLen
    const perpX = (deltaY/actualLength)*offPar
    const perpY = (-deltaX/actualLength)*offPar

    if (isMajor && showTickmarkNumbers) {
      const label = `${i}`
      const ts = scale/5
      const lW = font.getTextWidth(label, ts)
      const labelPos: Vec2 = [
        x0+perpX - (lW/2)*Math.cos(angle) + (hLen/4)*Math.sin(angle),
        y0+perpY - (lW/2)*Math.sin(angle) - (hLen/4)*Math.cos(angle)
      ]
      renderer.drawRotatedText({ font, xy: labelPos, str: label, scale: ts, color: textColor, outlineColor, rotation: angle })
    }

    // Draw hash mark
    const hx0 = x0 + perpX - (hLen/2)*Math.cos(angle+Math.PI/2)
    const hy0 = y0 + perpY - (hLen/2)*Math.sin(angle+Math.PI/2)
    const hx1 = x0 + perpX + (hLen/2)*Math.cos(angle+Math.PI/2)
    const hy1 = y0 + perpY + (hLen/2)*Math.sin(angle+Math.PI/2)
    renderer.drawLine({ startEnd: [hx0, hy0, hx1, hy1], thickness: 1, color: lineColor })
  }
}

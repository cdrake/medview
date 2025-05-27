// src/renderers/composites/lineGraphRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import { drawLine } from '../primitives/lineRenderer.js'
import { drawCircle } from '../primitives/circleRenderer.js'
import { drawText, drawRotatedText, drawTextCenteredOn } from '../primitives/textRenderer.js'
import { tickSpacing } from '../../utilities/graph-utilities.js'
import type { Vec2, Color } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'
import { HorizontalAlignment } from '../../types.js'

/** Configuration for rendering a 2D line graph */
export interface LineGraphConfig {
  renderer: UIKRenderer
  data: number[]             // Y-values of the series; X steps are uniform
  position: Vec2             // Top-left corner [x, y]
  size: Vec2                 // [width, height] of graph area
  minMax?: [number, number]  // Optional [minY, maxY]; auto-computed if omitted
  tickCount?: number         // Number of ticks on Y-axis
  lineColor?: Color          // Color of the polyline
  pointColor?: Color         // Color of data point markers
  showPoints?: boolean       // Whether to draw circle markers
  font: UIKFont              // Font for axis labels
  labelColor?: Color         // Color of tick labels
  scale?: number             // Text scale multiplier
  yAxisLabel?: string        // Optional label for the Y-axis
  yAxisLabelOffset?: number  // Distance from axis for Y-axis label
  xAxisLabel?: string        // Optional label for the X-axis
  xAxisLabelOffset?: number  // Distance from axis for X-axis label
}

/**
 * Draws a simple 2D line graph with axes, ticks, optional point markers,
 * and optional axis labels.
 */
export function drawLineGraph({
  renderer,
  data,
  position,
  size,
  minMax,
  tickCount = 5,
  lineColor = [0, 0.5, 1, 1],
  pointColor = [1, 1, 1, 1],
  showPoints = true,
  font,
  labelColor = [0, 0, 0, 1],
  scale = 1,
  yAxisLabel,
  yAxisLabelOffset = 40,
  xAxisLabel,
  xAxisLabelOffset = 20
}: LineGraphConfig): void {
  const [x0, y0] = position
  const [width, height] = size

  // Determine Y range
  const values = data.slice()
  let minY = minMax ? minMax[0] : Math.min(...values)
  let maxY = minMax ? minMax[1] : Math.max(...values)
  if (minY === maxY) { maxY += 1; minY -= 1 }

  // Compute ticks
  const [step, start, end] = tickSpacing(minY, maxY, tickCount)

  // Draw Y-axis ticks and labels
  for (let v = start; v <= end; v += step) {
    const frac = (v - minY) / (maxY - minY)
    const y = y0 + height - frac * height
    drawLine(renderer.gl, { startEnd: [x0 - 5, y, x0, y], thickness: 1, color: labelColor })
    drawText(renderer.gl, { font, xy: [x0 - 10, y], str: v.toFixed(2), scale, color: labelColor })
  }

  // Optional Y-axis label
  if (yAxisLabel) {
    const labelX = x0 - yAxisLabelOffset
    const labelY = y0 + height / 2
    drawRotatedText(renderer.gl, {
      font,
      xy: [labelX, labelY],
      str: yAxisLabel,
      scale,
      color: labelColor,
      rotation: -Math.PI / 2,
      alignment: HorizontalAlignment.CENTER
    })
  }

  // Plot polyline
  const n = data.length
  if (n < 2) return
  const dx = width / (n - 1)
  let prevX = x0
  let prevY = y0 + height - ((data[0] - minY) / (maxY - minY)) * height

  for (let i = 1; i < n; i++) {
    const x = x0 + i * dx
    const y = y0 + height - ((data[i] - minY) / (maxY - minY)) * height
    drawLine(renderer.gl, { startEnd: [prevX, prevY, x, y], thickness: 2, color: lineColor })
    if (showPoints) {
      drawCircle(renderer.gl, { leftTopWidthHeight: [x - 3, y - 3, 6, 6], circleColor: pointColor })
    }
    prevX = x; prevY = y
  }

  // Axis lines
  drawLine(renderer.gl, { startEnd: [x0, y0 + height, x0 + width, y0 + height], thickness: 1, color: labelColor })
  drawLine(renderer.gl, { startEnd: [x0, y0, x0, y0 + height], thickness: 1, color: labelColor })

  // Optional X-axis label
  if (xAxisLabel) {
    const labelX = x0 + width / 2
    const labelY = y0 + height + xAxisLabelOffset
    drawTextCenteredOn(renderer.gl, { font, xy: [labelX, labelY], str: xAxisLabel, scale, color: labelColor })
  }
}

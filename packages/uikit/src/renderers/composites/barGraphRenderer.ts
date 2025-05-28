// src/renderers/composites/barGraphRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Color } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'
import { tickSpacing } from '../../utilities/graph-utilities.js'

/** Configuration for rendering a bar graph */
export interface BarGraphConfig {
  renderer: UIKRenderer
  data: number[]             // Values for each bar
  position: Vec2             // Top-left corner [x, y]
  size: Vec2                 // [width, height] of graph area
  labels?: string[]          // Optional labels for each bar
  minMax?: [number, number]  // Optional Y range
  tickCount?: number         // Number of Y-axis ticks
  barColor?: Color           // Color of bars
  font: UIKFont              // Font for labels/ticks
  labelColor?: Color         // Color of tick and bar labels
  scale?: number             // Text scale multiplier
  yAxisLabel?: string        // Optional label for the Y-axis
  yAxisLabelOffset?: number  // Distance from axis for Y-axis label
  xAxisLabel?: string        // Optional label for the X-axis
  xAxisLabelOffset?: number  // Distance from axis for X-axis label
}

/**
 * Draws a vertical bar chart with axes, ticks, optional bar labels,
 * and optional axis labels.
 */
export function drawBarGraph({
  renderer,
  data,
  position,
  size,
  labels = [],
  minMax,
  tickCount = 5,
  barColor = [0.2, 0.7, 0.3, 1],
  font,
  labelColor = [0, 0, 0, 1],
  scale = 1,
  yAxisLabel,
  yAxisLabelOffset = 40,
  xAxisLabel,
  xAxisLabelOffset = 20
}: BarGraphConfig): void {
  const [x0, y0] = position
  const [width, height] = size
  const n = data.length
  if (n === 0) return

  // Determine Y range
  let minY = minMax ? minMax[0] : 0
  let maxY = minMax ? minMax[1] : Math.max(...data)
  if (maxY === minY) maxY = minY + 1

  // Compute Y-axis ticks and labels
  const [step, start, end] = tickSpacing(minY, maxY, tickCount)
  for (let v = start; v <= end; v += step) {
    const frac = (v - minY) / (maxY - minY)
    const y = y0 + height - frac * height
    // Tick mark
    renderer.drawLine({ startEnd: [x0 - 5, y, x0, y], thickness: 1, color: labelColor })
    // Label
    renderer.drawText({ font, position: [x0 - 10, y], text: v.toFixed(2), scale, color: labelColor })
  }

  // Optional Y-axis label
  if (yAxisLabel) {
    const labelX = x0 - yAxisLabelOffset
    const labelY = y0 + height / 2
    renderer.drawRotatedText({ font, xy: [labelX, labelY], str: yAxisLabel, scale, color: labelColor, rotation: -Math.PI/2, alignment: 1 })
  }

  // Draw each bar
  const barWidth = (width / n) * 0.8
  const gap = (width / n) * 0.2
  for (let i = 0; i < n; i++) {
    const val = data[i]
    const frac = (val - minY) / (maxY - minY)
    const barHeight = frac * height
    const x = x0 + i * (barWidth + gap) + gap / 2
    const y = y0 + height - barHeight

    // Bar as rounded rectangle
    renderer.drawRoundedRect({
      bounds: [x, y, barWidth, barHeight],
      fillColor: barColor,
      outlineColor: barColor,
      cornerRadius: barWidth * 0.1,
      thickness: 1
    })

    // Bar label (if provided)
    if (labels[i]) {
      const txt = labels[i]
      const tW = font.getTextWidth(txt, scale)
      const tx = x + (barWidth - tW) / 2
      const ty = y0 + height + 5
      renderer.drawText({ font, position: [tx, ty], text: txt, scale, color: labelColor })
    }
  }

  // Draw axes
  renderer.drawLine({ startEnd: [x0, y0, x0, y0 + height], thickness: 1, color: labelColor })
  renderer.drawLine({ startEnd: [x0, y0 + height, x0 + width, y0 + height], thickness: 1, color: labelColor })

  // Optional X-axis label
  if (xAxisLabel) {
  const labelX = x0 + width / 2
  const labelY = y0 + height + xAxisLabelOffset
  renderer.drawTextCenteredOn({
    font,
    xy: [labelX, labelY],
    str: xAxisLabel,
    scale,
    color: labelColor
  })
}

}

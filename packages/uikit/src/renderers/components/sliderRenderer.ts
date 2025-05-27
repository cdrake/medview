// src/renderers/components/sliderRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Color } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'

/**
 * Configuration for rendering a slider control.
 */
export interface SliderConfig {
  renderer: UIKRenderer
  position: Vec2      // Top-left corner of the slider
  size: Vec2          // Width and height of the slider track
  value?: number      // Current slider value
  min?: number        // Minimum value
  max?: number        // Maximum value
  trackColor?: Color  // Color of the unfilled track
  fillColor?: Color   // Color of the filled portion
  knobColor?: Color   // Color of the slider knob
  shadowColor?: Color // Shadow color for the knob
  shadowOffset?: Vec2 // Shadow offset
  shadowBlur?: number // Shadow blur radius
  valueTextColor?: Color // Color of the value text
  font: UIKFont       // Font for rendering value text
  scale?: number      // Scale factor for text and knob
}

/**
 * Draws a slider with track, fill, knob, and value text.
 */
export function drawSlider({
  renderer,
  position,
  size,
  value = 0.5,
  min = 0,
  max = 1,
  trackColor = [0.8, 0.8, 0.8, 1.0],
  fillColor = [0.0, 0.5, 1.0, 1.0],
  knobColor = [1.0, 1.0, 1.0, 1.0],
  shadowColor = [0.0, 0.0, 0.0, 0.2],
  shadowOffset = [0, 0],
  shadowBlur = 0,
  valueTextColor = [0, 0, 0, 1],
  font,
  scale = 1.0
}: SliderConfig): void {
  const [x, y] = position
  const [width, height] = size

  // Clamp and normalize value
  const v = Math.max(min, Math.min(max, value))
  const frac = (v - min) / (max - min)

  const radius = height / 2

  // Draw track background
  renderer.drawRoundedRect({
    bounds: [x, y, width, height],
    fillColor: trackColor,
    outlineColor: trackColor,
    cornerRadius: radius,
    thickness: 1
  })

  // Draw filled portion
  renderer.drawRoundedRect({
    bounds: [x, y, width * frac, height],
    fillColor: fillColor,
    outlineColor: fillColor,
    cornerRadius: radius,
    thickness: 1
  })

  // Compute knob dimensions and position
  const knobSize = height * 1.2
  const offX = x + (height - knobSize) / 2
  const onX = x + width - knobSize - (height - knobSize) / 2
  const knobX = offX + (onX - offX) * frac
  const knobY = y + (height - knobSize) / 2

  // Draw knob shadow if requested
  if (shadowBlur > 0) {
    renderer.drawCircle({
      leftTopWidthHeight: [knobX + shadowOffset[0], knobY + shadowOffset[1], knobSize, knobSize],
      circleColor: shadowColor,
      shadowBlur
    })
  }

  // Draw knob
  renderer.drawCircle({
    leftTopWidthHeight: [knobX, knobY, knobSize, knobSize],
    circleColor: knobColor
  })

  // Draw value label to the right of slider
  const textX = x + width + 5
  const textY = y + height / 2
  renderer.drawTextCenteredOn({
    font,
    xy: [textX, textY],
    str: v.toFixed(2),
    scale,
    color: valueTextColor
  })
}

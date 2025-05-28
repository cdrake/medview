// src/renderers/components/sliderRenderer.ts

import type { Vec2, Color } from '../../types.js'
import { UIKRenderer } from '../../uikrenderer.js'
import { UIKFont } from '../../assets/uikfont.js'

export interface SliderConfig {
  position: Vec2
  size: Vec2
  value?: number
  min?: number
  max?: number
  trackColor?: Color
  fillColor?: Color
  knobColor?: Color
  shadowColor?: Color
  shadowOffset?: Vec2
  shadowBlur?: number
  valueTextColor?: Color
  font: UIKFont
  scale?: number
}

/**
 * Draws a slider with track, fill, knob, and a centered value label underneath the knob.
 * `this` is bound to the UIKRenderer instance.
 */
export function drawSlider(this: UIKRenderer, cfg: SliderConfig): void {
  const {
    position, size,
    value = 0.5, min = 0, max = 1,
    trackColor    = [0.8, 0.8, 0.8, 1],
    fillColor     = [0.0, 0.5, 1.0, 1.0],
    knobColor     = [1, 1, 1, 1],
    shadowColor   = [0, 0, 0, 0.2],
    shadowOffset  = [0, 0],
    shadowBlur    = 0,
    valueTextColor= [0, 0, 0, 1],
    font, scale   = 1
  } = cfg

  const [x, y] = position
  const [width, height] = size
  const v = Math.max(min, Math.min(max, value))
  const frac = (v - min) / (max - min)
  const radius = height / 2

  // 1) Draw the track background
  this.drawRoundedRect({
    bounds: [x, y, width, height],
    fillColor: trackColor,
    outlineColor: trackColor,
    cornerRadius: radius,
    thickness: 1
  })

  // 2) Draw the filled portion
  this.drawRoundedRect({
    bounds: [x, y, width * frac, height],
    fillColor,
    outlineColor: fillColor,
    cornerRadius: radius,
    thickness: 1
  })

  // 3) Draw the knob shadow (if any)
  const knobSize = height * 1.2
  const offX = x + (height - knobSize) / 2
  const onX  = x + width - knobSize - (height - knobSize) / 2
  const knobX = offX + (onX - offX) * frac
  const knobY = y + (height - knobSize) / 2

  if (shadowBlur > 0) {
    this.drawCircle({
      leftTopWidthHeight: [knobX + shadowOffset[0], knobY + shadowOffset[1], knobSize, knobSize],
      circleColor: shadowColor,
      shadowBlur
    })
  }

  // 4) Draw the knob
  this.drawCircle({
    leftTopWidthHeight: [knobX, knobY, knobSize, knobSize],
    circleColor: knobColor
  })

  // 5) Draw the value label centered under the knob
  const labelX = knobX + knobSize / 2
  const labelY = y + height + knobSize / 2 + 5
  this.drawTextCenteredOn({
    font,
    position: [labelX, labelY],
    text: v.toFixed(2),
    scale,
    color: valueTextColor
  })
}

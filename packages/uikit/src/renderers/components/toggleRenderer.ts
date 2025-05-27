// src/renderers/components/toggleRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Color } from '../../types.js'

/**
 * Configuration for drawing a toggle switch.
 */
export interface ToggleConfig {
  renderer: UIKRenderer
  position: Vec2      // [x, y] top-left corner of the toggle
  size: Vec2          // [width, height] of the toggle area
  isOn: boolean       // current state of the toggle
  onColor: Color      // color when toggle is on
  offColor: Color     // color when toggle is off
  knobPosition?: number // animated knob position (0 to 1)
}

/**
 * Draws a toggle switch with support for an animated knob position.
 * @param params - Object containing the toggle parameters.
 * @param params.renderer - Render instance to draw toggle primitives.
 * @param params.position - The position of the top-left corner of the toggle.
 * @param params.size - The size of the toggle ([width, height]).
 * @param params.isOn - Whether the toggle is on or off.
 * @param params.onColor - The color when the toggle is on.
 * @param params.offColor - The color when the toggle is off.
 * @param params.knobPosition - The position of the knob (0 for off, 1 for on).
 */
export function drawToggle({
  renderer,
  position,
  size,
  isOn,
  onColor,
  offColor,
  knobPosition = isOn ? 1.0 : 0.0
}: ToggleConfig): void {
  // Extract position and size
  const [posX, posY] = position
  const [sizeX, sizeY] = size

  // Compute corner radius from height
  const cornerRadius = sizeY / 2

  // Determine fill color based on state
  const fillColor = new Float32Array(isOn ? onColor : offColor)

  // Draw background rounded rectangle
  renderer.drawRoundedRect({
    bounds: [posX, posY, sizeX, sizeY],
    fillColor,
    outlineColor: new Float32Array([0.2, 0.2, 0.2, 1.0]),
    cornerRadius,
    thickness: 2.0
  })

  // Clamp knob position [0,1]
  knobPosition = Math.max(0, Math.min(1, knobPosition))

  // Calculate knob dimensions and position
  const knobSize = sizeY * 0.8
  const offX = posX + (sizeY - knobSize) / 2
  const onX = posX + sizeX - knobSize - (sizeY - knobSize) / 2
  const knobX = offX + (onX - offX) * knobPosition
  const knobY = posY + (sizeY - knobSize) / 2

  // Draw toggle knob
  renderer.drawCircle({
    leftTopWidthHeight: [knobX, knobY, knobSize, knobSize],
    circleColor: new Float32Array([1.0, 1.0, 1.0, 1.0])
  })
}

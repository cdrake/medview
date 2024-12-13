import { UIKRenderer } from '../uikrenderer'
import { Color, Vec4 } from '../types'
import { BaseContainerComponent } from './base-container-component'
import { BaseContainerComponentConfig } from '../interfaces'

interface PanelContainerConfig extends BaseContainerComponentConfig {
  backgroundColor?: Color
  outlineColor?: Color
  outlineWidth?: number
}

export class PanelContainerComponent extends BaseContainerComponent {
  private backgroundColor: Color
  private outlineColor: Color
  private outlineWidth: number

  constructor(config: PanelContainerConfig) {
    super(config)

    // Default styles
    this.backgroundColor = config.backgroundColor ?? [1, 1, 1, 1] // White by default
    this.outlineColor = config.outlineColor ?? [0, 0, 0, 1] // Black by default
    this.outlineWidth = config.outlineWidth ?? 2 // Default outline width
  }

  /**
   * Draws the container with a background color and outline.
   * @param renderer - The UIKRenderer instance.
   */
  draw(renderer: UIKRenderer): void {
    if (!this.isVisible) {
      return
    }

    const [x, y, width, height] = this.getBounds()

    // Draw the panel background
    renderer.drawRoundedRect({
      bounds: [x, y, width, height],
      fillColor: this.backgroundColor,
      outlineColor: this.outlineColor,
      cornerRadius: 10, // Default corner radius for rounded edges
      thickness: this.outlineWidth
    })

    // Draw child components
    this.components.forEach((component) => {
      if (component.isVisible) {
        component.draw(renderer)
      }
    })
  }

  // Getters and setters for styles

  getBackgroundColor(): Color {
    return this.backgroundColor
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color
    this.requestRedraw?.()
  }

  getOutlineColor(): Color {
    return this.outlineColor
  }

  setOutlineColor(color: Color): void {
    this.outlineColor = color
    this.requestRedraw?.()
  }

  getOutlineWidth(): number {
    return this.outlineWidth
  }

  setOutlineWidth(width: number): void {
    this.outlineWidth = width
    this.requestRedraw?.()
  }

  /**
   * Update the layout and redraw the container.
   */
  updateLayout(): void {
    super.updateLayout()
    this.requestRedraw?.()
  }
}

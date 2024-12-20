import { BaseContainerComponent } from './base-container-component'
import { Color, Vec4 } from '../types'
import { UIKRenderer } from '../uikrenderer'
import { BaseContainerComponentConfig, IUIComponent } from '../interfaces'

export interface PanelContainerConfig extends BaseContainerComponentConfig {
  backgroundColor?: Color
  outlineColor?: Color
  outlineWidth?: number
  gradientStartColor?: Color
  gradientEndColor?: Color
}

export class PanelContainerComponent extends BaseContainerComponent {
  private backgroundColor: Color
  private outlineColor: Color
  private outlineWidth: number
  private gradientStartColor: Color
  private gradientEndColor: Color

  constructor(config: PanelContainerConfig) {
    super(config)

    this.backgroundColor = config.backgroundColor ?? [1, 1, 1, 1] // Default white
    this.outlineColor = config.outlineColor ?? [0, 0, 0, 1] // Default black
    this.outlineWidth = config.outlineWidth ?? 2 // Default 2px outline
    this.gradientStartColor = config.gradientStartColor ?? this.backgroundColor
    this.gradientEndColor = config.gradientEndColor ?? this.backgroundColor
    this.className = 'PanelContainerComponent'
  }

  draw(renderer: UIKRenderer): void {
    if (!this.isVisible) {
      return
    }
    // console.log('bounds for panel', this.bounds)
    // Draw background with gradient support
    renderer.drawRoundedRect({
      bounds: this.getBounds(),
      fillColor: this.gradientStartColor,
      outlineColor: this.outlineColor,
      cornerRadius: 10, // Example corner radius
      thickness: this.outlineWidth,
      bottomColor: this.gradientEndColor
    })

    // Draw child components
    for(const component of this.components) {
      if(!component.isVisible) {
        continue
      }
      component.draw(renderer)
    }
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color
    this.requestRedraw?.()
  }

  setOutlineColor(color: Color): void {
    this.outlineColor = color
    this.requestRedraw?.()
  }

  setOutlineWidth(width: number): void {
    this.outlineWidth = width
    this.requestRedraw?.()
  }

  setGradient(startColor: Color, endColor: Color): void {
    this.gradientStartColor = startColor
    this.gradientEndColor = endColor
    this.requestRedraw?.()
  }

  getBackgroundColor(): Color {
    return this.backgroundColor
  }

  getOutlineColor(): Color {
    return this.outlineColor
  }

  getOutlineWidth(): number {
    return this.outlineWidth
  }

  getGradientStartColor(): Color {
    return this.gradientStartColor
  }

  getGradientEndColor(): Color {
    return this.gradientEndColor
  }
}

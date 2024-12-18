import { IColorable, TextBoxComponentConfig } from '../interfaces'
import { UIKRenderer } from '../uikrenderer'
import { Color, Vec4 } from '../types'
import { UIKFont } from '../assets/uikfont'
import { BaseUIComponent } from './base-ui-component'

export class TextBoxComponent extends BaseUIComponent implements IColorable {
  protected textColor: Color
  protected backgroundColor: Color = [0, 0, 0, 0.5]
  protected outlineColor: Color = [1, 1, 1, 1]
  protected cornerRadius: number = 5
  protected outlineWidth: number = 1
  protected text: string
  protected font: UIKFont
  protected maxWidth: number
  protected width: number
  protected height: number
  protected innerMargin: number

  constructor(config: TextBoxComponentConfig) {
    super(config)
    this.text = config.text
    this.font = config.font
    this.textColor = config.textColor ?? [0, 0, 0, 1]
    this.backgroundColor = config.backgroundColor ?? [0, 0, 0, 0.5]
    this.outlineColor = config.outlineColor ?? [1, 1, 1, 1]
    this.cornerRadius = config.cornerRadius ?? 5
    this.outlineWidth = config.outlineWidth ?? 1
    this.scale = config.scale ?? 1.0
    this.maxWidth = config.maxWidth ?? 0
    this.innerMargin = config.innerMargin ?? 15

    const size = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    this.width = size[0]
    this.height = size[1]
    this.bounds = [this.position[0], this.position[1], this.width, this.height]
  }
  getForegroundColor(): Color {
    return this.textColor
  }
  setForegroundColor(color: Color): void {
    this.textColor = color
  }
  handleResize?: (() => void) | undefined
  handleWheelScroll?: ((event: WheelEvent) => void) | undefined

  fitBounds(targetBounds: Vec4): void {
    super.fitBounds(targetBounds)
    this.updateBounds()
  }

  updateBounds(): void {
    const size = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    
    const dpr = window.devicePixelRatio || 1
    let scale = this.scale
    scale *= dpr
    const textHeight = this.font.getTextHeight(this.text, scale)
    const wrappedSize = this.font.getWordWrappedSize(this.text, scale, this.maxWidth)
    const rectWidth = wrappedSize[0] + 2 * this.innerMargin * scale + textHeight
    const rectHeight = wrappedSize[1] + 4 * this.innerMargin * scale
    this.width = rectWidth
    this.height = rectHeight
    this.setBounds([this.position[0], this.position[1], rectWidth, rectHeight])
  }

  getBounds(): Vec4 {
    this.updateBounds()
    return this.bounds
  }

  draw(renderer: UIKRenderer): void {    
    renderer.drawTextBox({font: this.font, xy: this.position, text: this.text, fillColor: this.backgroundColor, roundness: this.cornerRadius, scale: this.scale, maxWidth: this.maxWidth, fontOutlineColor: this.outlineColor})
  }

  getTextColor(): Color {
    return this.textColor
  }

  setTextColor(color: Color): void {
    this.textColor = color
  }

  getBackgroundColor(): Color {
    return this.backgroundColor
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color
  }

  getBorderColor(): Color {
    return this.outlineColor
  }

  setBorderColor(color: Color): void {
    this.outlineColor = color
  }

  getBorderRadius(): number {
    return this.cornerRadius
  }

  setBorderRadius(radius: number): void {
    this.cornerRadius = radius
  }

  getBorderWidth(): number {
    return this.outlineWidth
  }

  setBorderWidth(width: number): void {
    this.outlineWidth = width
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      className: 'TextBoxComponent',
      position: Array.from(this.position),
      text: this.text,
      fontId: this.font.id,
      textColor: Array.from(this.textColor),
      backgroundColor: Array.from(this.backgroundColor),
      borderColor: Array.from(this.outlineColor),
      borderRadius: this.cornerRadius,
      borderWidth: this.outlineWidth,
      scale: this.scale,
      maxWidth: this.maxWidth,
      width: this.width,
      height: this.height
    }
  }

  public static fromJSON(data: any, fonts: { [key: string]: UIKFont }): TextBoxComponent {
    const font = fonts[data.fontId]
    if (!font) {
      throw new Error(`Font with ID ${data.fontId} not found`)
    }

    const config: TextBoxComponentConfig = {
      className: 'TextBoxComponent',
      position: data.position || [0, 0],
      text: data.text || '',
      font,
      textColor: data.textColor || [0, 0, 0, 1],
      // backgroundColor: data.backgroundColor || [0, 0, 0, 0.5],
      // borderColor: data.borderColor || [1, 1, 1, 1],
      // borderRadius: data.borderRadius || 5,
      // borderWidth: data.borderWidth || 1,
      scale: data.scale || 1.0,
      maxWidth: data.maxWidth || 0
    }

    const component = new TextBoxComponent(config)
    component.width = data.width ?? component.font.getTextWidth(config.text, config.scale)
    component.height = data.height ?? component.font.getTextHeight(config.text, config.scale)
    const position = Array.isArray(config.position) ? config.position : [0, 0]
    component.bounds = [position[0], position[1], component.width, component.height]

    return component
  }
}

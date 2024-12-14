import { IColorable, TextComponentConfig } from '../interfaces'
import { UIKRenderer } from '../uikrenderer'
import { Color, Vec4 } from '../types'
import { UIKFont } from '../assets/uikfont'
import { BaseUIComponent } from './base-ui-component'

export class TextComponent extends BaseUIComponent implements IColorable {
  protected textColor: Color
  protected backgroundColor: Color = [0, 0, 0, 1]
  protected foregroundColor: Color = [1, 1, 1, 1]
  protected text: string
  protected font: UIKFont
  protected maxWidth: number
  protected width: number
  protected height: number

  constructor(config: TextComponentConfig) {
    super(config)
    this.text = config.text
    this.font = config.font
    this.textColor = config.textColor ?? [0, 0, 0, 1]
    this.scale = config.scale ?? 1.0
    this.maxWidth = config.maxWidth ?? 0

    const size = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    this.width = size[0]
    this.height = size[1]
    this.bounds = [this.position[0], this.position[1], this.width, this.height]
    this.className = 'TextComponent'    
  }

  fitBounds(targetBounds: Vec4): void {
    const targetWidth = targetBounds[2]
    const targetHeight = targetBounds[3]

    // Set the maxWidth to the available width within the bounds
    this.maxWidth = targetWidth

    // Calculate wrapped text dimensions based on new maxWidth
    const size = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    this.width = size[0]
    this.height = size[1]

    // Calculate scaling factors for the bounds
    const scaleX = targetWidth / this.width
    const scaleY = targetHeight / this.height

    // Use the smaller of the two scales to ensure text fits within the bounds
    const newScale = Math.min(scaleX, scaleY, this.scale)
    this.setScale(newScale)

    // Recalculate dimensions with the adjusted scale
    const wordWrappedSize = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    this.width = wordWrappedSize[0]
    this.height = wordWrappedSize[1]

    // Center the text within the bounds
    const offsetX = targetBounds[0] // + (targetWidth - this.width) / 2
    const offsetY = targetBounds[1] // + (targetHeight - this.height) / 2

    this.setPosition([offsetX, offsetY])
    this.setBounds([offsetX, offsetY, this.width, this.height])
}


  updateBounds(): void {
    const size = this.font.getWordWrappedSize(this.text, this.scale, this.maxWidth)
    this.width = size[0]
    this.height = size[1]
    this.setBounds([this.position[0], this.position[1], size[0], size[1]])
  }

  getBounds(): Vec4 {
    this.updateBounds()
    return this.bounds
  }

  draw(renderer: UIKRenderer): void {
    renderer.drawText({
      font: this.font,
      position: this.position,
      text: this.text,
      scale: this.scale,
      color: this.textColor,
      maxWidth: this.maxWidth
    })
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

  getForegroundColor(): Color {
    return this.foregroundColor
  }

  setForegroundColor(color: Color): void {
    this.foregroundColor = color
  }

  toJSON(): object {
    return {
      ...super.toJSON(), // Serialize base properties from BaseUIComponent
      className: 'TextComponent', // Class name for identification
      position: Array.from(this.position), // Convert Vec2 to array
      text: this.text, // Serialize the text string
      fontId: this.font.id, // Reference to the font by ID
      textColor: Array.from(this.textColor), // Convert Color to array
      backgroundColor: Array.from(this.backgroundColor), // Convert Color to array
      foregroundColor: Array.from(this.foregroundColor), // Convert Color to array
      scale: this.scale, // Serialize scale
      maxWidth: this.maxWidth, // Serialize maxWidth
      width: this.width, // Serialize width
      height: this.height // Serialize height
    }
  }

  public static fromJSON(data: any, fonts: { [key: string]: UIKFont }): TextComponent {
    const font = fonts[data.fontId]
    if (!font) {
      throw new Error(`Font with ID ${data.fontId} not found`)
    }

    const config: TextComponentConfig = {
      className: 'TextComponent',
      position: data.position || [0, 0],
      text: data.text || '',
      font,
      textColor: data.textColor || [0, 0, 0, 1],
      scale: data.scale || 1.0,
      maxWidth: data.maxWidth || 0
    }

    const component = new TextComponent(config)
    component.backgroundColor = data.backgroundColor || [0, 0, 0, 1]
    component.foregroundColor = data.foregroundColor || [1, 1, 1, 1]
    component.width = data.width ?? component.font.getTextWidth(config.text, config.scale)
    component.height = data.height ?? component.font.getTextHeight(config.text, config.scale)
    const position = (Array.isArray(config.position)) ? config.position : [0, 0]
    component.bounds = [position[0], position[1], component.width, component.height]

    return component
  }
}

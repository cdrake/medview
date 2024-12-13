import { UIKRenderer } from '../uikrenderer'
import { Vec2, Color } from '../types'
import { SliderComponentConfig } from '../interfaces'
import { BaseUIComponent } from './base-ui-component'
import { UIKFont } from '../assets/uikfont'

export class SliderComponent extends BaseUIComponent {
  private size: Vec2
  private value: number
  private min: number
  private max: number
  private trackColor: Color
  private fillColor: Color
  private knobColor: Color
  private shadowColor: Color
  private shadowOffset: Vec2
  private shadowBlur: number
  private valueTextColor: Color
  private font: UIKFont
  private isDragging: boolean = false

  constructor(config: SliderComponentConfig) {
    super(config)

    this.position = config.position!
    this.size = config.size
    this.value = config.value ?? 0.5
    this.min = config.min ?? 0
    this.max = config.max ?? 1
    this.trackColor = config.trackColor || [0.8, 0.8, 0.8, 1.0]
    this.fillColor = config.fillColor || [0.0, 0.5, 1.0, 1.0]
    this.knobColor = config.knobColor || [1.0, 1.0, 1.0, 1.0]
    this.shadowColor = config.shadowColor || [0.0, 0.0, 0.0, 0.2]
    this.shadowOffset = config.shadowOffset || [0.02, 0.02]
    this.shadowBlur = config.shadowBlur ?? 0.05
    this.valueTextColor = config.valueTextColor || [0.0, 0.5, 1.0, 1.0]
    this.font = config.font // Font is required for drawing the value text

    // Initialize bounds based on position and size
    this.setBounds([this.position[0], this.position[1], this.size[0], this.size[1]])
  }

  // Start dragging when pointer is down on the knob
  public handlePointerDown(event: PointerEvent): void {
    const pointerPosition = this.getPointerPosition(event)
    if (pointerPosition && this.isPointerOnKnob(pointerPosition)) {
      this.isDragging = true
    }
  }

  // Stop dragging when pointer is released
  public handlePointerUp(): void {
    this.isDragging = false
  }

  // Handle pointer move to adjust value when dragging
  public handlePointerMove(event: PointerEvent): void {
    if (this.isDragging) {
      const pointerPosition = this.getPointerPosition(event)
      if (pointerPosition) {
        this.updateValueFromPointer(pointerPosition)
      }
    }
  }

  // Helper to calculate pointer position relative to the slider
  private getPointerPosition(event: PointerEvent): Vec2 | null {
    const canvas = event.target as HTMLCanvasElement
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / (rect.width / canvas.width)
    const y = (event.clientY - rect.top) / (rect.height / canvas.height)

    return [x, y]
  }

  // Checks if the pointer is on the knob
  private isPointerOnKnob(pointerPosition: Vec2): boolean {
    const knobX = this.position[0] + ((this.value - this.min) / (this.max - this.min)) * this.size[0]
    const knobY = this.position[1] + this.size[1] / 2
    const knobRadius = this.size[1] / 2

    const dx = pointerPosition[0] - knobX
    const dy = pointerPosition[1] - knobY
    return Math.sqrt(dx * dx + dy * dy) <= knobRadius
  }

  // Updates the slider value based on pointer position
  private updateValueFromPointer(pointerPosition: Vec2): void {
    const posX = this.position[0]
    const sizeX = this.size[0]

    // Calculate the relative position of the pointer within the slider track
    const relativePosition = Math.max(0, Math.min(1, (pointerPosition[0] - posX) / sizeX))
    this.value = this.min + relativePosition * (this.max - this.min)
    if (this.requestRedraw) {
      this.requestRedraw() // Trigger a redraw to reflect the updated slider value
    }
  }

  // Static drawSlider method
  public static drawSlider({
    renderer,
    font,
    position,
    size,
    value = 0.5,
    min = 0,
    max = 1,
    trackColor = [0.8, 0.8, 0.8, 1.0],
    fillColor = [0.0, 0.5, 1.0, 1.0],
    knobColor = [1.0, 1.0, 1.0, 1.0],
    shadowColor = [0.0, 0.0, 0.0, 0.2],
    shadowOffset = [0.02, 0.02],
    shadowBlur = 0.05,
    valueTextColor = [0.0, 0.5, 1.0, 1.0],
    scale = 1.0
  }: {
    renderer: UIKRenderer
    font: UIKFont
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
    scale?: number
  }): void {
    // Extract position and size
    const [posX, posY] = position
    const [width, height] = size
  
    // Adjust track height to be thinner than the knob
    const trackHeight = height * 0.5
    const trackY = posY + (height - trackHeight) / 2
  
    // Ensure the value is clamped between min and max
    value = Math.max(min, Math.min(max, value))
    const valueRatio = (value - min) / (max - min)
  
    // Draw the track (background)
    renderer.drawRoundedRect({
      bounds: [posX, trackY, width, trackHeight],
      fillColor: trackColor,
      outlineColor: [0, 0, 0, 0],
      cornerRadius: trackHeight / 2,
      thickness: 0 // Solid track
    })
  
    // Draw the filled portion of the track
    renderer.drawRoundedRect({
      bounds: [posX, trackY, width * valueRatio, trackHeight],
      fillColor: new Float32Array(fillColor),
      outlineColor: [0, 0, 0, 0],
      cornerRadius: trackHeight / 2,
      thickness: 0
    })
  
    // Calculate knob position based on value
    const knobX = posX + valueRatio * width - height / 2
    const knobY = posY
  
    // Draw the knob
    renderer.drawCircle({
      leftTopWidthHeight: [knobX, knobY, height, height],
      circleColor: new Float32Array(knobColor),
      shadowColor: new Float32Array(shadowColor),
      shadowOffset: new Float32Array(shadowOffset),
      shadowBlur,
      fillPercent: 1.0
    })
  
    // Adjust text position below the slider and center it using font.getTextWidth
    const valueText = value.toFixed(2)
    const textWidth = font.getTextWidth(valueText, scale)
    const textX = posX + width * valueRatio - textWidth / 2
    const textY = posY + height + font.getTextHeight(valueText, scale) * 1.3
  
    // Draw the value text
    renderer.drawRotatedText({
      font,
      xy: [textX, textY],
      str: valueText,
      scale,
      color: valueTextColor,
      outlineColor: [0, 0, 0, 1.0],
      outlineThickness: 2
    })
  }
  
  

  // Instance draw method
  draw(renderer: UIKRenderer): void {
    SliderComponent.drawSlider({
      renderer,
      font: this.font,
      position: this.position,
      size: this.size,
      value: this.value,
      min: this.min,
      max: this.max,
      trackColor: this.trackColor,
      fillColor: this.fillColor,
      knobColor: this.knobColor,
      shadowColor: this.shadowColor,
      shadowOffset: this.shadowOffset,
      shadowBlur: this.shadowBlur,
      valueTextColor: this.valueTextColor
    })
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      className: 'SliderComponent',
      size: Array.from(this.size),
      value: this.value,
      min: this.min,
      max: this.max,
      trackColor: Array.from(this.trackColor),
      fillColor: Array.from(this.fillColor),
      knobColor: Array.from(this.knobColor),
      shadowColor: Array.from(this.shadowColor),
      shadowOffset: Array.from(this.shadowOffset),
      shadowBlur: this.shadowBlur,
      valueTextColor: Array.from(this.valueTextColor),
      fontId: this.font.id // Serialize the font by ID
    }
  }

  public static fromJSON(data: any, fonts: { [key: string]: UIKFont }): SliderComponent {
    const font = fonts[data.fontId]
    if (!font) {
      throw new Error(`Font with ID ${data.fontId} not found`)
    }

    const config: SliderComponentConfig = {
      className: 'SliderComponent',
      position: data.position || [0, 0],
      size: data.size || [200, 20],
      value: data.value ?? 0.5,
      min: data.min ?? 0,
      max: data.max ?? 1,
      trackColor: data.trackColor || [0.8, 0.8, 0.8, 1.0],
      fillColor: data.fillColor || [0.0, 0.5, 1.0, 1.0],
      knobColor: data.knobColor || [1.0, 1.0, 1.0, 1.0],
      shadowColor: data.shadowColor || [0.0, 0.0, 0.0, 0.2],
      shadowOffset: data.shadowOffset || [0.02, 0.02],
      shadowBlur: data.shadowBlur ?? 0.05,
      valueTextColor: data.valueTextColor || [0.0, 0.5, 1.0, 1.0],
      font,
      isVisible: data.isVisible ?? true,
      zIndex: data.zIndex ?? 0
    }

    const component = new SliderComponent(config)
    return component
  }
}

import { UIKRenderer } from '../uikrenderer'
import { Vec2, Vec3, Color, LineTerminator } from '../types'
import { IProjectable2D, RulerComponentConfig } from '../interfaces'
import { UIKFont } from '../assets/uikfont'
import { BaseUIComponent } from './baseuicomponent'

export class RulerComponent extends BaseUIComponent implements IProjectable2D {
  modelPlanePoints: Vec2[] // Array to hold start and end points in model space
  private projectedStart: Vec2 // Projected screen start point
  private projectedEnd: Vec2 // Projected screen end point
  private units: string
  private font: UIKFont
  private textColor: Color
  private lineColor: Color
  private lineThickness: number
  private offset: number
  private showTickmarkNumbers: boolean

  constructor(config: RulerComponentConfig) {
    super(config) // Pass BaseUIComponentConfig properties to the parent constructor

    this.modelPlanePoints = [config.startPoint, config.endPoint]
    this.units = config.units
    this.font = config.font
    this.textColor = config.textColor ?? [1, 0, 0, 1]
    this.lineColor = config.lineColor ?? [0, 0, 0, 1]
    this.lineThickness = config.lineThickness ?? 1
    this.offset = config.offset ?? 40
    this.scale = config.scale ?? 1.0
    this.showTickmarkNumbers = config.showTickmarkNumbers ?? true
    this.projectedStart = [0, 0]
    this.projectedEnd = [0, 0]
  }

  // Set the projected screen points for the start and end of the ruler
  setScreenPoints(screenPoints: Vec3[]): void {
    if (screenPoints.length > 1) {
      this.projectedStart = [screenPoints[0][0], screenPoints[0][1]]
      this.projectedEnd = [screenPoints[1][0], screenPoints[1][1]]
    }
  }

  // Calculate the length based on the distance between projectedStart and projectedEnd
  private calculateLength(): number {
    const deltaX = this.modelPlanePoints[1][0] - this.modelPlanePoints[0][0]
    const deltaY = this.modelPlanePoints[1][1] - this.modelPlanePoints[0][1]
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  /**
   * Draws a ruler with length text, units, and hash marks.
   * @param params - Object containing parameters for rendering the ruler.
   * @param params.renderer - Renderer use to draw primitives.
   * @param params.pointA - Start point of the ruler.
   * @param params.pointB - End point of the ruler.
   * @param params.length - Length value to display.
   * @param params.units - Units to display alongside the length.
   * @param params.font - Font object for rendering text.
   * @param params.textColor - Color of the text. Defaults to red.
   * @param params.lineColor - Color of the ruler lines. Defaults to black.
   * @param params.lineThickness - Thickness of the ruler lines. Defaults to 1.
   * @param params.offset - Offset distance for parallel line and text. Defaults to 40.
   * @param params.scale - Scale factor for text size. Defaults to 1.0.
   */
  public static drawRuler({
    renderer,
    pointA,
    pointB,
    length,
    units,
    font,
    textColor = [1, 0, 0, 1],
    outlineColor = [1, 1, 1, 1],
    lineColor = [0, 0, 0, 1],
    lineThickness = 1,
    offset = 40,
    scale = 1.0,
    showTickmarkNumbers = true
  }: {
    renderer: UIKRenderer
    pointA: Vec2
    pointB: Vec2
    length: number
    units: string
    font: UIKFont
    textColor?: Color
    outlineColor?: Color
    lineColor?: Color
    lineThickness?: number
    offset?: number
    scale?: number
    showTickmarkNumbers?: boolean
  }): void {
    // Calculate the angle between the points
    const deltaX = pointB[0] - pointA[0]
    const deltaY = pointB[1] - pointA[1]
    const actualLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    let angle = Math.atan2(deltaY, deltaX)

    // Calculate the midpoint
    const midPoint: Vec2 = [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2]

    // Format the length text
    const text = `${length.toFixed(2)}`

    // Adjust the text position to ensure it's centered above the parallel line
    const textWidth = font.getTextWidth(text, scale)
    const textHeight = font.getTextHeight(text, scale)
    const halfTextWidth = textWidth / 2
    const halfTextHeight = textHeight / 2
    let textPosition: Vec2 = [
      midPoint[0] - halfTextWidth * Math.cos(angle) + (halfTextHeight + offset) * Math.sin(angle),
      midPoint[1] - halfTextWidth * Math.sin(angle) - (halfTextHeight + offset) * Math.cos(angle)
    ]

    // Ensure text is not upside down
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      angle += Math.PI
      textPosition = [
        midPoint[0] -
          (textWidth / 2) * Math.cos(angle) -
          (textHeight / 2 + offset) * Math.sin(angle) -
          offset * Math.sin(angle),
        midPoint[1] -
          (textWidth / 2) * Math.sin(angle) +
          (textHeight / 2 + offset) * Math.cos(angle) +
          offset * Math.cos(angle)
      ]
    }

    // Draw the rotated length text at the adjusted position
    renderer.drawRotatedText({ font, xy: textPosition, str: text, scale, color: textColor, outlineColor, rotation: angle })

    // Draw the units at half the requested scale
    const unitsScale = scale / 2
    const unitsTextWidth = font.getTextWidth(units, unitsScale)
    const unitsTextPosition: Vec2 = [
      textPosition[0] + (textWidth + unitsTextWidth / 4) * Math.cos(angle),
      textPosition[1] + (textWidth + unitsTextWidth / 4) * Math.sin(angle)
    ]
    renderer.drawRotatedText({
      font,
      xy: unitsTextPosition,
      str: units,
      scale: unitsScale,
      color: textColor,
      outlineColor,
      rotation: angle
    })

    // Draw a parallel line of equal length to the original line
    const parallelPointA: Vec2 = [
      pointA[0] + (offset * deltaY) / actualLength,
      pointA[1] - (offset * deltaX) / actualLength
    ]
    const parallelPointB: Vec2 = [
      pointB[0] + (offset * deltaY) / actualLength,
      pointB[1] - (offset * deltaX) / actualLength
    ]
    renderer.drawLine({
      startEnd: [parallelPointA[0], parallelPointA[1], parallelPointB[0], parallelPointB[1]],
      thickness: lineThickness,
      color: lineColor
    })

    // Draw lines terminating in arrows from the ends of the parallel line to points A and B
    renderer.drawLine({
      startEnd: [parallelPointA[0], parallelPointA[1], pointA[0], pointA[1]],
      thickness: lineThickness,
      color: lineColor,
      terminator: LineTerminator.ARROW
    })
    renderer.drawLine({
      startEnd: [parallelPointB[0], parallelPointB[1], pointB[0], pointB[1]],
      thickness: lineThickness,
      color: lineColor,
      terminator: LineTerminator.ARROW
    })

    // Draw perpendicular hash marks like a ruler
    const numHashMarks = Math.floor(length)
    const hashLength = 8
    const parallelOffset = offset / 4

    for (let i = 1; i <= numHashMarks; i++) {
      const t = i / length
      const hashPoint: Vec2 = [pointA[0] + t * deltaX, pointA[1] + t * deltaY]
      const currentHashLength = i % 5 === 0 ? hashLength * 2 : hashLength
      const perpOffsetX = (deltaY / actualLength) * parallelOffset
      const perpOffsetY = (-deltaX / actualLength) * parallelOffset

      if (i % 5 === 0) {
        const hashText = `${i}`
        const hashTextScale = scale / 5
        const hashTextWidth = font.getTextWidth(hashText, hashTextScale)
        const hashTextPosition: Vec2 = [
          hashPoint[0] +
            perpOffsetX -
            (hashTextWidth / 2) * Math.cos(angle) +
            (currentHashLength / 4) * Math.sin(angle),
          hashPoint[1] + perpOffsetY - (hashTextWidth / 2) * Math.sin(angle) - (currentHashLength / 4) * Math.cos(angle)
        ]
        if (showTickmarkNumbers) {
          renderer.drawRotatedText({
            font,
            xy: hashTextPosition,
            str: hashText,
            scale: hashTextScale,
            color: textColor,
            outlineColor,
            rotation: angle
          })
        }
      }

      const hashStart: Vec2 = [
        hashPoint[0] + perpOffsetX - (currentHashLength / 2) * Math.cos(angle + Math.PI / 2),
        hashPoint[1] + perpOffsetY - (currentHashLength / 2) * Math.sin(angle + Math.PI / 2)
      ]
      const hashEnd: Vec2 = [
        hashPoint[0] + perpOffsetX + (currentHashLength / 2) * Math.cos(angle + Math.PI / 2),
        hashPoint[1] + perpOffsetY + (currentHashLength / 2) * Math.sin(angle + Math.PI / 2)
      ]
      renderer.drawLine({ startEnd: [hashStart[0], hashStart[1], hashEnd[0], hashEnd[1]], thickness: 1, color: lineColor })
    }
  }

  draw(renderer: UIKRenderer): void {
    // Calculate the dynamic length based on projected screen points
    const length = this.calculateLength()

    // // Draw the ruler component on the screen using projected points
    // renderer.drawRuler({
    //   pointA: this.projectedStart,
    //   pointB: this.projectedEnd,
    //   length,
    //   units: this.units,
    //   font: this.font,
    //   textColor: this.textColor,
    //   lineColor: this.lineColor,
    //   lineThickness: this.lineThickness,
    //   offset: this.offset,
    //   scale: this.scale, // Pass scale from BaseUIComponent
    //   showTickmarkNumbers: this.showTickmarkNumbers
    // })
    RulerComponent.drawRuler({
        renderer,
        pointA: this.projectedStart,
        pointB: this.projectedEnd,
        length,
        units: this.units,
        font: this.font,
        textColor: this.textColor,
        lineColor: this.lineColor,
        lineThickness: this.lineThickness,
        offset: this.offset,
        scale: this.scale, // Pass scale from BaseUIComponent
        showTickmarkNumbers: this.showTickmarkNumbers
      })
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      className: 'RulerComponent',
      modelPlanePoints: this.modelPlanePoints,
      units: this.units,
      fontId: this.font.id, // Reference the font by ID
      textColor: Array.from(this.textColor),
      lineColor: Array.from(this.lineColor),
      lineThickness: this.lineThickness,
      offset: this.offset
    }
  }

  public static fromJSON(data: any, fonts: { [key: string]: UIKFont }): RulerComponent {
    const font = fonts[data.fontId]
    if (!font) {
      throw new Error(`Font with ID ${data.fontId} not found`)
    }

    const config: RulerComponentConfig = {
      className: 'RulerComponent',
      startPoint: data.modelPlanePoints[0],
      endPoint: data.modelPlanePoints[1],
      units: data.units,
      font,
      textColor: data.textColor,
      lineColor: data.lineColor,
      lineThickness: data.lineThickness,
      offset: data.offset,
      scale: data.scale ?? 1.0,
      position: data.position, // Optional position from BaseUIComponentConfig
      isVisible: data.isVisible ?? true,
      zIndex: data.zIndex ?? 0
    }

    return new RulerComponent(config)
  }
}

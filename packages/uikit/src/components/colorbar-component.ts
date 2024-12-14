import { UIKRenderer } from '../uikrenderer.js'
import { Vec2, Vec4, Color, HorizontalAlignment } from '../types.js'
import { ColorTables } from '../colortables.js'
import { ColorbarComponentConfig } from '../interfaces.js'
import { BaseUIComponent } from './base-ui-component.js'
import { UIKFont } from '../assets/uikfont.js'

export class ColorbarComponent extends BaseUIComponent {
  private gl: WebGL2RenderingContext
  private gradientTexture: WebGLTexture | null = null
  private minMax: [number, number]
  private tickSpacing: number
  private tickLength: number
  private tickColor: Color
  private labelColor: Color
  private font: UIKFont
  private _colormapName: string
  protected static colorTables: ColorTables

  constructor(config: ColorbarComponentConfig) {
    super(config)
    this.gl = config.gl
    this.minMax = config.minMax ?? [0, 1]
    this.tickSpacing = config.tickSpacing ?? 1
    this.tickLength = config.tickLength ?? 5
    this.tickColor = config.tickColor ?? [0, 0, 0, 1] // Default black
    this.labelColor = config.labelColor ?? [0, 0, 0, 1] // Default black
    this.font = config.font
    this._colormapName = config.colormapName ?? 'viridis'    
    this.bounds = config.bounds
    
  }

  async init() {
    if (!ColorbarComponent.colorTables) {
      ColorbarComponent.colorTables = new ColorTables()
      await ColorbarComponent.colorTables.loadColormaps()
    }
    this.gradientTexture = this.generateColorMapTexture(this.gl, this._colormapName)
  }

  private generateColorMapTexture(gl: WebGL2RenderingContext, colormapName: string): WebGLTexture {
    const lut = ColorbarComponent.colorTables.colormap(colormapName, false)
    const texture = gl.createTexture() as WebGLTexture
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lut)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return texture
  }

  draw(renderer: UIKRenderer): void {
    const position: Vec2 = [this.bounds[0] * this.scale, this.bounds[1] * this.scale]
    const size: Vec2 = [this.bounds[2] * this.scale, this.bounds[3] * this.scale]

    renderer.drawColorbar({
      position,
      size,
      gradientTexture: this.gradientTexture!,
      minMax: this.minMax,
      tickLength: this.tickLength,
      tickColor: this.tickColor,
      labelColor: this.labelColor,
      font: this.font,
      labelAlignment: HorizontalAlignment.CENTER
    })
  }

  get colormapName(): string {
    return this._colormapName
  }

  set colormapName(value: string) {
    if (this._colormapName !== value) {
      this._colormapName = value
      this.gradientTexture = this.generateColorMapTexture(this.gl, value)
      if (this.requestRedraw) {
        this.requestRedraw()
      }
    }
  }

  setMinMax(newMinMax: [number, number]): void {
    this.minMax = newMinMax
    if (this.requestRedraw) {
      this.requestRedraw()
    }
  }

  setBounds(bounds: [number, number, number, number]): void {
    super.setBounds(bounds)
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      className: 'ColorbarComponent',
      minMax: this.minMax,
      colormapName: this._colormapName,
      bounds: Array.from(this.bounds),
      tickSpacing: this.tickSpacing,
      tickLength: this.tickLength,
      tickColor: this.tickColor,
      labelColor: this.labelColor
    }
  }
}

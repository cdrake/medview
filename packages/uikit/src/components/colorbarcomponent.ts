import { UIKRenderer } from '../uikrenderer.js'
import { Vec2 } from '../types.js'
import { ColorTables } from '../colortables'
import { ColorbarComponentConfig } from '../interfaces.js'
import { BaseUIComponent } from './baseuicomponent.js'

export class ColorbarComponent extends BaseUIComponent {
  private gl: WebGL2RenderingContext
  private gradientTexture: WebGLTexture
  private minMax: [number, number]
  private _colormapName: string // Private variable for colormap name
  protected static colorTables: ColorTables

  constructor(config: ColorbarComponentConfig) {    
    super(config)
    this.gl = config.gl
    this.minMax = config.minMax ?? [0, 1]
    this._colormapName = config.colormapName ?? 'viridis'
    this.gradientTexture = this.generateColorMapTexture(this.gl, this._colormapName)
    this.bounds = config.bounds

    if(!ColorbarComponent.colorTables) {
      ColorbarComponent.colorTables = new ColorTables()
    }

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

    // renderer.drawColorbar({
    //   position,
    //   size,
    //   gradientTexture: this.gradientTexture
    //   // minMax: this.minMax
    // })
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
      bounds: Array.from(this.bounds)
    }
  }
}

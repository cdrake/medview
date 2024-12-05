import { UIKShader } from '../uikshader.js'
import bitmapVertShader from '../shaders/vert/bitmap.vert.glsl'
import bitmapFragShader from '../shaders/frag/bitmap.frag.glsl'
import { UIKAsset } from './uikasset.js'

export class UIKSVG extends UIKAsset {
  public bitmapShader: UIKShader
  private svgContent: string | null = null

  constructor(gl: WebGL2RenderingContext) {
    super(gl)
    // Use the same shader as UIKBitmap
    this.bitmapShader = new UIKShader(gl, bitmapVertShader, bitmapFragShader)
  }

  /**
   * Load an SVG from a URL and generate a texture.
   * @param svgUrl The URL of the SVG file.
   */
  public async loadSVG(svgUrl: string): Promise<void> {
    const response = await fetch(svgUrl)
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.statusText}`)
    }

    this.svgContent = await response.text()

    // Create a Blob from the SVG content and convert it to a texture
    const blob = new Blob([this.svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    try {
      await this.loadTexture(url)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Converts the SVG instance to a JSON representation.
   * @returns An object containing the SVG data.
   */
  public toJSON(): object {
    return {
      id: this.id,
      className: 'UIKSVG',
      width: this.width,
      height: this.height,
      svgContent: this.svgContent
    }
  }

  /**
   * Creates a UIKSVG instance from a JSON object.
   * @param gl The WebGL2 rendering context.
   * @param json The JSON object representing the SVG.
   * @returns A promise resolving to a UIKSVG instance.
   */
  public static async fromJSON(gl: WebGL2RenderingContext, json: any): Promise<UIKSVG> {
    const svg = new UIKSVG(gl)
    svg.id = json.id
    svg.width = json.width
    svg.height = json.height
    svg.svgContent = json.svgContent || null

    if (svg.svgContent) {
      // Create a Blob from the SVG content and convert it to a texture
      const blob = new Blob([svg.svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      try {
        await svg.loadTexture(url)
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    return svg
  }
}

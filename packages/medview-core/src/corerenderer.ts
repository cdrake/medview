import { UIKRenderer, UIKFont, Vec2, Color, Vec4, LineTerminator, LineStyle, ColorTables, UIKSVG, UIKBitmap } from '@medview/uikit'
const fontImage = '/fonts/NotoSansHebrew-VariableFont_wght.png'
const fontMetrics = '/fonts/NotoSansHebrew-VariableFont_wght.json'

export class CoreRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private renderer: UIKRenderer
  private defaultFont: UIKFont | null = null
  private hebrewFont: UIKFont | null = null
  private colorTables: ColorTables = new ColorTables()
  private colorMap: string = "viridis"; // viridis
  private paperClip: UIKSVG | null = null
  private bitmap: UIKBitmap | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext

    if (!this.gl) {
      throw new Error('WebGL2 is not supported in this browser')
    }

    // Initialize the UIKRenderer
    this.renderer = new UIKRenderer(this.gl)

    // Load the default font
    // this.defaultFont = new UIKFont(this.gl)
    // this.defaultFont.loadDefaultFont().then(() => {
    //   console.log('Default font loaded successfully')
    //   this.hebrewFont = new UIKFont(this.gl)
    //   this.hebrewFont.loadFont(fontImage, fontMetrics).then(() => {
    //     console.log('Heebo font loaded successfully')
    //     this.draw() // Redraw once the font is loaded
    //   })
      
    // })
    this.init().then(() => this.draw())
  }

  async init() {
    this.defaultFont = new UIKFont(this.gl)
    await this.defaultFont.loadDefaultFont()
    this.hebrewFont = new UIKFont(this.gl)
    await this.hebrewFont.loadFont(fontImage, fontMetrics)
    await this.colorTables.loadColormaps()
    this.paperClip = new UIKSVG(this.gl)
    await this.paperClip.loadSVG('/svg/paper-clip.svg')
    this.bitmap = new UIKBitmap(this.gl)
    await this.bitmap.loadBitmap('/images/rorden.png')
  }

  /**
 * Main draw method that demonstrates rendering shapes, rotated text, and a ruler.
 */
async draw(): Promise<void> {
    if (!this.defaultFont!.isFontLoaded) {
      return
    }
  
    // Clear the canvas with a black background
    this.clear([0.5, 0.5, 0.5, 1])
  
    this.renderer.drawMTSDFText({
      font: this.defaultFont!, // Your loaded UIKFont instance
      xy: [100, 300], // Starting position
      str: 'Hello, jay and pique MTSDF!',
      scale: 1.0,
      color: [1.0, 0.0, 0.0, 1.0], // Red color
      outlineColor: [0.0, 0.0, 0.0, 1.0], // Black outline
      outlineWidthAbsolute: 0.5,
      outlineWidthRelative: 0.05,
      outlineBlur: 0.0,
      threshold: 0.5,
      outBias: 0.25,
      gamma: 0.0,
    })
  //   this.renderer.drawRotatedText({
  //     font: this.defaultFont!, // A loaded UIKFont instance
  //     xy: [200, 150], // Starting position of the text
  //     str: 'Hello, MTSDF!', // The text to render
  //     scale: 1.0, // Scale of the text
  //     color: [0.0, 0.5, 1.0, 1.0], // Text color (blue)
  //     rotation: Math.PI / 6, // Rotation in radians (30 degrees)
  //     outlineColor: [1.0, 1.0, 1.0, 1.0], // Outline color (white)
  //     outlineThickness: 2, // Thickness of the outline
  //     maxWidth: 300 // Maximum width for text wrapping
  // })
  
    
    // this.renderer.drawMTSDFText({
    //   font: this.defaultFont!, // Instance of UIKFont, preloaded with MTSDF data
    //   xy: [500, 500], // Starting position for the text
    //   str: 'Hello, MedView!', // Text to render
    //   scale: 1.5, // Scale factor for the text
    //   color: [0.0, 1.0, 0.0, 1.0], // Green fill color with full opacity
    //   rotation: Math.PI / 6, // Rotate 30 degrees clockwise
    //   outlineColor: [0.0, 0.0, 0.0, 1.0], // Black outline color with full opacity
    //   maxWidth: 300, // Wrap text to fit within this width
    //   u_rounded_fonts: 0.0, // Sharp glyph corners
    //   u_rounded_outlines: 0.0, // Sharp outline corners
    //   u_threshold: 0.5, // Midpoint threshold for edge detection
    //   u_out_bias: 0.25, // Bias for glyph edges
    //   u_outline_width_absolute: 0.3, // Absolute outline width
    //   u_outline_width_relative: 0.05, // Relative outline width
    //   u_outline_blur: 0.0, // No blur
    //   u_gradient: 0.0, // No gradient effect
    //   u_gamma: 1.0 // Gamma correction factor
    // });
    

  }
  

  /**
   * Clears the canvas.
   * @param color - Optional background color.
   */
  clear(color: Color = [0, 0, 0, 1]): void {
    const { gl } = this
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  /**
   * Resizes the canvas and adjusts the WebGL viewport.
   * @param width - The new width of the canvas.
   * @param height - The new height of the canvas.
   */
  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }
}

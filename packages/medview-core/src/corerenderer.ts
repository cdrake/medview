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
    this.clear([1, 1, 1, 1])
  
    // Draw a triangle
    // this.renderer.drawTriangle({
    //   headPoint: [100, 600],
    //   baseMidPoint: [100, 800],
    //   baseLength: 200,
    //   color: [1, 0, 0, 1] // Red triangle
    // })
  
    // // Draw a circle
    // this.renderer.drawCircle({
    //   leftTopWidthHeight: [250, 700, 150, 150],
    //   circleColor: [0, 0, 1, 1], // Blue circle
    //   fillPercent: 1.0
    // })
  
    // // Draw a line
    // this.renderer.drawLine({
    //   startEnd: [200, 800, 600, 610],
    //   thickness: 5,
    //   color: [0, 1, 0, 1], // Green line
    //   style: LineStyle.SOLID,
    //   terminator: LineTerminator.ARROW
    // })
  
    // // Draw another triangle
    // this.renderer.drawTriangle({
    //   headPoint: [500, 600],
    //   baseMidPoint: [500, 800],
    //   baseLength: 200,
    //   color: [1, 1, 0, 1] // Yellow triangle
    // })
  
    // // Draw rotated text
    // this.renderer.drawRotatedText({
    //   font: this.defaultFont,
    //   xy: [100, 100], // Starting position of the text
    //   str: 'Hello, MedView!', // The string to render
    //   scale: 0.50, // Scale factor
    //   color: [0.3, 0.75, 0.75, 1.0], // Text color (orange)
    //   rotation: Math.PI / 6, // Rotation angle in radians (30 degrees)
    //   outlineColor: [0, 0, 0, 1], // Outline color (black)
    //   outlineThickness: 2 // Outline thickness
    // })
  
    // // Draw a ruler
    // this.renderer.drawRuler({
    //   pointA: [300, 500], // Starting point of the ruler
    //   pointB: [600, 500], // Ending point of the ruler
    //   length: 30.5, // Length value to display
    //   units: 'cm', // Units to display
    //   font: this.defaultFont, // Font for text
    //   textColor: [1, 0, 0, 1], // Red text
    //   lineColor: [1, 1, 1, 1], // Black ruler lines
    //   lineThickness: 2, // Thickness of the lines
    //   offset: 50, // Offset distance for parallel line and text
    //   scale: 1.0, // Scale factor for text
    //   showTickmarkNumbers: true // Show tickmark numbers
    // })

    // this.renderer.drawRotatedText({
    //   font: this.defaultFont!,
    //   xy: [500, 200],
    //   str: 'This is a long string that will wrap if it exceeds the maxWidth.',
    //   scale: 0.5,
    //   color: [1, 1, 1, 1],
    //   outlineColor: [0.25, 0.25, 1, 1],
    //   rotation: Math.PI / 6, // 30-degree rotation
    //   maxWidth: 300 // Wrap to fit within 300px
    // })

    // if(this.hebrewFont) {
    // this.renderer.drawRotatedText({
    //   font: this.hebrewFont,
    //   xy: [800, 500],
    //   str: 'שָׁלוֹם עֲלֵיכֶם',
    //   scale: 0.5,
    //   color: [1, 1, 1, 1],
    //   outlineColor: [0.25, 0.25, 1, 1],
    //   rotation: 0,//Math.PI / 6, // 30-degree rotation
    //   maxWidth: 300 // Wrap to fit within 300px
    // })
    // }
    // const gradientTexture = this.colorTables.generateColorMapTexture(this.gl, this.colorMap)
    // this.renderer.drawColorbar({position: [200, 500], size: [400, 50], gradientTexture})

    this.renderer.drawSVG({svgAsset: this.paperClip!, position: [200, 500], scale: 0.2})
    this.renderer.drawBitmap({bitmap: this.bitmap!, position: [500, 500], scale: 1.0})
  
  // this.renderer.drawLine({
  //   startEnd: [500, 500, 1000, 800],
  //   thickness: 5,
  //   color: [0, 1, 0, 1], // Green line
  //   style: LineStyle.SOLID,
  //   terminator: LineTerminator.ARROW
  // })
  
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

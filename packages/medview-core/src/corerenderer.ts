import { UIKRenderer, UIKFont, Vec2, Color, Vec4, LineTerminator, LineStyle } from '@medview/uikit'

export class CoreRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private renderer: UIKRenderer
  private defaultFont: UIKFont

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext

    if (!this.gl) {
      throw new Error('WebGL2 is not supported in this browser')
    }

    // Initialize the UIKRenderer
    this.renderer = new UIKRenderer(this.gl)

    // Load the default font
    this.defaultFont = new UIKFont(this.gl)
    this.defaultFont.loadDefaultFont().then(() => {
      console.log('Default font loaded successfully')
      this.draw() // Redraw once the font is loaded
    })
  }

  /**
   * Main draw method that demonstrates rendering shapes and rotated text.
   */
  draw(): void {
    if(!this.defaultFont.isFontLoaded) {
        return
    }
    // Clear the canvas with a black background
    this.clear([0, 0, 0, 1])

    // Draw a triangle
    this.renderer.drawTriangle({
      headPoint: [100, 600],
      baseMidPoint: [100, 800],
      baseLength: 200,
      color: [1, 0, 0, 1] // Red triangle
    })

    // Draw a circle
    this.renderer.drawCircle({
      leftTopWidthHeight: [250, 700, 150, 150],
      circleColor: [0, 0, 1, 1], // Blue circle
      fillPercent: 1.0
    })

    // Draw a line
    this.renderer.drawLine({
      startEnd: [200, 800, 600, 610],
      thickness: 5,
      color: [0, 1, 0, 1], // Green line
      style: LineStyle.SOLID,
      terminator: LineTerminator.ARROW
    })

    // // Draw another triangle
    this.renderer.drawTriangle({
      headPoint: [500, 600],
      baseMidPoint: [500, 800],
      baseLength: 200,
      color: [1, 1, 0, 1] // Yellow triangle
    })

     // Draw rotated text if the default font is loaded
    this.renderer.drawRotatedText({
        font: this.defaultFont,
        xy: [100, 100], // Starting position of the text
        str: 'Hello, MedView!', // The string to render
        scale: 0.50, // Scale factor
        color: [0.3, 0.75, 0.75, 1.0], // Text color (orange)
        rotation: Math.PI / 6, // Rotation angle in radians (30 degrees)
        outlineColor: [0, 0, 0, 1], // Outline color (black)
        outlineThickness: 2 // Outline thickness
    })
    
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

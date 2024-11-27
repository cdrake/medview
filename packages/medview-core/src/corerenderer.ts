import { UIKRenderer, Vec2, Color, Vec4, LineTerminator, LineStyle } from '@medview/uikit' // Importing UIKRenderer from uikit
// import { Vec2, Color, Vec4 } from '@medview/uikit/types'

export class CoreRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private renderer: UIKRenderer

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext

    if (!this.gl) {
      throw new Error('WebGL2 is not supported in this browser')
    }

    // Initialize the UIKRenderer
    this.renderer = new UIKRenderer(this.gl)
  }

  /**
   * Draws a triangle using the UIKRenderer.
   * @param params - Parameters for the triangle.
   */
  drawTriangle(params: {
    headPoint: Vec2
    baseMidPoint: Vec2
    baseLength: number
    color: Color
    z?: number
  }): void {
    this.renderer.drawTriangle(params)
  }

  /**
   * Draws a circle using the UIKRenderer.
   * @param params - Parameters for the circle.
   */
  drawCircle(params: {
    leftTopWidthHeight: Vec4
    circleColor?: Color
    fillPercent?: number
    z?: number
  }): void {
    this.renderer.drawCircle(params)
  }

  /**
   * Draws a line using the UIKRenderer.
   * @param params - Parameters for the line.
   */
  drawLine(params: {
    startEnd: Vec4
    thickness?: number
    color?: Color
    terminator?: LineTerminator
    style?: LineStyle
    dashDotLength?: number
  }): void {
    this.renderer.drawLine(params)
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
    this.canvas.width = width * window.devicePixelRatio || 1
    this.canvas.height = height * window.devicePixelRatio || 1
    this.gl.viewport(0, 0, width, height)
  }
}

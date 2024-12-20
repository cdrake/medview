import { mat4, vec2, vec4 } from 'gl-matrix'
import { UIKShader } from './uikshader.js'
import circleVert from './shaders/circle.vert.glsl'
import circleFrag from './shaders/circle.frag.glsl'
import colorbarVert from './shaders/colorbar.vert.glsl'
import colorbarFrag from './shaders/colorbar.frag.glsl'
import ellipseVert from './shaders/elliptical-fill.vert.glsl'
import ellipseFrag from './shaders/elliptical-fill.frag.glsl'
import lineVert from './shaders/line.vert.glsl'
import projectedLineVert from './shaders/projected-line.vert.glsl'
import rectVert from './shaders/rect.vert.glsl'
import solidColorFrag from './shaders/solid-color.frag.glsl'
import roundedRectFrag from './shaders/rounded-rect.frag.glsl'
import triangleVert from './shaders/triangle.vert.glsl'
import triangleFrag from './shaders/triangle.frag.glsl'
import rotatedFontVert from './shaders/rotated-font.vert.glsl'
import rotatedFontFrag from './shaders/rotated-font.frag.glsl'
import boxVert from './shaders/box.vert.glsl'
import boxFrag from './shaders/box.frag.glsl'
import { Vec4, Color, LineTerminator, LineStyle, Vec2, HorizontalAlignment } from './types.js'
import { UIKFont } from './assets/uikfont.js'
import { UIKBitmap } from './assets/uikbitmap.js'
import { UIKSVG } from './assets/uiksvg.js'
import { ToggleComponent } from './components/toggle-component.js'
import { RulerComponent } from './components/ruler-component.js'
import { SliderComponent } from './components/slider-component.js'
import { tickSpacing } from './utilities/graph-utilities'

export class UIKRenderer {
  private _gl: WebGL2RenderingContext
  protected static lineShader: UIKShader
  protected static circleShader: UIKShader
  protected static rectShader: UIKShader
  protected static roundedRectShader: UIKShader
  protected static triangleShader: UIKShader
  protected static rotatedFontShader: UIKShader
  protected static colorbarShader: UIKShader
  protected static projectedLineShader: UIKShader
  protected static ellipticalFillShader: UIKShader
  protected static boxShader: UIKShader
  protected static genericVAO: WebGLVertexArrayObject
  protected static triangleVertexBuffer: WebGLBuffer
  protected static fullScreenVAO: WebGLVertexArrayObject

  get gl(): WebGL2RenderingContext {
    return this._gl
  }

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl
    
    if(!UIKRenderer.lineShader) {
      UIKRenderer.lineShader = new UIKShader(gl, lineVert, solidColorFrag)
    }
    
    if (!UIKRenderer.roundedRectShader) {
      UIKRenderer.roundedRectShader = new UIKShader(gl, rectVert, roundedRectFrag)
    }

    if (!UIKRenderer.circleShader) {
      UIKRenderer.circleShader = new UIKShader(gl, circleVert, circleFrag)
    }

    if (!UIKRenderer.triangleShader) {
      UIKRenderer.triangleShader = new UIKShader(gl, triangleVert, triangleFrag)
    }

    if (!UIKRenderer.rotatedFontShader) {
      UIKRenderer.rotatedFontShader = new UIKShader(gl, rotatedFontVert, rotatedFontFrag)
    }

    if (!UIKRenderer.colorbarShader) {
      UIKRenderer.colorbarShader = new UIKShader(gl, colorbarVert, colorbarFrag)
    }

    if (!UIKRenderer.projectedLineShader) {
      UIKRenderer.projectedLineShader = new UIKShader(gl, projectedLineVert, solidColorFrag)
    }

    if (!UIKRenderer.ellipticalFillShader) {
      UIKRenderer.ellipticalFillShader = new UIKShader(gl, ellipseVert, ellipseFrag)
    }

    // Initialize the box shader
    if (!UIKRenderer.boxShader) {
      UIKRenderer.boxShader = new UIKShader(gl, boxVert, boxFrag)
    }

    if (!UIKRenderer.genericVAO) {
      const rectStrip = [
        1,
        1,
        0, // Top-right
        1,
        0,
        0, // Bottom-right
        0,
        1,
        0, // Top-left
        0,
        0,
        0 // Bottom-left
      ]

      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!

      gl.bindVertexArray(vao)

      // Setup position VBO
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectStrip), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

      const texCoordData = [
        1.0,
        1.0, // Top-right
        1.0,
        0.0, // Bottom-right
        0.0,
        1.0, // Top-left
        0.0,
        0.0 // Bottom-left
      ]

      const texCoordBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordData), gl.STATIC_DRAW)

      // Assign a_texcoord (location = 1)
      gl.enableVertexAttribArray(1)
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)

      gl.bindVertexArray(null) // Unbind VAO when done

      UIKRenderer.genericVAO = vao
    }

    // Initialize the full-screen VAO
    if (!UIKRenderer.fullScreenVAO) {
      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!
      gl.bindVertexArray(vao)

      // Full-screen quad vertices
      const quadVertices = new Float32Array([
          -1.0, -1.0, // Bottom-left
           1.0, -1.0, // Bottom-right
          -1.0,  1.0, // Top-left
           1.0,  1.0  // Top-right
      ])

      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

      gl.bindVertexArray(null)
      UIKRenderer.fullScreenVAO = vao
  }

    if (!UIKRenderer.triangleVertexBuffer) {
      // Create a static vertex buffer
      UIKRenderer.triangleVertexBuffer = this._gl.createBuffer() as WebGLBuffer
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, UIKRenderer.triangleVertexBuffer)

      // Allocate space for 3 vertices (triangle), each with 2 components (x, y)
      const initialVertices = new Float32Array(6)
      this._gl.bufferData(this._gl.ARRAY_BUFFER, initialVertices, this._gl.DYNAMIC_DRAW)
      gl.bindVertexArray(null) // Unbind VAO when done
      // Unbind the buffer to prevent accidental modification
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null)
    }
  }

  /**
   * Draws a triangle.
   * @param params - Object containing the triangle parameters.
   * @param params.headPoint - The coordinates of the triangle's head (top vertex).
   * @param params.baseMidPoint - The midpoint of the triangle's base.
   * @param params.baseLength - The length of the triangle's base.
   * @param params.color - The color of the triangle.
   * @param params.z - The z-coordinate of the triangle. Defaults to 0.
   */
  public drawTriangle({
    headPoint,
    baseMidPoint,
    baseLength,
    color,
    z = 0
  }: {
    headPoint: Vec2
    baseMidPoint: Vec2
    baseLength: number
    color: Color
    z?: number
  }): void {
    const canvas = this._gl.canvas as HTMLCanvasElement

    // Convert screen points to WebGL coordinates
    const hp = Array.isArray(headPoint) ? headPoint : [headPoint[0], headPoint[1]]
    const bmp = Array.isArray(baseMidPoint) ? baseMidPoint : [baseMidPoint[0], baseMidPoint[1]]
    const webglHeadX = (hp[0] / canvas.width) * 2 - 1
    const webglHeadY = 1 - (hp[1] / canvas.height) * 2
    const webglBaseMidX = (bmp[0] / canvas.width) * 2 - 1
    const webglBaseMidY = 1 - (bmp[1] / canvas.height) * 2

    // Ensure the vertex buffer is defined
    if (!UIKRenderer.triangleVertexBuffer) {
      console.error('Vertex buffer is not defined at draw time')
      return
    }
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, UIKRenderer.triangleVertexBuffer)

    // Calculate left and right base vertices
    const directionX = webglHeadX - webglBaseMidX
    const directionY = webglHeadY - webglBaseMidY
    const length = Math.sqrt(directionX * directionX + directionY * directionY)
    const unitPerpX = -directionY / length
    const unitPerpY = directionX / length
    const baseLengthNormalizedX = (baseLength / canvas.width) * 2
    const baseLengthNormalizedY = (baseLength / canvas.height) * 2
    const leftBaseX = webglBaseMidX - unitPerpX * (baseLengthNormalizedX / 2)
    const leftBaseY = webglBaseMidY - unitPerpY * (baseLengthNormalizedY / 2)
    const rightBaseX = webglBaseMidX + unitPerpX * (baseLengthNormalizedX / 2)
    const rightBaseY = webglBaseMidY + unitPerpY * (baseLengthNormalizedY / 2)

    // Update the vertex buffer with three vertices (head, left base, right base)
    const vertices = new Float32Array([
      webglHeadX,
      webglHeadY, // Head of the triangle
      leftBaseX,
      leftBaseY, // Left base vertex
      rightBaseX,
      rightBaseY // Right base vertex
    ])

    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, vertices)
    // Use the shader program
    UIKRenderer.triangleShader.use(this._gl)

    // Bind the position attribute
    const positionLocation = UIKRenderer.triangleShader.uniforms.a_position as GLuint
    this._gl.enableVertexAttribArray(positionLocation)
    this._gl.vertexAttribPointer(positionLocation, 2, this._gl.FLOAT, false, 0, 0)

    // Set u_antialiasing in pixels and canvas size in pixels
    this._gl.uniform1f(UIKRenderer.triangleShader.uniforms.u_antialiasing, baseLength * 0.01) // Example proportion
    this._gl.uniform2f(UIKRenderer.triangleShader.uniforms.u_canvasSize, canvas.width, canvas.height)

    // Set the color uniform
    this._gl.uniform4fv(UIKRenderer.triangleShader.uniforms.u_color, color as Float32List)

    // Set z value
    this._gl.uniform1f(UIKRenderer.triangleShader.uniforms.u_z, z)

    // Draw the triangle
    this._gl.drawArrays(this._gl.TRIANGLES, 0, 3)
    this._gl.bindVertexArray(null)
  }
  
  /**
 * Draws a circle with optional shadow.
 * @param params - Object containing the circle parameters.
 * @param params.leftTopWidthHeight - The bounding box of the circle (left, top, width, height).
 * @param params.circleColor - The color of the circle.
 * @param params.shadowColor - The color of the shadow (defaults to transparent black).
 * @param params.shadowOffset - The shadow's offset from the circle center (defaults to no offset).
 * @param params.shadowBlur - The blur radius for the shadow (defaults to no blur).
 * @param params.fillPercent - The percentage of the circle to fill (0 to 1).
 * @param params.z - The z-index value of the circle.
 */
public drawCircle({
  leftTopWidthHeight,
  circleColor = [1, 1, 1, 1],
  shadowColor = [0, 0, 0, 0], // Default: transparent black
  shadowOffset = [0, 0], // Default: no offset
  shadowBlur = 0.0, // Default: no blur
  fillPercent = 1.0,
  z = 0
}: {
  leftTopWidthHeight: Vec4
  circleColor?: Color
  shadowColor?: Color
  shadowOffset?: Vec2
  shadowBlur?: number
  fillPercent?: number
  z?: number
}): void {
  if (!UIKRenderer.circleShader) {
    throw new Error('circleShader undefined')
  }

  // Use the circle shader program
  UIKRenderer.circleShader.use(this._gl)
  this._gl.enable(this._gl.BLEND)

  // Set uniform values for the shader
  this._gl.uniform4fv(UIKRenderer.circleShader.uniforms.circleColor, circleColor as Float32List)
  this._gl.uniform4fv(UIKRenderer.circleShader.uniforms.shadowColor, shadowColor as Float32List)
  this._gl.uniform2fv(UIKRenderer.circleShader.uniforms.shadowOffset, shadowOffset as Float32List)
  this._gl.uniform1f(UIKRenderer.circleShader.uniforms.shadowBlur, shadowBlur)
  this._gl.uniform2fv(UIKRenderer.circleShader.uniforms.canvasWidthHeight, [
    this._gl.canvas.width,
    this._gl.canvas.height
  ])

  // Prepare the rectangle parameters
  const rectParams = Array.isArray(leftTopWidthHeight)
    ? vec4.fromValues(leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3])
    : leftTopWidthHeight

  // Pass the rectangle and other circle properties to the shader
  this._gl.uniform4fv(UIKRenderer.circleShader.uniforms.leftTopWidthHeight, rectParams as Float32List)
  this._gl.uniform1f(UIKRenderer.circleShader.uniforms.fillPercent, fillPercent)
  this._gl.uniform1f(UIKRenderer.circleShader.uniforms.z, z)

  // Bind the vertex array and draw the circle
  this._gl.bindVertexArray(UIKRenderer.genericVAO)
  this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4)
  this._gl.bindVertexArray(null) // Unbind to avoid side effects
}


  /**
   * Draws a line with specified start and end coordinates, thickness, color, and style.
   * Supports solid, dashed, or dotted lines, with optional terminators (such as arrows or rings).
   * For dashed and dotted lines, segments or dots will adjust to reach the endpoint or terminator.
   *
   * @param config - Configuration object containing the following properties:
   *   - startEnd: The start and end coordinates of the line, as a Vec4 array in the form [startX, startY, endX, endY].
   *   - thickness?: The thickness of the line. Defaults to 1.
   *   - color?: The color of the line, as a Color array in [R, G, B, A] format. Defaults to red ([1, 0, 0, -1]).
   *   - terminator?: The type of terminator at the end of the line (e.g., NONE, ARROW, CIRCLE, or RING). Defaults to NONE.
   *   - style?: The style of the line: solid, dashed, or dotted. Defaults to solid.
   *   - dashDotLength?: The length of dashes or diameter of dots for dashed/dotted lines. Defaults to 5.
   */
  public drawLine(config: {
    startEnd: Vec4
    thickness?: number
    color?: Color
    terminator?: LineTerminator
    style?: LineStyle
    dashDotLength?: number
  }): void {
    const {
      startEnd,
      thickness = 1,
      color = [1, 0, 0, -1],
      terminator = LineTerminator.NONE,
      style = LineStyle.SOLID,
      dashDotLength = 5
    } = config
    const gl = this._gl
    
    // Extract start and end points
    const lineCoords = Array.isArray(startEnd)
      ? vec4.fromValues(startEnd[0], startEnd[1], startEnd[2], startEnd[3])
      : startEnd

    let [startX, startY, endX, endY] = lineCoords

    // Calculate direction and adjust for terminator
    const direction = vec2.sub(vec2.create(), [endX, endY], [startX, startY])
    vec2.normalize(direction, direction)

    const terminatorSize = thickness * 3 // Example terminator size based on thickness

    // Adjust line length by half the terminator width if a terminator exists
    if (terminator !== LineTerminator.NONE) {
      endX -= direction[0] * (terminatorSize / 2)
      endY -= direction[1] * (terminatorSize / 2)
    }

    if (style === LineStyle.DASHED || style === LineStyle.DOTTED) {
      const lineLength = vec2.distance([startX, startY], [endX, endY])
      const segmentSpacing = style === LineStyle.DASHED ? dashDotLength * 1.5 : dashDotLength * 2
      const segmentCount = Math.floor(lineLength / segmentSpacing)

      for (let i = 0; i <= segmentCount; i++) {
        const segmentStart = vec2.scaleAndAdd(vec2.create(), [startX, startY], direction, i * segmentSpacing)

        if (i === segmentCount) {
          // Connect the last dash or dot to the adjusted endpoint
          if (style === LineStyle.DASHED) {
            const segmentCoords = vec4.fromValues(segmentStart[0], segmentStart[1], endX, endY)
            this.drawSegment({ segmentCoords, thickness, color })
          } else if (style === LineStyle.DOTTED) {
            this.drawCircle({
              leftTopWidthHeight: [endX - dashDotLength / 2, endY - dashDotLength / 2, dashDotLength, dashDotLength],
              circleColor: color
            })
          }
        } else {
          if (style === LineStyle.DASHED) {
            // Draw dashed segment
            const segmentEnd = vec2.scaleAndAdd(vec2.create(), segmentStart, direction, dashDotLength)
            const segmentCoords = vec4.fromValues(segmentStart[0], segmentStart[1], segmentEnd[0], segmentEnd[1])
            this.drawSegment({ segmentCoords, thickness, color })
          } else if (style === LineStyle.DOTTED) {
            // Draw dot as a small circle
            this.drawCircle({
              leftTopWidthHeight: [
                segmentStart[0] - dashDotLength / 2,
                segmentStart[1] - dashDotLength / 2,
                dashDotLength,
                dashDotLength
              ],
              circleColor: color
            })
          }
        }
      }
    } else {
      // Draw solid line if no dash/dot style specified
      const shortenedLine = vec4.fromValues(startX, startY, endX, endY)
      UIKRenderer.lineShader.use(gl)
      gl.enable(gl.BLEND)
      gl.uniform4fv(UIKRenderer.lineShader.uniforms.lineColor, color as Float32List)
      console.log('line color drawLine', color)
      gl.uniform2fv(UIKRenderer.lineShader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
      gl.uniform1f(UIKRenderer.lineShader.uniforms.thickness, thickness)
      gl.uniform4fv(UIKRenderer.lineShader.uniforms.startXYendXY, shortenedLine)

      gl.bindVertexArray(UIKRenderer.genericVAO)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.bindVertexArray(null) // Unbind to avoid side effects
    }

    // Draw the terminator
    switch (terminator) {
      case LineTerminator.ARROW:
        this.drawTriangle({
          headPoint: [startEnd[2], startEnd[3]],
          baseMidPoint: [endX - (direction[0] * terminatorSize) / 2, endY - (direction[1] * terminatorSize) / 2],
          baseLength: terminatorSize,
          color
        })
        break
      case LineTerminator.CIRCLE:
        this.drawCircle({
          leftTopWidthHeight: [
            startEnd[2] - terminatorSize / 2,
            startEnd[3] - terminatorSize / 2,
            terminatorSize,
            terminatorSize
          ],
          circleColor: color
        })
        break
      case LineTerminator.RING:
        this.drawCircle({
          leftTopWidthHeight: [
            startEnd[2] - terminatorSize / 2,
            startEnd[3] - terminatorSize / 2,
            terminatorSize,
            terminatorSize
          ],
          circleColor: color,
          fillPercent: 0.5
        })
        break
    }
  }

  /**
   * Helper method to draw individual dashed segments.
   * @param config - Configuration object containing the following properties:
   *   - segmentCoords: The start and end coordinates of the segment, as a Vec4 array in the form [startX, startY, endX, endY].
   *   - thickness: The thickness of the segment.
   *   - color: The color of the segment, as a Color array in [R, G, B, A] format.
   */
  private drawSegment(config: { segmentCoords: Vec4; thickness: number; color: Color }): void {
    const { segmentCoords, thickness, color } = config
    const gl = this._gl
    console.log('line color line segment', color)
    UIKRenderer.lineShader.use(gl)
    gl.uniform4fv(UIKRenderer.lineShader.uniforms.lineColor, color as Float32List)
    gl.uniform1f(UIKRenderer.lineShader.uniforms.thickness, thickness)
    gl.uniform4fv(UIKRenderer.lineShader.uniforms.startXYendXY, segmentCoords)

    gl.bindVertexArray(UIKRenderer.genericVAO)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null) // Unbind to avoid side effects
  }

  
  calculateOuterColor(fontColor: Color): Color {
    // Extract RGB components
    const r = fontColor[0]
    const g = fontColor[1]
    const b = fontColor[2]
  
    // Calculate the magnitude of the RGB vector
    const rgbLength = Math.sqrt(r ** 2 + g ** 2 + b ** 2)
  
    // Apply the step function logic
    const outerColorValue = 1.0 - (rgbLength >= 0.1 ? 1.0 : 0.0)
  
    // Return the resulting color as a Color type
    return [outerColorValue, outerColorValue, outerColorValue, fontColor[3]]
  }
  

/**
 * Draws rotated text, supporting individual character rendering and high-DPI scaling.
 * @param params - Object containing parameters for rendering rotated text.
 * @param params.font - The font object for rendering text.
 * @param params.xy - The starting position of the text.
 * @param params.str - The string to render.
 * @param params.scale - The scale of the text. Defaults to 1.0.
 * @param params.color - The color of the text. Defaults to red.
 * @param params.rotation - The rotation angle in radians. Defaults to 0.
 * @param params.outlineColor - The outline color of the text. Defaults to black.
 * @param params.isOutline - Draw an outline around the letters.ß
 * @param params.maxWidth - Maximum width for text wrapping.
 */
  public drawRotatedText({
    font,
    xy,
    str,
    scale = 1.0,
    color = [1.0, 0.0, 0.0, 1.0],
    rotation = 0.0,
    outlineColor = null,
    isOutline = false,
    maxWidth = 0, // Default to 0, meaning no wrapping
    alignment = HorizontalAlignment.LEFT
  }: {
    font: UIKFont
    xy: Vec2
    str: string
    scale?: number
    color?: Color
    rotation?: number
    outlineColor?: Color | null
    isOutline?: boolean
    maxWidth?: number
    alignment?: HorizontalAlignment
  }): void {
    if (!font.isFontLoaded) {
      throw new Error('font not loaded')
    }
  
    if (!UIKRenderer.rotatedFontShader) {
      throw new Error('rotatedTextShader undefined')
    }

    const rotatedFontShader = UIKRenderer.rotatedFontShader
    const gl = this._gl

    if(!outlineColor) {
      outlineColor = this.calculateOuterColor(color)
    }
  
    // Bind the font texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, font.getTexture())
  
    rotatedFontShader.use(gl)
  
    // Enable blending for text rendering
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
  
    // Set uniforms
    const finalColor = color || font.fontColor
    gl.uniform4fv(rotatedFontShader.uniforms.fontColor, finalColor as Float32List)
    gl.uniform4fv(rotatedFontShader.uniforms.outlineColor, outlineColor as Float32List)
  
    // Calculate screen pixel range
    // let screenPxRange = (scale / font.fontMets!.size) * font.fontMets!.distanceRange
    const size = font.textHeight * gl.canvas.height * scale
    let screenPxRange = (size / font.fontMets!.size) * font.fontMets!.distanceRange
    screenPxRange = Math.max(screenPxRange, 1.0) 
    // screenPxRange *= window.devicePixelRatio || 1.0 // Adjust for DPR
    gl.uniform1f(rotatedFontShader.uniforms.screenPxRange, screenPxRange)
  
    // Convert outline thickness to NDC, considering DPR
    // const ndcOutlineThickness = outlineThickness / (gl.canvas.width * (window.devicePixelRatio || 1.0))
    // gl.uniform1f(rotatedFontShader.uniforms.outlineThickness, ndcOutlineThickness)
    gl.uniform1i(rotatedFontShader.uniforms.isOutline, isOutline ? 1 : 0)
    // Pass canvas dimensions for proper scaling
    gl.uniform2fv(rotatedFontShader.uniforms.canvasWidthHeight, [
      gl.canvas.width * (window.devicePixelRatio || 1.0),
      gl.canvas.height * (window.devicePixelRatio || 1.0)
    ])
  
    // Bind VAO for the generic rectangle
    gl.bindVertexArray(UIKRenderer.genericVAO)
  
    // Set up orthographic projection matrix
    const orthoMatrix = mat4.create()
    mat4.ortho(orthoMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1)
  
    // Split text into lines based on maxWidth
    
    const words = str.split(' ')
    const lines: string[] = []
  
    if (maxWidth > 0) {
      let currentLine = ''
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = font.getTextWidth(testLine, scale)
        if (testWidth > maxWidth) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) {
        lines.push(currentLine)
      }
    } else {
      lines.push(str) // No wrapping, treat the entire string as a single line
    }
  
    // Adjust line height to include outline thickness
    // outlineThickness = 0;
    const lineHeight = font.getTextHeight(str, scale)// + outlineThickness * scale
  
    // Calculate perpendicular offset for each line
    const perpendicularX = -Math.sin(rotation) * lineHeight
    const perpendicularY = Math.cos(rotation) * lineHeight
    // console.log('perpendicular x and y',perpendicularX, perpendicularY )
    // Start from the first line's base position
    let baselineX = xy[0]
    let baselineY = xy[1]
    console.log('xy', xy)

    // console.log('dpr', dpr)
    lines.forEach((line) => {
      // Calculate the line's total width
      const lineWidth = font.getTextWidth(line, scale)
    
      // Determine alignment offset considering rotation
      let alignmentOffsetX = 0
      let alignmentOffsetY = 0
      switch (alignment) {
        case HorizontalAlignment.CENTER:
          alignmentOffsetX = -Math.cos(rotation) * lineWidth / 2
          alignmentOffsetY = -Math.sin(rotation) * lineWidth / 2
          break
        case HorizontalAlignment.RIGHT:
          alignmentOffsetX = -Math.cos(rotation) * lineWidth
          alignmentOffsetY = -Math.sin(rotation) * lineWidth
          break
        case HorizontalAlignment.LEFT:
        default:
          alignmentOffsetX = 0
          alignmentOffsetY = 0
          break
      }
    
      // Apply rotation and adjusted alignment offset to the line's starting position
      const modelMatrix = mat4.create()
      mat4.translate(modelMatrix, modelMatrix, [baselineX + alignmentOffsetX, baselineY + alignmentOffsetY, 0.0])
      mat4.rotateZ(modelMatrix, modelMatrix, rotation)
    
      let currentX = 0 // Start X position relative to the line
    
      for (const char of Array.from(line)) {
        const metrics = font.fontMets!.mets[char]
        if (!metrics) {
          continue
        }
    
        // Calculate character-specific offsets
        const charWidth = metrics.lbwh[2] * size
        const charHeight = metrics.lbwh[3] * size
        const charOffsetX = metrics.lbwh[0] * size
        const charOffsetY = metrics.lbwh[1] * size
    
        // Calculate rotated positions for each character
        const rotatedCharX = currentX + charOffsetX
        const rotatedCharY = charOffsetY
    
        const charModelMatrix = mat4.clone(modelMatrix)
        mat4.translate(charModelMatrix, charModelMatrix, [
          rotatedCharX,
          -rotatedCharY,
          0.0
        ])
        mat4.scale(charModelMatrix, charModelMatrix, [charWidth, -charHeight, 1.0])
    
        // Combine the orthographic matrix with the character's model matrix
        const mvpMatrix = mat4.create()
        mat4.multiply(mvpMatrix, orthoMatrix, charModelMatrix)
    
        // Set uniform values for MVP matrix and UV coordinates
        gl.uniformMatrix4fv(rotatedFontShader.uniforms.modelViewProjectionMatrix, false, mvpMatrix)
        gl.uniform4fv(rotatedFontShader.uniforms.uvLeftTopWidthHeight, metrics.uv_lbwh)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    
        // Advance the current X position
        currentX += metrics.xadv * size
      }
    
      // Move the baseline for the next line along the perpendicular axis
      baselineX += perpendicularX
      baselineY += perpendicularY
    })
    
    
  
    // Unbind the VAO
    gl.bindVertexArray(null)
  }

  /**
   * Draws non-rotated text using the existing drawRotatedText method.
   * Simplifies text rendering for cases without rotation or outlines.
   * 
   * @param params - Object containing parameters for rendering text.
   * @param params.font - The font object for rendering text.
   * @param params.position - The position of the text [x, y].
   * @param params.text - The string to render.
   * @param params.scale - The scale of the text. Defaults to 1.0.
   * @param params.color - The color of the text. Defaults to black.
   * @param params.maxWidth - Maximum width for text wrapping. Defaults to 0 (no wrapping).
   */
  public drawText({
    font,
    position,
    text,
    scale = 1.0,
    color = [0, 0, 0, 1],
    outlineColor = [0, 0, 0, 0],
    isOutline = false,
    maxWidth = 0
  }: {
    font: UIKFont
    position: Vec2
    text: string
    scale?: number
    color?: Color
    outlineColor?: Color
    isOutline?: boolean
    maxWidth?: number
  }): void {
    // Use the existing drawRotatedText method with default rotation and outline parameters    
    this.drawRotatedText({
      font,
      xy: position,
      str: text,
      scale,
      color,
      rotation: 0, // No rotation
      outlineColor,
      isOutline, // No outline thickness
      maxWidth
    })
  }

 /**
 * Draws a rounded rectangle with an optional gradient background.
 * @param bounds - The bounding box of the rounded rectangle (left, top, width, height).
 * @param fillColor - The fill color or top color of the rectangle.
 * @param outlineColor - The outline color of the rectangle.
 * @param bottomColor - The bottom color for the gradient. Defaults to fillColor.
 * @param cornerRadius - The corner radius.
 * @param thickness - The thickness of the outline.
 */
public drawRoundedRect(config: {
  bounds: Vec4
  fillColor: Color
  outlineColor: Color
  bottomColor?: Color
  cornerRadius?: number
  thickness?: number
}): void {
  const {
    bounds,
    fillColor,
    outlineColor,
    bottomColor = fillColor, // Default bottom color to fillColor
    cornerRadius = -1,
    thickness = 10
  } = config

  if (!UIKRenderer.roundedRectShader) {
    throw new Error('roundedRectShader undefined')
  }
  const gl = this._gl
  console.log('outline color', outlineColor)
  // Use the rounded rectangle shader program
  UIKRenderer.roundedRectShader.use(gl)

  // Enable blending for transparency
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Set the necessary uniforms
  const shader = UIKRenderer.roundedRectShader
  const adjustedCornerRadius = cornerRadius === -1 ? thickness * 2 : cornerRadius

  const rectParams = Array.isArray(bounds) ? vec4.fromValues(bounds[0], bounds[1], bounds[2], bounds[3]) : bounds

  this._gl.uniform1f(shader.uniforms.thickness, thickness)
  this._gl.uniform1f(shader.uniforms.cornerRadius, adjustedCornerRadius)
  this._gl.uniform4fv(shader.uniforms.borderColor, outlineColor as Float32List)
  this._gl.uniform4fv(shader.uniforms.topColor, fillColor as Float32List) // Use fillColor as top color
  this._gl.uniform4fv(shader.uniforms.bottomColor, bottomColor as Float32List) // Bottom color for gradient
  this._gl.uniform2fv(shader.uniforms.canvasWidthHeight, [this._gl.canvas.width, this._gl.canvas.height])
  this._gl.uniform4fv(shader.uniforms.leftTopWidthHeight, rectParams as Float32List)
  this._gl.bindVertexArray(UIKRenderer.genericVAO)
  this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4)
  this._gl.bindVertexArray(null)
}

/**
   * Draws a text box with customizable text, colors, and margins.
   * @param params - Object containing parameters for rendering the text box.
   * @param params.font - The font object for rendering the text.
   * @param params.xy - The position of the top-left corner of the text box.
   * @param params.str - The text to render inside the text box.
   * @param params.textColor - The color of the text. Defaults to black with full opacity.
   * @param params.outlineColor - The color of the box's outline. Defaults to white with full opacity.
   * @param params.fillColor - The fill color of the box. Defaults to a transparent black.
   * @param params.margin - The margin between the text and the edges of the box. Defaults to 15.
   * @param params.roundness - The roundness of the box corners (0 to 1). Defaults to 0 (square corners).
   * @param params.scale - The scaling factor for the text. Defaults to 1.0.
   * @param params.maxWidth - The maximum width for text wrapping. Defaults to 0 (no wrapping).
   * @param params.fontOutlineColor - The outline color for the text. Defaults to black.
   */
public drawTextBox({
  font,
  xy,
  text,
  textColor = [0, 0, 0, 1.0],
  outlineColor = [1.0, 1.0, 1.0, 1.0],
  fillColor = [0.0, 0.0, 0.0, 0.3],
  margin = 15,
  roundness = 0.0,
  scale = 1.0,
  maxWidth = 0,
  fontOutlineColor = [0, 0, 0, 1],
}: {
  font: UIKFont
  xy: Vec2
  text: string
  textColor?: Color
  outlineColor?: Color
  fillColor?: Color
  margin?: number
  roundness?: number
  scale?: number
  maxWidth?: number
  fontOutlineColor?: Color
  fontOutlineThickness?: number
}): void {
  const dpr = window.devicePixelRatio || 1
  scale *= dpr
  const textHeight = font.getTextHeight(text, scale)
  const wrappedSize = font.getWordWrappedSize(text, scale, maxWidth)
  const rectWidth = wrappedSize[0] + 2 * margin * scale + textHeight
  const rectHeight = wrappedSize[1] + 4 * margin * scale // Height of the rectangle enclosing the text

  const leftTopWidthHeight = [xy[0], xy[1], rectWidth, rectHeight] as [number, number, number, number]
  this.drawRoundedRect({
    bounds: leftTopWidthHeight,
    fillColor,
    outlineColor,
    cornerRadius: (Math.min(1.0, roundness) / 2) * Math.min(leftTopWidthHeight[2], leftTopWidthHeight[3]),
    thickness: 5 // Add thickness parameter to match drawRoundedRect signature
  })
  const descenderDepth = font.getDescenderDepth(text, scale)

  const size = font.textHeight * this.gl.canvas.height * scale
  // Adjust the position of the text with a margin, ensuring it's vertically centered
  const textPosition = [
    leftTopWidthHeight[0] + margin * scale + textHeight / 2,
    leftTopWidthHeight[1] + 2 * margin * scale + textHeight - size + descenderDepth
  ] as [number, number]

  // Render the text
  this.drawText({
    font,
    position: textPosition,
    text,
    scale,
    color: textColor,
    maxWidth,
    outlineColor: fontOutlineColor,
  })
}

  
  /**
   * Draws a ruler with length text, units, and hash marks.
   * @param params - Object containing parameters for rendering the ruler.
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
  public drawRuler({
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
    RulerComponent.drawRuler({renderer: this, pointA, pointB, length, units, font, textColor, outlineColor, lineColor, lineThickness, offset, scale, showTickmarkNumbers})
  }

  logVertexAttribState(gl: WebGL2RenderingContext, index: number): void {
    console.log(`--- Attribute ${index} ---`)
    console.log('Enabled:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_ENABLED))
    console.log('Size:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_SIZE))
    console.log('Type:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_TYPE))
    console.log('Normalized:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED))
    console.log('Stride:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_STRIDE))
    console.log('Offset:', gl.getVertexAttribOffset(index, gl.VERTEX_ATTRIB_ARRAY_POINTER))
    console.log('Buffer:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING))
    console.log('Divisor:', gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_DIVISOR))
  }
  

  /**
   * Draws a bitmap on the canvas.
   *
   * @param config - Configuration object containing the bitmap, position, and scale.
   * @param config.bitmap - The bitmap to draw.
   * @param config.position - The position to place the bitmap ([x, y]).
   * @param config.scale - The scale factor for the bitmap.
   */
  public drawBitmap({ bitmap, position, scale }: { bitmap: UIKBitmap; position: Vec2; scale: number }): void {
    if (!bitmap.getTexture()) {
      console.error('Bitmap texture not loaded')
      return
    }

    const gl = this._gl
    const shader = bitmap.bitmapShader
    shader.use(gl)

    gl.activeTexture(gl.TEXTURE0)
    const texture = bitmap.getTexture()
    if (!texture) {
      console.error('Texture not found')
      return
    }
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.uniform1i(shader.uniforms.u_textureLocation, 0)

    // Set the canvas size
    const canvasWidth = gl.canvas.width
    const canvasHeight = gl.canvas.height
    gl.uniform2f(shader.uniforms.canvasWidthHeight, canvasWidth, canvasHeight)

    // Set the position and size of the bitmap based on position and scale
    const pos = Array.isArray(position) ? vec2.fromValues(position[0], position[1]) : position
    const width = bitmap.getWidth() * scale
    const height = bitmap.getHeight() * scale
    gl.uniform4f(shader.uniforms.leftTopWidthHeight, pos[0], pos[1], width, height)

    // Set the viewport
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    // Bind the VAO and draw the bitmap
    gl.bindVertexArray(UIKRenderer.genericVAO)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Check for WebGL errors
    const error = gl.getError()
    if (error !== gl.NO_ERROR) {
      console.error('WebGL Error:', error)
    }

    // Unbind the VAO
    gl.bindVertexArray(null)
  }

 /**
 * Draws a color bar with a gradient, tick marks, and corresponding labels.
 * 
 * @param config - Configuration object for the color bar.
 * @property position - The `[x, y]` coordinates of the top-left corner of the color bar.
 * @property size - The `[width, height]` dimensions of the color bar.
 * @property gradientTexture - A WebGL texture representing the gradient of the color bar.
 * @property minMax - A tuple `[min, max]` defining the range of values for the color bar.
 * @property tickSpacing - The number of divisions or intervals for the tick marks.
 * @property tickLength - The length of each tick mark in pixels.
 * @property tickColor - The color of the tick marks.
 * @property labelColor - The color of the text labels.
 * @property font - The font used for rendering the text labels.
 * 
 * @example
 * ```typescript
 * const colorbarConfig = {
 *   position: [50, 50] as Vec2,
 *   size: [400, 50] as Vec2,
 *   gradientTexture: gradientTexture, // A WebGL texture generated elsewhere
 *   minMax: [-10, 10],
 *   tickSpacing: 5,
 *   tickLength: 10,
 *   tickColor: [0, 0, 0, 1], // Black tick marks
 *   labelColor: [0.1, 0.1, 0.1, 1], // Gray labels
 *   font: defaultFont // A loaded UIKFont instance
 * }
 * 
 * renderer.drawColorbar(colorbarConfig)
 * ```
 */
 public drawColorbar({
  position,
  size,
  gradientTexture,
  minMax,
  tickLength = 5,
  tickColor = [0, 0, 0, 1],
  labelColor = [0, 0, 0, 1],
  font,
  labelAlignment = HorizontalAlignment.CENTER,
  labelOffset = 5
}: {
  position: Vec2
  size: Vec2
  gradientTexture: WebGLTexture
  minMax: [number, number]
  tickLength?: number
  tickColor?: Color
  labelColor?: Color
  font: UIKFont
  labelAlignment?: HorizontalAlignment
  labelOffset?: number
}): void {
  const gl = this._gl
  const [x, y] = position
  const [width, height] = size

  // Draw the outline
  const bounds = [...position, ...size] as [number, number, number, number]
  const delta = 5
  bounds[0] -= delta
  bounds[1] -= delta
  bounds[2] += delta * 2
  bounds[3] += delta * 2
  this.drawRoundedRect({bounds, fillColor: [0,0,0,0], outlineColor: tickColor, cornerRadius: 0 })


  // Draw the gradient background
  UIKRenderer.colorbarShader.use(gl)
  gl.uniform2fv(UIKRenderer.colorbarShader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
  gl.uniform4fv(UIKRenderer.colorbarShader.uniforms.leftTopWidthHeight, [x, y, width, height])
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, gradientTexture)
  gl.uniform1i(UIKRenderer.colorbarShader.uniforms.gradientTexture, 0)
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)

  // Calculate tick spacing using `tickSpacing`
  const [tickStep, start, end] = tickSpacing(minMax[0], minMax[1])

  // Draw tick marks and labels
  for (let value = start; value <= end; value += tickStep) {
    const normalizedPosition = (value - minMax[0]) / (minMax[1] - minMax[0])
    const tickX = x + normalizedPosition * width

    // Draw tick mark
    this.drawLine({
      startEnd: [tickX, y + height, tickX, y + height + tickLength],
      thickness: 1,
      color: tickColor
    })

    // Draw label directly under the tick mark
    const label = value.toFixed(1) // Customize precision as needed
    const textWidth = font.getTextWidth(label, 1.0)
    let labelX = tickX

    switch (labelAlignment) {
      case HorizontalAlignment.CENTER:
        labelX -= textWidth / 4
        break
      case HorizontalAlignment.RIGHT:
        labelX -= textWidth / 2
        break
      case HorizontalAlignment.LEFT:
      default:
        // No adjustment needed
        break
    }

    // Label's Y position is under the tick mark, adjusted by `labelOffset`
    const labelY = y + height + tickLength + labelOffset

    this.drawText({
      font,
      position: [labelX, labelY],
      text: label,
      color: labelColor,
      scale: 0.5 // Adjust scale as needed
    })
  }
}


  /**
 * Draws an SVG on the canvas using the generated WebGL texture.
 *
 * @param config - Configuration object for rendering the SVG.
 * @param config.svgAsset - The SVG asset to draw.
 * @param config.position - The position to draw the SVG ([x, y]).
 * @param config.scale - The scale factor for the SVG.
 */
public drawSVG({ svgAsset, position, scale }: { svgAsset: UIKSVG; position: Vec2; scale: number }): void {
  if (!svgAsset.getTexture()) {
    console.error('SVG texture not loaded')
    return
  }

  const gl = this._gl
  const shader = svgAsset.bitmapShader
  shader.use(gl)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, svgAsset.getTexture())

  gl.uniform1i(shader.uniforms.u_textureLocation, 0)

  // Set canvas size
  const canvasWidth = gl.canvas.width
  const canvasHeight = gl.canvas.height
  gl.uniform2f(shader.uniforms.canvasWidthHeight, canvasWidth, canvasHeight)

  // Set the position and size of the SVG
  const pos = Array.isArray(position) ? vec2.fromValues(position[0], position[1]) : position
  const width = svgAsset.getWidth() * scale
  const height = svgAsset.getHeight() * scale
  gl.uniform4f(shader.uniforms.leftTopWidthHeight, pos[0], pos[1], width, height)

  // Bind the VAO and draw the SVG
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  // Unbind the VAO
  gl.bindVertexArray(null)
}

/**
   * Draws a toggle switch with support for an animated knob position.
   * @param params - Object containing the toggle parameters.
   * @param params.position - The position of the top-left corner of the toggle.
   * @param params.size - The size of the toggle ([width, height]).
   * @param params.isOn - Whether the toggle is on or off.
   * @param params.onColor - The color when the toggle is on.
   * @param params.offColor - The color when the toggle is off.
   * @param params.knobPosition - The position of the knob (0 for off, 1 for on, values in between for animation).
   */
public drawToggle({
  position,
  size,
  isOn,
  onColor,
  offColor,
  knobPosition = isOn ? 1.0 : 0.0 // Default to fully on or off
}: {
  position: Vec2
  size: Vec2
  isOn: boolean
  onColor: Color
  offColor: Color
  knobPosition?: number
}): void {  
  ToggleComponent.drawToggle({renderer: this, position, size, isOn, onColor, offColor, knobPosition})
}

/**
 * Draws a slider with a track, knob, shadow, and value text.
 * @param params - Object containing the slider parameters.
 * @param params.position - The position of the top-left corner of the slider.
 * @param params.size - The size of the slider ([width, height]).
 * @param params.value - The current value of the slider (between `min` and `max`).
 * @param params.min - The minimum value of the slider.
 * @param params.max - The maximum value of the slider.
 * @param params.trackColor - The color of the slider track.
 * @param params.fillColor - The color of the filled portion of the slider.
 * @param params.knobColor - The color of the slider knob.
 * @param params.shadowColor - The shadow color for the knob.
 * @param params.shadowOffset - The shadow's offset from the knob center.
 * @param params.shadowBlur - The blur radius for the knob shadow.
 * @param params.valueTextColor - The color of the value text displayed below the slider.
 * @param params.font - The font object for rendering the slider value text.
 * @param params.scale - The scale of the slider and text. Defaults to 1.0.
 */
public drawSlider({
  position,
  size,
  value = 0.5,
  min = 0,
  max = 1,
  trackColor = [0.8, 0.8, 0.8, 1.0], // Default light gray
  fillColor = [0.0, 0.5, 1.0, 1.0], // Default blue
  knobColor = [1.0, 1.0, 1.0, 1.0], // Default white knob
  shadowColor = [0.0, 0.0, 0.0, 0.2], // Default shadow color
  shadowOffset = [0.02, 0.02], // Default shadow offset
  shadowBlur = 0.05, // Default shadow blur radius
  valueTextColor = [0.0, 0.5, 1.0, 1.0], // Default blue text
  font,
  scale = 1.0 // Default scale
}: {
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
  font: UIKFont
  scale?: number
}): void {
  if (!font) {
    throw new Error('Font is required to render slider value text.')
  }

  SliderComponent.drawSlider({
    renderer: this,
    font,
    position,
    size,
    value,
    min,
    max,
    trackColor,
    fillColor,
    knobColor,
    shadowColor,
    shadowOffset,
    shadowBlur,
    valueTextColor,
    scale
  })
}

}

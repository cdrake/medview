import { mat4, vec2, vec4 } from 'gl-matrix'
import { UIKShader } from './uikshader.js'
import circleVert from './shaders/vert/circle.glsl'
import circleFrag from './shaders/frag/circle.glsl'
import colorbarVert from './shaders/vert/colorbar.glsl'
import colorbarFrag from './shaders/frag/colorbar.glsl'
import ellipseVert from './shaders/vert/ellipse.glsl'
import ellipseFrag from './shaders/frag/ellipse.glsl'
import lineVert from './shaders/vert/line.glsl'
import lineFrag from './shaders/frag/line.glsl'
import projectedLineVert from './shaders/vert/projectedLine.glsl'
import projectedLineFrag from './shaders/frag/rect.glsl' // Reuse rect shader for line color
import rectVert from './shaders/vert/rect.glsl'
import rectFrag from './shaders/frag/rect.glsl'
import roundedRectFrag from './shaders/frag/roundedRect.glsl'
import triangleVert from './shaders/vert/triangle.glsl'
import triangleFrag from './shaders/frag/triangle.glsl'
import rotatedFontVert from './shaders/vert/rotatedFont.glsl'
import rotatedFontFrag from './shaders/frag/rotatedFont.glsl'

export class UIKRenderer {
  private gl: WebGL2RenderingContext
  private lineShader: UIKShader
  protected static circleShader: UIKShader
  protected static rectShader: UIKShader
  protected static roundedRectShader: UIKShader
  protected static triangleShader: UIKShader
  protected static rotatedTextShader: UIKShader
  protected static colorbarShader: UIKShader
  protected static projectedLineShader: UIKShader
  protected static ellipticalFillShader: UIKShader
  protected static genericVAO: WebGLVertexArrayObject

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.lineShader = new UIKShader(gl, lineVert, lineFrag)

    if (!UIKRenderer.rectShader) {
      UIKRenderer.rectShader = new UIKShader(gl, rectVert, rectFrag)
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

    if (!UIKRenderer.rotatedTextShader) {
      UIKRenderer.rotatedTextShader = new UIKShader(gl, rotatedFontVert, rotatedFontFrag)
    }

    if (!UIKRenderer.colorbarShader) {
      UIKRenderer.colorbarShader = new UIKShader(gl, colorbarVert, colorbarFrag)
    }

    if (!UIKRenderer.projectedLineShader) {
      UIKRenderer.projectedLineShader = new UIKShader(gl, projectedLineVert, projectedLineFrag)
    }

    if (!UIKRenderer.ellipticalFillShader) {
      UIKRenderer.ellipticalFillShader = new UIKShader(gl, ellipseVert, ellipseFrag)
    }

    if (!UIKRenderer.genericVAO) {
      const rectStrip = [
        1, 1, 0, // Top-right
        1, 0, 0, // Bottom-right
        0, 1, 0, // Top-left
        0, 0, 0  // Bottom-left
      ]
      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!

      gl.bindVertexArray(vao)

      // Setup position VBO
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectStrip), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

      UIKRenderer.genericVAO = vao
    }
  }
}

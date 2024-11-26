import { mat4, vec2, vec4 } from 'gl-matrix'
import { Shader } from './shader.js'
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
  private lineShader: Shader
  protected static circleShader: Shader
  protected static rectShader: Shader
  protected static roundedRectShader: Shader
  protected static triangleShader: Shader
  protected static rotatedTextShader: Shader
  protected static colorbarShader: Shader
  protected static projectedLineShader: Shader
  protected static ellipticalFillShader: Shader
  protected static genericVAO: WebGLVertexArrayObject

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.lineShader = new Shader(gl, lineVert, lineFrag)

    if (!UIKRenderer.rectShader) {
      UIKRenderer.rectShader = new Shader(gl, rectVert, rectFrag)
    }

    if (!UIKRenderer.roundedRectShader) {
      UIKRenderer.roundedRectShader = new Shader(gl, rectVert, roundedRectFrag)
    }

    if (!UIKRenderer.circleShader) {
      UIKRenderer.circleShader = new Shader(gl, circleVert, circleFrag)
    }

    if (!UIKRenderer.triangleShader) {
      UIKRenderer.triangleShader = new Shader(gl, triangleVert, triangleFrag)
    }

    if (!UIKRenderer.rotatedTextShader) {
      UIKRenderer.rotatedTextShader = new Shader(gl, rotatedFontVert, rotatedFontFrag)
    }

    if (!UIKRenderer.colorbarShader) {
      UIKRenderer.colorbarShader = new Shader(gl, colorbarVert, colorbarFrag)
    }

    if (!UIKRenderer.projectedLineShader) {
      UIKRenderer.projectedLineShader = new Shader(gl, projectedLineVert, projectedLineFrag)
    }

    if (!UIKRenderer.ellipticalFillShader) {
      UIKRenderer.ellipticalFillShader = new Shader(gl, ellipseVert, ellipseFrag)
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

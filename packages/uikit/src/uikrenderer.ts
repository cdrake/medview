// src/UIKRenderer.ts

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

import * as tri from './renderers/primitives/triangleRenderer.js'
import * as circ from './renderers/primitives/circleRenderer.js'
import * as linePrim from './renderers/primitives/lineRenderer.js'
import * as rrect from './renderers/primitives/roundedRectRenderer.js'
import {
  drawRotatedText    as primDrawRotatedText,
  drawTextOffset     as primDrawTextOffset,
  drawText           as primDrawText,
  drawTextBelow      as primDrawTextBelow,
  drawTextAbove      as primDrawTextAbove,
  drawTextLeftOf     as primDrawTextLeftOf,
  drawTextRightOf    as primDrawTextRightOf,
  drawTextCenteredOn as primDrawTextCenteredOn,
  RotatedTextConfig,
  TextOffsetConfig
} from './renderers/primitives/textRenderer.js'

import * as boxPrim from './renderers/primitives/boxRenderer.js'

import * as tbox from './renderers/composites/textBoxRenderer.js'
import * as cb from './renderers/composites/colorbarRenderer.js'
import * as rul from './renderers/composites/rulerRenderer.js'
import * as lineGraph from './renderers/composites/lineGraphRenderer.js'
import * as barGraph from './renderers/composites/barGraphRenderer.js'

import * as tog from './renderers/components/toggleRenderer.js'
import * as sld from './renderers/components/sliderRenderer.js'

import { drawBitmap, drawSVG } from './renderers/assets/assetsRenderer.js'
import { HorizontalAlignment, OffsetDirection, type Color, type Vec2 } from './types.js'
import { UIKFont } from './assets/uikfont.js'

export class UIKRenderer {
  private _gl: WebGL2RenderingContext

  // Shared static resources
  public static lineShader: UIKShader
  public static roundedRectShader: UIKShader
  public static circleShader: UIKShader
  public static triangleShader: UIKShader
  public static rotatedFontShader: UIKShader
  public static colorbarShader: UIKShader
  public static projectedLineShader: UIKShader
  public static ellipticalFillShader: UIKShader
  public static boxShader: UIKShader
  public static genericVAO: WebGLVertexArrayObject
  public static fullScreenVAO: WebGLVertexArrayObject
  public static triangleVertexBuffer: WebGLBuffer

  /** Access the WebGL context */
  public get gl(): WebGL2RenderingContext {
    return this._gl
  }

  /** Initialize shaders, buffers, and set up state */
  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl

    // --- Shader initialization ---
    if (!UIKRenderer.lineShader) {
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
    if (!UIKRenderer.boxShader) {
      UIKRenderer.boxShader = new UIKShader(gl, boxVert, boxFrag)
    }

    // --- Buffer & VAO initialization ---
    // Full-screen quad
    if (!UIKRenderer.fullScreenVAO) {
      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray(null)
      UIKRenderer.fullScreenVAO = vao
    }

    // Generic rectangle strip
    if (!UIKRenderer.genericVAO) {
      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,0, 1,0,0, 0,1,0, 0,0,0]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
      const tbo = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, tbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1, 1,0, 0,1, 0,0]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(1)
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray(null)
      UIKRenderer.genericVAO = vao
    }

    // Triangle dynamic buffer
    if (!UIKRenderer.triangleVertexBuffer) {
      const buf = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, 6 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW)
      UIKRenderer.triangleVertexBuffer = buf
    }
  }

  // --- Primitives ---
  public drawTriangle(cfg: tri.TriangleConfig): void { tri.drawTriangle(this._gl, cfg) }
  public drawCircle(cfg: circ.CircleConfig): void   { circ.drawCircle(this._gl, cfg) }
  public drawLine(cfg: linePrim.LineConfig): void   { linePrim.drawLine(this._gl, cfg) }
  public drawRoundedRect(cfg: rrect.RoundedRectConfig): void { rrect.drawRoundedRect(this._gl, cfg) }

  /**
 * Purely forwards to our textRenderer.drawRotatedText.
 */
public drawRotatedText(cfg: RotatedTextConfig): void {
  primDrawRotatedText(this._gl, cfg)
}

/**
 * Purely forwards to our textRenderer.drawTextOffset.
 */
public drawTextOffset(cfg: TextOffsetConfig): void {
  primDrawTextOffset(this._gl, cfg)
}

/** Shortcut for “no rotation” text */
public drawText(cfg: RotatedTextConfig): void {
  primDrawText(this._gl, cfg)
}

/** Shortcut for “text just below a point” */
public drawTextBelow(cfg: TextOffsetConfig): void {
  primDrawTextBelow(this._gl, cfg)
}

/** Shortcut for “text just above a point” */
public drawTextAbove(cfg: TextOffsetConfig): void {
  primDrawTextAbove(this._gl, cfg)
}

/** Shortcut for “text to the left of a point” */
public drawTextLeftOf(cfg: TextOffsetConfig): void {
  primDrawTextLeftOf(this._gl, cfg)
}

/** Shortcut for “text to the right of a point” */
public drawTextRightOf(cfg: TextOffsetConfig): void {
  primDrawTextRightOf(this._gl, cfg)
}

/** Shortcut for “center text on a point” */
public drawTextCenteredOn(cfg: TextOffsetConfig): void {
  primDrawTextCenteredOn(this._gl, cfg)
}
  public drawBox(cfg: boxPrim.BoxConfig): void                  { boxPrim.drawBox(this._gl, cfg) }

  // --- Composites ---
  public drawTextBox(cfg: tbox.TextBoxConfig & { fontOutlineColor?: Color }): void {
    // Pass both the box outlineColor and the fontOutlineColor through to the composite
    tbox.drawTextBox(this._gl, cfg)
  }
  public drawColorbar(cfg: cb.ColorbarConfig): void             { cb.drawColorbar(this._gl, cfg) }
  public drawRuler(cfg: rul.RulerConfig): void                  { rul.drawRuler(cfg) }
  public drawLineGraph(cfg: lineGraph.LineGraphConfig): void    { lineGraph.drawLineGraph(cfg) }
  public drawBarGraph(cfg: barGraph.BarGraphConfig): void       { barGraph.drawBarGraph(cfg) }

  // --- UI Components ---
  /** 
   * Caller only needs to pass Position, Size, etc.;
   * we Omit<…, 'renderer'> so they never see “renderer” in the IDE,
   * and then spread it back in for the underlying function.
   */
  public drawToggle(cfg: Omit<tog.ToggleConfig, 'renderer'>): void {
    tog.drawToggle({ renderer: this, ...cfg })
  }

  public drawSlider = sld.drawSlider

  // --- Assets ---
  public drawBitmap(cfg: { bitmap: any; position: Vec2; scale: number }): void { drawBitmap(this._gl, cfg) }
  public drawSVG(cfg: { svgAsset: any; position: Vec2; scale: number }): void   { drawSVG(this._gl, cfg) }
}

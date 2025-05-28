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
import * as textPrim from './renderers/primitives/textRenderer.js'
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
 * Draws rotated text, supporting individual character rendering,
 * high-DPI scaling, outlines, wrapping and alignment.
 */
public drawRotatedText({
  font,
  xy,
  str,
  scale = 1.0,
  color = [1, 0, 0, 1],
  rotation = 0,
  outlineColor = [0, 0, 0, 1],
  isOutline = false,
  maxWidth = 0,
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
  if (!font.isFontLoaded) throw new Error('font not loaded');
  if (!UIKRenderer.rotatedFontShader) throw new Error('rotatedTextShader undefined');

  const gl = this._gl;
  const shader = UIKRenderer.rotatedFontShader;

  // bind font texture & shader
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, font.getTexture());
  shader.use(gl);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  // figure outline color
  const finalOutline = isOutline
    ? (outlineColor || this.calculateOuterColor(color))
    : [color[0], color[1], color[2], 0];
  gl.uniform4fv(shader.uniforms.fontColor, color);
  gl.uniform4fv(shader.uniforms.outlineColor, finalOutline);

  // compute sizing/uniforms
  const sizePx     = font.textHeight * gl.canvas.height * scale;
  let   pxRange    = (sizePx / font.fontMets!.size) * font.fontMets!.distanceRange;
  pxRange          = Math.max(pxRange, 1.0);
  const dpr        = window.devicePixelRatio || 1.0;
  const canvasWH   = [gl.canvas.width * dpr, gl.canvas.height * dpr];

  gl.uniform1f(shader.uniforms.screenPxRange, pxRange);
  gl.uniform1i(shader.uniforms.isOutline, isOutline ? 1 : 0);
  gl.uniform2fv(shader.uniforms.canvasWidthHeight, canvasWH);

  // bind quad VAO
  gl.bindVertexArray(UIKRenderer.genericVAO);

  // set up ortho
  const ortho = mat4.create();
  mat4.ortho(ortho, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

  // word‐wrap
  const words = str.split(' ');
  const lines: string[] = [];
  if (maxWidth > 0) {
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.getTextWidth(test, scale) > maxWidth) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  } else {
    lines.push(str);
  }

  // line stepping
  const lineHeight = font.getTextHeight(str, scale);
  const perpX = -Math.sin(rotation) * lineHeight;
  const perpY =  Math.cos(rotation) * lineHeight;

  // start at baseline
  let baseX = xy[0];
  let baseY = xy[1] - (isOutline
    ? ((1/3 + pxRange * 0.05) * scale)
    : 0
  );

  for (const line of lines) {
    const w = font.getTextWidth(line, scale);
    let alignX = 0, alignY = 0;
    if (alignment === HorizontalAlignment.CENTER) {
      alignX = -Math.cos(rotation) * w * 0.5;
      alignY = -Math.sin(rotation) * w * 0.5;
    } else if (alignment === HorizontalAlignment.RIGHT) {
      alignX = -Math.cos(rotation) * w;
      alignY = -Math.sin(rotation) * w;
    }
    // build model matrix
    const M = mat4.create();
    mat4.translate(M, M, [baseX + alignX, baseY + alignY, 0]);
    mat4.rotateZ(M, M, rotation);

    let cursorX = 0;
    for (const ch of Array.from(line)) {
      const met = font.fontMets!.mets[ch];
      if (!met) continue;

      const cw = met.lbwh[2] * sizePx,
            chh= met.lbwh[3] * sizePx,
            ox = met.lbwh[0] * sizePx,
            oy = met.lbwh[1] * sizePx;

      const charM = mat4.clone(M);
      mat4.translate(charM, charM, [cursorX + ox, -oy, 0]);
      mat4.scale(charM, charM, [cw, -chh, 1]);

      const mvp = mat4.create();
      mat4.multiply(mvp, ortho, charM);
      gl.uniformMatrix4fv(shader.uniforms.modelViewProjectionMatrix, false, mvp);
      gl.uniform4fv(shader.uniforms.uvLeftTopWidthHeight, met.uv_lbwh);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cursorX += met.xadv * sizePx;
    }

    baseX += perpX;
    baseY += perpY;
  }

  gl.bindVertexArray(null);
}


/**
 * Applies an X/Y offset and then calls drawRotatedText.
 */
public drawTextOffset({
  font,
  xy,
  str,
  scale = 1,
  color = [1,0,0,1],
  rotation = 0,
  outlineColor = null,
  isOutline = false,
  maxWidth = 0,
  direction = OffsetDirection.Below
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
  direction?: OffsetDirection
}): void {
  let [x, y] = xy;
  const w = font.getTextWidth(str, scale);
  switch (direction) {
    case OffsetDirection.Below:
      y += font.fontMets!.ascender * scale * font.textHeight * this._gl.canvas.height;
      break;
    case OffsetDirection.Above:
      y += font.fontMets!.descender * scale * font.textHeight * this._gl.canvas.height;
      break;
    case OffsetDirection.LeftOf:
      x -= w; break;
    case OffsetDirection.RightOf:
      x += w; break;
  }
  this.drawRotatedText({
    font, xy: [x,y], str, scale, color, rotation,
    outlineColor, isOutline, maxWidth,
    alignment:
      direction === OffsetDirection.LeftOf  ? HorizontalAlignment.LEFT :
      direction === OffsetDirection.RightOf ? HorizontalAlignment.RIGHT :
      HorizontalAlignment.CENTER
  });
}

/** Shortcut for “below” */
public drawTextBelow(params: Parameters<UIKRenderer['drawTextOffset']>[0]): void {
  this.drawTextOffset({ ...params, direction: OffsetDirection.Below });
}

/** Shortcut for “above” */
public drawTextAbove(params: Parameters<UIKRenderer['drawTextOffset']>[0]): void {
  this.drawTextOffset({ ...params, direction: OffsetDirection.Above });
}

/** Shortcut for “left of” */
public drawTextLeftOf(params: Parameters<UIKRenderer['drawTextOffset']>[0]): void {
  this.drawTextOffset({ ...params, direction: OffsetDirection.LeftOf });
}

/** Shortcut for “right of” */
public drawTextRightOf(params: Parameters<UIKRenderer['drawTextOffset']>[0]): void {
  this.drawTextOffset({ ...params, direction: OffsetDirection.RightOf });
}


/**
 * Convenience, non-rotated drawText.
 */
public drawText({
  font,
  position,
  text,
  scale = 1,
  color = [0,0,0,1],
  outlineColor = [0,0,0,0],
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
  this.drawRotatedText({
    font,
    xy: position,
    str: text,
    scale,
    color,
    rotation: 0,
    outlineColor,
    isOutline,
    maxWidth
  });
}

/**
 * Draws non-rotated (or rotated) text centered on a given point.
 * @param params - Object containing parameters for rendering the text.
 * @param params.font - The font object for rendering text.
 * @param params.xy - The point to center the text on [x, y].
 * @param params.str - The string to render.
 * @param params.scale - The scale of the text. Defaults to 1.0.
 * @param params.color - The color of the text. Defaults to black.
 * @param params.rotation - Rotation in radians. Defaults to 0.
 * @param params.outlineColor - Outline color. Defaults to transparent.
 * @param params.isOutline - Whether to draw an outline. Defaults to false.
 * @param params.maxWidth - Max width for wrapping. Defaults to 0 (no wrap).
 */
public drawTextCenteredOn({
  font,
  xy,
  str,
  scale = 1.0,
  color = [0, 0, 0, 1],
  rotation = 0.0,
  outlineColor = [0, 0, 0, 0],
  isOutline = false,
  maxWidth = 0
}: {
  font: UIKFont,
  xy: Vec2,
  str: string,
  scale?: number,
  color?: Color,
  rotation?: number,
  outlineColor?: Color,
  isOutline?: boolean,
  maxWidth?: number
}): void {
  this.drawRotatedText({
    font,
    xy,
    str,
    scale,
    color,
    rotation,
    outlineColor,
    isOutline,
    maxWidth,
    alignment: HorizontalAlignment.CENTER
  })
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

// src/renderers/primitives/textRenderer.ts

import { mat4 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Color } from '../../types.js'
import { HorizontalAlignment, OffsetDirection } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'
import { calculateOuterColor } from './textUtils.js'

/** Configuration for rotated text rendering */
export interface RotatedTextConfig {
  font: UIKFont
  position: Vec2
  text: string
  scale?: number
  color?: Color
  rotation?: number
  outlineColor?: Color | null
  isOutline?: boolean
  maxWidth?: number
  alignment?: HorizontalAlignment
}

 /**
 * Draws rotated text, supporting individual character rendering,
 * high-DPI scaling, outlines, wrapping and alignment.
 */
export function drawRotatedText(
  gl: WebGL2RenderingContext,
  {
  font,
  position,
  text,
  scale = 1.0,
  color = [1, 0, 0, 1],
  rotation = 0,
  outlineColor = [0, 0, 0, 1],
  isOutline = false,
  maxWidth = 0,
  alignment = HorizontalAlignment.LEFT
}: RotatedTextConfig): void {
  if (!font.isFontLoaded) throw new Error('font not loaded');
  if (!UIKRenderer.rotatedFontShader) throw new Error('rotatedTextShader undefined');

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
    ? (outlineColor || calculateOuterColor(color))
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
  const words = text.split(' ');
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
    lines.push(text);
  }

  // line stepping
  const lineHeight = font.getTextHeight(text, scale);
  const perpX = -Math.sin(rotation) * lineHeight;
  const perpY =  Math.cos(rotation) * lineHeight;

  // start at baseline
  let baseX = position[0];
  let baseY = position[1] - (isOutline
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



/** Configuration for directional offset text */
export interface TextOffsetConfig {
  font: UIKFont
  position: Vec2
  text: string
  scale?: number
  color?: Color
  rotation?: number
  outlineColor?: Color | null
  isOutline?: boolean
  maxWidth?: number
  direction?: OffsetDirection
}

export function drawTextOffset(
  gl: WebGL2RenderingContext,
  {
    font,
    position,
    text,
    scale = 1,
    color = [1, 0, 0, 1],
    rotation = 0,
    outlineColor = null,
    isOutline = false,
    maxWidth = 0,
    direction = OffsetDirection.Below
  }: TextOffsetConfig
): void {
  let [x, y] = position
  const w = font.getTextWidth(text, scale)

  switch (direction) {
    case OffsetDirection.Below:
      y += font.fontMets!.ascender * scale * font.textHeight * gl.canvas.height
      break
    case OffsetDirection.Above:
      y += font.fontMets!.descender * scale * font.textHeight * gl.canvas.height
      break
    case OffsetDirection.LeftOf:
      x -= w
      break
    case OffsetDirection.RightOf:
      x += w
      break
    case OffsetDirection.CenteredOn:
      y += ((font.fontMets!.ascender + font.fontMets!.descender) / 2)
         * scale * font.textHeight * gl.canvas.height
      break
  }

  drawRotatedText(gl, {
    font,
    position: [x, y],
    text,
    scale,
    color,
    rotation,
    outlineColor,
    isOutline,
    maxWidth,
    alignment: HorizontalAlignment.CENTER
  })
}


/** Convenience draw methods */
export const drawText           = (gl: WebGL2RenderingContext, cfg: RotatedTextConfig) =>
  drawRotatedText(gl, { ...cfg, rotation: 0 })
export const drawTextBelow      = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.Below })
export const drawTextAbove      = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.Above })
export const drawTextLeftOf     = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.LeftOf })
export const drawTextRightOf    = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.RightOf })
export const drawTextCenteredOn = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.CenteredOn })

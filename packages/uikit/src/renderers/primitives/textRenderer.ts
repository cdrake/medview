// src/renderers/primitives/textRenderer.ts

import { mat4 } from 'gl-matrix'
import { UIKRenderer } from '../../uikrenderer.js'
import type { Vec2, Color } from '../../types.js'
import { HorizontalAlignment, OffsetDirection } from '../../types.js'
import { UIKFont } from '../../assets/uikfont.js'

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

export function drawRotatedText(
  gl: WebGL2RenderingContext,
  {
    font,
    position,
    text,
    scale = 1.0,
    color = [1, 0, 0, 1],
    rotation = 0,
    outlineColor = null,
    isOutline = false,
    maxWidth = 0,
    alignment = HorizontalAlignment.LEFT
  }: RotatedTextConfig
): void {
  if (!font.isFontLoaded) throw new Error('Font not loaded')

  const shader = UIKRenderer.rotatedFontShader
  if (!shader) throw new Error('rotatedFontShader undefined')

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, font.getTexture())
  shader.use(gl)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)

  const finalColor = color
  if (!outlineColor) outlineColor = [0, 0, 0, 0]

  gl.uniform4fv(shader.uniforms.fontColor, finalColor as Float32List)
  gl.uniform4fv(
    shader.uniforms.outlineColor,
    isOutline
      ? (outlineColor as Float32List)
      : new Float32Array([finalColor[0], finalColor[1], finalColor[2], 0])
  )

  // Compute orthographic projection
  const ortho = mat4.create()
  mat4.ortho(ortho, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1)

  // Word-wrap into lines
  const words = text.split(' ')
  const lines: string[] = maxWidth > 0
    ? words.reduce<string[]>((acc, w) => {
        const last = acc[acc.length - 1] || ''
        const test = last ? last + ' ' + w : w
        return font.getTextWidth(test, scale) > maxWidth
          ? [...acc, w]
          : [...acc.slice(0, -1), test]
      }, [''])
    : [text]

  const lineHeight = font.getTextHeight(text, scale)
  const perpX = -Math.sin(rotation) * lineHeight
  const perpY =  Math.cos(rotation) * lineHeight

  let baseX = position[0]
  let baseY = position[1]

  for (const line of lines) {
    // compute alignment offset along the line
    const lw = font.getTextWidth(line, scale)
    let ax = 0, ay = 0
    if (alignment === HorizontalAlignment.CENTER) {
      ax = -Math.cos(rotation) * lw / 2
      ay = -Math.sin(rotation) * lw / 2
    }
    if (alignment === HorizontalAlignment.RIGHT) {
      ax = -Math.cos(rotation) * lw
      ay = -Math.sin(rotation) * lw
    }

    const model = mat4.create()
    mat4.translate(model, model, [baseX + ax, baseY + ay, 0])
    mat4.rotateZ(model, model, rotation)

    let curX = 0
    for (const ch of Array.from(line)) {
      const mets = font.fontMets!.mets[ch]
      if (!mets) continue

      // character quad size & offset in screen pixels
      const w = mets.lbwh[2] * font.textHeight * gl.canvas.height * scale
      const h = mets.lbwh[3] * font.textHeight * gl.canvas.height * scale
      const xOff = mets.lbwh[0] * font.textHeight * gl.canvas.height * scale
      const yOff = mets.lbwh[1] * font.textHeight * gl.canvas.height * scale

      const charMat = mat4.clone(model)
      mat4.translate(charMat, charMat, [curX + xOff, -yOff, 0])
      mat4.scale(charMat, charMat, [w, -h, 1])

      const mvp = mat4.create()
      mat4.multiply(mvp, ortho, charMat)
      gl.uniformMatrix4fv(shader.uniforms.modelViewProjectionMatrix, false, mvp)
      gl.uniform4fv(shader.uniforms.uvLeftTopWidthHeight, mets.uv_lbwh as Float32List)

      gl.bindVertexArray(UIKRenderer.genericVAO)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      curX += mets.xadv * font.textHeight * gl.canvas.height * scale
    }

    baseX += perpX
    baseY += perpY
  }

  gl.bindVertexArray(null)
}


/** Configuration for text with offset directions */
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
export const drawText               = (gl: WebGL2RenderingContext, cfg: RotatedTextConfig) =>
  drawRotatedText(gl, { ...cfg, rotation: 0 })
export const drawTextBelow          = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.Below })
export const drawTextAbove          = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.Above })
export const drawTextLeftOf         = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.LeftOf })
export const drawTextRightOf        = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.RightOf })
export const drawTextCenteredOn     = (gl: WebGL2RenderingContext, cfg: TextOffsetConfig) =>
  drawTextOffset(gl, { ...cfg, direction: OffsetDirection.CenteredOn })

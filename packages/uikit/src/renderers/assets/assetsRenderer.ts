// src/renderers/assets/assetsRenderer.ts

import { UIKRenderer } from '../../uikrenderer.js'
import { UIKBitmap } from '../../assets/uikbitmap.js'
import { UIKSVG } from '../../assets/uiksvg.js'
import type { Vec2 } from '../../types.js'

/**
 * Draws a bitmap using its associated shader and the shared generic VAO.
 */
export function drawBitmap(
  gl: WebGL2RenderingContext,
  params: { bitmap: UIKBitmap; position: Vec2; scale: number }
): void {
  const { bitmap, position, scale } = params
  const texture = bitmap.getTexture()
  if (!texture) {
    console.error('Bitmap texture not loaded')
    return
  }

  const shader = bitmap.bitmapShader
  shader.use(gl)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(shader.uniforms.u_textureLocation, 0)

  // Set canvas dimensions
  const canvasWidth = gl.canvas.width
  const canvasHeight = gl.canvas.height
  gl.uniform2f(shader.uniforms.canvasWidthHeight, canvasWidth, canvasHeight)

  // Compute and set rectangle for bitmap
  const [x, y] = position
  const w = bitmap.getWidth() * scale
  const h = bitmap.getHeight() * scale
  gl.uniform4f(shader.uniforms.leftTopWidthHeight, x, y, w, h)

  // Draw using the shared generic VAO
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

/**
 * Draws an SVG asset using its associated shader and the shared generic VAO.
 */
export function drawSVG(
  gl: WebGL2RenderingContext,
  params: { svgAsset: UIKSVG; position: Vec2; scale: number }
): void {
  const { svgAsset, position, scale } = params
  const texture = svgAsset.getTexture()
  if (!texture) {
    console.error('SVG texture not loaded')
    return
  }

  const shader = svgAsset.bitmapShader
  shader.use(gl)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(shader.uniforms.u_textureLocation, 0)

  // Set canvas dimensions
  const canvasWidth = gl.canvas.width
  const canvasHeight = gl.canvas.height
  gl.uniform2f(shader.uniforms.canvasWidthHeight, canvasWidth, canvasHeight)

  // Compute and set rectangle for SVG
  const [x, y] = position
  const w = svgAsset.getWidth() * scale
  const h = svgAsset.getHeight() * scale
  gl.uniform4f(shader.uniforms.leftTopWidthHeight, x, y, w, h)

  // Draw using the shared generic VAO
  gl.bindVertexArray(UIKRenderer.genericVAO)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.bindVertexArray(null)
}

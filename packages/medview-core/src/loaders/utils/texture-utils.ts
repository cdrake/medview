export function createTexture(gl: WebGL2RenderingContext, data: Uint8Array, dims: number[]): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) throw new Error('Failed to create texture')

  gl.bindTexture(gl.TEXTURE_3D, texture)
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, dims[0], dims[1], dims[2], 0, gl.RED, gl.UNSIGNED_BYTE, data)

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  gl.bindTexture(gl.TEXTURE_3D, null)
  return texture
}

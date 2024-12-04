import * as nifti from 'nifti-reader-js'
import { createTexture } from './utils/texture-utils'
import { normalizeData } from './utils/data-utils'


export async function loadNiftiToTexture(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> {
  const { data, dims } = await loadNifti(url)
  const normalizedData = normalizeData(data)
  return createTexture(gl, normalizedData, dims)
}

async function loadNifti(url: string): Promise<{ data: Float32Array, dims: number[] }> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()

  if (nifti.isCompressed(buffer)) {
    const decompressed = nifti.decompress(buffer)

    // Convert ArrayBufferLike to ArrayBuffer explicitly
    const arrayBuffer = decompressed instanceof ArrayBuffer 
      ? decompressed 
      : new Uint8Array(decompressed).slice().buffer

    return parseNifti(arrayBuffer)
  } else {
    return parseNifti(buffer)
  }
}

function parseNifti(buffer: ArrayBuffer): { data: Float32Array, dims: number[] } {
  if (!nifti.isNIFTI(buffer)) throw new Error('Not a valid NIfTI file')

  const niftiHeader = nifti.readHeader(buffer)
  if(!niftiHeader) {
    throw Error('Not a Nifti file!')
  }

  const niftiImage = nifti.readImage(niftiHeader, buffer)

  const dims = niftiHeader.dims.slice(1, niftiHeader.dims[0] + 1)
  const data = new Float32Array(niftiImage)

  return { data, dims }
}

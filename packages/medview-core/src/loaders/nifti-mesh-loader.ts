import { mat4 } from 'gl-matrix'
import * as nifti from 'nifti-reader-js'
import { UIKShader, Log, ColorTables } from '@medview/uikit'
import vertexShaderSource from '../shaders/volume.vert.glsl'
import fragmentShaderSourceF from '../shaders/sampler3D.frag.glsl'
import fragmentShaderSourceU from '../shaders/sampler3DUnsigned.frag.glsl'
import fragmentShaderSourceI from '../shaders/sampler3DInt.frag.glsl'

export class NiftiMeshLoader {
  private gl: WebGL2RenderingContext
  public header: nifti.NIFTI1 | nifti.NIFTI2 | null = null
  public volumeTexture: WebGLTexture | null = null
  public vao: WebGLVertexArrayObject | null = null
  private shader: UIKShader | null = null
  private colorTables: ColorTables = new ColorTables()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
  }

  /**
   * Initializes the colormap tables.
   */
  async init(): Promise<void> {
    await this.colorTables.loadColormaps()
  }

  /**
   * Loads a NIfTI file and returns its header and volume data.
   * @param fileUrl - URL of the NIfTI file.
   * @returns A tuple containing the header and volume data.
   */
  async loadFile(fileUrl: string): Promise<[nifti.NIFTI1 | nifti.NIFTI2, ArrayBuffer]> {
    const response = await fetch(fileUrl)
    const niftiData = await response.arrayBuffer()
    const header = nifti.readHeader(niftiData)
    if (!header) throw new Error('Failed to read NIfTI header')

    const volumeData = nifti.readImage(header, niftiData)
    if (!volumeData) throw new Error('Failed to read NIfTI volume data')

    return [header, volumeData]
  }

  /**
 * Creates a 3D texture from a NIfTI header and volume data.
 * @param header - The NIfTI header containing volume information.
 * @param volumeData - The raw volume data.
 * @param colormapName - The name of the colormap to use.
 */
createTexture(header: nifti.NIFTI1 | nifti.NIFTI2, volumeData: ArrayBuffer, colormapName: string): WebGLTexture {
  const gl = this.gl
  this.header = header

  const dims = header.dims
  const width = dims[1]
  const height = dims[2]
  const depth = dims[3]

  const scl_slope = header.scl_slope || 1.0
  const scl_inter = header.scl_inter || 0.0
  const cal_min = header.cal_min || 0.0
  const cal_max = header.cal_max || 1.0

  const numVoxels = width * height * depth
  const rgbaData = new Uint8Array(numVoxels * 4)

  // Get the colormap data
  const colormapData = this.colorTables.colormap(colormapName)

  const intensityArray = new Float32Array(volumeData) // Adjust based on the datatype
  for (let i = 0; i < numVoxels; i++) {
    const rawIntensity = intensityArray[i]
    const scaledIntensity = (rawIntensity * scl_slope) + scl_inter
    const normalized = (scaledIntensity - cal_min) / Math.max(0.00001, cal_max - cal_min)
    const clamped = Math.max(0, Math.min(1, normalized))

    // Inline logic to map intensity to RGBA using the colormap
    const index = Math.floor(clamped * 255)
    const offset = index * 4
    rgbaData[i * 4] = colormapData[offset]
    rgbaData[i * 4 + 1] = colormapData[offset + 1]
    rgbaData[i * 4 + 2] = colormapData[offset + 2]
    rgbaData[i * 4 + 3] = colormapData[offset + 3]
  }

  this.volumeTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_3D, this.volumeTexture)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage3D(
    gl.TEXTURE_3D,
    0,
    gl.RGBA8,
    width,
    height,
    depth,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    rgbaData
  )

  console.log('3D texture successfully generated and uploaded.')
  return this.volumeTexture
}


  /**
   * Creates a Vertex Array Object (VAO) representing a cuboid
   * with texture coordinates for the 3D texture, centered at the AC.
   * @param header - The NIfTI header containing the volume dimensions and affine matrix.
   * @returns A VAO that can be used for rendering the cuboid.
   */
  createCuboidVAO(header: nifti.NIFTI1 | nifti.NIFTI2, cuboidShader: UIKShader): WebGLVertexArrayObject | null {
    const gl = this.gl
    const { dims, pixDims } = header
  
    // Calculate the dimensions of the cuboid in model space
    const width = dims[1] * pixDims[1]
    const height = dims[2] * pixDims[2]
    const depth = dims[3] * pixDims[3]
  
    const vertices = new Float32Array([
      // Position            // Texture Coordinates
      -width / 2, -height / 2, depth / 2,   0.0, 0.0, 1.0, // Front-bottom-left
      width / 2, -height / 2, depth / 2,    1.0, 0.0, 1.0, // Front-bottom-right
      width / 2, height / 2, depth / 2,     1.0, 1.0, 1.0, // Front-top-right
      -width / 2, height / 2, depth / 2,    0.0, 1.0, 1.0, // Front-top-left
  
      -width / 2, -height / 2, -depth / 2,  0.0, 0.0, 0.0, // Back-bottom-left
      width / 2, -height / 2, -depth / 2,   1.0, 0.0, 0.0, // Back-bottom-right
      width / 2, height / 2, -depth / 2,    1.0, 1.0, 0.0, // Back-top-right
      -width / 2, height / 2, -depth / 2,   0.0, 1.0, 0.0  // Back-top-left
    ])
  
    const indices = new Uint16Array([
      // Front face
      0, 1, 2, 0, 2, 3,
      // Back face
      4, 5, 6, 4, 6, 7,
      // Top face
      3, 2, 6, 3, 6, 7,
      // Bottom face
      0, 1, 5, 0, 5, 4,
      // Right face
      1, 2, 6, 1, 6, 5,
      // Left face
      0, 3, 7, 0, 7, 4
    ])
  
    const vao = gl.createVertexArray()
    if (!vao) {
      throw new Error('Failed to create VAO')
    }
  
    gl.bindVertexArray(vao)
  
    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  
    // Get attribute locations from the shader
    const positionLocation = gl.getAttribLocation(cuboidShader.program, 'aPosition')
    const texCoordLocation = gl.getAttribLocation(cuboidShader.program, 'vTexCoord')
  
    // Configure the position attribute
    if (positionLocation >= 0) {
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0) // 3D position
      gl.enableVertexAttribArray(positionLocation)
    }
  
    // Configure the texture coordinate attribute
    if (texCoordLocation >= 0) {
      gl.vertexAttribPointer(texCoordLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT) // Texture coordinates
      gl.enableVertexAttribArray(texCoordLocation)
    }
  
    // Create and bind index buffer
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  
    // Unbind VAO to avoid accidental modifications
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  
    this.vao = vao
    return vao
  }
  
  
}

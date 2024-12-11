import { mat4 } from 'gl-matrix'
import * as nifti from 'nifti-reader-js'
import { UIKShader, Log, ColorTables } from '@medview/uikit'
import vertexShaderSource from '../shaders/volume.vert.glsl'
import fragmentShaderSource from '../shaders/volume.frag.glsl'
import sampler3DFragmentShader from '../shaders/sampler3D.frag.glsl'
import usampler3DFragmentShader from '../shaders/usampler3d.frag.glsl'
import isampler3DFragmentShader from '../shaders/isampler3D.frag.glsl'

export class NiftiMeshLoader {
  private gl: WebGL2RenderingContext
  public header: nifti.NIFTI1 | nifti.NIFTI2 | null = null
  public volumeTexture: WebGLTexture | null = null
  private framebuffer: WebGLFramebuffer | null = null
  private sliceTexture: WebGLTexture | null = null
  private shader: UIKShader | null = null
  public vao: WebGLVertexArrayObject | null = null
  private colorTables: ColorTables
  private colormapTexture: WebGLTexture | null = null

  constructor(gl: WebGL2RenderingContext, colorMap: string = 'viridis') {
    this.gl = gl
    this.colorTables = new ColorTables()
    this.initializeFramebuffer()
    
    this.initializeColormap(colorMap)
  }

  /**
   * Initializes the shader program.
   */
  private initializeShader(datatypeCode: number): void {
    const gl = this.gl
    let fragmentShaderSource: string
  
    // Select the appropriate fragment shader
    switch (datatypeCode) {
      case nifti.NIFTI1.TYPE_UINT8:
        fragmentShaderSource = usampler3DFragmentShader
        break
      case nifti.NIFTI1.TYPE_INT16:
        fragmentShaderSource = isampler3DFragmentShader
        break
      case nifti.NIFTI1.TYPE_FLOAT32:
        fragmentShaderSource = sampler3DFragmentShader
        break
      default:
        throw new Error(`Unsupported NIfTI data type: ${datatypeCode}`)
    }
  
    try {
      this.shader = new UIKShader(gl, vertexShaderSource, fragmentShaderSource)
    } catch (error) {
      Log.error('Failed to initialize shader:', error)
    }
  }
  /**
   * Initializes the framebuffer and 2D texture for rendering slices.
   */
  private initializeFramebuffer(): void {
    const gl = this.gl

    this.framebuffer = gl.createFramebuffer()
    if (!this.framebuffer) {
      throw new Error('Failed to create framebuffer')
    }

    this.sliceTexture = gl.createTexture()
    if (!this.sliceTexture) {
      throw new Error('Failed to create slice texture')
    }

    gl.bindTexture(gl.TEXTURE_2D, this.sliceTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sliceTexture, 0)

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer is not complete: ${status}`)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /**
   * Initializes the Vertex Array Object (VAO).
   */
  private initializeVAO(): void {
    const gl = this.gl
  
    // Define vertices for a quad (vPos.xy) in normalized device coordinates
    const vertices = new Float32Array([
      0.0, 0.0, // Bottom-left
      1.0, 0.0, // Bottom-right
      1.0, 1.0, // Top-right
      0.0, 1.0  // Top-left
    ])
  
    // Define indices for two triangles forming the quad
    const indices = new Uint16Array([
      0, 1, 2, // First triangle
      0, 2, 3  // Second triangle
    ])
  
    // Create and bind a Vertex Array Object (VAO)
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
  
    // Create and bind a vertex buffer
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  
    // Get the attribute location for `vPos`
    const positionLocation = gl.getAttribLocation(this.shader!.program, 'vPos')
    if (positionLocation === -1) {
      throw new Error('Attribute "vPos" not found in shader program')
    }
  
    // Enable the vertex attribute array for `vPos`
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
    // Create and bind an index buffer
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  
    // Unbind the VAO
    gl.bindVertexArray(null)
  }
  

  /**
   * Initializes the colormap texture.
   * @param colorMap - The name of the colormap to use.
   */
  private initializeColormap(colorMap: string): void {
    this.colorTables.loadColormaps().then(() => {
      const gl = this.gl
      const colormapData = this.colorTables.colormap(colorMap)
      this.colormapTexture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        256,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        colormapData
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.bindTexture(gl.TEXTURE_2D, null)
    }).catch((error) => {
      Log.error('Failed to initialize colormap texture:', error)
    })
  }

  /**
   * Generates a 3D texture slice by slice from the NIfTI volume.
   */
  async generate3DTexture(fileUrl: string): Promise<void> {
    try {
      const gl = this.gl
  
      // Fetch and parse the NIfTI file
      const response = await fetch(fileUrl)
      const niftiData = await response.arrayBuffer()
      const header = nifti.readHeader(niftiData)
      if (!header) throw new Error('Failed to read NIfTI header')
  
      const volumeData = nifti.readImage(header, niftiData)
      if (!volumeData) throw new Error('Failed to read NIfTI volume data')
  
      this.header = header
      const datatypeCode = header.datatypeCode
  
      // Initialize the shader with the datatype
      this.initializeShader(datatypeCode)
      this.initializeVAO()
      
      const dims = header.dims
      const width = dims[1]
      const height = dims[2]
      const depth = dims[3]
  
      let glType: GLenum
      let internalFormat: GLenum
      let convertedData: ArrayBufferView
  
      // Determine the type of the volume data
      switch (datatypeCode) {
        case nifti.NIFTI1.TYPE_UINT8:
          internalFormat = gl.R8
          glType = gl.UNSIGNED_BYTE
          convertedData = new Uint8Array(volumeData)
          break
        case nifti.NIFTI1.TYPE_INT16:
          internalFormat = gl.R16I
          glType = gl.SHORT
          convertedData = new Int16Array(volumeData)
          break
        case nifti.NIFTI1.TYPE_FLOAT32:
          internalFormat = gl.R32F
          glType = gl.FLOAT
          convertedData = new Float32Array(volumeData)
          break
        default:
          throw new Error(`Unsupported NIfTI data type: ${datatypeCode}`)
      }
  
      // Verify data size matches the expected volume dimensions
      const elementSize = {
        [gl.UNSIGNED_BYTE]: 1,
        [gl.SHORT]: 2,
        [gl.FLOAT]: 4
      }[glType]
  
      if (convertedData.byteLength / elementSize! !== width * height * depth) {
        throw new Error(
          `Data size mismatch. Expected ${width * height * depth} elements, but got ${
            convertedData.byteLength / elementSize!
          }`
        )
      }
  
      // Upload the 3D texture
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
        internalFormat,
        width,
        height,
        depth,
        0,
        gl.RED,
        glType,
        convertedData
      )
  
      // Bind the colormap texture
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture)
      this.shader?.setUniform(gl, 'colormap', 1)
  
      // Set uniforms that don't change across slices
      this.shader?.setUniform(gl, 'scl_slope', header.scl_slope || 1.0)
      this.shader?.setUniform(gl, 'scl_inter', header.scl_inter || 0.0)
      this.shader?.setUniform(gl, 'cal_max', header.cal_max || 1.0)
      this.shader?.setUniform(gl, 'cal_min', header.cal_min || 0.0)
      this.shader?.setUniform(gl, 'opacity', 1.0)
  
      // Render each slice into the 3D texture
      for (let z = 0; z < depth; z++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.viewport(0, 0, width, height)
  
        // Set the current slice coordinate
        const normalizedZ = z / (depth - 1)
        this.shader?.setUniform(gl, 'coordZ', normalizedZ)
  
        // Render the current slice
        gl.bindVertexArray(this.vao)
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  
        // Copy the rendered slice into the 3D texture
        gl.bindTexture(gl.TEXTURE_3D, this.volumeTexture)
        gl.copyTexSubImage3D(
          gl.TEXTURE_3D,
          0,
          0,
          0,
          z,
          0,
          0,
          width,
          height
        )
      }
  
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    } catch (error) {
      Log.error('Error generating 3D texture:', error)
    }
  }
  
  
  
}

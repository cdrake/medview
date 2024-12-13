import { BaseUIComponent, BaseUIComponentConfig, UIKShader } from '@medview/uikit'
import { mat4, vec3 } from 'gl-matrix'
import { NiftiMeshLoader } from '../loaders/nifti-mesh-loader' // Adjust path as necessary

interface VolumeRendererConfig extends BaseUIComponentConfig {
  gl: WebGL2RenderingContext
  niftiLoader: NiftiMeshLoader
  cuboidShader: UIKShader
}

export class VolumeRendererComponent extends BaseUIComponent {
  private niftiLoader: NiftiMeshLoader
  private _cuboidShader: UIKShader
  private gl: WebGL2RenderingContext
  private modelMatrix: mat4 = mat4.create()
  private viewMatrix: mat4 = mat4.create()
  private projectionMatrix: mat4 = mat4.create()
  private translationOffset: vec3 = vec3.create()
  private rotation: vec3 = vec3.create()
  
  private scaleFactor: number = 1
  private minScale: number = 0.1 // Minimum zoom level
  private maxScale: number = 10  // Maximum zoom level

  private isDragging: boolean = false
  private lastPointerPosition: { x: number; y: number } | null = null

  constructor(config: VolumeRendererConfig) {
    super(config)

    this.gl = config.gl
    this.niftiLoader = config.niftiLoader
    this._cuboidShader = config.cuboidShader

    // Initialize the orthographic matrix using the canvas dimensions
    this.updateOrthoProjectionMatrix()

    // Set up event listeners
    this.onPointerDown = this.handlePointerDown.bind(this)
    this.onPointerMove = this.handlePointerMove.bind(this)
    this.onPointerUp = this.handlePointerUp.bind(this)

    const { dims, pixDims } = this.niftiLoader.header!
    const width = dims[1] * pixDims[1]
    const height = dims[2] * pixDims[2]
    const depth = dims[3] * pixDims[3]

    const largestDimension = Math.max(width, height, depth)
    this.scaleFactor = (1 / 3) * 2.0 / largestDimension
    this.minScale = this.scaleFactor / 5
    this.maxScale = this.scaleFactor * 10
  }

  private updateOrthoProjectionMatrix(): void {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const aspect = canvas.width / canvas.height

    // Define orthographic bounds
    const orthoSize = 1 // Mimic identity range [-1, 1]
    const left = -orthoSize * aspect
    const right = orthoSize * aspect
    const bottom = -orthoSize
    const top = orthoSize
    const near = -1 // Near plane
    const far = 1  // Far plane

    // Create orthographic projection matrix
    mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far)

   


  }


  get cuboidShader(): UIKShader {
    return this._cuboidShader
  }

  set cuboidShader(shader: UIKShader) {
    this._cuboidShader = shader
    this.requestRedraw?.()
  }

  drawVolume(): void {
    const gl = this.gl

    if (!this.niftiLoader?.vao || !this.niftiLoader?.volumeTexture || !this._cuboidShader) {
      console.error('Missing VAO, texture, or shader')
      return
    }

    const bounds = this.bounds // Use the component's bounds for scissor box

    // Enable scissor test and set scissor box
    gl.enable(gl.SCISSOR_TEST)
    const scissorX = Math.round(bounds[0])
    const scissorY = Math.round(gl.canvas.height - bounds[1] - bounds[3]) // Flip Y for WebGL's coordinate system
    const scissorWidth = Math.round(bounds[2])
    const scissorHeight = Math.round(bounds[3])
    gl.scissor(scissorX, scissorY, scissorWidth, scissorHeight)

    // Update projection matrix
    this.updateOrthoProjectionMatrix()

    

    const mvpMatrix = mat4.create()
    mat4.identity(this.modelMatrix)
    mat4.scale(this.modelMatrix, this.modelMatrix, [this.scaleFactor, this.scaleFactor, this.scaleFactor])
    mat4.translate(this.modelMatrix, this.modelMatrix, this.translationOffset)
    mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0])
    mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1])
    mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2])


    // Re-add the perspective projection matrix
    // const fov = Math.PI / 6 // 45 degrees field of view
    // const aspectRatio = gl.canvas.width / gl.canvas.height
    // const near = 0.1
    // const far = 1000.0
    // mat4.perspective(this.projectionMatrix, fov, aspectRatio, near, far)
    // mat4.identity(this.projectionMatrix)
    mat4.multiply(mvpMatrix, this.viewMatrix, this.modelMatrix)
    mat4.multiply(mvpMatrix, this.projectionMatrix, mvpMatrix)

    this._cuboidShader.use(gl)
    this._cuboidShader.setUniform(gl, 'uMVPMatrix', mvpMatrix)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_3D, this.niftiLoader.volumeTexture)
    this._cuboidShader.setUniform(gl, 'uVolumeTexture', 0)

    const clipPlane = [0.0, 0.0, 0.0, 0.0]
    this._cuboidShader.setUniform(gl, 'uClipPlane', clipPlane)

    gl.bindVertexArray(this.niftiLoader.vao)
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

    gl.bindVertexArray(null)
  }

  draw(_renderer: any): void {
    this.drawVolume()
  }

  setRotation(x: number, y: number, z: number): void {
    vec3.set(this.rotation, x, y, z)
    this.requestRedraw?.()
  }

  setScale(scale: number): void {
    this.scaleFactor = scale
    this.requestRedraw?.()
  }

  setTranslateOffset(x: number, y: number, z: number): void {
    vec3.set(this.translationOffset, x, y, z)
    this.requestRedraw?.()
  }

  handlePointerDown(event: PointerEvent): void {
    this.isDragging = true
    this.lastPointerPosition = { x: event.clientX, y: event.clientY }
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isDragging || !this.lastPointerPosition) {
      return
    }

    const deltaX = event.clientX - this.lastPointerPosition.x
    const deltaY = event.clientY - this.lastPointerPosition.y

    // Update rotation based on pointer movement
    this.rotation[1] += deltaX * 0.01 // Rotate around Y-axis (horizontal drag)
    this.rotation[0] += deltaY * 0.01 // Rotate around X-axis (vertical drag)

    this.lastPointerPosition = { x: event.clientX, y: event.clientY }
    this.requestRedraw?.()
  }

  handlePointerUp(): void {
    this.isDragging = false
    this.lastPointerPosition = null
  }

  handleResize(): void {
    this.updateOrthoProjectionMatrix()
  }

  handleWheelScroll(event: WheelEvent): void {
    console.log('current scale factor', this.scaleFactor)
     // Adjust scale factor based on scroll delta
     const zoomSpeed = 0.001
     this.scaleFactor += -event.deltaY * zoomSpeed * this.scaleFactor
 
     // Clamp the scale factor to the min/max range
     this.scaleFactor = Math.max(this.minScale, Math.min(this.maxScale, this.scaleFactor))
      console.log('this.scaleFactor', this.scaleFactor)
     // Request a redraw to reflect the updated scale
     this.requestRedraw?.()
  }
}

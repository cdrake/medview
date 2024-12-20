import { UIKit, UIKRenderer, UIKFont, Vec2, Color, Vec4, LineTerminator, LineStyle, ColorTables, UIKSVG, UIKBitmap, UIKShader, TextComponent, PanelContainerComponent, ColorbarComponent, AlignmentPoint, ButtonComponent } from '@medview/uikit'
import { NiftiMeshLoader } from './loaders/nifti-mesh-loader'
import cuboidVertexShaderSource from './shaders/cuboid.vert.glsl'
import cuboidFragmentShaderSource from './shaders/cuboid.frag.glsl'
import { mat4, vec3 } from 'gl-matrix'
import { VolumeRendererComponent } from './components/volume-renderer-component'

const fontImage = '/fonts/NotoSansHebrew-VariableFont_wght.png'
const fontMetrics = '/fonts/NotoSansHebrew-VariableFont_wght.json'

const fontMTSDFImage = '/fonts/FiraSans-Regular.png'
const fontMTSDFMetrics = '/fonts/FiraSans-Regular.json'


export class CoreRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private uikit: UIKit | null = null

  private renderer: UIKRenderer
  private defaultFont: UIKFont | null = null
  private hebrewFont: UIKFont | null = null
  private mtsdfFont: UIKFont | null = null
  private colorTables: ColorTables = new ColorTables()
  private colorMap: string = "viridis"; // viridis
  private paperClip: UIKSVG | null = null
  private bitmap: UIKBitmap | null = null
  private niftiLoader: NiftiMeshLoader | null = null
  private cuboidShader: UIKShader | null = null
  private rotationAngle: number = Math.PI / 4 // Rotation angle around Z-axis
  private modelMatrix: mat4 = mat4.create()
  private viewMatrix: mat4 = mat4.create()
  private projectionMatrix: mat4 = mat4.create()

  async initUIKit(): Promise<void> {
    const gl = this.gl

    // Instantiate UIKit
    this.uikit = new UIKit(gl)

    // Initialize NiftiMeshLoader
    const niftiLoader = new NiftiMeshLoader(gl)
    await niftiLoader.init()
    const [header, volumeData] = await niftiLoader.loadFile('./images/mni152.nii')
    niftiLoader.createTexture(header, volumeData, 'viridis')
    niftiLoader.createCuboidVAO(header, this.cuboidShader!)

    // Create UIKShader

    // Calculate bounds for the center square of a tic-tac-toe grid
    const canvasWidth = gl.canvas.width
    const canvasHeight = gl.canvas.height
    const cellWidth = canvasWidth / 3
    const cellHeight = canvasHeight / 3
    const centerBounds: [number, number, number, number] = [
      cellWidth, // x
      cellHeight, // y
      cellWidth + 200, // width
      cellHeight + 200 // height
    ]

    // Instantiate VolumeRendererComponent
    const volumeRenderer = new VolumeRendererComponent({
      gl,
      niftiLoader,
      cuboidShader: this.cuboidShader!,
      position: [0, 0],
      bounds: centerBounds,
      alignmentPoint: UIKit.alignmentPoint.MIDDLECENTER
    })
    // Add VolumeRendererComponent to UIKit
    // this.uikit.addComponent(volumeRenderer)

    // Create a PanelContainerComponent with Apple-themed gradient
    const panelContainer = new PanelContainerComponent({
      canvas: this.canvas,
      position: [0, 0],
      bounds: [210, 10, 400, 200],
      backgroundColor: [1, 1, 1, 1],
      gradientStartColor: [0.0, 0.478, 1.0, 0.4], // Apple blue
      gradientEndColor: [0.0, 0.698, 1.0, 1.0], // Slightly lighter blue
      outlineColor: [0.0, 0.0, 0.0, 1.0],
      outlineWidth: 2,
      padding: 35,
      isHorizontal: false
    })

    // Load the default font if not already loaded
    if (!this.defaultFont) {
      this.defaultFont = new UIKFont(gl)
      await this.defaultFont.loadDefaultFont()
    }

    // Add some text components to the panel
    const text1 = new TextComponent({
      position: [20, 20],
      text: 'Welcome to UIKit!',
      font: this.defaultFont,
      textColor: [1, 1, 1, 1],
      scale: 0.7
    })

    const text2 = new TextComponent({
      position: [20, 60],
      text: 'Experience the future of medical visualization.',
      font: this.defaultFont,
      textColor: [1, 1, 1, 1],
      scale: 0.5
    })

    panelContainer.addComponent(text1)
    panelContainer.addComponent(text2)

    // Add the panel to UIKit
    this.uikit.addComponent(panelContainer)

    

    // Add ColorbarComponent
    await ColorbarComponent.loadColorTables()
    const colorbar = new ColorbarComponent({
      gl,
      minMax: [0, 100],
      colormapName: 'viridis',
      bounds: [620, 10, 400, 50],
      font: this.defaultFont,
      tickSpacing: 5,
      tickLength: 15,
      tickColor: [0, 0, 0, 1], // Black
      labelColor: [0, 0, 0, 1], // Black
      alignmentPoint: AlignmentPoint.BOTTOMCENTER      
    })
    await colorbar.init()

    // Add ColorbarComponent to UIKit
    this.uikit.addComponent(colorbar)

    const button = new ButtonComponent({
      font: this.defaultFont!, // Use the default font loaded in CoreRenderer
      position: [300, 400], // Position the button at (300, 400)
      text: 'Click Me', // Button text
      textColor: [1.0, 1.0, 1.0, 1.0], // White text
      backgroundColor: [0.0, 0.5, 1.0, 1.0], // Blue button background
      outlineColor: [0.0, 0.0, 0.0, 1.0], // Black outline
      // outlineThickness: 2, // Outline thickness
      highlightColor: [0.7, 0.7, 0.7, 1.0], // Light gray highlight color on hover
      buttonDownColor: [0.0, 0.4, 0.8, 1.0], // Darker blue on button down
      onClick: (event: PointerEvent) => {
        console.log('Button clicked!', event)
        alert('Button clicked!')
      },
      scale: 0.7, // Default scale
      // margin: 20, // Padding inside the button
      // roundness: 0.5 // Rounded corners (50% roundness)
    })

    this.uikit.addComponent(button)

    // Render the UI
    this.uikit.draw()

    this.renderer.drawTextBox({font: this.defaultFont, xy:[500, 300], text: 'Hello, world!', textColor: [1, 0, 0, 1]})

    // this.renderer.drawRotatedText({
    //   font: this.defaultFont!,
    //   xy: [100, 400], // Starting position of the text
    //   str: 'Hello, MedView!', // The string to render
    //   scale: 0.50, // Scale factor
    //   color: [0.3, 0.75, 0.75, 1.0], // Text color (orange)
    //   rotation: 0, //Math.PI / 6, // Rotation angle in radians (30 degrees)
    //   outlineColor: [0, 0, 0, 1], // Outline color (black)
    //   outlineThickness: 2 // Outline thickness
    // })
   // this.renderer.drawMTSDFText({font: this.mtsdfFont!, xy: [400, 100], str: 'Hello, MTSDF', scale: 0.5, color: [0.3, 0.75, 0.75, 1.0]})
}
  
  async loadAssets() {
    this.defaultFont = new UIKFont(this.gl)
    await this.defaultFont.loadDefaultFont()
    this.hebrewFont = new UIKFont(this.gl)
    await this.hebrewFont.loadFont(fontImage, fontMetrics)
    this.mtsdfFont = new UIKFont(this.gl)
    await this.mtsdfFont.loadFont(fontMTSDFImage, fontMTSDFMetrics)
    await this.colorTables.loadColormaps()
    this.paperClip = new UIKSVG(this.gl)
    await this.paperClip.loadSVG('/svg/paper-clip.svg')
    this.bitmap = new UIKBitmap(this.gl)
    await this.bitmap.loadBitmap('/images/rorden.png')
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext

    if (!this.gl) {
      throw new Error('WebGL2 is not supported in this browser')
    }
    // console.log('frag shader', cuboidFragmentShaderSource)
    this.cuboidShader = new UIKShader(this.gl, cuboidVertexShaderSource, cuboidFragmentShaderSource)
    // Initialize the UIKRenderer
    this.renderer = new UIKRenderer(this.gl)
    this.niftiLoader = new NiftiMeshLoader(this.gl)

    // Load the default font
    // this.defaultFont = new UIKFont(this.gl)
    // this.defaultFont.loadDefaultFont().then(() => {
    //   console.log('Default font loaded successfully')
    //   this.hebrewFont = new UIKFont(this.gl)
    //   this.hebrewFont.loadFont(fontImage, fontMetrics).then(() => {
    //     console.log('Heebo font loaded successfully')
    //     this.draw() // Redraw once the font is loaded
    //   })
      
    // })
    // this.init().then(() => this.draw())
    this.loadAssets().then(() => this.drawText())
    
  }

  drawText() {
    this.clear([0.5, 0.5, 0.5, 1.0])

    const str = 'M' //'Hello, MTSDF'
    let color = [0.3, 0.75, 0.75, 1.0] // [0, 0, 0, 1]//
    //this.renderer.drawMTSDFText({font: this.mtsdfFont!, xy: [400, 100], str, scale: 0.5, color })
    //drawMTSDFText(font: UIKFont, xy: number[], str: string, scale = 1, color: Float32List | null = null): void {
    // this.renderer.drawMTSDFText(this.mtsdfFont!, [400, 100], str, 1, color )
    color = [0, 0, 0, 1]     
    this.renderer.drawRotatedText({
      font: this.mtsdfFont!,
      xy: [100, 400], // Starting position of the text
      str: 'Hello, MTSDF', // The string to render
      scale: 0.50, // Scale factor
      color, // Text color (orange)
      rotation: 0, //Math.PI / 6, // Rotation angle in radians (30 degrees)
      isOutline: true // Outline thickness
    })

    color = [0.0, 0.478, 1.0, 0.4]
    this.renderer.drawRotatedText({
      font: this.mtsdfFont!,
      xy: [400, 400], // Starting position of the text
      str: 'Hello, MTSDF', // The string to render
      scale: 1.50, // Scale factor
      color, //[0.3, 0.75, 0.75, 1.0], // Text color (orange)
      rotation: Math.PI / 6, // Rotation angle in radians (30 degrees)
      // outlineColor: null, //[0, 0, 0, 1], // Outline color (black)
      isOutline: true // Outline thickness
    })

    color = [1, 1, 1, 1] // [0.0, 0.478, 1.0, 1.0]
    this.renderer.drawRotatedText({
      font: this.defaultFont!,
      xy: [150, 200],
      str: 'This is a long string that will wrap if it exceeds the max width.',
      scale: 1.0,
      color,
      // outlineColor: [0.25, 0.25, 1, 1],
      rotation: -Math.PI / 6, // 30-degree rotation
      maxWidth: 300, // Wrap to fit within 300px
      isOutline: true
    })

  }

  async init() {
    // fonts
    this.defaultFont = new UIKFont(this.gl)
    await this.defaultFont.loadDefaultFont()
    this.hebrewFont = new UIKFont(this.gl)
    await this.hebrewFont.loadFont(fontImage, fontMetrics)
    this.mtsdfFont = new UIKFont(this.gl)
    await this.mtsdfFont.loadFont(fontMTSDFImage, fontMTSDFMetrics)

    await this.colorTables.loadColormaps()
    this.paperClip = new UIKSVG(this.gl)
    await this.paperClip.loadSVG('/svg/paper-clip.svg')
    this.bitmap = new UIKBitmap(this.gl)
    await this.bitmap.loadBitmap('/images/rorden.png')

    // Load and generate the 3D texture
    await this.niftiLoader!.init()
    const result = await this.niftiLoader?.loadFile('./images/mni152.nii')
    if (!result) {
      throw new Error('Failed to load NIfTI file.')
    }

    const [header, volumeData] = result
    
    this.niftiLoader!.createTexture(header, volumeData, 'gray')      
    this.niftiLoader!.createCuboidVAO(header, this.cuboidShader!)      
    //TODO: remove
    // this.createHardcodedVertexBuffer()

    // Initialize matrices
    mat4.lookAt(this.viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]) // Eye, center, up
    mat4.perspective(this.projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0) // FOV, aspect, near, far
  }

  // private createHardcodedVertexBuffer(): void {
  //   const gl = this.gl;
  
  //   // Hardcoded cube vertices in NDC with texture coordinates
  //   const vertices = new Float32Array([
  //     // Front face
  //     -0.5, -0.5,  0.5,  0.0, 0.0,
  //      0.5, -0.5,  0.5,  1.0, 0.0,
  //      0.5,  0.5,  0.5,  1.0, 1.0,
  //     -0.5,  0.5,  0.5,  0.0, 1.0,
  //     // Back face
  //     -0.5, -0.5, -0.5,  0.0, 0.0,
  //      0.5, -0.5, -0.5,  1.0, 0.0,
  //      0.5,  0.5, -0.5,  1.0, 1.0,
  //     -0.5,  0.5, -0.5,  0.0, 1.0,
  //   ]);
  
  //   const indices = new Uint16Array([
  //     // Front face
  //     0, 1, 2, 0, 2, 3,
  //     // Back face
  //     4, 5, 6, 4, 6, 7,
  //     // Top face
  //     3, 2, 6, 3, 6, 7,
  //     // Bottom face
  //     0, 1, 5, 0, 5, 4,
  //     // Right face
  //     1, 2, 6, 1, 6, 5,
  //     // Left face
  //     0, 3, 7, 0, 7, 4
  //   ]);
  
  //   // Create and bind VAO
  //   const vao = gl.createVertexArray();
  //   gl.bindVertexArray(vao);
  
  //   // Vertex buffer
  //   const vertexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  //   // Index buffer
  //   const indexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
  //   // Define attributes
  //   const positionLocation = gl.getAttribLocation(this.cuboidShader!.program, 'aPosition');
  //   const texCoordLocation = gl.getAttribLocation(this.cuboidShader!.program, 'aTexCoord');
  
  //   if (positionLocation >= 0) {
  //     gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 20, 0);
  //     gl.enableVertexAttribArray(positionLocation);
  //   }
  
  //   if (texCoordLocation >= 0) {
  //     gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 20, 12);
  //     gl.enableVertexAttribArray(texCoordLocation);
  //   }
  
  //   // Unbind VAO
  //   gl.bindVertexArray(null);
  
  //   this.niftiLoader!.vao = vao; // Assign the VAO for rendering
  // }
  

  /**
   * Render the cuboid with the 3D texture.
   */
  // private renderCuboid(): void {
  //   const gl = this.gl
  
  //   // Check for required resources
  //   if (!this.niftiLoader?.vao || !this.niftiLoader?.volumeTexture || !this.cuboidShader) {
  //     console.error('Missing VAO, texture, or shader')
  //     return
  //   }
  
  //   // Set viewport and clear the canvas
  //   gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  
  //   // Calculate the Model-View-Projection (MVP) matrix
  //   const mvpMatrix = mat4.create()
  //   mat4.identity(this.modelMatrix)
  //   mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotationAngle) // Y-axis rotation
  //   mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotationAngle / 2) // Z-axis rotation
  //   mat4.multiply(mvpMatrix, this.viewMatrix, this.modelMatrix) // View * Model
  //   mat4.multiply(mvpMatrix, this.projectionMatrix, mvpMatrix) // Projection * (View * Model)
  
  //   console.log('MVP Matrix:', mvpMatrix)
  
  //   // Use the cuboid shader program
  //   this.cuboidShader.use(gl)
  
  //   // Set the MVP matrix uniform
  //   this.cuboidShader.setUniform(gl, 'uMVPMatrix', mvpMatrix)
  
  //   // Bind the 3D texture and set the texture uniform
  //   gl.activeTexture(gl.TEXTURE0)
  //   gl.bindTexture(gl.TEXTURE_3D, this.niftiLoader.volumeTexture)
  //   this.cuboidShader.setUniform(gl, 'uVolumeTexture', 0)
  
  //   // Bind the VAO
  //   gl.bindVertexArray(this.niftiLoader.vao)
  
  //   // Enable attributes explicitly (this ensures they are active during rendering)
  //   const positionLocation = gl.getAttribLocation(this.cuboidShader.program, 'aPosition')
  //   const texCoordLocation = gl.getAttribLocation(this.cuboidShader.program, 'aTexCoord')
  
  //   if (positionLocation >= 0) {
  //     gl.enableVertexAttribArray(positionLocation)
  //   }
  //   if (texCoordLocation >= 0) {
  //     gl.enableVertexAttribArray(texCoordLocation)
  //   }
  
  //   // Render the cuboid using drawElements
  //   gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
  
  //   // Disable attributes after rendering to avoid unintended use later
  //   if (positionLocation >= 0) {
  //     gl.disableVertexAttribArray(positionLocation)
  //   }
  //   if (texCoordLocation >= 0) {
  //     gl.disableVertexAttribArray(texCoordLocation)
  //   }
  
  //   // Unbind the VAO after rendering
  //   gl.bindVertexArray(null)
  // }
  
  private renderCuboid(): void {
    const gl = this.gl
  
    if (!this.niftiLoader?.vao || !this.niftiLoader?.volumeTexture || !this.cuboidShader) {
      console.error('Missing VAO, texture, or shader')
      return
    }
  
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // gl.enable(gl.CULL_FACE)
    // gl.cullFace(gl.BACK)

    const { dims, pixDims } = this.niftiLoader.header!
    const width = dims[1] * pixDims[1]
    const height = dims[2] * pixDims[2]
    const depth = dims[3] * pixDims[3]
  
    // Calculate the scale factor based on the largest dimension
    const largestDimension = Math.max(width, height, depth)
    const scaleFactor = (1 / 3) * 2.0 / largestDimension
  
    // Create the MVP matrix
    const mvpMatrix = mat4.create()
    mat4.identity(this.modelMatrix)
    mat4.scale(this.modelMatrix, this.modelMatrix, [scaleFactor, scaleFactor, scaleFactor]) // Scale to fit within 1/3 of canvas
    mat4.translate(this.modelMatrix, this.modelMatrix, [0, 0, -0.5]) // Position the cuboid in the center
    mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotationAngle)
    mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotationAngle / 2)
    mat4.multiply(mvpMatrix, this.viewMatrix, this.modelMatrix)
    mat4.multiply(mvpMatrix, this.projectionMatrix, mvpMatrix)
  
    // Use the cuboid shader
    this.cuboidShader.use(gl)
    this.cuboidShader.setUniform(gl, 'uMVPMatrix', mvpMatrix)
  
    // Bind 3D texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_3D, this.niftiLoader.volumeTexture)
    this.cuboidShader.setUniform(gl, 'uVolumeTexture', 0)
  
    // Set the clip plane
    const clipPlane = [0.0, 0.0, 0.0, 0.0]; // Example: z-axis plane at 0.5 in normalized texture space
    // const clipPlane = [0.0, 0.0, 1.0, 0.0]
    this.cuboidShader.setUniform(gl, 'uClipPlane', clipPlane)
    // this.cuboidShader.setUniform(gl, 'uEnableClipping', false)
    // Bind VAO
    gl.bindVertexArray(this.niftiLoader.vao)
  
    // Render the cuboid
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
  
    // Cleanup
    gl.bindVertexArray(null)
  }
  
  
  
  
  
  /**
 * Main draw method that demonstrates rendering shapes, rotated text, and a ruler.
 */
async draw(): Promise<void> {
    if (!this.defaultFont!.isFontLoaded) {
      return
    }
  
    // Clear the canvas with a black background
    this.clear([0.5, 0.5, 0.5, 1])
    this.renderCuboid()
    // Draw a triangle
    // this.renderer.drawTriangle({
    //   headPoint: [100, 600],
    //   baseMidPoint: [100, 800],
    //   baseLength: 200,
    //   color: [1, 0, 0, 1] // Red triangle
    // })
  
    // // Draw a circle
    // this.renderer.drawCircle({
    //   leftTopWidthHeight: [250, 700, 150, 150],
    //   circleColor: [0, 0, 1, 1], // Blue circle
    //   fillPercent: 1.0
    // })
  
    // // Draw a line
    // this.renderer.drawLine({
    //   startEnd: [200, 800, 600, 610],
    //   thickness: 5,
    //   color: [0, 1, 0, 1], // Green line
    //   style: LineStyle.SOLID,
    //   terminator: LineTerminator.ARROW
    // })
  
    // // Draw another triangle
    // this.renderer.drawTriangle({
    //   headPoint: [500, 600],
    //   baseMidPoint: [500, 800],
    //   baseLength: 200,
    //   color: [1, 1, 0, 1] // Yellow triangle
    // })
  
    // // // Draw rotated text
    // this.renderer.drawRotatedText({
    //   font: this.defaultFont!,
    //   xy: [100, 300], // Starting position of the text
    //   str: 'Hello, MedView!', // The string to render
    //   scale: 0.50, // Scale factor
    //   color: [0.3, 0.75, 0.75, 1.0], // Text color (orange)
    //   rotation: Math.PI / 6, // Rotation angle in radians (30 degrees)
    //   outlineColor: [0, 0, 0, 1], // Outline color (black)
    //   outlineThickness: 2 // Outline thickness
    // })
  
    // // Draw a ruler
    // this.renderer.drawRuler({
    //   pointA: [300, 500], // Starting point of the ruler
    //   pointB: [600, 500], // Ending point of the ruler
    //   length: 30.5, // Length value to display
    //   units: 'cm', // Units to display
    //   font: this.defaultFont!, // Font for text
    //   textColor: [1, 0, 0, 1], // Red text
    //   lineColor: [0, 0, 0, 1], // Black ruler lines
    //   lineThickness: 2, // Thickness of the lines
    //   offset: 50, // Offset distance for parallel line and text
    //   scale: 1.0, // Scale factor for text
    //   showTickmarkNumbers: true // Show tickmark numbers
    // })

    // this.renderer.drawRotatedText({
    //   font: this.defaultFont!,
    //   xy: [500, 200],
    //   str: 'This is a long string that will wrap if it exceeds the maxWidth.',
    //   scale: 0.5,
    //   color: [1, 1, 1, 1],
    //   outlineColor: [0.25, 0.25, 1, 1],
    //   rotation: Math.PI / 6, // 30-degree rotation
    //   maxWidth: 300 // Wrap to fit within 300px
    // })

    // // if(this.hebrewFont) {
    // // this.renderer.drawRotatedText({
    // //   font: this.hebrewFont,
    // //   xy: [800, 500],
    // //   str: 'שָׁלוֹם עֲלֵיכֶם',
    // //   scale: 0.5,
    // //   color: [1, 1, 1, 1],
    // //   outlineColor: [0.25, 0.25, 1, 1],
    // //   rotation: 0,//Math.PI / 6, // 30-degree rotation
    // //   maxWidth: 300 // Wrap to fit within 300px
    // // })
    // // }
    // // const gradientTexture = this.colorTables.generateColorMapTexture(this.gl, this.colorMap)
    // // this.renderer.drawColorbar({position: [200, 500], size: [400, 50], gradientTexture})

    // this.renderer.drawSVG({svgAsset: this.paperClip!, position: [200, 500], scale: 0.2})
    // this.renderer.drawBitmap({bitmap: this.bitmap!, position: [500, 500], scale: 1.0})
    // this.renderer.drawToggle({position: [800, 500], size: [100, 50], isOn: true, onColor: [0, 1, 0, 1], offColor: [0.5, 0.5, 0.5, 1]})    
    // this.renderer.drawSlider({
    //   position: [800, 700],
    //   size: [300, 40], // Slider size
    //   value: 50, // Current slider value
    //   min: 0,
    //   max: 100,
    //   trackColor: [0.8, 0.8, 0.8, 1.0], // Light gray
    //   fillColor: [0.0, 0.5, 1.0, 1.0], // Blue
    //   knobColor: [1.0, 1.0, 1.0, 1.0], // White
    //   shadowColor: [0.0, 0.0, 0.0, 0.3], // Light black shadow
    //   shadowOffset: [0.03, -0.03], // Slight shadow offset
    //   shadowBlur: 0.1, // Smooth shadow blur
    //   valueTextColor: [0.0, 0.5, 1.0, 1.0], // Blue text
    //   font: this.defaultFont!, // Default font for rendering the slider value
    //   scale: 0.5 // Default scale
    // })
    
    
    
  // this.renderer.drawLine({
  //   startEnd: [500, 500, 1000, 800],
  //   thickness: 5,
  //   color: [0, 1, 0, 1], // Green line
  //   style: LineStyle.SOLID,
  //   terminator: LineTerminator.ARROW
  // })
      // Increment rotation angle
      this.rotationAngle += 0.01     
      // Schedule the next frame
      // requestAnimationFrame(() => this.draw())
  }
  

  /**
   * Clears the canvas.
   * @param color - Optional background color.
   */
  clear(color: Color = [0, 0, 0, 1]): void {
    const { gl } = this
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  /**
   * Resizes the canvas and adjusts the WebGL viewport.
   * @param width - The new width of the canvas.
   * @param height - The new height of the canvas.
   */
  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Creates a basic orthographic projection matrix.
   */
  createProjectionMatrix(): Float32Array {
    const aspect = this.canvas.width / this.canvas.height
    const near = 0.1
    const far = 100.0
    const size = 10.0

    const left = -size * aspect
    const right = size * aspect
    const top = size
    const bottom = -size

    const projectionMatrix = new Float32Array(16)
    const r_l = 1.0 / (right - left)
    const t_b = 1.0 / (top - bottom)
    const f_n = 1.0 / (far - near)

    projectionMatrix[0] = 2.0 * r_l
    projectionMatrix[5] = 2.0 * t_b
    projectionMatrix[10] = -2.0 * f_n
    projectionMatrix[12] = -(right + left) * r_l
    projectionMatrix[13] = -(top + bottom) * t_b
    projectionMatrix[14] = -(far + near) * f_n
    projectionMatrix[15] = 1.0

    return projectionMatrix
  }

}

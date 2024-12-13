import { Rectangle, QuadTree } from './quadtree'
import {
  Vec2,
  Vec4,
  Color,
  LineStyle,
  LineTerminator,
  ComponentSide,
  AlignmentPoint,
  HorizontalAlignment,
  VerticalAlignment,
  Plane
} from './types'
import { UIKRenderer } from './uikrenderer'
import { UIKFont } from './assets/uikfont'
import { UIKBitmap } from './assets/uikbitmap'
import { BaseContainerComponent } from './components/base-container-component'
import { AnimationManager } from './animationmanager'
import { IUIComponent } from './interfaces'


export class UIKit {
  private gl: WebGL2RenderingContext
  private renderer: UIKRenderer
  private quadTree: QuadTree<IUIComponent>
  private _redrawRequested?: () => void

  // Style field
  public style: {
    textColor: Color
    foregroundColor: Color
    backgroundColor: Color
    textSize: number
  }

  private canvasWidth: number
  private canvasHeight: number
  private dpr: number

  private resizeObserver: ResizeObserver
  private lastClickTime: DOMHighResTimeStamp = 0
  private activePointers: Map<number, Vec2> = new Map()
  private lastDistance: number = 0
  private lastAngle: number = 0
  private lastPanPosition: Vec2 = [-1, -1]

  private onFileDrop?: (data: DataTransfer) => void
  private onDragOver?: (event: DragEvent) => void

  // Static enums
  public static lineTerminator = LineTerminator
  public static lineStyle = LineStyle
  public static componentSide = ComponentSide
  public static alignmentPoint = AlignmentPoint
  public static horizontalAlignment = HorizontalAlignment
  public static verticalAlignment = VerticalAlignment
  public static plane = Plane

  private lastHoveredComponents: Set<IUIComponent> = new Set()

  public get redrawRequested(): (() => void) | undefined {
    return this._redrawRequested
  }

  public set redrawRequested(callback: (() => void) | undefined) {
    const canvas = this.gl.canvas as HTMLCanvasElement
    if (callback) {
      canvas.removeEventListener('pointerup', this.handlePointerUp.bind(this))
      canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this))
      canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this))
      window.removeEventListener('resize', this.resizeListener)
      console.log('event handlers removed')
    } else {
      canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this))
      canvas.addEventListener('pointerup', this.handlePointerUp.bind(this))
      canvas.addEventListener('pointermove', this.handlePointerMove.bind(this))
      window.addEventListener('resize', this.resizeListener)
    }
    this._redrawRequested = callback
  }

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.renderer = new UIKRenderer(gl)
    this.dpr = window.devicePixelRatio || 1
    const canvas = this.gl.canvas as HTMLCanvasElement
    this.resizeObserver = new ResizeObserver(this.handleWindowResize.bind(this))
    this.resizeObserver.observe((this.gl.canvas as HTMLCanvasElement).parentElement!)
    const rect = canvas.parentElement!.getBoundingClientRect()
    this.canvasWidth = rect.width
    this.canvasHeight = rect.height

    this.style = {
      textColor: [0, 0, 0, 1],
      foregroundColor: [1, 1, 1, 1],
      backgroundColor: [0, 0, 0, 1],
      textSize: 12
    }
    const bounds = new Rectangle(0, 0, this.canvasWidth * this.dpr, this.canvasHeight * this.dpr)
    this.quadTree = new QuadTree<IUIComponent>(bounds)

    const animationManager = AnimationManager.getInstance()
    animationManager.setRequestRedrawCallback(this.requestRedraw.bind(this))

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => {
        this.resizeListener()
      })
    })
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.resizeListener()
      })
    })
    this.resizeObserver.observe(canvas.parentElement!)

    canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this))
    canvas.addEventListener('pointerup', this.handlePointerUp.bind(this))
    canvas.addEventListener('pointermove', this.handlePointerMove.bind(this))
    canvas.addEventListener('pointercancel', this.handlePointerCancel.bind(this))
    // Add event listeners for drag and drop
    canvas.addEventListener('dragover', this.handleDragOver.bind(this))
    canvas.addEventListener('dragleave', this.handleDragLeave.bind(this))
    canvas.addEventListener('drop', this.handleFileDrop.bind(this))

    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`
    const media = matchMedia(mqString)
    media.addEventListener('change', this.handleUpdatedPixelRatio.bind(this))

    // Add event listener for wheel (scroll) events
    canvas.addEventListener('wheel', this.handleWheel.bind(this))
  }

   /**
   * Set a general-purpose callback for file drop events.
   * @param callback - A function to receive all dropped files.
   */
   public setOnFileDrop(callback: (data: DataTransfer) => void): void {
    this.onFileDrop = callback
  }

  /**
   * Set a callback to handle dragover events.
   * @param callback - A function to handle dragover events.
   */
  public setOnDragOver(callback: (event: DragEvent) => void): void {
    this.onDragOver = callback
  }

  /**
   * Handle drag over event to allow dropping.
   * @param event - The drag event.
   */
  private handleDragOver(event: DragEvent): void {
    event.preventDefault()

    // Invoke the dragover callback if defined
    if (this.onDragOver) {
      this.onDragOver(event)
    } else {
      const canvas = this.gl.canvas as HTMLCanvasElement
      canvas.style.border = '2px dashed #0078d4' // Optional: Add visual feedback
    }
  }

  /**
   * Handle drag leave event to reset styles.
   * @param event - The drag event.
   */
  private handleDragLeave(event: DragEvent): void {
    event.preventDefault()
    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.style.border = '' // Reset border style
  }

  /**
   * Handle file drop event.
   * @param event - The drop event.
   */
  private handleFileDrop(event: DragEvent): void {
    event.preventDefault()
    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.style.border = '' // Reset border style

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {

      // Invoke the general-purpose file drop handler, if defined
      if (this.onFileDrop) {
        this.onFileDrop(event.dataTransfer)
      }
      
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()

    const { clientX, clientY } = event
    const point: Vec2 = [clientX * this.dpr, clientY * this.dpr]

    // Query components under the mouse pointer
    const components = this.quadTree.queryPoint(point).filter((component) => component.isVisible)

    for (const component of components) {
      // Check if the component has a zoom handler
      if (typeof component.handleWheelScroll === 'function') {
        component.handleWheelScroll(event)
      }
    }
  }

  /**
   * callback function to handle resize window events, redraws the scene.
   * @internal
   */
  resizeListener(): void {
    if (!this.gl) {
      return
    }

    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'

    if ('width' in canvas.parentElement!) {
      canvas.width = (canvas.parentElement.width as number) * this.dpr
      // @ts-expect-error not sure why height is not defined for HTMLElement
      canvas.height = this.canvas.parentElement.height * this.uiData.dpr
    } else {
      canvas.width = canvas.offsetWidth * this.dpr
      canvas.height = canvas.offsetHeight * this.dpr
    }

    const bounds = new Rectangle(0, 0, canvas.width, canvas.height)
    this.quadTree.updateBoundary(bounds)
  }

  handleUpdatedPixelRatio(): void {
    this.dpr = window.devicePixelRatio
    this.resizeListener()
    if (this.redrawRequested) {
      this.redrawRequested()
    } else {
      this.draw()
    }
    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`
    const media = matchMedia(mqString)
    media.addEventListener('change', this.handleUpdatedPixelRatio.bind(this))
  }

  // Method to add a component to the QuadTree
  public addComponent(component: IUIComponent): void {
    if (component instanceof BaseContainerComponent) {
      component.quadTree = this.quadTree
    }
    component.requestRedraw = this.requestRedraw.bind(this)
    this.quadTree.insert(component)
  }

  getComponents(
    boundsInScreenCoords?: Vec4,
    tags: string[] = [],
    useAnd: boolean = true,
    useNot: boolean = false
  ): IUIComponent[] {
    const candidates = boundsInScreenCoords
      ? this.quadTree.query(Rectangle.fromVec4(boundsInScreenCoords))
      : this.quadTree.getAllElements()

    return candidates.filter((component) => {
      // If tags array is empty, return only components without tags
      if (tags.length === 0) {
        return component.tags.length === 0
      }
      const hasTags = useAnd
        ? tags.every((tag) => component.tags.includes(tag))
        : tags.some((tag) => component.tags.includes(tag))

      return useNot ? !hasTags : hasTags
    })
  }

  public alignItems(leftTopWidthHeight?: Vec4, tags: string[] = []): void {
    // Set up bounds for filtering and positioning
    const bounds: Vec4 = leftTopWidthHeight || [0, 0, this.gl.canvas.width, this.gl.canvas.height]

    // Retrieve components that match the specified tags and are within bounds
    const components = this.getComponents(
      leftTopWidthHeight,
      tags,
      true // Match all specified tags
    )

    for (const component of components) {
      // Align component within bounds if specified
      component.align(bounds)
    }
  }

  public draw(leftTopWidthHeight?: Vec4, tags: string[] = []): void {
    this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

    // Set up bounds for filtering and positioning
    // Retrieve components that match the specified tags and are within bounds
    const components = this.getComponents(
      leftTopWidthHeight,
      tags,
      true // Match all specified tags
    )
    for (const component of components) {
      // Align component within bounds if specified
      // component.align(bounds)
      // Draw the component using NVRenderer
      if (component.isVisible) {
        component.draw(this.renderer)
      }
    }
  }

  // Method to request a redraw
  private requestRedraw(): void {
    if (this._redrawRequested) {
      this._redrawRequested()
    } else {
      // no host
      this.draw()
    }
  }

  public processPointerMove(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x, y]
    const components = new Set(this.quadTree.queryPoint(point).filter((component) => component.isVisible))
    for (const component of components) {
      if (!component.isVisible) {
        continue
      }
      if (!this.lastHoveredComponents.has(component)) {
        component.applyEventEffects('pointerenter', event)
        if (typeof component.handlePointerEnter === 'function') {
          component.handlePointerEnter(event)
        }
      }

      if (typeof component.handlePointerMove === 'function') {
        component.handlePointerMove(event)
      }
    }
    for (const component of this.lastHoveredComponents) {
      if (!components.has(component)) {
        component.applyEventEffects('pointerleave', event)
        if (typeof component.handlePointerLeave === 'function') {
          component.handlePointerLeave(event)
        }
      }
    }
    this.lastHoveredComponents = components
  }

  public processPointerDown(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x, y]
    const components = this.quadTree.queryPoint(point)
    for (const component of components) {
      if (component.isVisible) {
        component.applyEventEffects('pointerdown', event)
        if (typeof component.handlePointerDown === 'function') {
          component.handlePointerDown(event)
        }
      }
    }
  }

  public processPointerUp(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x, y]
    const components = this.quadTree.queryPoint(point)
    for (const component of components) {
      if (component.isVisible) {
        component.applyEventEffects('pointerup', event)
        if (typeof component.handlePointerUp === 'function') {
          component.handlePointerUp(event)
        }
      }
    }
  }

  // Method to handle window resize events
  public handleWindowResize(): void {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const width = canvas.clientWidth * this.dpr
    const height = canvas.clientHeight * this.dpr

    // Update canvasWidth and canvasHeight
    this.canvasWidth = width
    this.canvasHeight = height

    const bounds = new Rectangle(0, 0, this.canvasWidth * this.dpr, this.canvasHeight * this.dpr)
    this.quadTree.updateBoundary(bounds)

    const components = this.quadTree.getAllElements()
    for (const component of components) {
      if (typeof component.handleResize === 'function') {
        component.handleResize()
      }
    }
  }

  // Handler for pointer down events
  private handlePointerDown(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.activePointers.set(event.pointerId, [pos.x, pos.y])
      this.processPointerDown(pos.x, pos.y, event)
    }    
  }

  private handlePointerUp(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      // console.log('handle click called')
      const currentClickTime = performance.now()
      // console.log('current click time', currentClickTime)
      const elapsed = currentClickTime - this.lastClickTime
      // console.log('elapsed', elapsed)
      if (elapsed > 200) {
        this.processPointerUp(pos.x, pos.y, event)
      }
      this.lastClickTime = currentClickTime
      this.activePointers.delete(event.pointerId)
    }
  }

  private handlePointerCancel(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId)
  }

  // Handler for pointer move events
  private handlePointerMove(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.activePointers.set(event.pointerId, [pos.x, pos.y])
      this.processPointerMove(pos.x, pos.y, event)
      this.detectGestures()
    }
  }

  private detectGestures(): void {
    const pointers = Array.from(this.activePointers.values()) as Vec2[]
    if (pointers.length === 2) {
      this.detectPinchOrRotate(pointers as [Vec2, Vec2])
    } else if (pointers.length === 1) {
      // Handle single-touch gestures like pan
      this.detectPan(pointers[0])
    }
  }

  private detectPinchOrRotate([p1, p2]: [Vec2, Vec2]): void {
    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (this.lastDistance != null) {
      const zoomDelta = distance - this.lastDistance
      this.handleZoom(zoomDelta)
    }
    this.lastDistance = distance

    const angle = Math.atan2(dy, dx)
    if (this.lastAngle != null) {
      const rotationDelta = angle - this.lastAngle
      this.handleRotate(rotationDelta)
    }
    this.lastAngle = angle
  }

  private detectPan([x, y]: Vec2): void {
    if (this.lastPanPosition) {
      const dx = x - this.lastPanPosition[0]
      const dy = y - this.lastPanPosition[1]
      this.handlePan(dx, dy)
    }
    this.lastPanPosition = [x, y]
  }

  // Gesture handlers to be customized
  private handleZoom(delta: number): void {
    console.log('Zoom delta:', delta)
    // Add your zoom logic here
  }

  private handleRotate(delta: number): void {
    console.log('Rotation delta:', delta)
    // Add your rotation logic here
  }

  private handlePan(dx: number, dy: number): void {
    // console.log('Pan delta:', dx, dy)
    // Add your pan logic here
  }

  // Utility method to calculate position relative to the canvas
  private getCanvasRelativePosition(event: PointerEvent): { x: number; y: number } | null {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) * this.dpr
    const y = (event.clientY - rect.top) * this.dpr
    return { x, y }
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resizeListener)
    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this))
    canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this))
    canvas.removeEventListener('pointerup', this.handlePointerUp.bind(this))
  }

  public async serializeComponents(): Promise<string> {
    const components = this.quadTree.getAllElements()
    const serializedComponents = []
    const assets: { fonts: Record<string, any>; bitmaps: Record<string, any> } = { fonts: {}, bitmaps: {} } // Separate nodes for fonts and bitmaps

    for (const component of components) {
      if ('getFont' in component && typeof component.getFont === 'function') {
        const font = component.getFont()
        if (font && font.getBase64Texture) {
          const base64Texture = await font.getBase64Texture()
          if (base64Texture) {
            assets.fonts[font.id] = {
              ...font.toJSON(),
              texture: base64Texture
            }
          }
        }
      }
      if ('getBitmap' in component && typeof component.getBitmap === 'function') {
        const bitmap = component.getBitmap()
        if (bitmap && bitmap.getBase64Texture) {
          const base64Texture = await bitmap.getBase64Texture()
          if (base64Texture) {
            assets.bitmaps[bitmap.id] = {
              ...bitmap.toJSON(),
              texture: base64Texture
            }
          }
        }
      }
      serializedComponents.push(await component.toJSON())
    }

    return JSON.stringify({ components: serializedComponents, assets }, null, 2)
  }

  public static async fromJSON(json: any, gl: WebGL2RenderingContext): Promise<UIKit> {
    const ui = new UIKit(gl)

    // Deserialize fonts
    const fonts: { [key: string]: UIKFont } = {}
    if (json.assets?.fonts) {
      await Promise.all(
        Object.entries(json.assets.fonts).map(async ([fontId, fontData]) => {
          try {
            const font = await UIKFont.fromJSON(gl, fontData)
            fonts[fontId] = font
          } catch (error) {
            console.error(`Failed to load font with ID ${fontId}:`, error)
          }
        })
      )
    }

    // Deserialize bitmaps
    const bitmaps: { [key: string]: UIKBitmap } = {}
    if (json.assets?.bitmaps) {
      await Promise.all(
        Object.entries(json.assets.bitmaps).map(async ([bitmapId, bitmapData]) => {
          try {
            const bitmap = await UIKBitmap.fromJSON(gl, bitmapData)
            bitmaps[bitmapId] = bitmap
          } catch (error) {
            console.error(`Failed to load bitmap with ID ${bitmapId}:`, error)
          }
        })
      )
    }

    // Deserialize components
    if (Array.isArray(json.components)) {
      json.components.forEach((componentData: any) => {
        try {
          let component
          switch (componentData.className) {
            // case 'BitmapComponent':
            //   component = BitmapComponent.fromJSON(componentData, bitmaps)
            //   break
            // case 'TextBoxComponent':
            //   component = TextBoxComponent.fromJSON(componentData, fonts)
            //   break
            // case 'TextComponent':
            //   component = TextComponent.fromJSON(componentData, fonts)
            //   break
            // case 'ButtonComponent':
            //   component = ButtonComponent.fromJSON(componentData, fonts)
            //   break
            // case 'CircleComponent':
            //   component = CircleComponent.fromJSON(componentData)
            //   break
            // case 'TriangleComponent':
            //   component = TriangleComponent.fromJSON(componentData)
            //   break
            // case 'LineComponent':
            //   component = LineComponent.fromJSON(componentData)
            //   break
            // case 'ToggleComponent':
            //   component = ToggleComponent.fromJSON(componentData)
            //   break
            // case 'CaliperComponent':
            //   component = CaliperComponent.fromJSON(componentData, fonts)
            //   break
            default:
              console.warn(`Unknown component class: ${componentData.className}`)
          }
          if (component) {
            ui.addComponent(component)
          }
        } catch (error) {
          console.error(`Failed to deserialize component:`, error)
        }
      })
    } else {
      console.warn('No valid components array found in JSON data.')
    }

    return ui
  }
}

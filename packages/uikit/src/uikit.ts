import { Rectangle, QuadTree } from './quadtree.js'
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
} from './types.js'
import { UIKRenderer } from './uikrenderer.js'
import { UIKFont } from './assets/uikfont.js'
import { UIKBitmap } from './assets/uikbitmap.js'
import { BaseContainerComponent } from './components/basecontainercomponent.js'
import { AnimationManager } from './animationmanager.js'
import { IUIComponent } from './interfaces.js'


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

  // Static enum for line terminators
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

    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`
    const media = matchMedia(mqString)
    media.addEventListener('change', this.handleUpdatedPixelRatio.bind(this))
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
        console.log('event applied', event)
      }
    }
    for (const component of this.lastHoveredComponents) {
      if (!components.has(component)) {
        component.applyEventEffects('pointerleave', event)
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
      }
    }
  }

  public processPointerUp(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x, y]
    const components = this.quadTree.queryPoint(point)
    for (const component of components) {
      if (component.isVisible) {
        component.applyEventEffects('pointerup', event)
        console.log('applying pointer up event to', component)
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
  }

  // Handler for pointer down events
  private handlePointerDown(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.processPointerDown(pos.x, pos.y, event)
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      console.log('handle click called')
      const currentClickTime = performance.now()
      console.log('current click time', currentClickTime)
      const elapsed = currentClickTime - this.lastClickTime
      console.log('elapsed', elapsed)
      if (elapsed > 200) {
        this.processPointerUp(pos.x, pos.y, event)
      }
      this.lastClickTime = currentClickTime
    }
  }

  // Handler for pointer move events
  private handlePointerMove(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.processPointerMove(pos.x, pos.y, event)
    }
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

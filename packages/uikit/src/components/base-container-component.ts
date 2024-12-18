import { UIKRenderer } from '../uikrenderer'
import { AlignmentPoint, Vec2, Vec4 } from '../types'
import { QuadTree, Rectangle } from '../quadtree'
import { BaseContainerComponentConfig, IUIComponent } from '../interfaces'
import { BaseUIComponent } from './base-ui-component'
import { TextComponent } from './text-component'
import { vec2 } from 'gl-matrix'

export class BaseContainerComponent extends BaseUIComponent {
  public components: BaseUIComponent[] = []
  protected isHorizontal: boolean
  protected padding: number
  protected spacing: number
  protected _quadTree: QuadTree<IUIComponent>
  protected maxWidth: number = 0
  protected maxHeight: number = 0
  private boundsExplicitlySet: boolean = false

  constructor(config: BaseContainerComponentConfig) {
    super(config)
    this.isHorizontal = config.isHorizontal ?? true
    this.padding = config.padding ?? 20
    this.spacing = config.spacing ?? 20
    this.maxWidth = config.maxWidth ?? 0
    this.maxHeight = config.maxHeight ?? 0
    const bounds = new Rectangle(0, 0, config.canvas.width, config.canvas.height)
    this._quadTree = new QuadTree<IUIComponent>(bounds)
    if (config.bounds) {
      this.bounds = config.bounds
      this.boundsExplicitlySet = true
      this.position = vec2.fromValues(config.bounds[0], config.bounds[1])
    }
  }

  set quadTree(quadTree: QuadTree<IUIComponent>) {
    this.components.forEach((child) => {
      quadTree.insert(child)
      if (child instanceof BaseContainerComponent) {
        child.quadTree = this.quadTree
      }
      child.requestRedraw = this.requestRedraw
    })
    this._quadTree.getAllElements().forEach((child) => {
      this._quadTree.remove(child)
    })
    this._quadTree = quadTree
  }

  get quadTree(): QuadTree<IUIComponent> {
    return this._quadTree
  }

  addComponent(component: BaseUIComponent): void {
    component.fitBounds(this.bounds)
    this.components.push(component)
    if (!this.boundsExplicitlySet) {
      this.updateLayout()
    }
    if (component instanceof BaseContainerComponent) {
      component.quadTree = this._quadTree
    }
    component.requestRedraw = this.requestRedraw
    this._quadTree.insert(component)
  }

  removeComponent(component: BaseUIComponent): void {
    const index = this.components.indexOf(component)
    if (index > -1) {
      this.components.splice(index, 1)
      this._quadTree.remove(component)
      if (!this.boundsExplicitlySet) {
        this.updateLayout()
      }
    }
  }

  updateLayout(): void {
    // if (this.boundsExplicitlySet) {
    //   this.scaleToFitBounds()
    // }

    let offset = this.padding
    console.log('position of container', this.position)
    this.components.forEach((component) => {
      // const alignmentOffset = this.calculateAlignmentOffset(
      //   component.getAlignmentPoint(),
      //   this.bounds,
      //   component.getBounds()
      // )
      console.log('current offset', offset)
      if (this.isHorizontal) {
        component.setPosition([
          this.position[0] + this.padding + offset, 
          this.position[1] + this.padding, 
        ])
        offset += component.getBounds()[2] + this.spacing
      } else {
        component.setPosition([
          this.position[0] + this.padding, 
          this.position[1] + this.padding + offset, 
        ])
        offset += component.getBounds()[3] + this.spacing
      }
    })

    if (!this.boundsExplicitlySet) {
      this.updateBounds()
    }
  }

  updateBounds(): void {
    if (this.boundsExplicitlySet) return

    // if (this.components.length > 0) {
    //   let totalWidth = 0
    //   let totalHeight = 0

    //   if (this.isHorizontal) {
    //     totalWidth =
    //       this.components.reduce((sum, component) => sum + component.getBounds()[2], 0) +
    //       this.padding * (this.components.length + 1)
    //     totalHeight = Math.max(...this.components.map((component) => component.getBounds()[3])) + 2 * this.padding
    //   } else {
    //     totalWidth = Math.max(...this.components.map((component) => component.getBounds()[2])) + 2 * this.padding
    //     totalHeight =
    //       this.components.reduce((sum, component) => sum + component.getBounds()[3], 0) +
    //       this.padding * (this.components.length + 1)
    //   }

    //   this.setBounds([this.position[0], this.position[1], totalWidth, totalHeight])
    // } else {
    //   this.setBounds([this.position[0], this.position[1], 0, 0])
    // }
  }

  scaleToFitBounds(): void {
    // let minScale = Infinity

    // const recursivelyFindTextComponents = (component: BaseUIComponent): TextComponent[] => {
    //   if (component instanceof TextComponent) {
    //     return [component]
    //   } else if (component instanceof BaseContainerComponent) {
    //     return component.components.flatMap((child) => recursivelyFindTextComponents(child))
    //   }
    //   return []
    // }

    // const textComponents = recursivelyFindTextComponents(this)
    // textComponents.forEach((textComponent) => {
    //   const textBounds = textComponent.getBounds()
    //   const containerBounds = this.bounds

    //   const scaleX = containerBounds[2] / textBounds[2]
    //   const scaleY = containerBounds[3] / textBounds[3]
    //   minScale = Math.min(minScale, scaleX, scaleY)
    // })

    // textComponents.forEach((textComponent) => {
    //   textComponent.setScale(minScale)
    //   textComponent.updateBounds()
    // })
    for(const child of this.components) {
      const adjustedBounds = this.bounds
      adjustedBounds[0] += this.padding
      adjustedBounds[1] += this.padding
      adjustedBounds[2] -= this.padding * 2
      adjustedBounds[2] -= this.padding * 2
      child.fitBounds(adjustedBounds)
    }
  }

  calculateAlignmentOffset(alignmentPoint: AlignmentPoint, containerBounds: Vec4, childBounds: Vec4): Vec2 {
    const [containerX, containerY, containerWidth, containerHeight] = containerBounds
    const [childWidth, childHeight] = [childBounds[2], childBounds[3]]

    let offsetX = 0
    let offsetY = 0

    switch (alignmentPoint) {
      case AlignmentPoint.TOPLEFT:
        offsetX = 0
        offsetY = 0
        break
      case AlignmentPoint.TOPCENTER:
        offsetX = (containerWidth - childWidth) / 2
        offsetY = 0
        break
      case AlignmentPoint.TOPRIGHT:
        offsetX = containerWidth - childWidth
        offsetY = 0
        break
      case AlignmentPoint.MIDDLELEFT:
        offsetX = 0
        offsetY = (containerHeight - childHeight) / 2
        break
      case AlignmentPoint.MIDDLECENTER:
        offsetX = (containerWidth - childWidth) / 2
        offsetY = (containerHeight - childHeight) / 2
        break
      case AlignmentPoint.MIDDLERIGHT:
        offsetX = containerWidth - childWidth
        offsetY = (containerHeight - childHeight) / 2
        break
      case AlignmentPoint.BOTTOMLEFT:
        offsetX = 0
        offsetY = containerHeight - childHeight
        break
      case AlignmentPoint.BOTTOMCENTER:
        offsetX = (containerWidth - childWidth) / 2
        offsetY = containerHeight - childHeight
        break
      case AlignmentPoint.BOTTOMRIGHT:
        offsetX = containerWidth - childWidth
        offsetY = containerHeight - childHeight
        break
      default:
        break
    }

    return [offsetX, offsetY]
  }

  draw(renderer: UIKRenderer): void {
    if (!this.isVisible) {
      return
    }
    this.components.forEach((component) => {
      // TODO(cdrake): Check for overflow conditions
      // const [x, y, width, height] = component.getBounds()
      // const [containerX, containerY] = this.getPosition()

      
      // if (
      //   (this.maxWidth > 0 && x + width > containerX + this.maxWidth) ||
      //   (this.maxHeight > 0 && y + height > containerY + this.maxHeight)
      // ) {
      //   return // Skip drawing this component if it exceeds maxWidth or maxHeight
      // }

      if (component.isVisible) {
        component.draw(renderer)
      }
    })
  }

  setPosition(position: Vec2): void {
    super.setPosition(position)
    if (!this.boundsExplicitlySet) {
      this.updateLayout()
    }
  }
}

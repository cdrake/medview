import { v4 as uuidv4 } from '@lukeed/uuid'
import { vec2 } from 'gl-matrix'
import { BaseUIComponentConfig, IUIComponent } from '../interfaces.js'
import { UIKRenderer } from '../uikrenderer.js'
import { AlignmentPoint, Effect, HorizontalAlignment, Vec2, Vec4, VerticalAlignment } from '../types.js'
// Applying centralized animation management in BaseUIComponent
import { AnimationManager, Animation } from '../animationmanager.js'
import { getObjectProperty, isEqual, setObjectProperty } from '../uiutils.js'

export abstract class BaseUIComponent implements IUIComponent {
  alignmentPoint: AlignmentPoint = AlignmentPoint.NONE
  verticalAlignment: VerticalAlignment = VerticalAlignment.NONE
  horizontalAlignment: HorizontalAlignment = HorizontalAlignment.NONE
  isDraggable: boolean = false
  isVisible: boolean = true
  zIndex: number = 0
  id: string = uuidv4()
  tags: string[] = []
  className: string
  protected position: Vec2 = [0, 0]
  protected bounds: Vec4 = [0, 0, 0, 0]
  protected scale: number = 1
  protected alignmentOffset: number = 25
  private eventEffects: Map<string, Effect[]> = new Map()
  private eventListeners: Map<string, Array<(event: Event) => void>> = new Map()
  public requestRedraw?: () => void

  // Event handlers
  public onPointerUp?: (event: PointerEvent) => void
  public onPointerDown?: (event: PointerEvent) => void
  public onPointerEnter?: (event: PointerEvent) => void
  public onPointerLeave?: (event: PointerEvent) => void
  public onPointerMove?: (event: PointerEvent) => void

  // Protected callable handlers (not assignable)
  public handlePointerUp(event: PointerEvent): void {
    this.onPointerUp?.(event)
  }

  public handlePointerDown(event: PointerEvent): void {
    this.onPointerDown?.(event)
  }

  public handlePointerEnter(event: PointerEvent): void {
    this.onPointerEnter?.(event)
  }

  public handlePointerLeave(event: PointerEvent): void {
    this.onPointerLeave?.(event)
  }

  public handlePointerMove(event: PointerEvent): void {
    this.onPointerMove?.(event)
  }

  abstract draw(renderer: UIKRenderer): void

  constructor(config: BaseUIComponentConfig) {
    this.alignmentPoint = config.alignmentPoint ?? AlignmentPoint.NONE
    this.verticalAlignment = config.verticalAlignment ?? VerticalAlignment.NONE
    this.horizontalAlignment = config.horizontalAlignment ?? HorizontalAlignment.NONE
    this.isVisible = config.isVisible ?? true
    this.zIndex = config.zIndex ?? 0
    this.id = config.id ?? uuidv4()
    this.tags = config.tags ?? []
    this.className = config.className || 'None'
    this.position = config.position ?? [0, 0]
    this.bounds = config.bounds ?? [this.position[0],this.position[1], 0, 0]
    this.scale = config.scale ?? 1
    this.alignmentOffset = config.alignmentOffset ?? 25
    this.requestRedraw = config.requestRedraw

    console.log('config on base ui comp', config)
  }

  align(bounds: Vec4): void {
    let offsetX = 0
    let offsetY = 0
    console.log('align called on ', this)
    // Calculate alignment offsets based on alignmentPoint
    switch (this.alignmentPoint) {
      case AlignmentPoint.TOPLEFT:
        offsetX = bounds[0] + this.alignmentOffset
        offsetY = bounds[1] + this.alignmentOffset
        break
      case AlignmentPoint.TOPCENTER:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2]) / 2 + this.alignmentOffset
        offsetY = bounds[1] + this.alignmentOffset
        break
      case AlignmentPoint.TOPRIGHT:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2] - this.alignmentOffset)
        offsetY = bounds[1] + this.alignmentOffset
        break
      case AlignmentPoint.MIDDLELEFT:
        offsetX = bounds[0] + this.alignmentOffset
        offsetY = bounds[1] + (bounds[3] - this.bounds[3]) / 2
        break
      case AlignmentPoint.MIDDLECENTER:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2]) / 2
        offsetY = bounds[1] + (bounds[3] - this.bounds[3]) / 2
        break
      case AlignmentPoint.MIDDLERIGHT:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2] - this.alignmentOffset)
        offsetY = bounds[1] + (bounds[3] - this.bounds[3]) / 2
        break
      case AlignmentPoint.BOTTOMLEFT:
        offsetX = bounds[0] + this.alignmentOffset
        offsetY = bounds[1] + (bounds[3] - this.bounds[3] - this.alignmentOffset)
        break
      case AlignmentPoint.BOTTOMCENTER:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2]) / 2
        offsetY = bounds[1] + (bounds[3] - this.bounds[3] - this.alignmentOffset)
        break
      case AlignmentPoint.BOTTOMRIGHT:
        offsetX = bounds[0] + (bounds[2] - this.bounds[2] - this.alignmentOffset)
        offsetY = bounds[1] + (bounds[3] - this.bounds[3] - this.alignmentOffset)
        break
      default:
        offsetX = bounds[0]
        offsetY = bounds[1]
    }

    // Set new position
    this.setPosition([offsetX, offsetY])
  }

  fitBounds(targetBounds: Vec4): void {
    // Calculate the scaling factors based on the target bounds
    const scaleX = targetBounds[2] / this.bounds[2]
    const scaleY = targetBounds[3] / this.bounds[3]

    // Use the smaller scale factor to maintain aspect ratio
    const newScale = Math.min(scaleX, scaleY)

    // Update the component's scale
    this.setScale(newScale)

    // Adjust position based on the scaled bounds to center the component within target bounds
    const newWidth = this.bounds[2] * newScale
    const newHeight = this.bounds[3] * newScale
    const offsetX = targetBounds[0] + (targetBounds[2] - newWidth) / 2
    const offsetY = targetBounds[1] + (targetBounds[3] - newHeight) / 2

    // Set the new position and bounds
    this.setPosition([offsetX, offsetY])
    this.setBounds([offsetX, offsetY, newWidth, newHeight])
  }

  applyEffect(effect: Effect): void {
    const { targetObject, property } = effect

    switch (effect.type) {
      case 'setValue':
        setObjectProperty(targetObject, property, effect.value)
        if (this.requestRedraw) {
          this.requestRedraw()
        }

        if (effect.onComplete) {
          effect.onComplete(effect.event)
          console.log('onCOmplete called')
        } else {
          console.log('onCOmplete NOT called')
        }
        break

      case 'animateValue':
        {
          const animationManager = AnimationManager.getInstance()
          const animation = new Animation(
            targetObject,
            property,
            effect.from,
            effect.to,
            effect.duration,
            effect.isBounce,
            effect.isToggle,
            effect.onComplete,
            effect.event
          )
          animationManager.addAnimation(animation)
        }
        break

      case 'toggleValue': {
        const currentValue = getObjectProperty(targetObject, property)
        if (isEqual(currentValue, effect.value1)) {
          setObjectProperty(effect.targetObject, property, effect.value2)
        } else {
          setObjectProperty(effect.targetObject, property, effect.value1)
        }
        if (effect.onComplete) {
          effect.onComplete(effect.event)
        }
      }
    }
  }

  addEventEffect({
    event,
    targetObject,
    property,
    effectType,
    valueOrFrom,
    to,
    duration,
    isBounce = false,
    isToggle = false,
    onComplete
  }: {
    event: string
    targetObject: any
    property: string
    effectType: 'setValue' | 'animateValue' | 'toggleValue'
    valueOrFrom: any
    to?: any
    duration?: number
    isBounce?: boolean
    isToggle?: boolean
    onComplete?: (event?: Event) => void
  }): void {
    let effect: Effect
    switch (effectType) {
      case 'setValue':
        effect = {
          type: 'setValue',
          targetObject,
          property,
          value: valueOrFrom,
          isToggle,
          onComplete // Assign onComplete
        }
        break
      case 'toggleValue':
        effect = {
          type: 'toggleValue',
          targetObject,
          property,
          value1: valueOrFrom,
          value2: to,
          onComplete // Assign onComplete
        }
        break
      case 'animateValue':
        effect = {
          type: 'animateValue',
          targetObject,
          property,
          from: valueOrFrom,
          to: to!,
          duration: duration!,
          isBounce,
          isToggle,
          onComplete // Assign onComplete
        }
        break
    }

    if (!this.eventEffects.has(event)) {
      this.eventEffects.set(event, [])
    }
    this.eventEffects.get(event)!.push(effect)
    console.log('effect added', effect)
  }

  applyEventEffects(eventName: string): void {
    // console.log('event being applied', eventName, this)
    if (!eventName) {
      return
    }
    const eventNameLC = eventName.toLowerCase()
    const effects = this.eventEffects.get(eventNameLC)
    if (effects) {
      effects.forEach((effect) => this.applyEffect(effect))
      console.log(effects)
    }

    // Trigger user-defined event handlers
    switch (eventName.toLowerCase()) {
      case 'pointerup':
        if (this.onPointerUp) {
          this.onPointerUp(new PointerEvent('pointerup'))
        }
        break
      case 'pointerdown':
        if (this.onPointerDown) {
          this.onPointerDown(new PointerEvent('pointerdown'))
        }
        break
      case 'pointerenter':
        if (this.onPointerEnter) {
          this.onPointerEnter(new PointerEvent('pointerenter'))
        }
        break
      case 'pointerleave':
        if (this.onPointerLeave) {
          this.onPointerLeave(new PointerEvent('pointerleave'))
        }
        break
    }
  }

  // Trigger resize event callbacks
  private triggerResizeEvent(): void {
    const listeners = this.eventListeners.get('resize')
    if (listeners) {
      listeners.forEach((callback) => callback(new Event('resize')))
    }
  }

  addEventListener(eventName: string, callback: (event: Event) => void): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, [])
    }
    this.eventListeners.get(eventName)!.push(callback)
  }

  removeEventListener(eventName: string, callback: (event: Event) => void): void {
    const listeners = this.eventListeners.get(eventName)
    if (listeners) {
      this.eventListeners.set(
        eventName,
        listeners.filter((fn) => fn !== callback)
      )
    }
  }

  getBounds(): Vec4 {
    return this.bounds
  }

  setBounds(bounds: Vec4): void {
    this.bounds = bounds
    this.position = vec2.fromValues(bounds[0], bounds[1])
    if(this.className === 'PanelContainerComponent') {
      console.log('bounds set', bounds)
    }
    // Trigger a resize event with the updated bounds as the contentRect
    this.triggerResizeEvent()
  }

  getPosition(): Vec2 {
    return this.position
  }

  setPosition(position: Vec2): void {
    this.position = position
    this.setBounds([this.position[0], this.position[1], this.bounds[2], this.bounds[3]])
  }

  getScale(): number {
    return this.scale
  }

  setScale(value: number): void {
    this.scale = value
  }

  getAlignmentPoint(): AlignmentPoint {
    return this.alignmentPoint
  }

  setAlignmentPoint(value: AlignmentPoint): void {
    this.alignmentPoint = value
  }

  setAlignmentOffset(offset: number): void {
    this.alignmentOffset = offset
    this.requestRedraw?.()
  }

  getAlignmentOffset(): number {
    return this.alignmentOffset
  }

  getVerticalAlignment(): VerticalAlignment {
    return this.verticalAlignment
  }

  setVerticalAlignment(value: VerticalAlignment): void {
    this.verticalAlignment = value
  }

  getHorizontalAlignment(): HorizontalAlignment {
    return this.horizontalAlignment
  }

  setHorizontalAlignment(value: HorizontalAlignment): void {
    this.horizontalAlignment = value
  }

  toJSON(): object {
    return {
      id: this.id,
      className: this.className, // Include class name here
      alignmentPoint: this.alignmentPoint,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
      isVisible: this.isVisible,
      zIndex: this.zIndex,
      tags: this.tags,
      position: this.position,
      bounds: this.bounds,
      scale: this.scale,
      eventEffects: Array.from(this.eventEffects.entries()).map(([event, effects]) => ({
        event,
        effects: effects.map((effect) => ({
          type: effect.type,
          targetObjectId: effect.targetObject?.id,
          property: effect.property,
          value: effect.type === 'setValue' ? effect.value : undefined,
          from: effect.type === 'animateValue' ? effect.from : undefined,
          to: effect.type === 'animateValue' ? effect.to : undefined,
          duration: effect.type === 'animateValue' ? effect.duration : undefined,
          isBounce: effect.type === 'animateValue' ? effect.isBounce : undefined,
          value1: effect.type === 'toggleValue' ? effect.value1 : undefined,
          value2: effect.type === 'toggleValue' ? effect.value2 : undefined
        }))
      }))
    }
  }
}

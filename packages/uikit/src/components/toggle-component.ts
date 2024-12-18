import { UIKRenderer } from '../uikrenderer'
import { Vec2, Color } from '../types'
import { ToggleComponentConfig } from '../interfaces'
import { BaseUIComponent } from './base-ui-component'

export class ToggleComponent extends BaseUIComponent {
  private size: Vec2
  public isOn: boolean
  private onColor: Color
  private offColor: Color
  public knobPosition: number

  constructor(config: ToggleComponentConfig) {
    super(config) // Pass BaseUIComponentConfig properties to the parent constructor

    this.position = config.position!
    this.size = config.size
    this.isOn = config.isOn
    this.onColor = config.onColor
    this.offColor = config.offColor
    this.knobPosition = config.knobPosition ?? (this.isOn ? 1.0 : 0.0)

    // Initialize bounds based on position and size
    this.setBounds([this.position[0], this.position[1], this.size[0], this.size[1]])

    // Add click animation effect for knob position
    this.addEventEffect({
      event: 'pointerup',
      targetObject: this,
      property: 'knobPosition',
      effectType: 'animateValue',
      valueOrFrom: 0,
      to: 1,
      duration: 50,
      isBounce: false, // isBounce
      isToggle: true // isToggle
    }
    )

    // Add click toggle value effect for isOn state
    this.addEventEffect( {
      event: 'pointerup',
      targetObject: this,
      property: 'isOn',
      effectType: 'toggleValue',
      valueOrFrom: true, // value1 (on)
      to: false // value2 (off)
    }
    )
  }

  // Method to toggle the state and animate the knob position
  toggle(): void {
    this.applyEventEffects('pointerup')
  }

  // Handle mouse click to toggle state if clicked inside component bounds
  handleMouseClick(mousePosition: Vec2): void {
    const posX = Array.isArray(this.position) ? this.position[0] : this.position[0]
    const posY = Array.isArray(this.position) ? this.position[1] : this.position[1]
    const sizeX = Array.isArray(this.size) ? this.size[0] : this.size[0]
    const sizeY = Array.isArray(this.size) ? this.size[1] : this.size[1]

    if (
      mousePosition[0] >= posX &&
      mousePosition[0] <= posX + sizeX &&
      mousePosition[1] >= posY &&
      mousePosition[1] <= posY + sizeY
    ) {
      this.toggle()
    }
  }

  /**
   * Draws a toggle switch with support for an animated knob position.
   * @param params - Object containing the toggle parameters.
   * @param params.renderer - Render instance to draw toggle primitives
   * @param params.position - The position of the top-left corner of the toggle.
   * @param params.size - The size of the toggle ([width, height]).
   * @param params.isOn - Whether the toggle is on or off.
   * @param params.onColor - The color when the toggle is on.
   * @param params.offColor - The color when the toggle is off.
   * @param params.knobPosition - The position of the knob (0 for off, 1 for on, values in between for animation).
   */
public static drawToggle({
  renderer,
  position,
  size,
  isOn,
  onColor,
  offColor,
  knobPosition = isOn ? 1.0 : 0.0 // Default to fully on or off
}: {
  renderer: UIKRenderer
  position: Vec2
  size: Vec2
  isOn: boolean
  onColor: Color
  offColor: Color
  knobPosition?: number
}): void {
  // Handle Vec2 types to ensure compatibility with both gl-matrix vec2 and [number, number]
  const posX = Array.isArray(position) ? position[0] : position[0]
  const posY = Array.isArray(position) ? position[1] : position[1]
  const sizeX = Array.isArray(size) ? size[0] : size[0]
  const sizeY = Array.isArray(size) ? size[1] : size[1]

  const cornerRadius = sizeY / 2 // Height is used for radius

  // Ensure the colors are Float32Array
  const fillColor = new Float32Array(isOn ? onColor : offColor)

  // Draw the background rounded rectangle
  renderer.drawRoundedRect({
    bounds: [posX, posY, sizeX, sizeY],
    fillColor,
    outlineColor: new Float32Array([0.2, 0.2, 0.2, 1.0]), // Outline color
    cornerRadius,
    thickness: 2.0 // Outline thickness
  })

  // Clamp knobPosition between 0 and 1
  knobPosition = Math.max(0, Math.min(1, knobPosition))

  // Calculate the circle (toggle knob) position based on the knobPosition
  const knobSize = sizeY * 0.8
  const offX = posX + (sizeY - knobSize) / 2
  const onX = posX + sizeX - knobSize - (sizeY - knobSize) / 2
  const knobX = offX + (onX - offX) * knobPosition
  const knobY = posY + (sizeY - knobSize) / 2

  // Draw the toggle knob as a circle
  renderer.drawCircle({
    leftTopWidthHeight: [knobX, knobY, knobSize, knobSize],
    circleColor: new Float32Array([1.0, 1.0, 1.0, 1.0])
  })
}

  // Draw the toggle component, with an optional hover effect
  draw(renderer: UIKRenderer, isHovered: boolean = false): void {
    const posX = Array.isArray(this.position) ? this.position[0] : this.position[0]
    const posY = Array.isArray(this.position) ? this.position[1] : this.position[1]
    const sizeX = Array.isArray(this.size) ? this.size[0] : this.size[0]
    const sizeY = Array.isArray(this.size) ? this.size[1] : this.size[1]

    // Handle hover effect for drawing color
    let drawColor: Color = this.isOn ? this.onColor : this.offColor
    if (isHovered) {
      drawColor = [...drawColor] as Color
      drawColor[0] = Math.min(drawColor[0] * 1.2, 1)
      drawColor[1] = Math.min(drawColor[1] * 1.2, 1)
      drawColor[2] = Math.min(drawColor[2] * 1.2, 1)
    }

    // Draw the toggle with animation support using knobPosition
    // renderer.drawToggle({
    //   position: [posX, posY],
    //   size: [sizeX, sizeY],
    //   isOn: this.isOn,
    //   onColor: this.onColor,
    //   offColor: this.offColor,
    //   knobPosition: this.knobPosition
    // })
    ToggleComponent.drawToggle({
        renderer,
        position: [posX, posY],
        size: [sizeX, sizeY],
        isOn: this.isOn,
        onColor: this.onColor,
        offColor: this.offColor,
        knobPosition: this.knobPosition
      })
  }

  setKnobPosition(position: number): void {
    this.knobPosition = position
  }

  // Update the knob position to create animation (e.g., smooth transition)
  updateKnobPosition(deltaTime: number): void {
    const targetPosition = this.isOn ? 1.0 : 0.0
    const speed = 3.0 // Control the speed of the animation
    if (this.knobPosition !== targetPosition) {
      const direction = targetPosition > this.knobPosition ? 1 : -1
      this.knobPosition += direction * speed * deltaTime
      // Clamp between 0 and 1
      this.knobPosition = Math.max(0, Math.min(1, this.knobPosition))
    }
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      className: 'ToggleComponent',
      size: Array.from(this.size), // Convert Vec2 to array
      isOn: this.isOn,
      onColor: Array.from(this.onColor), // Convert Color to array
      offColor: Array.from(this.offColor), // Convert Color to array
      knobPosition: this.knobPosition
    }
  }

  public static fromJSON(data: any): ToggleComponent {
    const config: ToggleComponentConfig = {
      className: 'ToggleComponent',
      position: data.position || [0, 0],
      size: data.size || [50, 25], // Default size if not provided
      isOn: data.isOn ?? false,
      onColor: data.onColor || [0, 1, 0, 1], // Green
      offColor: data.offColor || [1, 0, 0, 1], // Red
      knobPosition: data.knobPosition ?? (data.isOn ? 1.0 : 0.0),
      isVisible: data.isVisible ?? true,
      zIndex: data.zIndex ?? 0
    }

    return new ToggleComponent(config)
  }
}

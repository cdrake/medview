import { ButtonComponentConfig } from '../interfaces'
import { Vec2, Color } from '../types'
import { UIKRenderer } from '../uikrenderer'
import { TextBoxComponent } from './text-box-component'

// Button Component extending TextBoxComponent
export class ButtonComponent extends TextBoxComponent {
  highlightColor: Color
  buttonDownColor: Color
  onClick?: (event: PointerEvent) => void

  constructor(config: ButtonComponentConfig) {
    super(config)
    this.highlightColor = config.highlightColor ?? [0.5, 0.5, 0.5, 1.0]
    this.buttonDownColor = config.buttonDownColor ?? [0.529, 0.808, 0.98, 1.0] // Light blue color
    this.onClick = config.onClick
    console.log('button bounds', this.bounds)
    // Adding click effects to create a bounce animation

    // Effect 1: Shrink button on pointer up (bounce effect)
this.addEventEffect({
  event: 'pointerup',
  targetObject: this,
  property: 'scale',
  effectType: 'animateValue',
  valueOrFrom: this.scale, // start value (normal size)
  to: 0.9 * this.scale, // target value (shrunk size)
  duration: 100, // duration in milliseconds
  isBounce: true // isBounce - true to create a bounce effect
})

// Effect 2: Move the button down slightly to maintain the same center point (bounce effect)
this.addEventEffect({
  event: 'pointerup',
  targetObject: this,
  property: 'position',
  effectType: 'animateValue',
  valueOrFrom: [this.position[0], this.position[1]], // start position
  to: [this.position[0], this.position[1] + 5], // target position (move down by 5 units)
  duration: 100, // duration in milliseconds
  isBounce: true, // isBounce - true to create a bounce effect
  isToggle: false, // explicitly set to false
  onComplete: this.handleClick.bind(this) // callback for completion
})

// Effect 3: Change fillColor on mouse down
this.addEventEffect({
  event: 'pointerdown',
  targetObject: this,
  property: 'fillColor',
  effectType: 'setValue',
  valueOrFrom: this.buttonDownColor // target color for mouse down
})

// Effect 4: Change fillColor on mouse enter
this.addEventEffect({
  event: 'pointerenter',
  targetObject: this,
  property: 'fillColor',
  effectType: 'setValue',
  valueOrFrom: this.highlightColor // target color for mouse enter
})

// Effect 5: Revert fillColor on mouse leave
this.addEventEffect({
  event: 'pointerleave',
  targetObject: this,
  property: 'fillColor',
  effectType: 'setValue',
  valueOrFrom: config.backgroundColor ?? [0, 0, 0, 0.3] // revert to original fill color
})


  // // Handle mouse click to trigger the effects
  // handleMouseClick(mousePosition: Vec2): void {
  //   const posX = Array.isArray(this.position) ? this.position[0] : this.position[0]
  //   const posY = Array.isArray(this.position) ? this.position[1] : this.position[1]
  //   const sizeX = this.maxWidth > 0 ? this.maxWidth : this.font.getTextWidth(this.text) * this.scale
  //   const sizeY = this.font.getTextHeight(this.text) * this.scale + this.margin * 2

  //   // Check if the click is within bounds
  //   if (
  //     mousePosition[0] >= posX &&
  //     mousePosition[0] <= posX + sizeX &&
  //     mousePosition[1] >= posY &&
  //     mousePosition[1] <= posY + sizeY
  //   ) {
  //     this.applyEventEffects('pointerup')
  //   }
  }

  handleClick(event: Event | undefined): void {
    if (this.onClick) {
      console.log('click called')
      this.onClick(event as PointerEvent)
    }
  }

  // Draw the button component
  draw(renderer: UIKRenderer): void {
    // Call the parent draw method to render the button as a text box
    super.draw(renderer)
  }

  // toJSON method to serialize the ButtonComponent instance
  toJSON(): object {
    return {
      ...super.toJSON(), // Serialize base properties from TextBoxComponent
      className: 'ButtonComponent', // Class name for identification
      highlightColor: Array.from(this.highlightColor) // Serialize the highlight color
    }
  }
}

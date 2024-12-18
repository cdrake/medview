import { TextBoxComponent } from './text-box-component'
import { UIKRenderer } from '../uikrenderer'
import { Color, Vec2 } from '../types'
import { UIKFont } from '../assets/uikfont'
import { AnimationManager, Animation } from '../animationmanager'

interface InputTextBoxConfig {
  text: string
  font: UIKFont
  position: Vec2
  textColor?: Color
  backgroundColor?: Color
  borderColor?: Color
  borderRadius?: number
  borderWidth?: number
  scale?: number
  maxWidth?: number
  cursorColor?: Color
}

export class InputTextBoxComponent extends TextBoxComponent {
  private cursorVisible: boolean = true
  private cursorPosition: number
  private cursorColor: Color
  private cursorBlinkAnimation: Animation | null = null

  constructor(config: InputTextBoxConfig) {
    super({
      ...config,
      text: config.text || '',
    })

    this.cursorPosition = config.text.length
    this.cursorColor = config.cursorColor || [0, 0, 0, 1]

    this.initCursorAnimation()
  }

  private initCursorAnimation(): void {
    const animationManager = AnimationManager.getInstance()

    this.cursorBlinkAnimation = new Animation(
      this,
      'cursorVisible',
      1,
      0,
      500,
      false,
      true, // Loop
      () => {
        this.cursorVisible = !this.cursorVisible
        this.requestRedraw?.()
      }
    )

    animationManager.addAnimation(this.cursorBlinkAnimation)
  }

  draw(renderer: UIKRenderer): void {
    super.draw(renderer)

    if (this.cursorVisible) {
      // Calculate cursor position
      const textWidth = this.font.getTextWidth(this.text.substring(0, this.cursorPosition), this.scale)
      const cursorX = this.position[0] + textWidth
      const cursorY = this.position[1]

      // Draw the cursor as a vertical line
      renderer.drawLine({
        startEnd: [cursorX, cursorY, cursorX, cursorY + this.font.textHeight * this.scale],
        thickness: 2,
        color: this.cursorColor
      })
    }
  }

  handleInput(input: string): void {
    const beforeCursor = this.text.substring(0, this.cursorPosition)
    const afterCursor = this.text.substring(this.cursorPosition)

    this.text = beforeCursor + input + afterCursor
    this.cursorPosition += input.length

    this.updateBounds()
    this.requestRedraw?.()
  }

  handleBackspace(): void {
    if (this.cursorPosition > 0) {
      const beforeCursor = this.text.substring(0, this.cursorPosition - 1)
      const afterCursor = this.text.substring(this.cursorPosition)

      this.text = beforeCursor + afterCursor
      this.cursorPosition--

      this.updateBounds()
      this.requestRedraw?.()
    }
  }

  handleDelete(): void {
    if (this.cursorPosition < this.text.length) {
      const beforeCursor = this.text.substring(0, this.cursorPosition)
      const afterCursor = this.text.substring(this.cursorPosition + 1)

      this.text = beforeCursor + afterCursor

      this.updateBounds()
      this.requestRedraw?.()
    }
  }

  handleArrowLeft(): void {
    if (this.cursorPosition > 0) {
      this.cursorPosition--
      this.requestRedraw?.()
    }
  }

  handleArrowRight(): void {
    if (this.cursorPosition < this.text.length) {
      this.cursorPosition++
      this.requestRedraw?.()
    }
  }

  destroy(): void {
    if (this.cursorBlinkAnimation) {
      const animationManager = AnimationManager.getInstance()
      animationManager.removeAnimation(this.cursorBlinkAnimation)
    }
  }
}

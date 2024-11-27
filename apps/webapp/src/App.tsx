import { useEffect, useRef } from 'react'
import { coreFunction, callUIKit } from '@medview/core'
import { CoreRenderer } from '@medview/core'
import { LineTerminator, LineStyle } from '@medview/uikit'

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = 1200 //* window.devicePixelRatio || 1
    canvas.height = 1200 //* window.devicePixelRatio || 1

    // Initialize CoreRenderer with the canvas
    const renderer = new CoreRenderer(canvas)

    

    // Clear the canvas
    renderer.clear([0.9, 0.9, 0.9, 1]) // Light gray background

    // // Draw a triangle
    renderer.drawTriangle({
      headPoint: [100, 600],
      baseMidPoint: [100, 800],
      baseLength: 200,
      color: [1, 0, 0, 1]
    })

    // Draw a circle
    renderer.drawCircle({
      leftTopWidthHeight: [250, 700, 150, 150],
      circleColor: [0, 0, 1, 1], // Blue circle
      fillPercent: 1.0
    })

    // Draw a line
    renderer.drawLine({
      startEnd: [200, 800, 600, 610],
      thickness: 5,
      color: [0, 1, 0, 1], // Green line
      style: LineStyle.SOLID,
      terminator: LineTerminator.ARROW
    })

    renderer.drawTriangle({
      headPoint: [500, 600],
      baseMidPoint: [500, 800],
      baseLength: 200,
      color: [1, 1, 0, 1]
    })
  }, [])

  return (
    <div>
      <h1>Welcome to MedView Web App</h1>
      <p>{coreFunction()}</p>
      <p>{callUIKit()}</p>
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} />
    </div>
  )
}

export default App

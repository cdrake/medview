import { useEffect, useRef } from 'react'
import { coreFunction, callUIKit } from '@medview/core'
import { CoreRenderer } from '@medview/core'
// import { render } from 'react-dom'

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
    renderer.draw()
    
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

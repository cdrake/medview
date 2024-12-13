import { useEffect, useRef } from 'react'
import { CoreRenderer } from '@medview/core'
// import { render } from 'react-dom'

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = document.body.clientWidth - 2//* window.devicePixelRatio || 1
    canvas.height = document.body.clientHeight - 2//* window.devicePixelRatio || 1

    // Initialize CoreRenderer with the canvas
    const _renderer = new CoreRenderer(canvas)
    if(!_renderer) {
      console.log('could not initalize renderer')
      return
    }
    
  }, [])

  return (
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} />
  )
}

export default App

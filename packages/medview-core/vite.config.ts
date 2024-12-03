import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  assetsInclude: ['**/*.png'], // Ensure Vite includes .png files as assets
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Entry file
      name: 'MedViewCore', // Global variable name for UMD build
      fileName: (format) => `medview-core.${format}.js` // Output file name
    },
    rollupOptions: {
      external: [], // Add external dependencies if necessary
      output: {
        globals: {} // Add global variables for UMD builds if necessary
      }
    }    
    
  }
})

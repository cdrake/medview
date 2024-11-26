import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl';
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Entry file
      name: 'UIKit', // Global variable name for UMD build
      fileName: (format) => `uikit.${format}.js` // Output file name
    },
    rollupOptions: {
      external: [], // Add external dependencies if necessary
      output: {
        globals: {} // Add global variables for UMD builds if necessary
      }
    }
  },
  plugins: [glsl()],
})

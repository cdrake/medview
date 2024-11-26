// import { defineConfig } from 'vite'

// export default defineConfig({
//   build: {
//     lib: {
//       entry: 'src/index.ts', // Path to your library entry file
//       name: 'MedViewCore', // Global name for UMD builds
//       fileName: (format) => `medview-core.${format}.js` // Output file naming
//     }
//   }
// })
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
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

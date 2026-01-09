import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Use 'node' for unit tests (faster). Switch to 'jsdom' when adding component tests.
    environment: 'node',
    // Include test files with these patterns
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    // Exclude node_modules and build output
    exclude: ['node_modules', '.next', 'dist'],
  },
})

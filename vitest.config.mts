import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // jsdom for component tests; node-only utilities still pass under jsdom.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Scope coverage to files that currently have tests. Extend this list as tests
      // are added (e.g. 'src/app/onboarding/**' once component tests land).
      include: [
        'src/lib/utils.ts',
        'src/lib/validation.ts',
        'src/app/onboarding/components/OnboardingLayout.tsx',
        'src/app/onboarding/step1-personal-info.tsx',
        'src/app/onboarding/step6-skills.tsx',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})

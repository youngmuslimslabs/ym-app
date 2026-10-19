import { validatePreviewEnvironment } from './environment.mjs'
try {
  validatePreviewEnvironment(process.env)
  console.log('Deployment environment check passed.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}

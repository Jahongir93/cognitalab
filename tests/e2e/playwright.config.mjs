// Playwright e2e sozlamalari. Ishga tushirish: npm run test:e2e
// GPU bo'lmagan muhitda WebGL dasturiy render (SwiftShader) bilan ishlaydi.
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 8799);

export default defineConfig({
  testDir: '.',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1280, height: 800 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: `python3 -m http.server ${PORT} -d ../../frontend/lab`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});

import { defineConfig } from '@playwright/test';

// The screenshot run never touches a real Supabase project: the app is built and started
// against e2e/mock-supabase.mjs with throwaway credentials. Every Supabase-related variable
// is set explicitly so none can fall back to a real value from .env.local.
const APP_PORT = 3210;
const MOCK_PORT = 54399;
export const DEMO_PIN = '123456';

const appEnv = {
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'demo-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'demo-service-role-key',
  GEMINI_API_KEY: 'demo-gemini-key',
  APP_PIN: DEMO_PIN,
  AUTH_SECRET: 'demo-secret-only-for-screenshots-0123456789',
  NEXT_DIST_DIR: '.next-e2e',
  TZ: 'America/Mexico_City',
};

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    // Use the installed Chrome locally (no browser download); CI would use Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    // Freezes the pattern's sway and the medal's pop so every capture is identical.
    reducedMotion: 'reduce',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
  },
  webServer: [
    {
      command: 'node e2e/mock-supabase.mjs',
      url: `http://127.0.0.1:${MOCK_PORT}/rest/v1/sessions?limit=1`,
      env: { MOCK_SUPABASE_PORT: String(MOCK_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://127.0.0.1:${APP_PORT}`,
      env: appEnv,
      timeout: 240_000,
      reuseExistingServer: false,
    },
  ],
});

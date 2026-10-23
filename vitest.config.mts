import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Pin a timezone behind UTC so date tests behave the same locally and in CI (UTC).
// Set before the workers start, so they inherit it.
process.env.TZ = 'America/Mexico_City';

export default defineConfig({
  resolve: {
    // Mirror the `@/*` alias from tsconfig.json.
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});

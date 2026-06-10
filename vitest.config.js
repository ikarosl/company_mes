import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@company/api-contract': fileURLToPath(
        new URL('./packages/api-contract/src/index.ts', import.meta.url),
      ),
      '@company/auth-client': fileURLToPath(
        new URL('./packages/auth-client/src/index.ts', import.meta.url),
      ),
      '@company/constants': fileURLToPath(
        new URL('./packages/constants/src/index.ts', import.meta.url),
      ),
      '@company/ui': fileURLToPath(new URL('./packages/ui/src/index.ts', import.meta.url)),
      '@company/utils': fileURLToPath(new URL('./packages/utils/src/index.ts', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  test: {
    environment: 'happy-dom',
  },
});

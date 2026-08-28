import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/domain/**/*.test.ts'],
    // lógica pura de dominio — sin DOM en los tests unit
  },
});

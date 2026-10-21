import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    // O jsdom + Three.js consome muita memoria quando varios arquivos de
    // teste correm em paralelo neste ambiente; a serializacao evita o
    // travamento do runner sem alterar o comportamento dos testes.
    fileParallelism: false,
  },
});

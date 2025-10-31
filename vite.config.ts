import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    dts({
      include: [
        'src/types.ts',
        'src/wizard-engine.ts',
        'src/wizard-state.ts',
        'src/validators.ts',
        'src/type-guards.ts',
        'src/composables/**/*.ts',
        'src/components/**/*.vue',
        'src/index.ts'
      ],
      exclude: [
        'src/**/*.spec.ts',
        'src/__tests__/**/*',
        'src/main.ts',
        'src/App.vue',
        'src/router/**/*',
        'src/stores/counter.ts',
        'src/views/**/*',
        'env.d.ts'
      ],
      rollupTypes: true,
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Wizardly',
      fileName: (format) => `wizardly.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['vue', 'pinia', '@vueuse/core'],
      output: {
        // Provide global variables to use in the UMD build
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          '@vueuse/core': 'VueUse',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    // Ensure compatibility
    target: 'es2020',
  },
})

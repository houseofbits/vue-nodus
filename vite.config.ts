import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  resolve: {
    dedupe: ['vue']
  },
  plugins: [
    vue(),
    libInjectCss(),
    dts({
      insertTypesEntry: true
    })
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'vue-nodus',
      formats: ['es'],
      fileName: 'index'
    },

    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },

    sourcemap: true
  }
})
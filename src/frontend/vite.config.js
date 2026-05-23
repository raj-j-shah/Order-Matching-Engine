import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['grpc-web', 'google-protobuf'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /proto/],
      transformMixedEsModules: true,
    },
  },
})

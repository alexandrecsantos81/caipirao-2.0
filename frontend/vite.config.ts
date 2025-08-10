import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path' // 1. IMPORTE O MÓDULO 'path' DO NODE.JS

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( ), tsconfigPaths()],
  
  // 2. ADICIONE A SEÇÃO 'resolve.alias' PARA MAPEAMENTO EXPLÍCITO
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

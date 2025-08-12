// frontend/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react( ), // O plugin do React já lida com o Fast Refresh corretamente.
    tsconfigPaths()
  ],
  
  // ✅ CORREÇÃO: Adicionando um alias explícito para garantir uma única fonte para o React.
  // Isso força o Vite a sempre usar a mesma cópia do React, evitando duplicações.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Garante que todas as importações de 'react' e 'react-dom' apontem para a mesma instância.
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  // Otimizações para o build de produção
  build: {
    rollupOptions: {
      output: {
        // Agrupa dependências de vendor (node_modules) em um chunk separado
        // para melhorar o caching do navegador.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})

// frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path'; // <-- Verifique se esta importação está presente

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react( ),
    // O plugin 'vite-tsconfig-paths' já lê os aliases do seu tsconfig.json,
    // então a configuração manual em 'resolve.alias' para '@' é redundante,
    // mas mantê-la não causa problemas e pode servir como clareza.
    tsconfigPaths()
  ],
  
  resolve: {
    alias: {
      // O alias para '@' é lido pelo plugin acima, mas podemos mantê-lo aqui para maior clareza.
      '@': path.resolve(__dirname, './src'),
      
      // Garante que todas as importações de 'react' e 'react-dom' apontem para a mesma instância,
      // o que é uma ótima prática para evitar erros de hooks duplicados.
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
});

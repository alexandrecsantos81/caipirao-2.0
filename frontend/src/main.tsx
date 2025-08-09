import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme, ThemeConfig } from '@chakra-ui/react'; // 1. Importar o necessário
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { AuthProvider } from './hooks/useAuth';

// 2. Configurar o tema
const config: ThemeConfig = {
  initialColorMode: 'system', // 'light', 'dark', ou 'system'
  useSystemColorMode: true,   // Segue a preferência do sistema operacional
};

const theme = extendTheme({ config }); // Cria o tema estendido

const queryClient = new QueryClient();
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* 3. Passar o novo tema para o provider */}
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// frontend/src/main.tsx (Sugestão de alteração)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { AuthProvider } from './hooks/useAuth';

// 1. Configuração inicial do modo de cor
const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

// 2. Definição de cores e estilos semânticos
const theme = extendTheme({
  config,
  styles: {
    global: (props: any) => ({
      // Estilos para o modo escuro
      'body, #root': {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
        transitionProperty: 'background-color',
        transitionDuration: 'normal',
      },
      // Efeito de hover futurista para botões e links
      'button, a': {
        transition: 'all 0.2s ease-in-out',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
      },
    }),
  },
  colors: {
    // Cores personalizadas para um visual mais moderno
    brand: {
      50: '#e6fffa',
      100: '#b2f5ea',
      200: '#81e6d9',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795',
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1d4044',
    },
  },
});

const queryClient = new QueryClient();
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}> {/* 3. Aplicar o tema estendido */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

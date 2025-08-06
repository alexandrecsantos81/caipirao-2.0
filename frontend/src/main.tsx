// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Seu componente principal da aplicação
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom'; // Essencial para as rotas

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O BrowserRouter deve envolver o App para o roteamento funcionar */}
    <BrowserRouter>
      {/* O QueryClientProvider habilita o React Query em toda a aplicação */}
      <QueryClientProvider client={queryClient}>
        {/* O ChakraProvider habilita o uso de componentes Chakra UI */}
        <ChakraProvider>
          <App />
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

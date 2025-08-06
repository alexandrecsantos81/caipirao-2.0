// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';

// Crie uma instância do QueryClient para o React Query
const queryClient = new QueryClient();

// Encontre o elemento raiz no seu HTML
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Renderize a aplicação
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* 
      1. O BrowserRouter envolve TUDO. Ele é o provedor principal de roteamento.
    */}
    <BrowserRouter>
      {/* 
        2. O ChakraProvider fornece o tema e os componentes UI para toda a aplicação.
      */}
      <ChakraProvider>
        {/* 
          3. O QueryClientProvider gerencia todo o cache e estado de dados da API.
        */}
        <QueryClientProvider client={queryClient}>
          {/* 
            4. Finalmente, o seu componente App, que agora contém apenas a lógica das rotas.
               (Se você tivesse um AuthProvider, ele viria aqui, envolvendo o App).
          */}
          <App />
        </QueryClientProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);

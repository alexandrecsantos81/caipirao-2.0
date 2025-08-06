// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 1. Importe o ChakraProvider
import { ChakraProvider } from '@chakra-ui/react';

// Esta linha encontra a <div id="root"> no seu index.html
const rootElement = document.getElementById('root')!;

// Esta linha diz ao React para criar a "raiz" da aplicação nesse elemento
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* 2. Envolva o componente <App /> com o <ChakraProvider /> */}
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

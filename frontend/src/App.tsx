// frontend/src/App.tsx

import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Box, Flex, Button, Heading, Text } from '@chakra-ui/react';

// Importando as páginas com a sintaxe de exportação padrão (sem chaves)
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';

// Componente para a página inicial
const Home = () => (
  <Box>
    <Heading as="h2" size="lg">Bem-vindo ao Caipirão 3.0!</Heading>
    <Text mt={4}>Selecione uma opção no menu acima para começar a gerenciar seu negócio.</Text>
  </Box>
);

// Componente principal da aplicação
function App() {
  return (
    <Box>
      {/* Menu de Navegação */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem"
        bg="teal.500"
        color="white"
      >
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
            Caipirão 3.0
          </Heading>
        </Flex>
        <Box>
          <Button as={Link} to="/clientes" variant="ghost" _hover={{ bg: 'teal.600' }} mr={4}>
            Clientes
          </Button>
          <Button as={Link} to="/produtos" variant="ghost" _hover={{ bg: 'teal.600' }}>
            Produtos
          </Button>
        </Box>
      </Flex>

      {/* Área de Conteúdo onde as Páginas serão Renderizadas */}
      <Box p={8}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/produtos" element={<Produtos />} />
          {/* Redireciona qualquer rota não encontrada para a página inicial */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;

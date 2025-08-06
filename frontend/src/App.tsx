// frontend/src/App.tsx

import { Routes, Route, Link, Navigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Button,
  Heading,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Spinner,
  Center
} from '@chakra-ui/react';
import { useAuth } from './hooks/useAuth';

import Login from './pages/Login';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Vendas from './pages/Vendas';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Não renderiza a barra de navegação durante o carregamento inicial
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    // O <Router> foi REMOVIDO daqui
    <Box>
      {isAuthenticated && (
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
            <Button as={Link} to="/clientes" variant="ghost" _hover={{ bg: 'teal.700' }} mr={2}>
              Clientes
            </Button>
            <Button as={Link} to="/produtos" variant="ghost" _hover={{ bg: 'teal.700' }} mr={2}>
              Produtos
            </Button>
            <Button as={Link} to="/vendas" variant="ghost" _hover={{ bg: 'teal.700' }}>
              Vendas
            </Button>
          </Box>

          <Spacer />

          <Menu>
            <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
              <Avatar size="sm" name={user?.nome || 'Usuário'} />
            </MenuButton>
            <MenuList bg="white" color="black">
              <MenuItem>Olá, {user?.nome}</MenuItem>
              <MenuItem onClick={logout} color="red.500">
                Sair (Logout)
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}

      <Box p={4}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
          <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/clientes" /> : <Navigate to="/login" />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;

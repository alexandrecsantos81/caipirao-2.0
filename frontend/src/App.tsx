// frontend/src/App.tsx

import { Routes, Route, Link as RouterLink, Navigate, Outlet } from 'react-router-dom';
import { Box, Flex, Button, Heading } from '@chakra-ui/react';

// Importe suas páginas
import LoginPage from './pages/Login';
import ClientesPage from './pages/Clientes';
import ProdutosPage from './pages/Produtos';
import MovimentacoesPage from './pages/Movimentacoes';
import DashboardPage from './pages/Dashboard';

// --- Componente de Proteção de Rota ---
const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken');
  // Se não houver token, redireciona para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Se houver token, renderiza o layout principal que contém as rotas filhas
  return <Layout />;
};

// --- Componente de Navegação (Navbar) ---
const Navbar = () => {
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
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
        <Button as={RouterLink} to="/dashboard" variant="ghost" mr={2}>
          Dashboard
        </Button>
        <Button as={RouterLink} to="/movimentacoes" variant="ghost" mr={2}>
          Movimentações
        </Button>
        <Button as={RouterLink} to="/clientes" variant="ghost" mr={2}>
          Clientes
        </Button>
        <Button as={RouterLink} to="/produtos" variant="ghost" mr={4}>
          Produtos
        </Button>
        <Button onClick={handleLogout} colorScheme="red">
          Sair
        </Button>
      </Box>
    </Flex>
  );
};

// --- Componente de Layout Principal ---
// Este componente inclui a Navbar e um espaço para o conteúdo da página (Outlet)
const Layout = () => {
  return (
    <Box>
      <Navbar />
      <main>
        {/* Outlet é o marcador de posição onde o React Router irá renderizar a página da rota correspondente */}
        <Outlet />
      </main>
    </Box>
  );
};

// --- Componente Principal da Aplicação ---
function App() {
  return (
    <Routes>
      {/* 1. Rota Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. Agrupamento de Rotas Protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Todas as rotas aqui dentro usarão o Layout e exigirão login */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        {/* Rota padrão para redirecionar para o dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>

      {/* Opcional: Uma rota para "Não Encontrado" */}
      <Route path="*" element={<Heading p={10}>404: Página Não Encontrada</Heading>} />
    </Routes>
  );
}

export default App;

// frontend/src/App.tsx

import { Routes, Route, Link as RouterLink, Navigate, Outlet } from 'react-router-dom';
import { Box, Flex, Button, Heading, Spacer, Menu, MenuButton, MenuList, MenuItem, Spinner } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

// Hooks e Páginas
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import SolicitarAcessoPage from './pages/SolicitarAcessoPage';
import ClientesPage from './pages/Clientes';
import ProdutosPage from './pages/Produtos';
import MovimentacoesPage from './pages/Movimentacoes';
// CORREÇÃO: Ajustando o caminho da importação. Verifique se o nome do seu arquivo é "Dashboard.tsx" ou "DashboardPage.tsx"
import DashboardPage from './pages/Dashboard'; // <--- TENTE ESTA IMPORTAÇÃO
import UtilizadoresPage from './pages/UtilizadoresPage';

// --- Componente de Proteção de Rota ---
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

// --- Componente de Proteção para Rotas de Admin ---
const AdminRoute = () => {
  const { user } = useAuth();
  if (user?.perfil !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// --- Componente de Navegação (Navbar) ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  return (
    <Flex as="nav" align="center" wrap="wrap" padding="1.5rem" bg="teal.500" color="white">
      <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>Caipirão 3.0</Heading>
      <Spacer />
      <Box>
        <Button as={RouterLink} to="/dashboard" variant="ghost" mr={2}>Dashboard</Button>
        <Button as={RouterLink} to="/movimentacoes" variant="ghost" mr={2}>Movimentações</Button>
        <Button as={RouterLink} to="/clientes" variant="ghost" mr={2}>Clientes</Button>
        <Button as={RouterLink} to="/produtos" variant="ghost" mr={4}>Produtos</Button>
        {isAdmin && (
          <Button as={RouterLink} to="/utilizadores" variant="ghost" mr={4}>Utilizadores</Button>
        )}
      </Box>
      <Spacer />
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="teal">
          {user?.nome}
        </MenuButton>
        <MenuList color="black">
          <MenuItem onClick={logout}>Sair</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};

// --- Componente de Layout Principal ---
const Layout = () => (
  <Box>
    <Navbar />
    <main><Outlet /></main>
  </Box>
);

// --- Componente Principal da Aplicação ---
function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      {/* Rotas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        
        <Route element={<AdminRoute />}>
          <Route path="/utilizadores" element={<UtilizadoresPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>

      <Route path="*" element={<Heading p={10}>404: Página Não Encontrada</Heading>} />
    </Routes>
  );
}

export default App;

// src/App.tsx

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, Spinner, Grid, GridItem, Center, Heading, useDisclosure } from '@chakra-ui/react';

// Hooks e Páginas
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import SolicitarAcessoPage from './pages/SolicitarAcessoPage';
import ClientesPage from './pages/Clientes';
import ProdutosPage from './pages/Produtos';
import MovimentacoesPage from './pages/Movimentacoes';
import DashboardPage from './pages/Dashboard';
import UtilizadoresPage from './pages/UtilizadoresPage';
import FornecedoresPage from './pages/FornecedoresPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
// 1. IMPORTAR A NOVA PÁGINA DE RELATÓRIOS
import RelatoriosPage from './pages/RelatoriosPage';

// --- Componente de Proteção de Rota ---
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

// --- Componente de Proteção para Rotas de Admin ---
const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }

  if (user?.perfil !== 'ADMIN') {
    return <Navigate to="/movimentacoes" replace />;
  }
  
  return <Outlet />;
};

// --- Componente de Layout Principal ---
const Layout = () => {
  const { isOpen: isSidebarOpen, onToggle: onToggleSidebar } = useDisclosure({ defaultIsOpen: true });

  return (
    <Grid
      templateAreas={`"nav header" "nav main"`}
      gridTemplateColumns={isSidebarOpen ? '240px 1fr' : '72px 1fr'}
      gridTemplateRows={'auto 1fr'}
      h='100vh'
      transition="grid-template-columns 0.2s ease-in-out"
    >
      <GridItem area={'nav'}>
        <Sidebar isCollapsed={!isSidebarOpen} />
      </GridItem>
      <GridItem area={'header'}>
        <Header onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />
      </GridItem>
      <GridItem area={'main'} overflowY="auto">
        <Box p={8}>
          <Outlet />
        </Box>
      </GridItem>
    </Grid>
  );
};

// --- Componente Principal da Aplicação ---
function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      {/* Rotas Protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Rotas Comuns */}
        <Route path="/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        
        {/* Rotas de Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/utilizadores" element={<UtilizadoresPage />} />
          {/* 2. ADICIONAR A NOVA ROTA DE RELATÓRIOS AQUI */}
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="/" element={<Navigate to="/movimentacoes" />} />
      </Route>

      <Route path="*" element={<Box p={10}><Heading>404: Página Não Encontrada</Heading></Box>} />
    </Routes>
  );
}

export default App;

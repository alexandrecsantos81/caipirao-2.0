import { Box, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// CORREÇÃO: Removida a extensão .tsx das importações de páginas.
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MovimentacoesPage from '@/pages/MovimentacoesPage';
import ClientesPage from '@/pages/ClientesPage';
import ProdutosPage from '@/pages/ProdutosPage';
import FornecedoresPage from '@/pages/FornecedoresPage';
import UtilizadoresPage from '@/pages/UtilizadoresPage';
import RelatoriosPage from '@/pages/RelatoriosPage';
import SolicitarAcessoPage from '@/pages/SolicitarAcessoPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const showNavigation = isAuthenticated && location.pathname !== '/login' && location.pathname !== '/solicitar-acesso';

  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? '240px' : '72px');

  return (
    <Box>
      {showNavigation && !isMobile && (
        <>
          <Sidebar isCollapsed={!isSidebarOpen} />
          <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </>
      )}

      <Box
        as="main"
        ml={sidebarWidth}
        p={{ base: 4, md: 8 }}
        pb={{ base: '80px', md: 8 }}
        transition="margin-left 0.2s ease-in-out"
      >
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

          {/* Rotas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/movimentacoes" element={<MovimentacoesPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            
            {/* Rotas de Admin */}
            <Route element={<AdminRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/fornecedores" element={<FornecedoresPage />} />
              <Route path="/utilizadores" element={<UtilizadoresPage />} />
            </Route>
          </Route>

          {/* Rota não encontrada */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>

      {showNavigation && isMobile && <BottomNavBar />}
    </Box>
  );
}

export default App;

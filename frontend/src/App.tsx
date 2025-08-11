// frontend/src/App.tsx

import { Box, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

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

// Componente de Layout Principal
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? '240px' : '72px');

  return (
    <Box>
      {!isMobile && (
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
        {children}
      </Box>

      {isMobile && <BottomNavBar />}
    </Box>
  );
};


function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Lista de rotas que NÃO devem usar o layout principal
  const publicRoutes = ['/login', '/solicitar-acesso'];
  const useMainLayout = isAuthenticated && !publicRoutes.includes(location.pathname);

  // Se a rota não usa o layout principal, renderiza apenas as rotas públicas
  if (!useMainLayout) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
        {/* Se o usuário tentar acessar uma rota protegida sem estar logado,
            o ProtectedRoute o redirecionará para /login */}
        <Route path="*" element={
          <ProtectedRoute> 
            <NotFoundPage />
          </ProtectedRoute>
        } />
      </Routes>
    );
  }

  // Se usa o layout principal, renderiza o layout com as rotas protegidas dentro
  return (
    <MainLayout>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/utilizadores" element={<UtilizadoresPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;

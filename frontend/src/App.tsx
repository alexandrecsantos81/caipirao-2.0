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

// Componente de Layout Principal (sem alterações)
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

  const publicRoutes = ['/login', '/solicitar-acesso'];
  const useMainLayout = isAuthenticated && !publicRoutes.includes(location.pathname);

  return (
    <Routes>
      {/* Rotas Públicas que não usam o MainLayout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      {/* Rotas Protegidas que usam o MainLayout */}
      <Route 
        path="/" 
        element={
          useMainLayout ? (
            <MainLayout>
              <Outlet /> {/* O Outlet renderizará as rotas aninhadas */}
            </MainLayout>
          ) : (
            <ProtectedRoute /> // Se não estiver logado, redireciona para /login
          )
        }
      >
        {/* Rotas filhas que serão renderizadas dentro do MainLayout */}
        <Route index element={<DashboardPage />} /> {/* Rota padrão para / */}
        <Route path="movimentacoes" element={<MovimentacoesPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="produtos" element={<ProdutosPage />} />
        
        {/* Rotas de Admin aninhadas */}
        <Route element={<AdminRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="fornecedores" element={<FornecedoresPage />} />
          <Route path="utilizadores" element={<UtilizadoresPage />} />
        </Route>
      </Route>

      {/* Rota 404 para qualquer caminho não correspondido */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// CORREÇÃO: Importar o Outlet do react-router-dom
import { Outlet } from 'react-router-dom';
export default App;

// frontend/src/App.tsx

import { Box, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavBar } from '@/components/BottomNavBar';
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

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? '240px' : '72px');

  return (
    <Box>
      {/* O Header agora é renderizado para mobile também, mas o botão de toggle é interno */}
      <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      {/* A Sidebar só é renderizada em desktop */}
      {!isMobile && <Sidebar isCollapsed={!isSidebarOpen} />}

      <Box
        as="main"
        // ✅ CORREÇÃO: Adicionar um padding-top para não ficar sob o Header fixo
        pt="14" // "14" é a altura do Header (h="14")
        ml={{ base: 0, md: sidebarWidth }} // Margem correta para desktop
        p={{ base: 4, md: 8 }}
        pb={{ base: '80px', md: 8 }} // Padding-bottom para não ficar sob o BottomNavBar
        transition="margin-left 0.2s ease-in-out"
      >
        <Outlet />
      </Box>

      {isMobile && <BottomNavBar />}
    </Box>
  );
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          
          <Route path="/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/utilizadores" element={<UtilizadoresPage />} />
          </Route>

        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

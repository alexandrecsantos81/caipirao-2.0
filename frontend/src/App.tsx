// frontend/src/App.tsx

import { Box, useBreakpointValue, Flex } from '@chakra-ui/react'; // Adicionado Flex
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
      {/* A Sidebar é renderizada primeiro e posicionada de forma fixa */}
      {!isMobile && <Sidebar isCollapsed={!isSidebarOpen} />}

      {/* ✅ CORREÇÃO: Um novo Flex container para o conteúdo principal */}
      <Flex
        direction="column"
        as="main"
        ml={{ base: 0, md: sidebarWidth }} // A margem dinâmica é aplicada aqui
        pb={{ base: '80px', md: 0 }} // Padding para o BottomNavBar em mobile
        transition="margin-left 0.2s ease-in-out"
      >
        {/* O Header fica no topo deste container */}
        <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        
        {/* O conteúdo da página (Outlet) vem logo abaixo */}
        <Box p={{ base: 4, md: 8 }}>
          <Outlet />
        </Box>
      </Flex>

      {/* O BottomNavBar continua fixo para mobile */}
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

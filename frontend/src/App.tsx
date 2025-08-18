// frontend/src/App.tsx

import { Box, useBreakpointValue, Flex } from '@chakra-ui/react';
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
import FinancasPage from '@/pages/FinancasPage';
import EmpresaPage from '@/pages/EmpresaPage'; // <-- 1. Importação da nova página

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? '240px' : '72px');

  return (
    <Flex h="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {!isMobile && <Sidebar isCollapsed={!isSidebarOpen} />}

      <Flex
        direction="column"
        as="main"
        flex="1"
        ml={{ base: 0, md: sidebarWidth }}
        pb={{ base: '60px', md: 0 }}
        transition="margin-left 0.2s ease-in-out"
        overflowY="auto"
      >
        <Box
          position="sticky"
          top="0"
          zIndex="docked"
          bg="chakra-body-bg"
          boxShadow="sm"
        >
          <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </Box>
        
        <Box p={{ base: 4, md: 8 }}>
          <Outlet />
        </Box>
      </Flex>

      {isMobile && <BottomNavBar />}
    </Flex>
  );
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          
          {/* Rotas acessíveis a todos os usuários logados */}
          <Route path="/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          
          {/* Rotas acessíveis apenas para ADMINs */}
          <Route element={<AdminRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/utilizadores" element={<UtilizadoresPage />} />
            <Route path="/financas" element={<FinancasPage />} />
            
            {/* 2. Adição da rota para a nova página */}
            <Route path="/empresa" element={<EmpresaPage />} />
          </Route>

        </Route>
      </Route>

      {/* Rota para páginas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

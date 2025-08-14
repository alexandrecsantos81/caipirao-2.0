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

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isMobile ? 0 : (isSidebarOpen ? '240px' : '72px');

  return (
    <Flex h="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {/* A Sidebar é renderizada primeiro e posicionada de forma fixa */}
      {!isMobile && <Sidebar isCollapsed={!isSidebarOpen} />}

      {/* Container principal para Header e Conteúdo */}
      <Flex
        direction="column"
        as="main"
        flex="1" // Ocupa todo o espaço restante
        ml={{ base: 0, md: sidebarWidth }} // Margem dinâmica para a sidebar
        pb={{ base: '60px', md: 0 }} // Padding para o BottomNavBar em mobile
        transition="margin-left 0.2s ease-in-out"
        overflowY="auto" // ✅ A barra de rolagem agora pertence a este container
      >
        {/* O Header fica fixo no topo deste container */}
        <Box
          position="sticky"
          top="0"
          zIndex="docked" // Garante que o header fique acima do conteúdo
          bg="chakra-body-bg" // Usa a cor de fundo do tema
          boxShadow="sm" // Adiciona uma sombra para destacar
        >
          <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </Box>
        
        {/* O conteúdo da página (Outlet) vem logo abaixo e é a área que rola */}
        <Box p={{ base: 4, md: 8 }}>
          <Outlet />
        </Box>
      </Flex>

      {/* O BottomNavBar continua fixo para mobile */}
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

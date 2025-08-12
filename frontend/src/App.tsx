// frontend/src/App.tsx

import { Box, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavBar } from '@/components/BottomNavBar';
import ProtectedRoute from '@/components/ProtectedRoute'; // Usaremos para agrupar rotas
import AdminRoute from '@/components/AdminRoute'; // Usaremos para agrupar rotas de admin

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

// Componente de Layout Principal que SEMPRE será renderizado para rotas protegidas
const MainLayout = () => {
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
        {/* As rotas filhas (páginas) serão renderizadas aqui */}
        <Outlet />
      </Box>

      {isMobile && <BottomNavBar />}
    </Box>
  );
};


function App() {
  return (
    <Routes>
      {/* 1. Rotas Públicas (não precisam de layout nem autenticação) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />

      {/* 2. Agrupador de Rotas Protegidas */}
      {/* O componente ProtectedRoute verifica a autenticação. Se ok, renderiza o Outlet. */}
      <Route element={<ProtectedRoute />}>
        {/* 3. Layout Principal para TODAS as rotas protegidas */}
        {/* O MainLayout é renderizado e as páginas aparecem dentro dele via Outlet */}
        <Route element={<MainLayout />}>
          
          {/* Rotas para todos os usuários logados */}
          <Route path="/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          
          {/* 4. Agrupador de Rotas de Admin */}
          {/* O AdminRoute verifica se o perfil é ADMIN. Se ok, renderiza o Outlet. */}
          <Route element={<AdminRoute />}>
            {/* As rotas aqui dentro só são acessíveis por Admins */}
            <Route path="/" element={<DashboardPage />} /> {/* Rota padrão para / */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/utilizadores" element={<UtilizadoresPage />} />
          </Route>

        </Route>
      </Route>

      {/* Rota 404 para qualquer caminho não correspondido */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

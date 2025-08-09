import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, Spinner, Grid, GridItem, Center, Heading } from '@chakra-ui/react'; // <-- CORREÇÃO: Adicionado Center e Heading

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

// --- Componente de Proteção de Rota ---
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    // Usando o Center que acabamos de importar
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }
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

// --- Componente de Layout Principal (ATUALIZADO) ---
const Layout = () => (
  <Grid
    templateAreas={`"nav main"`}
    gridTemplateColumns={'240px 1fr'} // Largura da Sidebar e o resto para o conteúdo
    h='100vh'
    bg="gray.50"
  >
    <GridItem area={'nav'}>
      <Sidebar />
    </GridItem>
    <GridItem area={'main'} overflowY="auto">
      <Box p={8}>
        <Outlet />
      </Box>
    </GridItem>
  </Grid>
);

// --- Componente Principal da Aplicação (ATUALIZADO) ---
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
        <Route path="/fornecedores" element={<FornecedoresPage />} />
        
        <Route element={<AdminRoute />}>
          <Route path="/utilizadores" element={<UtilizadoresPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>

      {/* Rota de fallback para páginas não encontradas */}
      <Route path="*" element={<Box p={10}><Heading>404: Página Não Encontrada</Heading></Box>} />
    </Routes>
  );
}

export default App;

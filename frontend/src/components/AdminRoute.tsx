import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Center, Spinner } from '@chakra-ui/react';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  // Enquanto o estado de autenticação está carregando, exibe um spinner
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Se o usuário não for um ADMIN, redireciona para a página principal permitida para ele
  if (user?.perfil !== 'ADMIN') {
    // Pode ser o dashboard ou outra página, como /movimentacoes
    return <Navigate to="/movimentacoes" replace />;
  }

  // Se for um ADMIN, permite o acesso às rotas aninhadas
  return <Outlet />;
};

export default AdminRoute;

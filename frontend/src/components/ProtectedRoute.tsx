// frontend/src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Center, Spinner } from '@chakra-ui/react';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto o estado de autenticação está sendo verificado, exibe um spinner.
  // Isso centraliza a lógica de carregamento e evita renderizações parciais.
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Após o carregamento, se o usuário NÃO estiver autenticado, redireciona para o login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, permite o acesso às rotas aninhadas.
  return <Outlet />;
};

export default ProtectedRoute;

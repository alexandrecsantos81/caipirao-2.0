// frontend/src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Center, Spinner } from '@chakra-ui/react';

const ProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    // Mantém o redirecionamento para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  // Se um usuário não-admin tentar acessar a raiz, redireciona para seu dashboard
  if (user?.perfil !== 'ADMIN' && location.pathname === '/') {
    return <Navigate to="/meu-dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

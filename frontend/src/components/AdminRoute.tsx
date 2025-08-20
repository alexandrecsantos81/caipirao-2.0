// frontend/src/components/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRoute = () => {
  const { user } = useAuth();

  // Se o usuário não for um ADMIN, redireciona para o dashboard de vendedor.
  if (user?.perfil !== 'ADMIN') {
    return <Navigate to="/meu-dashboard" replace />;
  }

  // Se for um ADMIN, permite o acesso às rotas aninhadas.
  return <Outlet />;
};

export default AdminRoute;

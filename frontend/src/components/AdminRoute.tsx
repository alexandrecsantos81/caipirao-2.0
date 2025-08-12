// frontend/src/components/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRoute = () => {
  const { user } = useAuth();

  // O hook useAuth já garante que 'user' não será nulo aqui,
  // pois ProtectedRoute já validou a autenticação.
  // A verificação de loading também já foi feita no ProtectedRoute.

  // Se o usuário não for um ADMIN, redireciona para a página principal permitida para ele.
  if (user?.perfil !== 'ADMIN') {
    // Redireciona para a página de movimentações, que é acessível por todos os usuários logados.
    return <Navigate to="/movimentacoes" replace />;
  }

  // Se for um ADMIN, permite o acesso às rotas aninhadas.
  return <Outlet />;
};

export default AdminRoute;

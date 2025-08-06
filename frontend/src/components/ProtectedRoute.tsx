// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken'); // Ou a sua lógica para verificar a autenticação

  // Se não houver token, redireciona para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se houver token, renderiza o componente da rota solicitada (filho)
  return <Outlet />;
};

export default ProtectedRoute;

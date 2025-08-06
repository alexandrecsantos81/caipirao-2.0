// frontend/src/hooks/useAuth.ts
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  perfil: 'ADMIN' | 'USER';
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return { user: null, isAdmin: false };
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Verifica se o token expirou
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return { user: null, isAdmin: false };
    }

    return {
      user: { id: decoded.id, perfil: decoded.perfil },
      isAdmin: decoded.perfil === 'ADMIN',
    };
  } catch (error) {
    console.error('Token inválido:', error);
    return { user: null, isAdmin: false };
  }
};

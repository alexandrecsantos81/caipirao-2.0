// frontend/src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// Interface para o payload decodificado do token JWT
interface DecodedToken {
  id: number; // Corrigido de userId para id
  nome: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN' | 'PENDENTE';
  iat: number;
  exp: number;
}

// Interface para o valor do contexto de autenticação
interface AuthContextType {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Token inválido:", error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      localStorage.setItem('token', token);
      setUser(decoded);
      navigate('/dashboard'); // Redireciona para o dashboard após o login
    } catch (error) {
      console.error("Falha ao processar o token de login:", error);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const authContextValue = {
    user,
    isAuthenticated: !loading && !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

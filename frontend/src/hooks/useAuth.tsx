// frontend/src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Interface para o payload decodificado do token JWT
interface DecodedToken {
  userId: number;
  nome: string;
  perfil: 'ADMIN' | 'USER';
  iat: number;
  exp: number;
}

// Interface para o valor do contexto de autenticação
interface AuthContextType {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente Provedor que vai envolver a aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Erro ao decodificar o token:", error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // O valor que será fornecido pelo contexto
  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    logout,
  };

  // A sintaxe correta para o provider
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação de forma segura
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

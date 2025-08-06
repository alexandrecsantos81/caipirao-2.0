// frontend/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Você pode precisar instalar isso: npm install jwt-decode

// Interface para o payload decodificado do token JWT
interface DecodedToken {
  id: number;
  nome: string;
  perfil: 'ADMIN' | 'USER';
  iat: number;
  exp: number;
}

// Interface para o objeto do usuário que vamos usar na aplicação
export interface User {
  id: number;
  nome: string;
  perfil: 'ADMIN' | 'USER';
}

// A função que será o nosso hook
export const useAuth = () => {
  // Estado para armazenar as informações do usuário
  const [user, setUser] = useState<User | null>(null);
  
  // Estado para verificar se a autenticação está sendo carregada (opcional, mas bom para UX)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decodifica o token para obter as informações do usuário
        const decodedToken = jwtDecode<DecodedToken>(token);
        
        // Verifica se o token não expirou
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({
            id: decodedToken.id,
            nome: decodedToken.nome,
            perfil: decodedToken.perfil,
          });
        } else {
          // Se o token expirou, remove do localStorage
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error("Falha ao processar o token:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Redireciona para a página de login
    window.location.href = '/login';
  };

  return {
    user, // O objeto do usuário (ou null)
    isAuthenticated: !!user, // Um booleano que é true se o usuário estiver logado
    isAdmin: user?.perfil === 'ADMIN', // Um booleano para verificar se é admin
    logout, // A função para fazer logout
    loading, // O estado de carregamento
  };
};

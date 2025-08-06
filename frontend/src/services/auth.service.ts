// frontend/src/services/auth.service.ts

const API_URL = 'http://localhost:3001/api/auth';

// Interface para as credenciais de login
export interface LoginCredentials {
  email: string;
  senha: string;
}

// Interface para a resposta da API de login
interface LoginResponse {
  token: string;
}

// Função para realizar o login
export const login = async (credentials: LoginCredentials ): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Lança um erro com a mensagem vinda do backend
    throw new Error(errorData.message || 'Falha na autenticação');
  }

  return response.json();
};

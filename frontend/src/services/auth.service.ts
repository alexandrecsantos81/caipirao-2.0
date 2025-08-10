import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

// ... (interceptor) ...

export interface LoginCredentials {
  credencial: string;
  senha: string;
}

interface LoginResponse {
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    // CORREÇÃO: Adicione '/auth' ao caminho da rota de login
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Falha na autenticação. Verifique suas credenciais.';
    throw new Error(errorMessage);
  }
};

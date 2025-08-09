// frontend/src/services/auth.service.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/auth';
const apiClient = axios.create({ baseURL: API_URL } );

// Interface para as credenciais de login (atualizada)
export interface LoginCredentials {
  credencial: string; // Pode ser email, nickname ou telefone
  senha: string;
}

// Interface para a resposta da API de login
interface LoginResponse {
  token: string;
}

// Função para realizar o login (atualizada)
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  } catch (error: any) {
    // Captura o erro do Axios e lança uma mensagem mais clara
    const errorMessage = error.response?.data?.error || 'Falha na autenticação. Verifique suas credenciais.';
    throw new Error(errorMessage);
  }
};

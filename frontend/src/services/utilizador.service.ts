// frontend/src/services/utilizador.service.ts

import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

// Interceptor para adicionar o token de autenticação em todas as chamadas
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- INTERFACES ---

// Interface para os dados de um utilizador, como retornado pela API
export interface IUtilizador {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN' | 'PENDENTE';
  status: 'ATIVO' | 'INATIVO';
}

// Interface para o formulário de criação de um novo utilizador (pelo Admin)
export interface ICreateUtilizadorForm {
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  senha: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN';
}

// Interface para o formulário de solicitação de acesso (público)
export interface ISolicitacaoAcessoForm {
    nome: string;
    email: string;
    telefone: string;
}

// Interface para a resposta da ativação de um utilizador
export interface IAtivacaoResponse {
    message: string;
    utilizador: IUtilizador;
    senhaProvisoria: string;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista completa de utilizadores. (Requer Admin)
 */
export const getUtilizadores = async (): Promise<IUtilizador[]> => {
  const response = await apiClient.get('/utilizadores');
  return response.data;
};

/**
 * @description Cria um novo utilizador diretamente. (Requer Admin)
 */
export const createUtilizador = async (data: ICreateUtilizadorForm): Promise<IUtilizador> => {
    const response = await apiClient.post('/utilizadores', data);
    return response.data;
}

/**
 * @description Envia uma solicitação de acesso. (Público)
 */
export const solicitarAcesso = async (data: ISolicitacaoAcessoForm): Promise<any> => {
    // Esta chamada não precisa do token, então usamos axios diretamente
    const response = await axios.post(`${API_URL}/utilizadores/solicitar-acesso`, data);
    return response.data;
}

/**
 * @description Ativa um utilizador inativo, definindo um perfil e gerando uma senha. (Requer Admin)
 * @param id - O ID do utilizador a ser ativado.
 * @param perfil - O perfil a ser atribuído ao utilizador.
 */
export const ativarUtilizador = async ({ id, perfil }: { id: number, perfil: string }): Promise<IAtivacaoResponse> => {
    const response = await apiClient.put(`/utilizadores/${id}/ativar`, { perfil });
    return response.data;
}

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

export interface IUtilizador {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN' | 'PENDENTE';
  status: 'ATIVO' | 'INATIVO';
}

export interface ICreateUtilizadorForm {
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  senha: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN';
}

// NOVA INTERFACE para o formulário de edição
export interface IUpdateUtilizadorForm {
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  perfil: 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN';
  status: 'ATIVO' | 'INATIVO';
}

export interface ISolicitacaoAcessoForm {
  nome: string;
  email: string;
  telefone: string;
}

export interface IAtivacaoResponse {
  message: string;
  utilizador: IUtilizador;
  senhaProvisoria: string;
}

// --- FUNÇÕES DO SERVIÇO ---

export const getUtilizadores = async (): Promise<IUtilizador[]> => {
  const response = await apiClient.get('/utilizadores');
  return response.data;
};

export const createUtilizador = async (data: ICreateUtilizadorForm): Promise<IUtilizador> => {
  const response = await apiClient.post('/utilizadores', data);
  return response.data;
}

export const solicitarAcesso = async (data: ISolicitacaoAcessoForm): Promise<any> => {
  const response = await axios.post(`${API_URL}/utilizadores/solicitar-acesso`, data);
  return response.data;
}

export const ativarUtilizador = async ({ id, perfil }: { id: number, perfil: string }): Promise<IAtivacaoResponse> => {
  const response = await apiClient.put(`/utilizadores/${id}/ativar`, { perfil });
  return response.data;
}

/**
 * @description Atualiza os dados de um utilizador existente. (Requer Admin)
 * @param id - O ID do utilizador a ser atualizado.
 * @param data - Os novos dados do utilizador.
 */
export const updateUtilizador = async ({ id, data }: { id: number, data: IUpdateUtilizadorForm }): Promise<IUtilizador> => {
    const response = await apiClient.put(`/utilizadores/${id}`, data);
    return response.data;
};

/**
 * @description Deleta um utilizador. (Requer Admin)
 * @param id - O ID do utilizador a ser deletado.
 */
export const deleteUtilizador = async (id: number): Promise<void> => {
    await apiClient.delete(`/utilizadores/${id}`);
};

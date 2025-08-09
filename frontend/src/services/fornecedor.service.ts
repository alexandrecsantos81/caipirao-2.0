import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/fornecedores` } );

// Interceptor para adicionar o token de autenticação
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

export interface IFornecedor {
  id: number;
  nome: string;
  cnpj_cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
}

// Para formulários, os campos opcionais podem ser string vazia
export type IFornecedorForm = Omit<IFornecedor, 'id'>;


// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista completa de fornecedores.
 */
export const getFornecedores = async (): Promise<IFornecedor[]> => {
  const response = await apiClient.get('/');
  return response.data;
};

/**
 * @description Cria um novo fornecedor.
 */
export const createFornecedor = async (data: IFornecedorForm): Promise<IFornecedor> => {
    const response = await apiClient.post('/', data);
    return response.data;
}

/**
 * @description Atualiza os dados de um fornecedor existente.
 */
export const updateFornecedor = async ({ id, ...data }: IFornecedor): Promise<IFornecedor> => {
    const response = await apiClient.put(`/${id}`, data);
    return response.data;
}

/**
 * @description Deleta um fornecedor. (Requer Admin)
 */
export const deleteFornecedor = async (id: number): Promise<void> => {
    await apiClient.delete(`/${id}`);
}

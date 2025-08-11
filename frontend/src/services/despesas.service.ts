import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas` } );

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

export const tiposDeSaida = [
    "Insumos de Produção", "Mão de Obra", "Materiais e Embalagens", 
    "Despesas Operacionais", "Encargos e Tributos", "Despesas Administrativas", 
    "Financeiras", "Remuneração de Sócios", "Outros"
] as const;

type TipoSaida = typeof tiposDeSaida[number];

export interface IDespesa {
  id: number;
  tipo_saida: TipoSaida;
  valor: number;
  discriminacao: string;
  data_vencimento: string; // Formato YYYY-MM-DD
  data_pagamento?: string | null;
  fornecedor_id?: number | null;
  responsavel_pagamento_id?: number | null;
  nome_fornecedor?: string; // Vem da junção no backend
}

export interface IDespesaForm {
  tipo_saida: TipoSaida | '';
  valor: number | string;
  discriminacao: string;
  data_vencimento: string;
  fornecedor_id?: number | null;
}

export interface IContasAPagar {
    id: number;
    valor: number;
    data_vencimento: string;
    nome_fornecedor: string;
}

export interface IQuitacaoData {
    data_pagamento: string; // YYYY-MM-DD
    responsavel_pagamento_id?: number;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Registra uma nova despesa.
 */
export const registrarDespesa = async (data: IDespesaForm): Promise<IDespesa> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

/**
 * @description Atualiza uma despesa existente.
 */
export const updateDespesa = async ({ id, data }: { id: number, data: IDespesaForm }): Promise<IDespesa> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

/**
 * @description Deleta uma despesa.
 */
export const deleteDespesa = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};

/**
 * @description Busca a lista de despesas a pagar para o dashboard.
 */
export const getContasAPagar = async (): Promise<IContasAPagar[]> => {
    const response = await apiClient.get('/a-pagar');
    return response.data;
};

/**
 * @description Quita uma despesa. (Requer Admin)
 */
export const quitarDespesa = async ({ id, quitacaoData }: { id: number, quitacaoData: IQuitacaoData }): Promise<IDespesa> => {
    const response = await apiClient.put(`/${id}/quitar`, quitacaoData);
    return response.data;
};

/**
 * @description Busca a lista paginada de despesas.
 */
export const getDespesas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IDespesa>> => {
    const response = await apiClient.get('/', {
        params: { pagina, limite }
    });
    return response.data;
};
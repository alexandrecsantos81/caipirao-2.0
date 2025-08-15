// frontend/src/services/despesa.service.ts

import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types'; // Importação centralizada

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
  data_compra: string;
  data_vencimento: string;
  data_pagamento?: string | null;
  fornecedor_id?: number | null;
  responsavel_pagamento_id?: number | null;
  nome_fornecedor?: string;
}

export interface IDespesaForm {
  tipo_saida: TipoSaida | '';
  valor: number | string;
  discriminacao: string;
  data_compra: string;
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
    data_pagamento: string;
    responsavel_pagamento_id?: number;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista completa de despesas com paginação e filtro.
 * @param pagina - O número da página a ser buscada.
 * @param limite - O número de itens por página.
 * @param termoBusca - (Opcional) O termo para filtrar os resultados.
 */
export const getDespesas = async (
  pagina = 1,
  limite = 10,
  termoBusca?: string // <-- NOVO PARÂMETRO ADICIONADO
): Promise<IPaginatedResponse<IDespesa>> => {
    const response = await apiClient.get('/', {
        params: {
          pagina,
          limite,
          termoBusca, // <-- PARÂMETRO ENVIADO PARA A API
        },
    });
    return response.data;
};

export const registrarDespesa = async (data: IDespesaForm): Promise<IDespesa> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

export const updateDespesa = async ({ id, data }: { id: number, data: IDespesaForm }): Promise<IDespesa> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

export const deleteDespesa = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};

export const getContasAPagar = async (): Promise<IContasAPagar[]> => {
    const response = await apiClient.get('/a-pagar');
    return response.data;
};

export const quitarDespesa = async ({ id, quitacaoData }: { id: number, quitacaoData: IQuitacaoData }): Promise<IDespesa> => {
    const response = await apiClient.put(`/${id}/quitar`, quitacaoData);
    return response.data;
};

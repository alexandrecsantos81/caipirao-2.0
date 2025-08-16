import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types'; // Importação centralizada

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// ✅ Aponta para a rota correta que agora lida com despesas pessoais
const apiClient = axios.create({ baseURL: `${API_URL}/despesas` }   );

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

// --- INTERFACES ATUALIZADAS ---

// ✅ Interface IDespesa atualizada para refletir a tabela despesas_pessoais
export interface IDespesa {
  id: number;
  discriminacao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string | null;
  pago: boolean;
  data_pagamento?: string | null;
  recorrente: boolean;
  tipo_recorrencia?: 'PARCELAMENTO' | 'ASSINATURA' | null;
  parcela_atual?: number | null;
  total_parcelas?: number | null;
  utilizador_id: number;
  data_criacao: string;
}

// ✅ Interface IDespesaForm atualizada para o formulário de criação/edição
export interface IDespesaForm {
  discriminacao: string;
  valor: number | string;
  data_vencimento: string;
  categoria?: string;
  recorrente: boolean;
  tipo_recorrencia?: 'PARCELAMENTO' | 'ASSINATURA';
  parcela_atual?: number | string;
  total_parcelas?: number | string;
  pago?: boolean;
  data_pagamento?: string;
}


// --- FUNÇÕES DO SERVIÇO ATUALIZADAS ---

/**
 * @description Busca a lista paginada de despesas pessoais do usuário.
 */
export const getDespesas = async (
  pagina = 1,
  limite = 50,
  termoBusca?: string
): Promise<IPaginatedResponse<IDespesa>> => {
    const response = await apiClient.get('/', {
        params: {
          pagina,
          limite,
          termoBusca,
        },
    });
    return response.data;
};

/**
 * @description Registra uma nova despesa pessoal.
 */
export const registrarDespesa = async (data: IDespesaForm): Promise<IDespesa> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

/**
 * @description Atualiza uma despesa pessoal existente.
 */
export const updateDespesa = async ({ id, data }: { id: number, data: IDespesaForm }): Promise<IDespesa> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

/**
 * @description Deleta uma despesa pessoal.
 */
export const deleteDespesa = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};


// --- Funções antigas para despesas do negócio (manter se necessário em outro lugar) ---
// Estas funções não serão mais usadas pela página de Finanças Pessoais.

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

export const getContasAPagar = async (): Promise<IContasAPagar[]> => {
    // Esta rota pode precisar ser ajustada se a lógica de contas a pagar do negócio ainda for usada
    const response = await apiClient.get('/a-pagar');
    return response.data;
};

export const quitarDespesa = async ({ id, quitacaoData }: { id: number, quitacaoData: IQuitacaoData }): Promise<IDespesa> => {
    // Esta rota pode precisar ser ajustada
    const response = await apiClient.put(`/${id}/quitar`, quitacaoData);
    return response.data;
};

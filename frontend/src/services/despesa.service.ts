import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas` } );

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

export const tiposDeSaida = [
    "Insumos de Produção", "Mão de Obra", "Materiais e Embalagens",
    "Despesas Operacionais", "Encargos e Tributos", "Despesas Administrativas",
    "Financeiras", "Remuneração de Sócios", "Outros", "ABATE"
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
  funcionario_id?: number | null;
  lote_id?: string | null;
}

export interface IDespesaForm {
  tipo_saida: Exclude<TipoSaida, 'ABATE'> | '';
  valor: number | string;
  discriminacao: string;
  data_compra: string;
  data_vencimento: string;
  fornecedor_id?: number | null;
}

// ✅ CORREÇÃO: Interface para os dados que o backend espera para o tipo ABATE
export interface IDespesaFormAbatePayload {
  tipo_saida: 'ABATE';
  data_compra: string;
  pagamentos: {
    funcionario_id: number;
    valor: number;
    discriminacao: string;
  }[];
  pagamento_futuro?: boolean;
  data_vencimento?: string;
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
    valor_pago: number;
}

export const getDespesas = async (
  pagina = 1,
  limite = 10,
  termoBusca?: string
): Promise<IPaginatedResponse<IDespesa>> => {
    const response = await apiClient.get('/', {
        params: { pagina, limite, termoBusca },
    });
    return response.data;
};

// ✅ CORREÇÃO: A função de registro agora aceita a união dos tipos de payload
export const registrarDespesa = async (data: IDespesaForm | IDespesaFormAbatePayload): Promise<IDespesa | IDespesa[]> => {
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

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/financas` } );

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

export interface IDateFilter {
    startDate: string;
    endDate: string;
}

export interface IFinancasConsolidadasKPIs {
  receitasCaipirao: number;
  despesasCaipirao: number;
  receitasExternas: number;
  receitasPessoais: number; // NOVO
  despesasPessoais: number;
  receitaTotalConsolidada: number;
  despesaTotalConsolidada: number;
  saldoConsolidado: number;
}

export interface IDashboardConsolidadoResponse {
  kpis: IFinancasConsolidadasKPIs;
}

export interface IDespesaPorCategoria {
  name: string;
  value: number;
}

export interface IBalancoMensal {
  name: string;
  receitas: number;
  despesas: number;
}

export interface IAnaliseFinanceiraResponse {
  despesasPorCategoria: IDespesaPorCategoria[];
  balancoMensal: IBalancoMensal[];
}


// --- FUNÇÕES DO SERVIÇO ---

export const getDashboardConsolidado = async (filters: IDateFilter): Promise<IDashboardConsolidadoResponse> => {
  const response = await apiClient.get('/dashboard-consolidado', {
    params: filters,
  });
  return response.data;
};

export const getAnaliseFinanceira = async (filters: IDateFilter): Promise<IAnaliseFinanceiraResponse> => {
  const response = await apiClient.get('/analise-mensal', {
    params: filters,
  });
  return response.data;
};

const getPdf = async (url: string, params: any): Promise<Blob> => {
  const response = await apiClient.get(url, {
    params,
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

export const getReceitasPessoaisPdf = async (filters: IDateFilter): Promise<Blob> => {
  return getPdf('/report/receitas-pessoais/pdf', filters);
};

export const getDespesasPessoaisPdf = async (filters: IDateFilter): Promise<Blob> => {
  return getPdf('/report/despesas-pessoais/pdf', filters);
};

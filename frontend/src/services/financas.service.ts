// frontend/src/services/financas.service.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/financas` } );

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

export interface IFinancasConsolidadasKPIs {
  receitasCaipirao: number;
  despesasCaipirao: number;
  receitasExternas: number;
  receitaTotalConsolidada: number;
  saldoConsolidado: number;
}

export interface IDashboardConsolidadoResponse {
  kpis: IFinancasConsolidadasKPIs;
}

export interface IDateFilter {
    startDate: string;
    endDate: string;
}

// --- FUNÇÃO DO SERVIÇO ---

/**
 * @description Busca os dados consolidados para o dashboard financeiro.
 */
export const getDashboardConsolidado = async (filters: IDateFilter): Promise<IDashboardConsolidadoResponse> => {
  const response = await apiClient.get('/dashboard-consolidado', {
    params: filters,
  });
  return response.data;
};

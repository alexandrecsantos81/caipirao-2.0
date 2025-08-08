import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
} );

// --- INTERFACES ---
export interface IFinancialSummary {
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
}

export interface IProdutoMaisVendido {
  id: number;
  nome: string;
  total_vendido: number;
}

// Interface para os parâmetros de data
export interface IDateFilter {
    de?: string;
    ate?: string;
}

// --- FUNÇÕES DE SERVIÇO ---

/**
 * @description Busca o resumo financeiro, opcionalmente filtrado por data.
 * @param filter - Objeto com as datas 'de' e 'ate'.
 */
export const getFinancialSummary = async (filter: IDateFilter = {}): Promise<IFinancialSummary> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token de autenticação não encontrado.');
  }

  const response = await api.get('/reports/summary', {
    headers: { Authorization: `Bearer ${token}` },
    // Passa os filtros como query params
    params: filter,
  });

  return response.data;
};

/**
 * @description Busca a lista de produtos mais vendidos, opcionalmente filtrada por data.
 * @param filter - Objeto com as datas 'de' e 'ate'.
 */
export const getProdutosMaisVendidos = async (filter: IDateFilter = {}): Promise<IProdutoMaisVendido[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token de autenticação não encontrado.');
  }

  const response = await api.get('/reports/produtos-mais-vendidos', {
    headers: { Authorization: `Bearer ${token}` },
    // Passa os filtros como query params
    params: filter,
  });

  return response.data;
};

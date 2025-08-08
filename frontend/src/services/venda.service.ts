// frontend/src/services/venda.service.ts

import axios from 'axios';
import { IPaginatedResponse } from './cliente.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

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

interface IProdutoVenda {
  produto_id: number;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  valor_unitario: number;
  valor_total_item: number;
}

export interface IVenda {
  id: number;
  cliente_nome: string;
  usuario_nome: string;
  valor_total: number;
  data_venda: string;
  opcao_pagamento: 'À VISTA' | 'A PRAZO';
  data_vencimento: string;
  data_pagamento: string | null;
  produtos: IProdutoVenda[];
}

export interface INovaVenda {
  cliente_id: number;
  data_venda: string;
  opcao_pagamento: 'À VISTA' | 'A PRAZO';
  data_vencimento: string;
  produtos: {
    produto_id: number;
    quantidade: number;
    preco_manual?: number;
  }[];
}

// --- NOVA INTERFACE ---
// Interface para os dados de "Contas a Receber" que virão do backend
export interface IContaAReceber {
    id: number; // ID da movimentação/venda
    valor_total: number;
    data_vencimento: string;
    cliente_nome: string;
    cliente_telefone: string;
}


// --- FUNÇÕES DE SERVIÇO ---

export const getVendas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IVenda>> => {
  const response = await apiClient.get('/movimentacoes/vendas', { params: { pagina, limite } });
  return response.data;
};

export const createVenda = async (novaVenda: INovaVenda): Promise<IVenda> => {
  const response = await apiClient.post('/movimentacoes/vendas', novaVenda);
  return response.data;
};

// --- NOVA FUNÇÃO ---
/**
 * @description Busca a lista de contas a receber com vencimento nos próximos 5 dias.
 * @returns Uma promessa com um array de contas a receber.
 */
export const getContasAReceber = async (): Promise<IContaAReceber[]> => {
    const response = await apiClient.get('/movimentacoes/contas-a-receber');
    return response.data;
};

// --- NOVA FUNÇÃO ---
/**
 * @description Registra o pagamento de uma venda específica.
 * @param vendaId - O ID da venda que foi paga.
 * @returns Uma promessa com os dados da venda atualizada.
 */
export const registrarPagamento = async (vendaId: number): Promise<IVenda> => {
    // A data do pagamento será definida pelo backend como a data atual.
    const response = await apiClient.put(`/movimentacoes/vendas/${vendaId}/pagamento`);
    return response.data;
};

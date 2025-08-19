// frontend/src/services/venda.service.ts

import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL }    );

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

export interface IProdutoVenda {
  produto_id: number;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  valor_unitario: number;
  valor_total_item: number;
  preco_manual?: number;
}

export interface IVenda {
  id: number;
  cliente_id: number;
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

export interface IContaAReceber {
    id: number;
    valor_total: number;
    data_vencimento: string;
    cliente_nome: string;
    cliente_telefone: string;
}

// ✅ NOVA INTERFACE PARA O FORMULÁRIO DE QUITAÇÃO
export interface IQuitacaoVendaData {
    data_pagamento: string;
    valor_pago: number;
    responsavel_quitacao_id?: number;
}


// --- FUNÇÕES DE SERVIÇO ---

export const getVendas = async (
  pagina = 1,
  limite = 50,
  termoBusca?: string
): Promise<IPaginatedResponse<IVenda>> => {
  const response = await apiClient.get('/movimentacoes/vendas', {
    params: { pagina, limite, termoBusca },
  });
  return response.data;
};

export const createVenda = async (novaVenda: INovaVenda): Promise<IVenda> => {
  const response = await apiClient.post('/movimentacoes/vendas', novaVenda);
  return response.data;
};

export const updateVenda = async ({ id, data }: { id: number, data: INovaVenda }): Promise<IVenda> => {
  const response = await apiClient.put(`/movimentacoes/vendas/${id}`, data);
  return response.data;
};

export const deleteVenda = async (id: number): Promise<void> => {
  await apiClient.delete(`/movimentacoes/vendas/${id}`);
};

export const getContasAReceber = async (): Promise<IContaAReceber[]> => {
    const response = await apiClient.get('/movimentacoes/contas-a-receber');
    return response.data;
};

// ✅ FUNÇÃO ATUALIZADA PARA ENVIAR MAIS DADOS
export const registrarPagamento = async ({ vendaId, quitacaoData }: { vendaId: number, quitacaoData: IQuitacaoVendaData }): Promise<IVenda> => {
    const response = await apiClient.put(`/movimentacoes/vendas/${vendaId}/pagamento`, quitacaoData);
    return response.data;
};

export const getVendaPdf = async (vendaId: number): Promise<Blob> => {
  const response = await apiClient.get(`/movimentacoes/vendas/${vendaId}/pdf`, {
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

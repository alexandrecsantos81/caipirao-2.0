// frontend/src/services/report.service.ts

import { api } from '@/services/api'; // Usando o alias que configuramos

// --- INTERFACES (sem alterações) ---

export interface IReportDateFilter {
  startDate: string;
  endDate: string;
}

export interface IProductRankingFilter extends IReportDateFilter {
  orderBy: 'valor' | 'quantidade';
}

export interface ISalesSummaryKPIs {
  faturamentoTotal: number;
  pesoTotalVendido: number;
  totalTransacoes: number;
}

export interface ISalesEvolution {
  data: string;
  faturamento: number;
}

export interface ISalesSummaryResponse {
  kpis: ISalesSummaryKPIs;
  evolucaoVendas: ISalesEvolution[];
}

export interface IProductRankingItem {
  produtoId: number;
  nome: string;
  valorTotal: number;
  quantidadeTotal: number;
}

export interface IClientRankingItem {
  clienteId: number;
  nome: string;
  telefone: string;
  totalCompras: number;
  valorTotalGasto: number;
}

export interface IClientAnalysisItem {
  clienteId: number;
  nome: string;
  telefone: string;
  data_ultima_compra: string | null;
  status: 'Ativo' | 'Inativo';
}

export interface IClientAnalysisResponse {
  ativos: IClientAnalysisItem[];
  inativos: IClientAnalysisItem[];
}

export interface ISellerProductivityItem {
  vendedorId: number;
  nome: string;
  numeroDeVendas: number;
  valorTotalVendido: number;
}

export interface IStockEntryReportItem {
  id: number;
  data_entrada: string;
  produto_nome: string;
  responsavel_nome: string;
  quantidade_adicionada: number;
  custo_total: number;
  observacao: string | null;
}


// --- FUNÇÕES DE SERVIÇO (DADOS JSON) (sem alterações) ---

export const getSalesSummary = async (filter: IReportDateFilter): Promise<ISalesSummaryResponse> => {
  const response = await api.get('/reports/sales-summary', { params: filter });
  return response.data;
};

export const getProductRanking = async (filter: IProductRankingFilter): Promise<IProductRankingItem[]> => {
  const response = await api.get('/reports/product-ranking', { params: filter });
  return response.data;
};

export const getClientRanking = async (filter: IReportDateFilter): Promise<IClientRankingItem[]> => {
  const response = await api.get('/reports/client-ranking', { params: filter });
  return response.data;
};

export const getClientAnalysis = async (): Promise<IClientAnalysisResponse> => {
  const response = await api.get('/reports/client-analysis');
  return response.data;
};

export const getSellerProductivity = async (filter: IReportDateFilter): Promise<ISellerProductivityItem[]> => {
  const response = await api.get('/reports/seller-productivity', { params: filter });
  return response.data;
};

export const getStockEntriesReport = async (filter: IReportDateFilter): Promise<IStockEntryReportItem[]> => {
  const response = await api.get('/reports/stock-entries', { params: filter });
  return response.data;
};

// --- FUNÇÕES DE SERVIÇO (PDF) ---

const getPdf = async (url: string, params: any): Promise<Blob> => {
  const response = await api.get(url, {
    params,
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

export const getProductRankingPdf = async (filter: IProductRankingFilter): Promise<Blob> => {
  return getPdf('/reports/product-ranking/pdf', filter);
};

export const getClientRankingPdf = async (filter: IReportDateFilter): Promise<Blob> => {
  return getPdf('/reports/client-ranking/pdf', filter);
};

export const getSellerProductivityPdf = async (filter: IReportDateFilter): Promise<Blob> => {
  return getPdf('/reports/seller-productivity/pdf', filter);
};

export const getStockEntriesPdf = async (filter: IReportDateFilter): Promise<Blob> => {
  return getPdf('/reports/stock-entries/pdf', filter);
};

// =====================================================================
// NOVA FUNÇÃO PARA GERAR O COMPROVANTE DE VENDA
// =====================================================================
/**
 * @description Solicita a geração do PDF de um comprovante de venda.
 * @param vendaId O ID da venda para a qual o comprovante será gerado.
 * @returns Um Blob contendo o PDF.
 */
export const gerarComprovanteVendaPDF = async (vendaId: number): Promise<Blob> => {
  // A rota foi definida como '/venda/:id/pdf' no backend
  const response = await api.get(`/reports/venda/${vendaId}/pdf`, {
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

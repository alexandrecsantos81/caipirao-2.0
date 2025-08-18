// frontend/src/services/empresa.service.ts

import { api } from '@/services/api'; // Importa a instância do Axios configurada

// 1. Interface para tipar os dados da empresa.
// Garante que o frontend e o backend "falem a mesma língua".
export interface IEmpresaDados {
  id: number;
  nome_fantasia: string;
  razao_social?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco_completo?: string | null;
  logo_url?: string | null;
  data_atualizacao: string;
}

// O tipo para o formulário não precisa do 'id' ou 'data_atualizacao',
// pois eles são controlados pelo backend.
export type IEmpresaForm = Omit<IEmpresaDados, 'id' | 'data_atualizacao'>;


/**
 * @description Busca os dados da empresa no backend.
 * @returns Uma Promise que resolve para os dados da empresa.
 */
export const getEmpresaDados = async (): Promise<IEmpresaDados> => {
  try {
    // Faz uma requisição GET para o endpoint /api/empresa
    const response = await api.get<IEmpresaDados>('/empresa');
    return response.data;
  } catch (error: any) {
    // Lança um erro mais claro para ser capturado pelo React Query
    throw new Error(error.response?.data?.error || 'Falha ao buscar os dados da empresa.');
  }
};

/**
 * @description Salva (atualiza) os dados da empresa no backend.
 * @param empresaData - Os dados do formulário a serem salvos.
 * @returns Uma Promise que resolve para os dados atualizados da empresa.
 */
export const updateEmpresaDados = async (empresaData: IEmpresaForm): Promise<IEmpresaDados> => {
  try {
    // Faz uma requisição PUT para o endpoint /api/empresa, enviando os novos dados
    const response = await api.put<IEmpresaDados>('/empresa', empresaData);
    return response.data;
  } catch (error: any) {
    // Lança um erro mais claro para ser capturado pelo React Query
    throw new Error(error.response?.data?.error || 'Falha ao salvar os dados da empresa.');
  }
};

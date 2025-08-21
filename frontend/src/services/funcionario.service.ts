import { api } from '@/services/api';
import { IPaginatedResponse } from '@/types/common.types';

// --- INTERFACES ---

export interface IFuncionario {
  id: number;
  nome: string;
  cpf?: string | null;
  funcao?: string | null;
  status: 'ATIVO' | 'INATIVO';
  data_criacao?: string;
}

export type IFuncionarioForm = Omit<IFuncionario, 'id' | 'data_criacao'>;

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista paginada de funcionários.
 * @param pagina - O número da página a ser buscada.
 * @param limite - O número de itens por página.
 * @param termoBusca - (Opcional) O termo para filtrar os resultados.
 * @param status - (Opcional) Filtra por status 'ATIVO' ou 'INATIVO'.
 */
export const getFuncionarios = async (
  pagina = 1,
  limite = 10,
  termoBusca?: string,
  status?: 'ATIVO' | 'INATIVO' | '' // O tipo permite string vazia
): Promise<IPaginatedResponse<IFuncionario>> => {
  
  // ✅ CORREÇÃO APLICADA AQUI
  const params: { [key: string]: any } = {
    pagina,
    limite,
  };

  // Adiciona o termo de busca aos parâmetros apenas se ele existir
  if (termoBusca) {
    params.termoBusca = termoBusca;
  }

  // Adiciona o status aos parâmetros apenas se for 'ATIVO' ou 'INATIVO'
  if (status === 'ATIVO' || status === 'INATIVO') {
    params.status = status;
  }
  // Se 'status' for uma string vazia ou undefined, ele não será incluído na URL.

  const response = await api.get('/funcionarios', { params });
  return response.data;
};

/**
 * @description Cria um novo funcionário.
 */
export const createFuncionario = async (data: IFuncionarioForm): Promise<IFuncionario> => {
  const response = await api.post('/funcionarios', data);
  return response.data;
};

/**
 * @description Atualiza os dados de um funcionário existente.
 */
export const updateFuncionario = async ({ id, data }: { id: number, data: IFuncionarioForm }): Promise<IFuncionario> => {
  const response = await api.put(`/funcionarios/${id}`, data);
  return response.data;
};

/**
 * @description Deleta um funcionário.
 */
export const deleteFuncionario = async (id: number): Promise<void> => {
  await api.delete(`/funcionarios/${id}`);
};

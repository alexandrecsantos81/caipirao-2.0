// frontend/src/services/despesas.service.ts

// 1. Importar o Axios diretamente da biblioteca
import axios from 'axios';

// 2. Configurar a instância do Axios AQUI MESMO
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Verifique se esta é a URL base correta da sua API
} );


// --- O RESTANTE DO CÓDIGO PERMANECE O MESMO ---

// Interface para definir a estrutura de uma Despesa
export interface IDespesa {
  id: number;
  descricao: string;
  valor_total: number;
  data_movimentacao: string;
  usuario_nome?: string;
}

// Interface para os dados de criação de uma nova despesa
export interface ICreateDespesa {
  descricao: string;
  valor_total: number;
}

// Função auxiliar para obter o token diretamente do localStorage
const getAuthToken = (): string | null => {
  // IMPORTANTE: Verifique se a chave do token no seu localStorage é 'authToken'
  return localStorage.getItem('token'); 
};

/**
 * @description Busca a lista de todas as despesas no backend.
 */
export const getDespesas = async (): Promise<IDespesa[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Token de autenticação não encontrado no localStorage.');
  }

  const response = await api.get('/movimentacoes/despesas', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

/**
 * @description Envia os dados de uma nova despesa para o backend.
 */
export const createDespesa = async (despesaData: ICreateDespesa): Promise<IDespesa> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Token de autenticação não encontrado no localStorage.');
  }

  const response = await api.post('/movimentacoes/despesas', despesaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

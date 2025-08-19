import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_URL } );

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERFACES ---

export interface ICliente {
  id: number;
  nome: string;
  email?: string;
  telefone: string;
  coordenada_x?: number;
  coordenada_y?: number;
  responsavel?: string;
  endereco?: string;
  tem_whatsapp?: boolean;
  status?: 'Ativo' | 'Inativo';
}

export type IClienteForm = Omit<ICliente, 'id' | 'status'>;

export interface IHistoricoVenda {
  id: number;
  data_venda: string;
  valor_total: number;
  opcao_pagamento: 'À VISTA' | 'A PRAZO';
  data_pagamento: string | null;
  produtos: {
    nome: string;
    quantidade: number;
    unidade_medida: string;
    valor_unitario: number;
  }[];
}


// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista paginada de clientes, com suporte a filtro de busca.
 * @param pagina - O número da página a ser buscada.
 * @param limite - O número de itens por página.
 * @param termoBusca - (Opcional) O termo para filtrar os resultados.
 */
export const getClientes = async (
  pagina = 1,
  limite = 10,
  // ✅ INÍCIO DA MODIFICAÇÃO: Adicionando o novo parâmetro opcional
  termoBusca?: string
  // ✅ FIM DA MODIFICAÇÃO
): Promise<IPaginatedResponse<ICliente>> => {
  const response = await api.get('/clientes', {
    params: {
      pagina,
      limite,
      // ✅ INÍCIO DA MODIFICAÇÃO: Enviando o parâmetro para a API se ele existir
      termoBusca,
      // ✅ FIM DA MODIFICAÇÃO
    },
  });
  return response.data;
};

export const createCliente = async (clienteData: IClienteForm): Promise<ICliente> => {
  const response = await api.post('/clientes', clienteData);
  return response.data;
};

export const updateCliente = async (id: number, clienteData: Partial<IClienteForm>): Promise<ICliente> => {
  const response = await api.put(`/clientes/${id}`, clienteData);
  return response.data;
};

export const deleteCliente = async (id: number): Promise<void> => {
  await api.delete(`/clientes/${id}`);
};

export const getHistoricoVendas = async (clienteId: number): Promise<IHistoricoVenda[]> => {
  const response = await api.get(`/clientes/${clienteId}/historico`);
  return response.data;
};

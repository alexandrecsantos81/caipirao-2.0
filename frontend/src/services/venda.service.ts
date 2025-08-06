// frontend/src/services/venda.service.ts

// Obtém o token do localStorage para autenticação
const getToken = () => localStorage.getItem('token');

// Define a URL base da nossa API
const API_URL = 'http://localhost:3001/api/movimentacoes';

// Interface para definir a estrutura de uma Venda (Movimentação de Entrada )
export interface Venda {
  id: number;
  cliente_nome: string;
  usuario_nome: string;
  valor_total: number;
  data: string;
  produtos: { produto_id: number; quantidade: number; valor_unitario: number }[];
}

// Interface para os dados necessários para criar uma nova venda
export interface NovaVenda {
  cliente_id: number;
  valor_total: number;
  produtos: { produto_id: number; quantidade: number; valor_unitario: number }[];
}

// Função para buscar todas as vendas
export const getVendas = async (): Promise<Venda[]> => {
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar vendas.');
  }
  return response.json();
};

// Função para criar uma nova venda
export const createVenda = async (novaVenda: NovaVenda): Promise<Venda> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(novaVenda),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao registrar a venda.');
  }
  return response.json();
};

// Função para deletar uma venda
export const deleteVenda = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao deletar a venda.');
  }
  return response.json();
};

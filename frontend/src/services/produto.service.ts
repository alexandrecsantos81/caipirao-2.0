// frontend/src/services/produto.service.ts

import axios from 'axios';

// Define a URL base da sua API.
// É uma boa prática usar variáveis de ambiente para isso.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cria uma instância do axios com a URL base e configurações padrão.
const apiClient = axios.create({
  baseURL: API_URL,
} );

// Adiciona um interceptor para incluir o token JWT em todas as requisições.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Define a interface para o tipo 'Produto', garantindo a tipagem.
export interface IProduto {
  id: number;
  nome: string;
  descricao?: string; // Opcional
  preco: number; // ou string, dependendo de como você trata no frontend
  estoque?: number; // Opcional
  criado_em?: string; // Data de criação, opcional no frontend
}

// --- Funções do Serviço de Produtos ---

/**
 * Busca todos os produtos da API.
 * @returns Uma promessa com a lista de produtos.
 */
export const getProdutos = async (): Promise<IProduto[]> => {
  const response = await apiClient.get('/produtos');
  return response.data;
};

/**
 * Cria um novo produto.
 * @param produtoData - Os dados do produto a ser criado (sem o id).
 * @returns Uma promessa com o produto recém-criado.
 */
export const createProduto = async (produtoData: Omit<IProduto, 'id'>): Promise<IProduto> => {
  const response = await apiClient.post('/produtos', produtoData);
  return response.data;
};

/**
 * Atualiza um produto existente.
 * @param id - O ID do produto a ser atualizado.
 * @param produtoData - Os novos dados do produto.
 * @returns Uma promessa com o produto atualizado.
 */
export const updateProduto = async (id: number, produtoData: Omit<IProduto, 'id'>): Promise<IProduto> => {
  const response = await apiClient.put(`/produtos/${id}`, produtoData);
  return response.data;
};

/**
 * Deleta um produto.
 * @param id - O ID do produto a ser deletado.
 * @returns Uma promessa vazia.
 */
export const deleteProduto = async (id: number): Promise<void> => {
  await apiClient.delete(`/produtos/${id}`);
};

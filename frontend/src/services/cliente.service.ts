// frontend/src/services/cliente.service.ts

import axios from 'axios';

// Define a URL base da nossa API.
// Em desenvolvimento, será http://localhost:3001/api
// Em produção, será o endereço do seu servidor.
const API_URL = 'http://localhost:3001/api';

// Cria uma instância do axios com a URL base e headers padrão
const api = axios.create({
  baseURL: API_URL,
} );

// Adiciona um "interceptor" para incluir o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Futuramente, pegaremos o token do localStorage após o login
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

// Interface para o tipo Cliente (pode ser movida para um arquivo de tipos depois)
export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  coordenada_x?: number;
  coordenada_y?: number;
}

// Funções para cada operação do CRUD

// READ (GET all)
export const getClientes = async (): Promise<Cliente[]> => {
  const response = await api.get('/clientes');
  return response.data;
};

// CREATE (POST)
// Omitimos o 'id' pois ele é gerado pelo banco de dados
export const createCliente = async (clienteData: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const response = await api.post('/clientes', clienteData);
  return response.data;
};

// UPDATE (PUT)
export const updateCliente = async (id: number, clienteData: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const response = await api.put(`/clientes/${id}`, clienteData);
  return response.data;
};

// DELETE (DELETE)
export const deleteCliente = async (id: number): Promise<void> => {
  await api.delete(`/clientes/${id}`);
};

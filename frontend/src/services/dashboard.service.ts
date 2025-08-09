import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/dashboard` } );

// Interceptor para adicionar o token de autenticação em todas as chamadas
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

// Interface para os dados dos cards (KPIs)
export interface IKPIs {
  totalVendasMes: number;
  totalDespesasMes: number;
  saldoMes: number;
  totalContasAReceber: number;
  totalContasAPagar: number;
  novosClientesMes: number;
}

// Interface para os dados do gráfico de vendas
export interface IVendasPorDia {
  dia: string;  // Formatado como "DD/MM"
  total: number;
}


// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca os KPIs (Key Performance Indicators) para os cards do dashboard.
 * @returns Uma promessa com o objeto de KPIs.
 */
export const getKPIs = async (): Promise<IKPIs> => {
  const response = await apiClient.get('/kpis');
  return response.data;
};

/**
 * @description Busca os dados de vendas agregados por dia para o gráfico.
 * @returns Uma promessa com um array de dados de vendas diárias.
 */
export const getVendasPorDia = async (): Promise<IVendasPorDia[]> => {
  const response = await apiClient.get('/vendas-por-dia');
  return response.data;
};

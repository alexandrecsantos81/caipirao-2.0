// frontend/src/types/common.types.ts

/**
 * Interface genérica para respostas paginadas da API.
 * Usada por Clientes, Produtos, Vendas, etc.
 */
export interface IPaginatedResponse<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

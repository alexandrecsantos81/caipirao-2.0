// frontend/src/types/empresa.types.ts

export interface IEmpresaDados {
  id?: number; // O ID é opcional, pois não o enviamos ao criar/atualizar
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual: string;
  telefone: string;
  endereco_completo: string;
  logo_url?: string; // O logo também é opcional
  data_atualizacao?: string;
}

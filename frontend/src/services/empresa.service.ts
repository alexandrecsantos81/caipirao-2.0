// frontend/src/services/empresa.service.ts

import { api } from '@/services/api';
import { IEmpresaDados } from '@/types/empresa.types';

/**
 * @description Busca os dados da empresa do backend.
 */
export const getEmpresaData = async (): Promise<IEmpresaDados> => {
  const response = await api.get('/empresa');
  return response.data;
};

/**
 * @description Envia os dados atualizados do formulário da empresa para o backend.
 * @param data Os dados do formulário.
 */
export const updateEmpresaData = async (data: IEmpresaDados): Promise<IEmpresaDados> => {
  const response = await api.put('/empresa', data);
  return response.data;
};

// ✅ NOVA FUNÇÃO DE UPLOAD
/**
 * @description Envia o arquivo do logo para o backend.
 * @param logoFile O arquivo de imagem selecionado pelo usuário.
 * @returns A URL do novo logo salvo.
 */
export const uploadLogoEmpresa = async (logoFile: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  // O nome 'logo' deve ser o mesmo usado no backend: upload.single('logo')
  formData.append('logo', logoFile);

  const response = await api.post('/empresa/upload-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

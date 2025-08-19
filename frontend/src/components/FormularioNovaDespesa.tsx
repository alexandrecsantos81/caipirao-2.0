import {
  Button,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormErrorMessage, FormLabel, Input, Select, Textarea, VStack,
  useToast,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { IDespesa, IDespesaForm, registrarDespesa, updateDespesa } from '../services/despesa.service';
import { getFornecedores, IFornecedor } from '../services/fornecedor.service';
import { IPaginatedResponse } from '@/types/common.types';

// --- LISTA DE OPÇÕES PARA O FORMULÁRIO DE DESPESA ---
const tiposDeSaida = [
    "Compra de Aves",
    "Insumos de Produção", 
    "Mão de Obra", 
    "Materiais e Embalagens",
    "Despesas Operacionais", 
    "Encargos e Tributos", 
    "Despesas Administrativas",
    "Financeiras", 
    "Remuneração de Sócios", 
    "Outros"
] as const;

interface FormularioNovaDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  despesaParaEditar: IDespesa | null;
}

export const FormularioNovaDespesa = ({ isOpen, onClose, despesaParaEditar }: FormularioNovaDespesaProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IDespesaForm>();
  
  const { data: fornecedores } = useQuery<IPaginatedResponse<IFornecedor>, Error, IFornecedor[]>({ 
    queryKey: ['todosFornecedores'], 
    queryFn: () => getFornecedores(1, 1000), 
    enabled: isOpen, 
    select: data => data.dados 
  });
  
  const mutation = useMutation({
    mutationFn: (data: { despesaData: IDespesaForm, id?: number }) =>
      data.id ? updateDespesa({ id: data.id, data: data.despesaData }) : registrarDespesa(data.despesaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: `Despesa ${despesaParaEditar ? 'atualizada' : 'registrada'}!`, status: "success", duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar despesa", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (despesaParaEditar) {
        reset({
          ...despesaParaEditar,
          data_compra: despesaParaEditar.data_compra.split('T')[0],
          data_vencimento: despesaParaEditar.data_vencimento.split('T')[0],
        });
      } else {
        reset({
          discriminacao: '', tipo_saida: '', valor: '',
          data_compra: new Date().toISOString().split('T')[0],
          data_vencimento: new Date().toISOString().split('T')[0],
          fornecedor_id: undefined,
        });
      }
    }
  }, [isOpen, despesaParaEditar, reset]);

  const onSubmit: SubmitHandler<IDespesaForm> = (data) => {
    const finalData = { ...data, valor: Number(data.valor), fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : null };
    mutation.mutate({ despesaData: finalData, id: despesaParaEditar?.id });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">{despesaParaEditar ? 'Editar Despesa' : 'Registrar Nova Despesa'}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.tipo_saida}>
                <FormLabel>Tipo de Saída</FormLabel>
                <Select placeholder="Selecione o tipo da despesa" {...register('tipo_saida', { required: 'Tipo é obrigatório' })}>
                  {tiposDeSaida.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </Select>
                <FormErrorMessage>{errors.tipo_saida?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.valor}>
                <FormLabel>Valor (R$)</FormLabel>
                <Input
                  placeholder="Ex: 852.50"
                  type="text"
                  inputMode="decimal"
                  {...register('valor', {
                    required: 'Valor é obrigatório',
                    valueAsNumber: true,
                    validate: {
                      isNumber: (value) => !isNaN(parseFloat(String(value))) || 'Por favor, insira um valor numérico válido.',
                      isPositive: (value) => parseFloat(String(value)) > 0 || 'O valor deve ser maior que zero.'
                    }
                  })}
                />
                <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.discriminacao}><FormLabel>Discriminação (Detalhes)</FormLabel><Textarea placeholder="Detalhes da despesa..." {...register('discriminacao', { required: 'A descrição é obrigatória' })} /><FormErrorMessage>{errors.discriminacao?.message}</FormErrorMessage></FormControl>
              
              <FormControl isRequired isInvalid={!!errors.data_compra}>
                <FormLabel>Data da Compra</FormLabel>
                <Input type="date" {...register('data_compra', { required: 'Data da compra é obrigatória' })} />
                <FormErrorMessage>{errors.data_compra?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.data_vencimento}><FormLabel>Data de Vencimento</FormLabel><Input type="date" {...register('data_vencimento', { required: 'Data de vencimento é obrigatória' })} /><FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage></FormControl>
              <FormControl><FormLabel>Fornecedor/Credor (Opcional)</FormLabel><Select placeholder="Selecione um fornecedor" {...register('fornecedor_id')}>{fornecedores?.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</Select></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px"><Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="red" type="submit" isLoading={mutation.isPending}>Salvar Despesa</Button></DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

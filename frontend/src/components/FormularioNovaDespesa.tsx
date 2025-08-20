import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useBreakpointValue,
  Select,
  Textarea,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IDespesa, IDespesaForm } from '../services/despesa.service';
import { getFornecedores, IFornecedor } from '../services/fornecedor.service';
import { IPaginatedResponse } from '@/types/common.types';

// Lista de tipos de saída permitidos para o formulário
const tiposDeSaida = [
    "Compra de Aves", "Insumos de Produção", "Mão de Obra", "Materiais e Embalagens",
    "Despesas Operacionais", "Encargos e Tributos", "Despesas Administrativas",
    "Financeiras", "Remuneração de Sócios", "Outros"
] as const;

// Interfaces para as props do componente
interface FormularioNovaDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  despesaParaEditar: IDespesa | null;
  onSave: (data: IDespesaForm, id?: number) => void;
  isLoading: boolean;
}

export const FormularioNovaDespesa = ({ isOpen, onClose, despesaParaEditar, onSave, isLoading }: FormularioNovaDespesaProps) => {
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IDespesaForm>();
  
  // Busca a lista de fornecedores para preencher o select
  const { data: fornecedores } = useQuery<IPaginatedResponse<IFornecedor>, Error, IFornecedor[]>({ 
    queryKey: ['todosFornecedores'], 
    queryFn: () => getFornecedores(1, 1000), 
    enabled: isOpen, 
    select: data => data.dados 
  });
  
  // Efeito para preencher ou limpar o formulário quando ele é aberto/fechado ou quando uma despesa é selecionada para edição
  useEffect(() => {
    if (isOpen) {
      if (despesaParaEditar) {
        // Se está editando, preenche o formulário com os dados existentes
        reset({
          ...despesaParaEditar,
          data_compra: despesaParaEditar.data_compra.split('T')[0],
          data_vencimento: despesaParaEditar.data_vencimento.split('T')[0],
        });
      } else {
        // Se está criando uma nova, reseta para os valores padrão
        reset({
          discriminacao: '', tipo_saida: '', valor: '',
          data_compra: new Date().toISOString().split('T')[0],
          data_vencimento: new Date().toISOString().split('T')[0],
          fornecedor_id: undefined,
        });
      }
    }
  }, [isOpen, despesaParaEditar, reset]);

  // Função chamada ao submeter o formulário
  const onSubmit: SubmitHandler<IDespesaForm> = (data) => {
    const finalData = { 
      ...data, 
      valor: Number(data.valor), 
      fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : null 
    };
    onSave(finalData, despesaParaEditar?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      {/* ✅ CORREÇÃO ESTRUTURAL APLICADA AQUI */}
      <DrawerContent 
        as="form" 
        onSubmit={handleSubmit(onSubmit)} 
        display="flex" 
        flexDirection="column" 
        h={{ base: "100vh", md: "auto" }} // Ocupa a tela inteira no mobile
      >
        <DrawerHeader borderBottomWidth="1px">
          {despesaParaEditar ? 'Editar Despesa' : 'Registrar Nova Despesa'}
        </DrawerHeader>
        <DrawerCloseButton />
        
        {/* O DrawerBody agora é flexível e rolável */}
        <DrawerBody flex="1" overflowY="auto">
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

            <FormControl isRequired isInvalid={!!errors.discriminacao}>
              <FormLabel>Discriminação (Detalhes)</FormLabel>
              <Textarea placeholder="Detalhes da despesa..." {...register('discriminacao', { required: 'A descrição é obrigatória' })} />
              <FormErrorMessage>{errors.discriminacao?.message}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.data_compra}>
              <FormLabel>Data da Compra</FormLabel>
              <Input type="date" {...register('data_compra', { required: 'Data da compra é obrigatória' })} />
              <FormErrorMessage>{errors.data_compra?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.data_vencimento}>
              <FormLabel>Data de Vencimento</FormLabel>
              <Input type="date" {...register('data_vencimento', { required: 'Data de vencimento é obrigatória' })} />
              <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Fornecedor/Credor (Opcional)</FormLabel>
              <Select placeholder="Selecione um fornecedor" {...register('fornecedor_id')}>
                {fornecedores?.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </Select>
            </FormControl>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="red" type="submit" isLoading={isLoading}>Salvar Despesa</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

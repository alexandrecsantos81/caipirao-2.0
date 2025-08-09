import {
  Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormErrorMessage, FormLabel, Input, Select, Textarea, VStack, useToast, HStack
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { IDespesaForm, registrarDespesa, tiposDeSaida } from '../services/despesa.service';
import { getFornecedores, IFornecedor } from '../services/fornecedor.service';

// --- INTERFACE PARA AS PROPS DO COMPONENTE ---
interface FormularioDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFornecedorForm: () => void; // Função para abrir o formulário de fornecedor
}

// --- COMPONENTE PRINCIPAL ---
const FormularioDespesa = ({ isOpen, onClose, onOpenFornecedorForm }: FormularioDespesaProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<IDespesaForm>();

  // Observa o valor do dropdown de fornecedor
  const fornecedorSelecionado = watch('fornecedor_id');

  // Busca a lista de fornecedores para o dropdown
  const { data: fornecedores, isLoading: isLoadingFornecedores } = useQuery<IFornecedor[]>({
    queryKey: ['fornecedores'],
    queryFn: getFornecedores,
    // A query só será executada se o drawer estiver aberto
    enabled: isOpen,
  });

  // Mutação para registrar a despesa
  const mutation = useMutation({
    mutationFn: registrarDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] }); // Invalida a query do dashboard
      toast({ title: 'Despesa registrada com sucesso!', status: 'success' });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const onSubmit: SubmitHandler<IDespesaForm> = (data) => {
    // Converte o valor para número e garante que o fornecedor_id seja um número ou nulo
    const finalData = { 
      ...data, 
      valor: Number(data.valor),
      fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : null,
    };
    mutation.mutate(finalData);
  };

  // Handler para o dropdown de fornecedor
  const handleFornecedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'CADASTRAR_NOVO') {
      // Abre o formulário de fornecedor e reseta a seleção
      onOpenFornecedorForm();
      setValue('fornecedor_id', undefined); 
    } else {
      // O valor do <option> já é uma string, então registramos como está
      setValue('fornecedor_id', Number(value));
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={() => { reset(); onClose(); }} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">Registrar Nova Despesa</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.tipo_saida}>
                <FormLabel>Tipo de Saída</FormLabel>
                <Select placeholder="Selecione o tipo" {...register('tipo_saida', { required: 'Tipo é obrigatório' })}>
                  {tiposDeSaida.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </Select>
                <FormErrorMessage>{errors.tipo_saida?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.valor}>
                <FormLabel>Valor (R$)</FormLabel>
                <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} />
                <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.discriminacao}>
                <FormLabel>Discriminação</FormLabel>
                <Textarea {...register('discriminacao', { required: 'A discriminação é obrigatória' })} placeholder="Detalhes da despesa (ex: compra de limões, pagamento de frete)..." />
                <FormErrorMessage>{errors.discriminacao?.message}</FormErrorMessage>
              </FormControl>

              <HStack w="100%">
                <FormControl isRequired isInvalid={!!errors.data_vencimento}>
                  <FormLabel>Vencimento</FormLabel>
                  <Input type="date" {...register('data_vencimento', { required: 'Data de vencimento é obrigatória' })} />
                  <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Fornecedor/Credor</FormLabel>
                <Select
                  placeholder={isLoadingFornecedores ? "Carregando..." : "Selecione um fornecedor"}
                  {...register('fornecedor_id')}
                  onChange={handleFornecedorChange}
                  value={fornecedorSelecionado || ''}
                  disabled={isLoadingFornecedores}
                >
                  {fornecedores?.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  <option value="CADASTRAR_NOVO" style={{ color: 'teal', fontWeight: 'bold' }}>
                    + Cadastrar Novo Fornecedor
                  </option>
                </Select>
              </FormControl>

            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={mutation.isPending}>Salvar Despesa</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default FormularioDespesa;

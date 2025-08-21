import { 
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, 
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, useBreakpointValue, Select, 
  Textarea, useToast, Box, Heading, IconButton, NumberInput, NumberInputField, 
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Checkbox, Collapse, 
} from '@chakra-ui/react';
import { useForm, SubmitHandler, useFieldArray, Controller, UseFormReturn, FieldErrors } from 'react-hook-form';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { IDespesa, IDespesaForm, IDespesaFormAbatePayload, registrarDespesa, updateDespesa, tiposDeSaida } from '../services/despesa.service';
import { getFornecedores, IFornecedor } from '../services/fornecedor.service';
import { getFuncionarios, IFuncionario } from '../services/funcionario.service';
import { IPaginatedResponse } from '@/types/common.types';

// --- Interfaces --- 
interface FormularioNovaDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  despesaParaEditar: IDespesa | null;
}

interface FormValues {
  tipo_saida: typeof tiposDeSaida[number] | '';
  data_compra: string;
  valor?: number | string;
  discriminacao?: string;
  data_vencimento?: string;
  fornecedor_id?: number | null;
  pagamentos?: {
    funcionario_id: number;
    valor: number;
    discriminacao: string;
  }[];
  pagamento_futuro?: boolean;
}

// --- Componente Principal ---
export const FormularioNovaDespesa = ({ isOpen, onClose, despesaParaEditar }: FormularioNovaDespesaProps) => {
  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      tipo_saida: '',
      data_compra: new Date().toISOString().split('T')[0],
      pagamento_futuro: false,
      pagamentos: [],
    }
  });

  const watchTipoSaida = watch("tipo_saida");

  const mutation = useMutation({
    mutationFn: (data: { formData: IDespesaForm | IDespesaFormAbatePayload, id?: number }) => 
      data.id 
        ? updateDespesa({ id: data.id, data: data.formData as IDespesaForm }) 
        : registrarDespesa(data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: `Despesa ${despesaParaEditar ? 'atualizada' : 'registrada'} com sucesso!`, status: 'success' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  useEffect(() => {
    if (!isOpen) {
      reset({
        tipo_saida: '',
        data_compra: new Date().toISOString().split('T')[0],
        pagamento_futuro: false,
        pagamentos: [],
        discriminacao: '',
        valor: '',
      });
    } else if (despesaParaEditar) {
      reset({
        ...despesaParaEditar,
        data_compra: despesaParaEditar.data_compra.split('T')[0],
        data_vencimento: despesaParaEditar.data_vencimento.split('T')[0],
      });
    }
  }, [isOpen, despesaParaEditar, reset]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (data.tipo_saida === 'ABATE') {
      const finalData: IDespesaFormAbatePayload = {
        tipo_saida: 'ABATE',
        data_compra: data.data_compra,
        pagamentos: (data.pagamentos || []).map(p => ({ ...p, valor: Number(p.valor) })),
        pagamento_futuro: data.pagamento_futuro,
        data_vencimento: data.pagamento_futuro ? data.data_vencimento : data.data_compra,
      };
      mutation.mutate({ formData: finalData });
    } else {
      const despesaNormal: IDespesaForm = {
        tipo_saida: data.tipo_saida as Exclude<typeof tiposDeSaida[number], 'ABATE'>,
        valor: Number(data.valor),
        discriminacao: data.discriminacao || '',
        data_compra: data.data_compra,
        data_vencimento: data.data_vencimento || data.data_compra,
        fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : null,
      };
      mutation.mutate({ formData: despesaNormal, id: despesaParaEditar?.id });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">
          {despesaParaEditar ? 'Editar Despesa' : 'Registrar Nova Despesa'}
        </DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.tipo_saida}>
              <FormLabel>Tipo de Saída</FormLabel>
              <Select
                placeholder="Selecione o tipo da despesa"
                {...register('tipo_saida', { required: 'Tipo é obrigatório' })}
                isDisabled={!!despesaParaEditar}
              >
                {tiposDeSaida.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.tipo_saida?.message}</FormErrorMessage>
            </FormControl>

            {/* Renderização condicional dos formulários */}
            {watchTipoSaida === 'ABATE' && (
              <FormularioAbate 
                control={control} 
                register={register} 
                errors={errors} 
                watch={watch}
              />
            )}
            {watchTipoSaida && watchTipoSaida !== 'ABATE' && (
              <FormularioNormal 
                register={register} 
                errors={errors} 
              />
            )}
          
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="red" type="submit" isLoading={mutation.isPending}>Salvar Despesa</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// --- Sub-componente para o Formulário de Abate ---
interface FormularioAbateProps {
  control: UseFormReturn<FormValues>['control'];
  register: UseFormReturn<FormValues>['register'];
  errors: FieldErrors<FormValues>;
  watch: UseFormReturn<FormValues>['watch'];
}

const FormularioAbate = ({ control, register, errors, watch }: FormularioAbateProps) => {
  const { fields, append, remove } = useFieldArray({ control, name: "pagamentos" });
  const isPagamentoFuturo = watch("pagamento_futuro");

  const { data: funcionariosData } = useQuery<IPaginatedResponse<IFuncionario>>({
    queryKey: ['todosFuncionariosAtivos'],
    queryFn: () => getFuncionarios(1, 1000, '', 'ATIVO'),
  });

  return (
    <Box w="full">
      <FormControl isRequired isInvalid={!!errors.data_compra} mt={4}>
        <FormLabel>Data da Competência</FormLabel>
        <Input type="date" {...register('data_compra', { required: true })} />
      </FormControl>

      <FormControl display="flex" alignItems="center" mt={4}>
        <FormLabel htmlFor="pagamento-futuro-check" mb="0">
          Agendar pagamento para data futura?
        </FormLabel>
        <Controller
          name="pagamento_futuro"
          control={control}
          render={({ field }) => (
            <Checkbox id="pagamento-futuro-check" isChecked={field.value} onChange={field.onChange} />
          )}
        />
      </FormControl>

      <Collapse in={isPagamentoFuturo} animateOpacity style={{ width: '100%' }}>
        <FormControl isRequired={isPagamentoFuturo} isInvalid={!!errors.data_vencimento} mt={2}>
          <FormLabel>Data do Vencimento</FormLabel>
          <Input type="date" {...register('data_vencimento', { required: isPagamentoFuturo })} />
          <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
        </FormControl>
      </Collapse>

      <Heading size="md" mt={6} mb={4}>Lançamento de Pagamentos de Abate</Heading>
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Funcionário</Th>
              <Th>Valor a Pagar</Th>
              <Th>Discriminação</Th>
              <Th>Ação</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fields.map((item, index) => (
              <Tr key={item.id}>
                <Td p={1} verticalAlign="top">
                  <FormControl isInvalid={!!errors.pagamentos?.[index]?.funcionario_id}>
                    <Select {...register(`pagamentos.${index}.funcionario_id` as const, { required: "Selecione um funcionário", valueAsNumber: true, validate: v => v > 0 || "Inválido" })}>
                      <option value="">Selecione</option>
                      {funcionariosData?.dados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </Select>
                    <FormErrorMessage>{errors.pagamentos?.[index]?.funcionario_id?.message}</FormErrorMessage>
                  </FormControl>
                </Td>
                <Td p={1} verticalAlign="top">
                  <FormControl isInvalid={!!errors.pagamentos?.[index]?.valor}>
                    <NumberInput>
                      <NumberInputField {...register(`pagamentos.${index}.valor` as const, { required: "Valor é obrigatório", valueAsNumber: true, validate: v => v > 0 || "Inválido" })} placeholder="R$" />
                    </NumberInput>
                    <FormErrorMessage>{errors.pagamentos?.[index]?.valor?.message}</FormErrorMessage>
                  </FormControl>
                </Td>
                <Td p={1} verticalAlign="top">
                  <FormControl isInvalid={!!errors.pagamentos?.[index]?.discriminacao}>
                    <Input {...register(`pagamentos.${index}.discriminacao` as const, { required: "Discriminação é obrigatória" })} />
                    <FormErrorMessage>{errors.pagamentos?.[index]?.discriminacao?.message}</FormErrorMessage>
                  </FormControl>
                </Td>
                <Td p={1} verticalAlign="top">
                  <IconButton aria-label="Remover" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => remove(index)} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Button mt={4} leftIcon={<FiPlus />} onClick={() => append({ funcionario_id: 0, valor: 0, discriminacao: 'PAGAMENTO ABATE' })}> 
        Adicionar Funcionário
      </Button>
    </Box>
  );
};

// --- Sub-componente para o Formulário Normal ---
interface FormularioNormalProps {
  register: UseFormReturn<FormValues>['register'];
  errors: FieldErrors<FormValues>;
}

const FormularioNormal = ({ register, errors }: FormularioNormalProps) => {
  const { data: fornecedoresData } = useQuery<IPaginatedResponse<IFornecedor>>({
    queryKey: ['todosFornecedores'],
    queryFn: () => getFornecedores(1, 1000),
  });

  return (
    <>
      <FormControl isRequired isInvalid={!!errors.valor}>
        <FormLabel>Valor (R$)</FormLabel>
        <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} />
        <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isRequired isInvalid={!!errors.discriminacao}>
        <FormLabel>Discriminação</FormLabel>
        <Textarea {...register('discriminacao', { required: 'A discriminação é obrigatória' })} />
        <FormErrorMessage>{errors.discriminacao?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isRequired isInvalid={!!errors.data_compra}>
        <FormLabel>Data da Compra</FormLabel>
        <Input type="date" {...register('data_compra', { required: true })} />
        <FormErrorMessage>{errors.data_compra?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isRequired isInvalid={!!errors.data_vencimento}>
        <FormLabel>Data de Vencimento</FormLabel>
        <Input type="date" {...register('data_vencimento', { required: true })} />
        <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
      </FormControl>
      <FormControl>
        <FormLabel>Fornecedor/Credor (Opcional)</FormLabel>
        <Select placeholder="Selecione um fornecedor" {...register('fornecedor_id')}> 
          {fornecedoresData?.dados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </Select>
      </FormControl>
    </>
  );
};
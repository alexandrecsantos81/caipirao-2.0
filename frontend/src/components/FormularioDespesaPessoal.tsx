import {
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, Switch, HStack, Text,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, useBreakpointValue
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import { IDespesaPessoal, IDespesaPessoalForm } from '../services/despesaPessoal.service';

interface FormularioDespesaPessoalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IDespesaPessoalForm, id?: number) => void;
  despesa: IDespesaPessoal | null;
  isLoading: boolean;
}

export const FormularioDespesaPessoal = ({ isOpen, onClose, onSave, despesa, isLoading }: FormularioDespesaPessoalProps) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<IDespesaPessoalForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  const isRecorrente = watch('recorrencia');

  useEffect(() => {
    if (isOpen) {
      if (despesa) {
        // MODO EDIÇÃO: Preenche apenas os campos relevantes para o formulário
        reset({
          descricao: despesa.descricao,
          valor: String(despesa.valor),
          data_vencimento: despesa.data_vencimento.split('T')[0],
          categoria: despesa.categoria || '',
          recorrencia: false, // Edição é sempre para uma única parcela
        });
      } else {
        // MODO CRIAÇÃO: Reseta para os valores padrão
        reset({
          descricao: '',
          valor: '',
          data_vencimento: new Date().toISOString().split('T')[0],
          categoria: '',
          recorrencia: false,
          mesesRecorrencia: 2,
        });
      }
    }
  }, [despesa, isOpen, reset]);

  const onSubmit: SubmitHandler<IDespesaPessoalForm> = (data) => {
    // Converte o valor para número antes de salvar
    const finalData = { ...data, valor: Number(data.valor) };
    onSave(finalData, despesa?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{despesa ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.descricao}>
              <FormLabel>Descrição</FormLabel>
              <Input {...register('descricao', { required: 'Descrição é obrigatória' })} textTransform="uppercase" />
              <FormErrorMessage>{errors.descricao?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.valor}>
              <FormLabel>Valor (R$)</FormLabel>
              <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} />
              <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.data_vencimento}>
              <FormLabel>{isRecorrente ? 'Data do 1º Vencimento' : 'Data de Vencimento'}</FormLabel>
              <Input type="date" {...register('data_vencimento', { required: 'Data é obrigatória' })} />
              <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="Ex: MORADIA, TRANSPORTE, LAZER" textTransform="uppercase" />
            </FormControl>

            {/* Lógica de Recorrência - só aparece no modo de criação */}
            {!despesa && (
              <VStack w="full" p={4} borderWidth={1} borderRadius="md" align="start" spacing={4}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="recorrencia-switch" mb="0">
                    É uma despesa recorrente?
                  </FormLabel>
                  <Switch id="recorrencia-switch" {...register('recorrencia')} />
                </FormControl>

                {isRecorrente && (
                  <FormControl isRequired isInvalid={!!errors.mesesRecorrencia}>
                    <FormLabel>Repetir por quantos meses?</FormLabel>
                    <NumberInput min={2} max={24}>
                      <NumberInputField {...register('mesesRecorrencia', { required: 'Informe o número de meses', valueAsNumber: true })} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="xs" color="gray.500" mt={1}>A despesa será criada para este mês e para os próximos N-1 meses.</Text>
                    <FormErrorMessage>{errors.mesesRecorrencia?.message}</FormErrorMessage>
                  </FormControl>
                )}
              </VStack>
            )}
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

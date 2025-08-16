// frontend/src/components/FormularioDespesaPessoal.tsx

import {
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, useBreakpointValue,
  Switch, HStack, Text, RadioGroup, Radio, NumberInput, NumberInputField, NumberIncrementStepper, NumberDecrementStepper, Collapse
} from '@chakra-ui/react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useEffect, RefObject } from 'react';
import { IDespesaPessoal, IDespesaPessoalForm } from '../services/despesaPessoal.service';

interface FormularioDespesaPessoalProps {
  isOpen: boolean;
  onClose: () => void;
  despesa: IDespesaPessoal | null;
  onSave: (data: IDespesaPessoalForm, id?: number) => void;
  isLoading: boolean;
  portalContainerRef: RefObject<HTMLDivElement>;
}

export const FormularioDespesaPessoal = ({ isOpen, onClose, despesa, onSave, isLoading, portalContainerRef }: FormularioDespesaPessoalProps) => {
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<IDespesaPessoalForm>({
    defaultValues: {
      recorrente: false,
      parcelado: undefined,
      quantidade_parcelas: 1,
    }
  });
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  const isRecorrente = watch('recorrente');
  const isParcelado = watch('parcelado');

  useEffect(() => {
    if (isOpen) {
      if (despesa) {
        // LÓGICA DE RESET CORRIGIDA
        reset({
          descricao: despesa.descricao,
          valor: despesa.valor,
          data_vencimento: despesa.data_vencimento.split('T')[0],
          categoria: despesa.categoria || '', // Garante que seja sempre string
          recorrente: despesa.recorrente,
          // CORREÇÃO 2: Define 'parcelado' com base na existência de 'total_parcelas'
          parcelado: despesa.recorrente ? (despesa.total_parcelas ? 'sim' : 'nao') : undefined,
          // CORREÇÃO 3: Usa 'total_parcelas' em vez de 'quantidade_parcelas' para popular o form
          quantidade_parcelas: despesa.total_parcelas || 1,
        });
      } else {
        // Lógica para criar uma nova despesa (já estava correta)
        reset({
          descricao: '',
          valor: undefined,
          data_vencimento: new Date().toISOString().split('T')[0],
          categoria: '',
          recorrente: false,
          parcelado: undefined,
          quantidade_parcelas: 1,
        });
      }
    }
  }, [despesa, isOpen, reset]);

  const onSubmit: SubmitHandler<IDespesaPessoalForm> = (data) => {
    const finalData = {
      ...data,
      valor: Number(data.valor),
      parcelado: isRecorrente ? data.parcelado : undefined,
      // CORREÇÃO 4: Garante que quantidade_parcelas só seja enviado se for parcelado
      quantidade_parcelas: isRecorrente && data.parcelado === 'sim' ? data.quantidade_parcelas : undefined,
    };
    onSave(finalData, despesa?.id);
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size={drawerSize}
      portalProps={{ containerRef: portalContainerRef }}
    >
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
              <FormLabel>{isRecorrente && isParcelado === 'sim' ? 'Vencimento da 1ª Parcela' : 'Data de Vencimento'}</FormLabel>
              <Input type="date" {...register('data_vencimento', { required: 'Data é obrigatória' })} />
              <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="EX: MORADIA, TRANSPORTE, LAZER" textTransform="uppercase" />
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between" isDisabled={!!despesa}>
              <FormLabel htmlFor="recorrente-switch" mb="0">
                É uma despesa recorrente?
              </FormLabel>
              <Switch id="recorrente-switch" {...register('recorrente')} />
            </FormControl>

            <Collapse in={isRecorrente} animateOpacity style={{ width: '100%' }}>
              <VStack spacing={4} borderWidth={1} borderRadius="md" p={4} mt={2} align="flex-start">
                <FormControl as="fieldset" isRequired={isRecorrente}>
                  <FormLabel as="legend">As parcelas têm quantidade definida?</FormLabel>
                  <Controller
                    name="parcelado"
                    control={control}
                    rules={{ required: isRecorrente ? 'Esta opção é obrigatória' : false }}
                    render={({ field }) => (
                      <RadioGroup {...field}>
                        <HStack spacing="24px">
                          <Radio value="sim">Sim (Ex: Financiamento)</Radio>
                          <Radio value="nao">Não (Ex: Assinatura)</Radio>
                        </HStack>
                      </RadioGroup>
                    )}
                  />
                   <FormErrorMessage>{errors.parcelado?.message}</FormErrorMessage>
                </FormControl>

                <Collapse in={isParcelado === 'sim'} animateOpacity style={{ width: '100%' }}>
                  <FormControl isRequired={isParcelado === 'sim'} isInvalid={!!errors.quantidade_parcelas}>
                    <FormLabel>Quantidade de Parcelas</FormLabel>
                    <Controller
                      name="quantidade_parcelas"
                      control={control}
                      rules={{ 
                        required: isParcelado === 'sim' ? 'A quantidade é obrigatória' : false,
                        min: isParcelado === 'sim' ? { value: 2, message: 'Deve haver pelo menos 2 parcelas' } : undefined
                      }}
                      render={({ field }) => (
                        <NumberInput {...field} min={2}>
                          <NumberInputField />
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInput>
                      )}
                    />
                    <FormErrorMessage>{errors.quantidade_parcelas?.message}</FormErrorMessage>
                  </FormControl>
                </Collapse>
                
                <Collapse in={isParcelado === 'nao'} animateOpacity>
                    <Text fontSize="sm" color="gray.500">
                        Esta despesa será criada mensalmente por tempo indeterminado.
                    </Text>
                </Collapse>
              </VStack>
            </Collapse>
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

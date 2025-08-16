import {
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, useBreakpointValue,
  Switch, HStack, RadioGroup, Radio, NumberInput, NumberInputField, Collapse, Text
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
      parcela_atual: undefined,
      quantidade_parcelas: undefined,
      data_vencimento: new Date().toISOString().split('T')[0],
    }
  });
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  const isRecorrente = watch('recorrente');
  const tipoRecorrencia = watch('parcelado');

  useEffect(() => {
    if (isOpen && !despesa) {
      reset({
        descricao: '',
        valor: undefined,
        data_vencimento: new Date().toISOString().split('T')[0],
        categoria: '',
        recorrente: false,
        parcelado: undefined,
        parcela_atual: undefined,
        quantidade_parcelas: undefined,
      });
    }
    // Lógica de edição pode ser implementada aqui no futuro
  }, [despesa, isOpen, reset]);

  const onSubmit: SubmitHandler<IDespesaPessoalForm> = (data) => {
    const finalData = {
      ...data,
      valor: Number(data.valor),
      parcela_atual: data.parcela_atual ? Number(data.parcela_atual) : undefined,
      quantidade_parcelas: data.quantidade_parcelas ? Number(data.quantidade_parcelas) : undefined,
    };
    onSave(finalData, despesa?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize} portalProps={{ containerRef: portalContainerRef }}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{despesa ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.descricao}>
              <FormLabel>Descrição</FormLabel>
              <Input {...register('descricao', { required: 'Descrição é obrigatória' })} placeholder="Ex: PRESTAÇÃO DO LOTE" textTransform="uppercase" />
              <FormErrorMessage>{errors.descricao?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.valor}>
              <FormLabel>Valor (R$)</FormLabel>
              <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true, min: { value: 0.01, message: 'O valor deve ser positivo.'} })} />
              <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="Ex: MORADIA, TRANSPORTE" textTransform="uppercase" />
            </FormControl>

            {/* Campo de data de vencimento para despesas não recorrentes */}
            <Collapse in={!isRecorrente} animateOpacity>
                <FormControl isRequired={!isRecorrente} isInvalid={!!errors.data_vencimento}>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Input type="date" {...register('data_vencimento', { required: !isRecorrente })} />
                    <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                </FormControl>
            </Collapse>

            <FormControl display="flex" alignItems="center" justifyContent="space-between" pt={4}>
              <FormLabel htmlFor="recorrente-switch" mb="0">É uma despesa recorrente?</FormLabel>
              <Switch id="recorrente-switch" {...register('recorrente')} />
            </FormControl>

            <Collapse in={isRecorrente} animateOpacity style={{ width: '100%' }}>
              <VStack spacing={4} borderWidth={1} borderRadius="md" p={4} mt={2} align="flex-start">
                <FormControl as="fieldset" isRequired={isRecorrente}>
                  <FormLabel as="legend">Tipo de Recorrência</FormLabel>
                  <Controller 
                    control={control} 
                    name="parcelado" 
                    rules={{ required: isRecorrente ? "Selecione o tipo de recorrência" : false }} 
                    render={({ field }) => (
                      <RadioGroup {...field}>
                        <HStack spacing="24px">
                          <Radio value="sim">Parcelamento (com fim)</Radio>
                          <Radio value="nao">Assinatura (contínua)</Radio>
                        </HStack>
                      </RadioGroup>
                    )} 
                  />
                   <FormErrorMessage>{errors.parcelado?.message}</FormErrorMessage>
                </FormControl>

                {/* Campos para Parcelamento (Financiamento) */}
                <Collapse in={tipoRecorrencia === 'sim'} animateOpacity style={{ width: '100%' }}>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.500">
                      Informe os dados da <strong>parcela atual</strong> que você está pagando ou da próxima a vencer.
                    </Text>
                    <HStack spacing={4}>
                      <FormControl isRequired={tipoRecorrencia === 'sim'} isInvalid={!!errors.parcela_atual}>
                        <FormLabel>Parcela Atual</FormLabel>
                        <NumberInput min={1}>
                          <NumberInputField {...register('parcela_atual', { required: tipoRecorrencia === 'sim' ? 'Campo obrigatório' : false, valueAsNumber: true })} />
                        </NumberInput>
                        <FormErrorMessage>{errors.parcela_atual?.message}</FormErrorMessage>
                      </FormControl>
                      <FormControl isRequired={tipoRecorrencia === 'sim'} isInvalid={!!errors.quantidade_parcelas}>
                        <FormLabel>de (Total)</FormLabel>
                        <NumberInput min={1}>
                          <NumberInputField {...register('quantidade_parcelas', { required: tipoRecorrencia === 'sim' ? 'Campo obrigatório' : false, valueAsNumber: true })} />
                        </NumberInput>
                        <FormErrorMessage>{errors.quantidade_parcelas?.message}</FormErrorMessage>
                      </FormControl>
                    </HStack>
                    <FormControl isRequired={tipoRecorrencia === 'sim'} isInvalid={!!errors.data_vencimento}>
                      <FormLabel>Vencimento da Parcela Atual</FormLabel>
                      <Input type="date" {...register('data_vencimento', { required: tipoRecorrencia === 'sim' ? 'Campo obrigatório' : false })} />
                       <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                    </FormControl>
                  </VStack>
                </Collapse>

                {/* Campo para Assinatura (Recorrência Contínua) */}
                <Collapse in={tipoRecorrencia === 'nao'} animateOpacity style={{ width: '100%' }}>
                   <FormControl isRequired={tipoRecorrencia === 'nao'} isInvalid={!!errors.data_vencimento}>
                      <FormLabel>Data do Próximo Vencimento</FormLabel>
                      <Input type="date" {...register('data_vencimento', { required: tipoRecorrencia === 'nao' ? 'Campo obrigatório' : false })} />
                      <FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage>
                    </FormControl>
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

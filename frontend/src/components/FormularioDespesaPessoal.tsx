import {
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, useBreakpointValue,
  Switch, HStack, RadioGroup, Radio, NumberInput, NumberInputField, Collapse
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
      parcela_atual: 1,
      quantidade_parcelas: 1,
    }
  });
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  const isRecorrente = watch('recorrente');
  const isParcelado = watch('parcelado');

  useEffect(() => {
    if (isOpen && !despesa) {
      reset({
        descricao: '',
        valor: undefined,
        data_vencimento: new Date().toISOString().split('T')[0],
        categoria: '',
        recorrente: false,
        parcelado: undefined,
        parcela_atual: 1,
        quantidade_parcelas: 1,
      });
    }
    // A lógica de edição foi desativada temporariamente para focar na criação
    if (despesa) {
        // Aqui você pode adicionar a lógica para popular o formulário para edição no futuro
    }
  }, [despesa, isOpen, reset]);

  const onSubmit: SubmitHandler<IDespesaPessoalForm> = (data) => {
    onSave(data, despesa?.id);
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
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.valor}>
              <FormLabel>Valor (R$)</FormLabel>
              <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} />
            </FormControl>
            
            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="Ex: PARCELAMENTO DE LOTE" textTransform="uppercase" />
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="recorrente-switch" mb="0">É uma despesa recorrente?</FormLabel>
              <Switch id="recorrente-switch" {...register('recorrente')} />
            </FormControl>

            <Collapse in={isRecorrente} animateOpacity style={{ width: '100%' }}>
              <VStack spacing={4} borderWidth={1} borderRadius="md" p={4} mt={2} align="flex-start">
                <FormControl as="fieldset" isRequired={isRecorrente}>
                  <FormLabel as="legend">Tipo de Recorrência</FormLabel>
                  <Controller control={control} name="parcelado" rules={{ required: isRecorrente }} render={({ field }) => (
                    <RadioGroup {...field}>
                      <HStack spacing="24px">
                        <Radio value="sim">Parcelamento (com fim)</Radio>
                        <Radio value="nao">Assinatura (contínua)</Radio>
                      </HStack>
                    </RadioGroup>
                  )} />
                </FormControl>

                <Collapse in={isParcelado === 'sim'} animateOpacity style={{ width: '100%' }}>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4}>
                      <FormControl isRequired={isParcelado === 'sim'} isInvalid={!!errors.parcela_atual}>
                        <FormLabel>Parcela Atual</FormLabel>
                        <NumberInput min={1}><NumberInputField {...register('parcela_atual', { required: isParcelado === 'sim', valueAsNumber: true })} /></NumberInput>
                      </FormControl>
                      <FormControl isRequired={isParcelado === 'sim'} isInvalid={!!errors.quantidade_parcelas}>
                        <FormLabel>de (Total)</FormLabel>
                        <NumberInput min={1}><NumberInputField {...register('quantidade_parcelas', { required: isParcelado === 'sim', valueAsNumber: true })} /></NumberInput>
                      </FormControl>
                    </HStack>
                    <FormControl isRequired={isParcelado === 'sim'} isInvalid={!!errors.data_vencimento}>
                      <FormLabel>Vencimento da Parcela Atual</FormLabel>
                      <Input type="date" {...register('data_vencimento', { required: isParcelado === 'sim' })} />
                    </FormControl>
                  </VStack>
                </Collapse>

                <Collapse in={isParcelado === 'nao'} animateOpacity style={{ width: '100%' }}>
                   <FormControl isRequired={isParcelado === 'nao'} isInvalid={!!errors.data_vencimento}>
                      <FormLabel>Data do Próximo Vencimento</FormLabel>
                      <Input type="date" {...register('data_vencimento', { required: isParcelado === 'nao' })} />
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

// frontend/src/components/ModalAdicionarDespesa.tsx

import {
  // ✅ REVERSÃO: Importando os componentes de Modal individualmente
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerBody,
  DrawerCloseButton,
  Button,
  // ✅ REVERSÃO: Importando os componentes de Formulário individualmente
  FormControl,
  FormLabel,
  Input,
  // ✅ REVERSÃO: Importando os componentes de NumberInput individualmente
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  FormErrorMessage,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IDespesaForm } from '../services/despesa.service';
import { useEffect } from 'react';

interface ModalAdicionarDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IDespesaForm) => void;
  isLoading: boolean;
}

export const ModalAdicionarDespesa = ({ isOpen, onClose, onSubmit, isLoading }: ModalAdicionarDespesaProps) => {
  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<IDespesaForm>();

  useEffect(() => {
    if (isSubmitSuccessful || !isOpen) {
      reset();
    }
  }, [isSubmitSuccessful, isOpen, reset]);

  const handleFormSubmit: SubmitHandler<IDespesaForm> = (data) => {
    onSubmit(data);
  };

  return (
    // ✅ REVERSÃO: Estrutura do Modal da v2
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DrawerHeader>Registrar Nova Despesa</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.discriminacao}>
                <FormLabel htmlFor="discriminacao">Descrição</FormLabel>
                <Input
                  id="discriminacao"
                  placeholder="Ex: Compra de gelo para o isopor"
                  {...register('discriminacao', { required: 'A descrição é obrigatória' })}
                />
                <FormErrorMessage>{errors.discriminacao && errors.discriminacao.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.valor}>
                <FormLabel htmlFor="valor">Valor (R$)</FormLabel>
                {/* ✅ REVERSÃO: Estrutura do NumberInput da v2 */}
                <NumberInput min={0.01} precision={2}>
                  <NumberInputField
                    id="valor"
                    {...register('valor', {
                        required: 'O valor é obrigatório',
                        valueAsNumber: true,
                        min: { value: 0.01, message: 'O valor deve ser maior que zero' }
                    })}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.valor && errors.valor.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="red"
              type="submit"
              // ✅ REVERSÃO: 'loading' para 'isLoading'
              isLoading={isLoading}
              loadingText="Salvando..."
            >
              Salvar Despesa
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};



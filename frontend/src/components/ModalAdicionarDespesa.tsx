import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
// CORREÇÃO: A interface agora é IDespesaForm
import { IDespesaForm } from '../services/despesa.service';
import { useEffect } from 'react';

interface ModalAdicionarDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IDespesaForm) => void; // CORREÇÃO: Usar IDespesaForm
  isLoading: boolean;
}

export const ModalAdicionarDespesa = ({ isOpen, onClose, onSubmit, isLoading }: ModalAdicionarDespesaProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<IDespesaForm>(); // CORREÇÃO: Usar IDespesaForm

  useEffect(() => {
    if (isSubmitSuccessful || !isOpen) {
      reset();
    }
  }, [isSubmitSuccessful, isOpen, reset]);

  const handleFormSubmit: SubmitHandler<IDespesaForm> = (data) => { // CORREÇÃO: Usar IDespesaForm
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>Registrar Nova Despesa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="red"
              type="submit"
              isLoading={isLoading}
              loadingText="Salvando..."
            >
              Salvar Despesa
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
//marcação para commit gemini
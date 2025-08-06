// frontend/src/components/ModalAdicionarDespesa.tsx

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
import { ICreateDespesa } from '../services/despesas.service';
import { useEffect } from 'react';

// Definindo as propriedades que o nosso Modal vai receber
interface ModalAdicionarDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICreateDespesa) => void;
  isLoading: boolean;
}

export const ModalAdicionarDespesa = ({ isOpen, onClose, onSubmit, isLoading }: ModalAdicionarDespesaProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<ICreateDespesa>();

  // Limpa o formulário sempre que ele for fechado ou quando um envio for bem-sucedido
  useEffect(() => {
    if (isSubmitSuccessful || !isOpen) {
      reset();
    }
  }, [isSubmitSuccessful, isOpen, reset]);

  const handleFormSubmit: SubmitHandler<ICreateDespesa> = (data) => {
    // O react-hook-form já foi configurado para tratar o valor como número
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
              <FormControl isInvalid={!!errors.descricao}>
                <FormLabel htmlFor="descricao">Descrição</FormLabel>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de gelo para o isopor"
                  {...register('descricao', { required: 'A descrição é obrigatória' })}
                />
                <FormErrorMessage>{errors.descricao && errors.descricao.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.valor_total}>
                <FormLabel htmlFor="valor_total">Valor (R$)</FormLabel>
                <NumberInput min={0.01} precision={2}>
                  <NumberInputField
                    id="valor_total"
                    {...register('valor_total', { 
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
                <FormErrorMessage>{errors.valor_total && errors.valor_total.message}</FormErrorMessage>
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

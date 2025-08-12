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
  NumberInput,
  NumberInputField,
  VStack,
  FormErrorMessage,
  Textarea,
  Text,
  Input, // Adicionar Input para o campo de data
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IEntradaEstoqueForm, IProduto } from '../services/produto.service';
import { useEffect } from 'react';

interface ModalEntradaEstoqueProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IEntradaEstoqueForm) => void;
  produto: IProduto | null;
  isLoading: boolean;
}

// Adicionar o campo 'data_entrada' à interface do formulário
interface IEntradaEstoqueFormComData extends IEntradaEstoqueForm {
  data_entrada: string;
}

export const ModalEntradaEstoque = ({ isOpen, onClose, onSubmit, produto, isLoading }: ModalEntradaEstoqueProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<IEntradaEstoqueFormComData>();

  // Limpa o formulário e define a data atual sempre que ele for aberto ou um envio for bem-sucedido
  useEffect(() => {
    if (!isOpen || isSubmitSuccessful) {
      reset({
        quantidade_adicionada: undefined,
        custo_total: undefined,
        observacao: '',
        data_entrada: new Date().toISOString().split('T')[0], // Define a data atual
      });
    } else if (isOpen) {
      // Garante que a data seja definida ao abrir o modal
      reset({
        data_entrada: new Date().toISOString().split('T')[0],
        quantidade_adicionada: undefined,
        custo_total: undefined,
        observacao: '',
      });
    }
  }, [isOpen, isSubmitSuccessful, reset]);

  const handleFormSubmit: SubmitHandler<IEntradaEstoqueFormComData> = (data) => {
    onSubmit({
      ...data,
      quantidade_adicionada: Number(data.quantidade_adicionada),
      custo_total: Number(data.custo_total),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>Registrar Entrada de Estoque</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text alignSelf="flex-start">
                Você está adicionando estoque para o produto: <strong>{produto?.nome}</strong>
              </Text>

              <FormControl isRequired isInvalid={!!errors.data_entrada}>
                <FormLabel>Data da Entrada</FormLabel>
                <Input
                  type="date"
                  {...register('data_entrada', { required: 'A data é obrigatória' })}
                />
                <FormErrorMessage>{errors.data_entrada?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.quantidade_adicionada}>
                <FormLabel>Quantidade Adicionada ({produto?.unidade_medida})</FormLabel>
                <NumberInput min={0.001} precision={3}>
                  <NumberInputField
                    {...register('quantidade_adicionada', {
                      required: 'Quantidade é obrigatória',
                      valueAsNumber: true,
                      min: { value: 0.001, message: 'A quantidade deve ser maior que zero.' }
                    })}
                  />
                </NumberInput>
                <FormErrorMessage>{errors.quantidade_adicionada?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.custo_total}>
                <FormLabel>Custo Total da Entrada (R$)</FormLabel>
                <NumberInput min={0} precision={2}>
                  <NumberInputField
                    {...register('custo_total', {
                      required: 'Custo total é obrigatório',
                      valueAsNumber: true,
                      min: { value: 0, message: 'O custo não pode ser negativo.' }
                    })}
                  />
                </NumberInput>
                <FormErrorMessage>{errors.custo_total?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Observação (Opcional)</FormLabel>
                <Textarea placeholder="Ex: Nota fiscal 123, Fornecedor Sítio do Picapau" {...register('observacao')} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              Adicionar ao Estoque
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
//marcação para commit gemini
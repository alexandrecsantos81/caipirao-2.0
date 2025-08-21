// frontend/src/components/ModalEntradaEstoque.tsx

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
  NumberInput,
  NumberInputField,
  VStack,
  FormErrorMessage,
  Textarea,
  Text,
  Input,
  useBreakpointValue,
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

interface IEntradaEstoqueFormComData extends IEntradaEstoqueForm {
  data_entrada: string;
}

export const ModalEntradaEstoque = ({ isOpen, onClose, onSubmit, produto, isLoading }: ModalEntradaEstoqueProps) => {
  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IEntradaEstoqueFormComData>();

  useEffect(() => {
    if (isOpen) {
      reset({
        data_entrada: new Date().toISOString().split('T')[0],
        quantidade_adicionada: undefined,
        custo_total: undefined,
        observacao: '',
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit: SubmitHandler<IEntradaEstoqueFormComData> = (data) => {
    onSubmit({
      ...data,
      quantidade_adicionada: Number(data.quantidade_adicionada),
      custo_total: Number(data.custo_total),
    });
  };

  return (
    // ✅ REVERSÃO: Estrutura do Modal da v2
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DrawerHeader>Registrar Entrada de Estoque</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
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
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            {/* ✅ REVERSÃO: 'loading' para 'isLoading' */}
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              Adicionar ao Estoque
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};



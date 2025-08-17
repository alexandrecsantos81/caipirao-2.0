import {
  Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Button, VStack, FormControl, FormLabel, Input, FormErrorMessage, useBreakpointValue
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import { IReceitaExterna, IReceitaExternaForm } from '../services/receitaExterna.service';

// A interface de props está correta, sem a propriedade 'portalContainerRef'.
interface FormularioReceitaProps {
  isOpen: boolean;
  onClose: () => void;
  receita: IReceitaExterna | null;
  onSave: (data: IReceitaExternaForm, id?: number) => void;
  isLoading: boolean;
}

export const FormularioReceita = ({ isOpen, onClose, receita, onSave, isLoading }: FormularioReceitaProps) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IReceitaExternaForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  useEffect(() => {
    if (isOpen) {
      if (receita) {
        reset({
          ...receita,
          data_recebimento: receita.data_recebimento.split('T')[0],
        });
      } else {
        reset({
          descricao: '',
          valor: undefined,
          data_recebimento: new Date().toISOString().split('T')[0],
          categoria: '',
        });
      }
    }
  }, [receita, isOpen, reset]);

  const onSubmit: SubmitHandler<IReceitaExternaForm> = (data) => {
    onSave(data, receita?.id);
  };

  return (
    // O componente Drawer não possui mais a propriedade 'portalProps'.
    <Drawer 
      isOpen={isOpen} 
      placement="right" 
      onClose={onClose} 
      size={drawerSize}
    >
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{receita ? 'Editar Receita' : 'Adicionar Nova Receita'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.descricao}>
              <FormLabel>Descrição</FormLabel>
              <Input 
                {...register('descricao', { 
                  required: 'Descrição é obrigatória',
                  validate: (value) => value.trim() !== '' || 'A descrição não pode conter apenas espaços.'
                })} 
                textTransform="uppercase" 
              />
              <FormErrorMessage>{errors.descricao?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.valor}>
              <FormLabel>Valor (R$)</FormLabel>
              <Input 
                type="number" 
                step="0.01" 
                {...register('valor', { 
                  required: 'Valor é obrigatório', 
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'O valor deve ser maior que zero.' }
                })} 
              />
              <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.data_recebimento}>
              <FormLabel>Data de Recebimento</FormLabel>
              <Input type="date" {...register('data_recebimento', { required: 'Data é obrigatória' })} />
              <FormErrorMessage>{errors.data_recebimento?.message}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="Ex: Salário, Aluguel, Freelance" textTransform="uppercase" />
            </FormControl>
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

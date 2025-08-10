import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Box textAlign="center" py={10} px={6} mt="20">
      <Heading
        display="inline-block"
        as="h2"
        size="2xl"
        bgGradient="linear(to-r, red.400, red.600)"
        backgroundClip="text">
        404
      </Heading>
      <Text fontSize="18px" mt={3} mb={2}>
        Página Não Encontrada
      </Text>
      <Text color={'gray.500'} mb={6}>
        Desculpe, a página que você está procurando não existe ou foi movida.
      </Text>

      <Button
        as={RouterLink}
        to="/"
        colorScheme="red"
        variant="solid">
        Voltar para o Início
      </Button>
    </Box>
  );
};

export default NotFoundPage;

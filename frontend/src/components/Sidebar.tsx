import {
  Box, VStack, Heading, Link as ChakraLink, Text, Divider, Avatar, HStack, Tag, Icon,
} from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiShoppingCart, FiUsers, FiBox, FiDollarSign, FiLogOut, FiTruck,
} from 'react-icons/fi'; // <-- CORREÇÃO: Removido o FiUser
import { useAuth } from '../hooks/useAuth';

// Interface para cada item do menu
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

// Componente para um único item de navegação
const NavItem = ({ icon, label, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      display="flex"
      alignItems="center"
      p={3}
      mx={3}
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={isActive ? 'teal.400' : 'transparent'}
      color={isActive ? 'white' : 'gray.600'}
      _hover={{
        bg: 'teal.300',
        color: 'white',
      }}
      fontWeight="medium"
    >
      <Box as={icon} mr="4" fontSize="18" />
      {label}
    </ChakraLink>
  );
};

// Componente principal da Sidebar
export const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  return (
    <Box
      as="nav"
      pos="fixed"
      h="full"
      w={{ base: 'full', md: 240 }} // Definindo uma largura fixa
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <VStack h="full" justify="space-between" py={5}>
        {/* Seção Superior: Logo e Itens de Menu */}
        <VStack align="stretch" w="full">
          <Heading size="md" p={4} mb={4} textAlign="center">Caipirão 3.0</Heading>
          <NavItem icon={FiHome} label="Dashboard" to="/dashboard" />
          <NavItem icon={FiShoppingCart} label="Movimentações" to="/movimentacoes" />
          <NavItem icon={FiDollarSign} label="Clientes" to="/clientes" />
          <NavItem icon={FiBox} label="Produtos" to="/produtos" />
          <NavItem icon={FiTruck} label="Fornecedores" to="/fornecedores" />
          {isAdmin && (
            <NavItem icon={FiUsers} label="Utilizadores" to="/utilizadores" />
          )}
        </VStack>

        {/* Seção Inferior: Perfil do Usuário e Sair */}
        <VStack align="stretch" w="full" spacing={4}>
          <Divider />
          <Box px={4}>
            <HStack>
              <Avatar size="sm" name={user?.nome} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">{user?.nome}</Text>
                <Tag size="sm" colorScheme="red" variant="solid">{user?.perfil}</Tag>
              </VStack>
            </HStack>
          </Box>
          <ChakraLink
            onClick={logout}
            display="flex"
            alignItems="center"
            p={3}
            mx={3}
            borderRadius="lg"
            role="group"
            cursor="pointer"
            _hover={{
              bg: 'teal.300',
              color: 'white',
            }}
            fontWeight="medium"
            color="gray.600"
          >
            <Icon as={FiLogOut} mr="4" fontSize="18" />
            Sair
          </ChakraLink>
        </VStack>
      </VStack>
    </Box>
  );
};

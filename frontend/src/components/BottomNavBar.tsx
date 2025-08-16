// frontend/src/components/BottomNavBar.tsx

import {
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiHome,
  FiShoppingCart,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiBox,
  FiTruck,
  FiGrid,
  FiUserCheck,
  FiCreditCard,
} from 'react-icons/fi';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const NavItem = ({ icon, label, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  // --- INÍCIO DA ALTERAÇÃO 1: Cores dos Ícones ---
  // A cor ativa agora é um branco mais forte para se destacar no fundo azul.
  const activeColor = 'white';
  // A cor inativa é um branco com um pouco de transparência.
  const inactiveColor = useColorModeValue('whiteAlpha.700', 'whiteAlpha.600');
  // A cor do hover será o mesmo branco forte da cor ativa.
  const hoverColor = 'white';
  // --- FIM DA ALTERAÇÃO 1 ---

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flex="1"
      py={2}
      color={isActive ? activeColor : inactiveColor}
      fontWeight={isActive ? 'bold' : 'normal'}
      _hover={{ textDecoration: 'none', color: hoverColor }}
      transition="color 0.2s ease-in-out"
    >
      <Icon as={icon} fontSize="2xl" />
      <Text fontSize="xs" mt={1}>
        {label}
      </Text>
    </ChakraLink>
  );
};

export const BottomNavBar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  // --- INÍCIO DA ALTERAÇÃO 2: Cor de Fundo da Barra ---
  // Define a nova cor de fundo de destaque.
  const bgColor = useColorModeValue('blue.500', 'blue.800');
  // A borda superior pode ser um pouco mais escura para dar profundidade.
  const borderColor = useColorModeValue('blue.600', 'blue.900');
  // Cor para o ícone de "Mais" (grid) e o ícone de "Sair".
  const iconColor = useColorModeValue('whiteAlpha.700', 'whiteAlpha.600');
  // --- FIM DA ALTERAÇÃO 2 ---

  return (
    <Box
      as="nav"
      pos="fixed"
      bottom="0"
      left="0"
      right="0"
      bg={bgColor} // Aplicando a nova cor de fundo
      borderTopWidth="1px"
      borderColor={borderColor} // Aplicando a nova cor de borda
      zIndex="sticky"
      display={{ base: 'block', md: 'none' }}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.15)" // Adiciona uma sombra para mais destaque
    >
      <Flex align="center" justify="space-around" h="60px">
        <NavItem icon={FiShoppingCart} label="Movim." to="/movimentacoes" />
        <NavItem icon={FiUsers} label="Clientes" to="/clientes" />
        <NavItem icon={FiBox} label="Produtos" to="/produtos" />

        {isAdmin ? (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Mais opções"
              icon={<FiGrid />}
              variant="ghost"
              fontSize="2xl"
              color={iconColor} // Aplicando a cor do ícone
              _hover={{ bg: useColorModeValue('blue.600', 'blue.700') }} // Efeito hover no botão
              flex={1}
              h="full"
              py={2}
            />
            <MenuList>
              <MenuItem as={RouterLink} to="/dashboard" icon={<FiHome />}>Dashboard</MenuItem>
              <MenuItem as={RouterLink} to="/relatorios" icon={<FiBarChart2 />}>Relatórios</MenuItem>
              <MenuItem as={RouterLink} to="/financas" icon={<FiCreditCard />}>Finanças</MenuItem>
              <MenuItem as={RouterLink} to="/fornecedores" icon={<FiTruck />}>Fornecedores</MenuItem>
              <MenuItem as={RouterLink} to="/utilizadores" icon={<FiUserCheck />}>Utilizadores</MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={logout}>Sair</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <ChakraLink
            onClick={logout}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            flex="1"
            py={2}
            color={iconColor} // Aplicando a cor do ícone
          >
            <Icon as={FiLogOut} fontSize="2xl" />
            <Text fontSize="xs" mt={1}>Sair</Text>
          </ChakraLink>
        )}
      </Flex>
    </Box>
  );
};

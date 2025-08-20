import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Útil para evitar chamadas de API a cada tecla digitada em um campo de busca.
 * @param value O valor a ser "atrasado" (ex: termo de busca).
 * @param delay O tempo de atraso em milissegundos (ex: 500ms).
 * @returns O valor após o atraso.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  // Estado que armazena o valor "atrasado".
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura um temporizador para atualizar o valor debounced após o 'delay'.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Função de limpeza: se o 'value' ou 'delay' mudarem antes do tempo acabar,
    // o temporizador anterior é cancelado. Isso garante que a atualização só
    // ocorra quando o usuário parar de digitar.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // O efeito é re-executado se o valor ou o delay mudarem.

  return debouncedValue;
};

import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Útil para evitar chamadas de API a cada tecla digitada em um campo de busca.
 * @param value O valor a ser "atrasado" (ex: termo de busca).
 * @param delay O tempo de atraso em milissegundos.
 * @returns O valor após o atraso.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

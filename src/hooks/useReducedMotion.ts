import { useCallback, useEffect, useState } from 'react';

/** Chave de persistência da preferência de movimento reduzido. */
export const REDUCED_MOTION_STORAGE_KEY = 'cdcpf:reduced-motion';

type ReducedMotionPreference = 'system' | 'reduced';

/**
 * Detecta `prefers-reduced-motion` de forma reativa e permite que a
 * preferencia seja sobrescrita manualmente pelo usuario.
 *
 * A preferencia manual e persistida em `localStorage` porque nao se trata
 * de dado pessoal (SDD 18.2). O CPF, porem, nunca e persistido.
 *
 * @returns `true` quando o movimento deve ser reduzido.
 */
export function useReducedMotion(): [boolean, (reduced: boolean) => void] {
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(false);
  const [manualPreference, setManualPreference] = useState<ReducedMotionPreference>('system');

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');

    setSystemPrefersReduced(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersReduced(event.matches);
    };

    query.addEventListener('change', handleChange);

    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);

      if (stored === 'reduced' || stored === 'system') {
        setManualPreference(stored);
      }
    } catch {
      // `localStorage` pode estar bloqueado; a preferencia do sistema prevalece.
    }
  }, []);

  const setReduced = useCallback((reduced: boolean) => {
    const next: ReducedMotionPreference = reduced ? 'reduced' : 'system';

    setManualPreference(next);

    try {
      window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, next);
    } catch {
      // Falha de persistencia nao deve interromper a aplicacao.
    }
  }, []);

  const isReduced =
    manualPreference === 'reduced' || (manualPreference === 'system' && systemPrefersReduced);

  return [isReduced, setReduced];
}

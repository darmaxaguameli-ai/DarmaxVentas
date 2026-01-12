import { useCallback } from 'react';

const useHaptic = () => {
  const vibrate = useCallback((pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  /**
   * Ligera vibración para selección o tap.
   */
  const triggerSelection = useCallback(() => vibrate(10), [vibrate]);

  /**
   * Vibración para éxito o confirmación.
   */
  const triggerSuccess = useCallback(() => vibrate([10, 30, 10]), [vibrate]);

  /**
   * Vibración para errores o advertencias.
   */
  const triggerError = useCallback(() => vibrate([50, 30, 50]), [vibrate]);

  /**
   * Vibración de impacto.
   * @param {'light' | 'medium' | 'heavy'} style
   */
  const triggerImpact = useCallback((style = 'medium') => {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 40;
      vibrate(duration);
  }, [vibrate]);

  return { vibrate, triggerSelection, triggerSuccess, triggerError, triggerImpact };
};

export default useHaptic;

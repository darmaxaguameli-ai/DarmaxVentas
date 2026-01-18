// src/hooks/useHaptic.js
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Hook personalizado para manejar la retroalimentación háptica
export const useHaptic = () => {
  
  // Función para disparar una vibración de impacto
  // style: 'HEAVY', 'MEDIUM', 'LIGHT'
  const impact = async (style = ImpactStyle.Light) => {
    // Solo intentar vibrar si la plataforma no es web (es decir, es una app nativa)
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptic impact failed', error);
      }
    }
  };

  // Función para disparar una vibración de notificación simple
  const notification = async () => {
    if (Capacitor.getPlatform() !== 'web') {
        try {
          await Haptics.notification();
        } catch (error) {
          console.error('Haptic notification failed', error);
        }
    }
  };

  // Función para una vibración simple (buena para selecciones)
  const selection = async () => {
    if (Capacitor.getPlatform() !== 'web') {
        try {
          await Haptics.selectionStart();
        } catch (error) {
          console.error('Haptic selection failed', error);
        }
    }
  };

  return {
    impact,
    notification,
    selection,
  };
};

// Exportamos una instancia del hook para un uso rápido y sencillo
// Esto es opcional, pero permite usarlo sin necesidad de instanciarlo en cada componente
export const hapticFeedback = {
    impact: (style = ImpactStyle.Light) => {
        if (Capacitor.getPlatform() !== 'web') Haptics.impact({ style }).catch(e => console.error(e));
    },
    notification: () => {
        if (Capacitor.getPlatform() !== 'web') Haptics.notification().catch(e => console.error(e));
    },
    selection: () => {
        if (Capacitor.getPlatform() !== 'web') Haptics.selectionStart().catch(e => console.error(e));
    }
}
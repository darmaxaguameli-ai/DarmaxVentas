// src/hooks/useHaptic.js
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Hook personalizado para manejar la retroalimentación háptica
export const useHaptic = () => {
  
  // Función para disparar una vibración de impacto
  // style: 'HEAVY', 'MEDIUM', 'LIGHT'
  const impact = async (style = ImpactStyle.Light) => {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptic impact failed', error);
      }
    }
  };

  // Función compatible con nombres específicos usados en componentes
  const triggerImpact = async (styleName = 'light') => {
    const style = styleName.toUpperCase() === 'HEAVY' ? ImpactStyle.Heavy :
                  styleName.toUpperCase() === 'MEDIUM' ? ImpactStyle.Medium :
                  ImpactStyle.Light;
    await impact(style);
  };

  // Funciones de notificación específicas
  const triggerSuccess = async () => {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (error) {
        console.error('Haptic notification success failed', error);
      }
    }
  };

  const triggerError = async () => {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (error) {
        console.error('Haptic notification error failed', error);
      }
    }
  };

  // Función para disparar una vibración de notificación simple
  const notification = async (type = NotificationType.Success) => {
    if (Capacitor.getPlatform() !== 'web') {
        try {
          await Haptics.notification({ type });
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
    triggerImpact,
    triggerSuccess,
    triggerError,
    notification,
    selection,
  };
};

// Exportamos una instancia del hook para un uso rápido y sencillo
export const hapticFeedback = {
    impact: (style = ImpactStyle.Light) => {
        if (Capacitor.getPlatform() !== 'web') Haptics.impact({ style }).catch(e => console.error(e));
    },
    notification: (type = NotificationType.Success) => {
        if (Capacitor.getPlatform() !== 'web') Haptics.notification({ type }).catch(e => console.error(e));
    },
    selection: () => {
        if (Capacitor.getPlatform() !== 'web') Haptics.selectionStart().catch(e => console.error(e));
    }
}
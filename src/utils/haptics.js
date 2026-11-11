// src/utils/haptics.js
/**
 * Emite una vibración háptica táctil en dispositivos móviles compatibles.
 * Seguro en cualquier navegador o entorno (sin lanzar excepciones).
 * @param {number} duration Duración en milisegundos (por defecto: 15ms)
 */
export const triggerHaptic = (duration = 15) => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignorar silenciosamente si no está permitido
    }
  }
};

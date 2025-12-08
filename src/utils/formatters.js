// src/utils/formatters.js

/**
 * Formatea una cadena de fecha a un formato legible en español, corrigiendo el problema de la zona horaria.
 * Interpreta la fecha como UTC para evitar que se desplace un día.
 * @param {string | Date} dateInput - La fecha a formatear (puede ser una cadena ISO o un objeto Date).
 * @param {Intl.DateTimeFormatOptions} options - Opciones de formato para toLocaleDateString.
 * @returns {string} La fecha formateada.
 */
export const formatDate = (dateInput, options) => {
  if (!dateInput) return 'Fecha no especificada';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // ¡La clave está aquí!
  };

  const formatOptions = { ...defaultOptions, ...options };

  // Crear el objeto Date a partir de la entrada.
  const date = new Date(dateInput);

  // Si la fecha no es válida, devolver un mensaje de error.
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return date.toLocaleDateString('es-MX', formatOptions);
};

/**
 * Formatea un número a una representación de moneda en MXN.
 * @param {number} amount - La cantidad a formatear.
 * @returns {string} La cantidad formateada como moneda.
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return '$0.00';
  }
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
};

// A simple fetch-based API client


// Usa el proxy de Vite -> /api -> http://localhost:3001/api
const API_BASE_URL = '/api';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}), // por si algún día quieres añadir más
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        errorData.error || errorData.message || 'Network response was not ok'
      );
    }

    if (response.status === 204) {
      return;
    }

    return response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

export const fetchProducts = () => request('/products');

export const createProduct = (productData) =>
  request('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });

export const updateProduct = (id, productData) =>
  request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });

export const deleteProduct = (id) =>
  request(`/products/${id}`, {
    method: 'DELETE',
  });

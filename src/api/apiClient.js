// A simple fetch-based API client
// Usa el proxy de Vite -> /api -> http://localhost:3001/api

const API_BASE_URL = '/api';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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

// ====================================================================
//  PRODUCTOS (model Producto)
//  id: String (cuid, lo genera Prisma)
//  name: String
//  price: Float
//  stock: Int
//  imageUrl?: String
//  category?: String
// ====================================================================

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

// ====================================================================
//  INGRESOS (model Ingreso)
//  id: String (cuid)
//  description: String
//  amount: Float
//  date: DateTime (ISO string)
//  pedidoId?: String | null
//  dailySalesRecordId?: String | null
// ====================================================================

export const fetchIncomes = () => request('/incomes');

export const createIncome = (incomeData) =>
  request('/incomes', {
    method: 'POST',
    body: JSON.stringify(incomeData),
  });

export const updateIncome = (id, incomeData) =>
  request(`/incomes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(incomeData),
  });

export const deleteIncome = (id) =>
  request(`/incomes/${id}`, {
    method: 'DELETE',
  });

// ====================================================================
//  GASTOS (model Gasto)
//  id: String (cuid)
//  description: String
//  amount: Float
//  date: DateTime (ISO string)
// ====================================================================

export const fetchExpenses = () => request('/expenses');

export const createExpense = (expenseData) =>
  request('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });

export const updateExpense = (id, expenseData) =>
  request(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });

export const deleteExpense = (id) =>
  request(`/expenses/${id}`, {
    method: 'DELETE',
  });

// ====================================================================
//  USERS (model User)
//  id: String (cuid)
//  customId: String (OBLIGATORIO y unique, estilo "ADM-001", "CL-001")
//  name: String
//  email?: String
//  password?: String
//  phone?: String
//  street?: String
//  neighborhood?: String
//  city?: String
//  postalCode?: String
//  references?: String
//  role: UserRole (ADMIN, VENDEDOR, REPARTIDOR, CLIENTE)
// ====================================================================

export const fetchUsers = () => request('/users');

export const createUser = (userData) =>
  request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const updateUser = (id, userData) =>
  request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

export const deleteUser = (id) =>
  request(`/users/${id}`, {
    method: 'DELETE',
  });

// ====================================================================
//  DAILY SALES RECORDS (model DailySalesRecord)
// ====================================================================

export const fetchDailySalesRecords = () => request('/daily-sales-records');

export const createDailySalesRecord = (recordData) =>
  request('/daily-sales-records', {
    method: 'POST',
    body: JSON.stringify(recordData),
  });

export const createDailySalesRecordsBulk = (recordsData) =>
  request('/daily-sales-records/bulk', {
    method: 'POST',
    body: JSON.stringify(recordsData),
  });

// ====================================================================
//  BUSINESS CONFIGURATION
// ====================================================================

// --- Water Types ---
export const fetchWaterTypes = () => request('/water-types');
export const createWaterType = (data) => request('/water-types', { method: 'POST', body: JSON.stringify(data) });
export const updateWaterType = (id, data) => request(`/water-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWaterType = (id) => request(`/water-types/${id}`, { method: 'DELETE' });

// --- Service Prices ---
export const fetchServicePrices = () => request('/service-prices');
export const createServicePrice = (data) => request('/service-prices', { method: 'POST', body: JSON.stringify(data) });
export const updateServicePrice = (id, data) => request(`/service-prices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteServicePrice = (id) => request(`/service-prices/${id}`, { method: 'DELETE' });

// --- Jug Brands ---
export const fetchJugBrands = () => request('/jug-brands');
export const createJugBrand = (data) => request('/jug-brands', { method: 'POST', body: JSON.stringify(data) });
export const updateJugBrand = (id, data) => request(`/jug-brands/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteJugBrand = (id) => request(`/jug-brands/${id}`, { method: 'DELETE' });

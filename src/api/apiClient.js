import axios from 'axios';

// Crea una instancia de axios con una configuración base.
// El proxy de Vite se encargará de redirigir las peticiones de /api al backend en desarrollo.
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores de forma centralizada (opcional pero recomendado)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aquí puedes manejar errores de forma global, como un 401 (No autorizado)
    // que podría redirigir al login.
    const errorMessage = error.response?.data?.error || error.message;
    console.error('API Error:', errorMessage);
    
    // Rechaza la promesa con un error más limpio.
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

// ====================================================================
//  Wrapper functions para mantener la compatibilidad con el código existente
// ====================================================================

// ====================================================================
//  PRODUCTOS
// ====================================================================
export const fetchProducts = () => apiClient.get('/products').then(res => res.data);
export const createProduct = (productData) => apiClient.post('/products', productData).then(res => res.data);
export const updateProduct = (id, productData) => apiClient.put(`/products/${id}`, productData).then(res => res.data);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`).then(res => res.data);

// ====================================================================
//  INGRESOS
// ====================================================================
export const fetchIncomes = () => apiClient.get('/incomes').then(res => res.data);
export const createIncome = (incomeData) => apiClient.post('/incomes', incomeData).then(res => res.data);
export const updateIncome = (id, incomeData) => apiClient.put(`/incomes/${id}`, incomeData).then(res => res.data);
export const deleteIncome = (id) => apiClient.delete(`/incomes/${id}`).then(res => res.data);

// ====================================================================
//  GASTOS
// ====================================================================
export const fetchExpenses = () => apiClient.get('/expenses').then(res => res.data);
export const createExpense = (expenseData) => apiClient.post('/expenses', expenseData).then(res => res.data);
export const updateExpense = (id, expenseData) => apiClient.put(`/expenses/${id}`, expenseData).then(res => res.data);
export const deleteExpense = (id) => apiClient.delete(`/expenses/${id}`).then(res => res.data);

// ====================================================================
//  USERS
// ====================================================================
export const fetchUsers = () => apiClient.get('/users').then(res => res.data);
export const createUser = (userData) => apiClient.post('/users', userData).then(res => res.data);
export const updateUser = (id, userData) => apiClient.put(`/users/${id}`, userData).then(res => res.data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`).then(res => res.data);

// DAILY SALES RECORDS
export const fetchDailySalesRecords = () => apiClient.get('/daily-sales-records').then(res => res.data);
export const createDailySalesRecord = (recordData) => apiClient.post('/daily-sales-records', recordData).then(res => res.data);
export const createDailySalesRecordsBulk = (recordsData) => apiClient.post('/daily-sales-records/bulk', recordsData).then(res => res.data);
export const updateDailySalesRecord = (id, recordData) => apiClient.put(`/daily-sales-records/${id}`, recordData).then(res => res.data);
export const deleteDailySalesRecord = (id) => apiClient.delete(`/daily-sales-records/${id}`).then(res => res.data);

// ====================================================================
//  BUSINESS CONFIGURATION
// ====================================================================
// --- Water Types ---
export const fetchWaterTypes = () => apiClient.get('/water-types').then(res => res.data);
export const createWaterType = (data) => apiClient.post('/water-types', data).then(res => res.data);
export const updateWaterType = (id, data) => apiClient.put(`/water-types/${id}`, data).then(res => res.data);
export const deleteWaterType = (id) => apiClient.delete(`/water-types/${id}`).then(res => res.data);

// --- Service Prices ---
export const fetchServicePrices = () => apiClient.get('/service-prices').then(res => res.data);
export const fetchFilteredServicePrices = ({ method, waterTypeId, name }) => {
  return apiClient.get('/service-prices', {
    params: { method, waterTypeId, name }
  }).then(res => res.data);
};
export const createServicePrice = (data) => apiClient.post('/service-prices', data).then(res => res.data);
export const updateServicePrice = (id, data) => apiClient.put(`/service-prices/${id}`, data).then(res => res.data);
export const deleteServicePrice = (id) => apiClient.delete(`/service-prices/${id}`).then(res => res.data);

// --- Jug Brands ---
export const fetchJugBrands = () => apiClient.get('/jug-brands').then(res => res.data);
export const createJugBrand = (data) => apiClient.post('/jug-brands', data).then(res => res.data);
export const updateJugBrand = (id, data) => apiClient.put(`/jug-brands/${id}`, data).then(res => res.data);
export const deleteJugBrand = (id) => apiClient.delete(`/jug-brands/${id}`).then(res => res.data);

// ====================================================================
//  EMPLEADOS (HR)
// ====================================================================
export const fetchEmpleados = () => apiClient.get('/empleados').then(res => res.data);
export const createEmpleado = (empleadoData) => apiClient.post('/empleados', empleadoData).then(res => res.data);
export const updateEmpleado = (id, empleadoData) => apiClient.put(`/empleados/${id}`, empleadoData).then(res => res.data);
export const deleteEmpleado = (id) => apiClient.delete(`/empleados/${id}`).then(res => res.data);
export const fetchEmpleadoById = (id) => apiClient.get(`/empleados/${id}`).then(res => res.data);
export const uploadDocumento = (empleadoId, formData) => {
  return apiClient.post(`/empleados/${empleadoId}/documentos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

// ====================================================================
//  PEDIDOS
// ====================================================================
export const fetchOrders = () => apiClient.get('/pedidos').then(res => res.data);
export const createOrder = (orderData) => apiClient.post('/pedidos', orderData).then(res => res.data);
export const updateOrder = (id, data) => apiClient.put(`/pedidos/${id}`, data).then(res => res.data);

// ====================================================================
//  MY ORDERS (for logged-in client)
// ====================================================================
export const fetchMyOrders = () => apiClient.get('/my-orders').then(res => res.data);
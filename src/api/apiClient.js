import axios from 'axios';

// Crea una instancia de axios con una configuración base.
// El proxy de Vite se encargará de redirigir las peticiones de /api al backend en desarrollo.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token dinámicamente en cada petición desde localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de forma centralizada (opcional pero recomendado)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aquí puedes manejar errores de forma global, como un 401 (No autorizado)
    // que podría redirigir al login.
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error('API Error:', errorMessage);
    
    // Si el token es inválido o expiró, forzar cierre de sesión mediante un evento global
    if (status === 401 || (status === 403 && errorMessage?.toLowerCase().includes('token'))) {
       window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: errorMessage } }));
    }
    
    // Rechaza la promesa con un error más limpio.
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

// ====================================================================
//  Wrapper functions para mantener la compatibilidad con el código existente
// ====================================================================

// ====================================================================
//  FRANQUICIAS Y SUCURSALES (LOGÍSTICA)
// ====================================================================

// --- Franchises ---
export const fetchFranchises = () => apiClient.get('/franchises').then(res => res.data);
export const createFranchise = (data) => apiClient.post('/franchises', data).then(res => res.data);
export const updateFranchise = (id, data) => apiClient.put(`/franchises/${id}`, data).then(res => res.data);
export const deleteFranchise = (id) => apiClient.delete(`/franchises/${id}`).then(res => res.data);

// --- Stores ---
export const fetchStores = () => apiClient.get('/stores').then(res => res.data);
export const fetchNearestStore = (lat, lng) => apiClient.get('/stores/nearest', { params: { lat, lng } }).then(res => res.data);
export const createStore = (data) => apiClient.post('/stores', data).then(res => res.data);
export const updateStore = (id, data) => apiClient.put(`/stores/${id}`, data).then(res => res.data);
export const deleteStore = (id) => apiClient.delete(`/stores/${id}`).then(res => res.data);

// --- Product Categories ---
export const fetchProductCategories = () => apiClient.get('/product-categories').then(res => res.data);
export const createProductCategory = (data) => apiClient.post('/product-categories', data).then(res => res.data);
export const updateProductCategory = (id, data) => apiClient.put(`/product-categories/${id}`, data).then(res => res.data);

// ====================================================================
//  PRODUCTOS
// ====================================================================
export const fetchProducts = () => apiClient.get('/products').then(res => res.data);
export const createProduct = (productData) => apiClient.post('/products', productData).then(res => res.data);
export const importProductsBulk = (products) => apiClient.post('/products/bulk', products).then(res => res.data);
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
//  USERS & ROLES
// ====================================================================
export const fetchUsers = () => apiClient.get('/users').then(res => res.data);
export const fetchRoles = () => apiClient.get('/roles').then(res => res.data); // Nuevo: Obtener roles
export const createUser = (userData) => apiClient.post('/users', userData).then(res => res.data);
export const updateUser = (id, userData) => apiClient.put(`/users/${id}`, userData).then(res => res.data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`).then(res => res.data);
export const checkUser = (identifier, type) => apiClient.get('/users/check', { params: { identifier, type } }).then(res => res.data);

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
export const fetchEmpleados = () => apiClient.get('/hr/empleados').then(res => res.data);
export const createEmpleado = (empleadoData) => apiClient.post('/hr/empleados', empleadoData).then(res => res.data);
export const updateEmpleado = (id, empleadoData) => apiClient.put(`/hr/empleados/${id}`, empleadoData).then(res => res.data);
export const deleteEmpleado = (id) => apiClient.delete(`/hr/empleados/${id}`).then(res => res.data);
export const fetchEmpleadoById = (id) => apiClient.get(`/hr/empleados/${id}`).then(res => res.data);
export const uploadDocumento = (empleadoId, formData) => {
  return apiClient.post(`/hr/empleados/${empleadoId}/documentos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

export const fetchNominas = (empresaId) => apiClient.get('/hr', { params: { empresaId } }).then(res => res.data);
export const generarNomina = (data) => apiClient.post('/hr/generar', data).then(res => res.data);
export const pagarNomina = (id, cuentaBancariaId) => apiClient.post(`/hr/${id}/pagar`, { cuentaBancariaId }).then(res => res.data);

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

// ====================================================================
//  CASH DRAWER
// ====================================================================
export const fetchActiveCashDrawerSession = () => apiClient.get('/cash-drawer/active').then(res => res.data);
export const startCashDrawerSession = (openingBalance, initialTags) => apiClient.post('/cash-drawer/start', { openingBalance, initialTags }).then(res => res.data);
export const closeCashDrawerSession = (closingBalance) => apiClient.post('/cash-drawer/close', { closingBalance }).then(res => res.data);
export const createCashTransaction = (transactionData) => apiClient.post('/cash-drawer/transaction', transactionData).then(res => res.data);
export const reportDamagedTags = (quantity) => apiClient.post('/cash-drawer/report-tags', { quantity }).then(res => res.data);

// ====================================================================
//  EXTERNAL SERVICES
// ====================================================================
export const fetchPostalCodeData = (cp) => apiClient.get('/external/dipomex/codigo_postal', { params: { cp } }).then(res => res.data);

// Geocoding Proxy
export const geocodeAddress = (query) => apiClient.get('/external/geocode', { params: { query } }).then(res => res.data);

// ====================================================================
//  COTIZACIONES
// ====================================================================
export const createCotizacion = (data) => apiClient.post('/cotizaciones', data).then(res => res.data);
export const updateCotizacion = (id, data) => apiClient.put(`/cotizaciones/${id}`, data).then(res => res.data);
export const fetchCotizaciones = () => apiClient.get('/cotizaciones').then(res => res.data);
export const fetchCotizacion = (id) => apiClient.get(`/cotizaciones/${id}`).then(res => res.data);
export const fetchCotizacionByFolio = (folio) => apiClient.get(`/cotizaciones/folio/${folio}`).then(res => res.data);
export const fetchCotizacionesByCliente = (nombre) => apiClient.get(`/cotizaciones/cliente/${nombre}`).then(res => res.data);
export const fetchPublicCotizacion = (id) => apiClient.get(`/cotizaciones/public/${id}`).then(res => res.data);
export const deleteCotizacion = (id) => apiClient.delete(`/cotizaciones/${id}`).then(res => res.data);

// ====================================================================
//  SOLICITUDES DE PRODUCTO (NUEVO)
// ====================================================================
export const fetchSolicitudes = () => apiClient.get('/solicitudes').then(res => res.data);
export const createSolicitud = (data) => apiClient.post('/solicitudes', data).then(res => res.data);
export const fetchSolicitud = (id) => apiClient.get(`/solicitudes/${id}`).then(res => res.data);
export const fetchSolicitudByFolio = (folio) => apiClient.get(`/solicitudes/folio/${folio}`).then(res => res.data);
export const updateSolicitud = (id, data) => apiClient.put(`/solicitudes/${id}`, data).then(res => res.data);
export const deleteSolicitud = (id) => apiClient.delete(`/solicitudes/${id}`).then(res => res.data);


// ====================================================================
//  BLOG EXTERNO (DARMAXAGUA.COM.MX)
// ====================================================================
const EXTERNAL_BLOG_URL = 'https://darmaxagua.com.mx/api/blog';

export const fetchExternalBlogPosts = () => axios.get(EXTERNAL_BLOG_URL).then(res => res.data);
export const createExternalBlogPost = (data) => axios.post(EXTERNAL_BLOG_URL, data).then(res => res.data);
export const updateExternalBlogPost = (id, data) => axios.put(EXTERNAL_BLOG_URL, data, { params: { id } }).then(res => res.data);
export const deleteExternalBlogPost = (id) => axios.delete(EXTERNAL_BLOG_URL, { params: { id } }).then(res => res.data);

// ====================================================================
//  BLOG INTERNO / GUÍAS (API LOCAL)
// ====================================================================
export const fetchBlogPosts = (target) => apiClient.get('/blog', { params: { target } }).then(res => res.data);
export const fetchBlogPost = (slug) => apiClient.get('/blog', { params: { slug } }).then(res => res.data);
export const createBlogPost = (data) => apiClient.post('/blog', data).then(res => res.data);
export const updateBlogPost = (id, data) => apiClient.put(`/blog/${id}`, data).then(res => res.data);
export const deleteBlogPost = (id) => apiClient.delete(`/blog/${id}`).then(res => res.data);


// ====================================================================
//  LEGAL
// ====================================================================
export const fetchLegalDocuments = () => apiClient.get('/legal').then(res => res.data);
export const createLegalDocument = (data) => apiClient.post('/legal', data).then(res => res.data);
export const updateLegalDocument = (id, data) => apiClient.put(`/legal/${id}`, data).then(res => res.data);
export const deleteLegalDocument = (id) => apiClient.delete(`/legal/${id}`).then(res => res.data);
export const uploadLegalDocument = (formData) => apiClient.post('/legal/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);

// ====================================================================
//  LEADS / PROSPECCIÓN
// ====================================================================
export const fetchLeads = () => apiClient.get('/leads').then(res => res.data);
export const createLead = (data) => apiClient.post('/leads', data).then(res => res.data);
export const updateLead = (id, data) => apiClient.put(`/leads/${id}`, data).then(res => res.data);
export const deleteLead = (id) => apiClient.delete(`/leads/${id}`).then(res => res.data);

// ====================================================================
//  SHOWCASE / INSTALLATIONS
// ====================================================================
export const fetchShowcaseInstallations = () => apiClient.get('/showcase').then(res => res.data);
export const createShowcaseInstallation = (data) => apiClient.post('/showcase', data).then(res => res.data);
export const updateShowcaseInstallation = (id, data) => apiClient.put(`/showcase/${id}`, data).then(res => res.data);
export const deleteShowcaseInstallation = (id) => apiClient.delete(`/showcase/${id}`).then(res => res.data);

// ====================================================================
//  REPORTS
// ====================================================================
export const fetchConsolidatedReport = () => apiClient.get('/reports/consolidated').then(res => res.data);

// ====================================================================
//  INSTALACIONES / INGENIERÍA
// ====================================================================
export const fetchInstallationModels = () => apiClient.get('/installation-models').then(res => res.data);
export const createInstallationModel = (data) => apiClient.post('/installation-models', data).then(res => res.data);
export const updateInstallationModel = (id, data) => apiClient.put(`/installation-models/${id}`, data).then(res => res.data);
export const deleteInstallationModel = (id) => apiClient.delete(`/installation-models/${id}`).then(res => res.data);

// ====================================================================
//  NOTIFICATIONS
// ====================================================================
export const fetchNotifications = () => apiClient.get('/notifications').then(res => res.data);
export const createNotification = (data) => apiClient.post('/notifications', data).then(res => res.data);
export const markNotificationAsRead = (id) => apiClient.put(`/notifications/${id}/read`).then(res => res.data);
export const clearNotifications = () => apiClient.delete('/notifications').then(res => res.data);

export const fetchPromotions = (category) => apiClient.get('/promotions', { params: { category } }).then(res => res.data);
export const createPromotion = (promotion) => apiClient.post('/promotions', promotion).then(res => res.data);
export const updatePromotion = (id, promotion) => apiClient.put(`/promotions/${id}`, promotion).then(res => res.data);
export const deletePromotion = (id) => apiClient.delete(`/promotions/${id}`).then(res => res.data);

// =====================================================================
// PREFERENCIAS DE USUARIO
// =====================================================================

export const fetchUserPreferences = () => apiClient.get('/user-preferences').then(res => res.data);
export const saveUserPreferences = (preferences) => apiClient.post('/user-preferences', { preferences }).then(res => res.data);

// ====================================================================
// CONTABILIDAD
// ====================================================================
export const fetchContableEmpresas = () => apiClient.get('/accounting/empresas').then(res => res.data);
export const createContableEmpresa = (data) => apiClient.post('/accounting/empresas', data).then(res => res.data);
export const updateContableEmpresa = (id, data) => apiClient.put(`/accounting/empresas/${id}`, data).then(res => res.data);

export const fetchContableEjercicios = (empresaId) => apiClient.get('/accounting/ejercicios', { params: { empresaId } }).then(res => res.data);
export const createContableEjercicio = (data) => apiClient.post('/accounting/ejercicios', data).then(res => res.data);
export const toggleContablePeriodo = (id) => apiClient.put(`/accounting/periodos/${id}/toggle`).then(res => res.data);

export const fetchContableSucursales = (empresaId) => apiClient.get('/accounting/sucursales', { params: { empresaId } }).then(res => res.data);
export const createContableSucursal = (data) => apiClient.post('/accounting/sucursales', data).then(res => res.data);
export const deleteContableSucursal = (id) => apiClient.delete(`/accounting/sucursales/${id}`).then(res => res.data);

export const fetchContableCuentas = (empresaId) => apiClient.get('/accounting/cuentas', { params: { empresaId } }).then(res => res.data);
export const createContableCuenta = (data) => apiClient.post('/accounting/cuentas', data).then(res => res.data);
export const updateContableCuenta = (id, data) => apiClient.put(`/accounting/cuentas/${id}`, data).then(res => res.data);
export const deleteContableCuenta = (id) => apiClient.delete(`/accounting/cuentas/${id}`).then(res => res.data);

export const fetchContableBancos = (empresaId) => apiClient.get('/accounting/bancos', { params: { empresaId } }).then(res => res.data);
export const createContableBanco = (data) => apiClient.post('/accounting/bancos', data).then(res => res.data);

export const fetchContableMovimientos = (cuentaBancariaId) => apiClient.get('/accounting/movimientos', { params: { cuentaBancariaId } }).then(res => res.data);
export const createContableMovimiento = (data) => apiClient.post('/accounting/movimientos', data).then(res => res.data);

export const fetchContablePolizas = (empresaId) => apiClient.get('/accounting/polizas', { params: { empresaId } }).then(res => res.data);
export const createContablePoliza = (data) => apiClient.post('/accounting/polizas', data).then(res => res.data);

export const fetchContableCentrosCosto = (empresaId) => apiClient.get('/accounting/centros-costo', { params: { empresaId } }).then(res => res.data);
export const createContableCentroCosto = (data) => apiClient.post('/accounting/centros-costo', data).then(res => res.data);

export const createContableTercero = (data) => apiClient.post('/accounting/terceros', data).then(res => res.data);

export const fetchContableContratos = (empresaId, centroCostoId) => apiClient.get('/accounting/contratos', { params: { empresaId, centroCostoId } }).then(res => res.data);
export const createContableContrato = (data) => apiClient.post('/accounting/contratos', data).then(res => res.data);

export const fetchContableDocumentos = (empresaId) => apiClient.get('/accounting/documentos', { params: { empresaId } }).then(res => res.data);
export const uploadContableDocumento = (formData) => {
  return apiClient.post('/accounting/documentos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

export const fetchContableRentabilidad = (empresaId, mes, anio) => apiClient.get('/accounting/rentabilidad', { params: { empresaId, mes, anio } }).then(res => res.data);

export const fetchContableBalanza = (empresaId, mes, anio) => apiClient.get('/accounting/balanza', { params: { empresaId, mes, anio } }).then(res => res.data);
export const fetchContableLibroMayor = (empresaId, cuentaId) => apiClient.get('/accounting/libro-mayor', { params: { empresaId, cuentaId } }).then(res => res.data);
export const fetchContableEstadoResultados = (empresaId) => apiClient.get('/accounting/estado-resultados', { params: { empresaId } }).then(res => res.data);

// ====================================================================
// VENDING
// ====================================================================
export const fetchVendingMachines = () => apiClient.get('/vending/machines').then(res => res.data);
export const createVendingMachine = (data) => apiClient.post('/vending/machines', data).then(res => res.data);

export const fetchVendingCortes = (machineId) => apiClient.get('/vending/cortes', { params: { machineId } }).then(res => res.data);
export const createVendingCorte = (data) => apiClient.post('/vending/cortes', data).then(res => res.data);

// ====================================================================
// COMPRAS / CXP
// ====================================================================
export const fetchSolicitudesCompra = (empresaId) => apiClient.get('/purchases/solicitudes', { params: { empresaId } }).then(res => res.data);
export const createSolicitudCompra = (data) => apiClient.post('/purchases/solicitudes', data).then(res => res.data);

export const fetchOrdenesCompra = (empresaId) => apiClient.get('/purchases/ordenes', { params: { empresaId } }).then(res => res.data);
export const createOrdenCompra = (data) => apiClient.post('/purchases/ordenes', data).then(res => res.data);

export const createRecepcionCompra = (data) => apiClient.post('/purchases/recepciones', data).then(res => res.data);

export const fetchCxP = (empresaId, status) => apiClient.get('/purchases/cxp', { params: { empresaId, status } }).then(res => res.data);
export const pagarCxP = (id, data) => apiClient.post(`/purchases/cxp/${id}/pagar`, data).then(res => res.data);

// ====================================================================
// FISCAL
// ====================================================================
export const fetchFiscalFacturas = (empresaId) => apiClient.get('/fiscal/facturas', { params: { empresaId } }).then(res => res.data);
export const createFiscalFacturaPedido = (data) => apiClient.post('/fiscal/facturar-pedido', data).then(res => res.data);
export const cancelFiscalFactura = (id, motive) => apiClient.post(`/fiscal/cancelar/${id}`, { motive }).then(res => res.data);

// =====================================================================
// OTROS
// =====================================================================
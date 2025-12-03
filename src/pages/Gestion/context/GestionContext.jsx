import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "../../../context/AuthContext";
import Swal from 'sweetalert2'; // Importar SweetAlert2
import {
  // Product
  fetchProducts as apiFetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  // User
  fetchUsers as apiFetchUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  // Income
  fetchIncomes as apiFetchIncomes,
  createIncome as apiCreateIncome,
  updateIncome as apiUpdateIncome,
  deleteIncome as apiDeleteIncome,
  // Expense
  fetchExpenses as apiFetchExpenses,
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
  // Daily Sales
  fetchDailySalesRecords as apiFetchDailySalesRecords,
  createDailySalesRecord as apiCreateDailySalesRecord,
  createDailySalesRecordsBulk as apiCreateDailySalesRecordsBulk,
  updateDailySalesRecord as apiUpdateDailySalesRecord,
  deleteDailySalesRecord as apiDeleteDailySalesRecord,
  // Business Config
  fetchWaterTypes as apiFetchWaterTypes,
  createWaterType as apiCreateWaterType,
  updateWaterType as apiUpdateWaterType,
  deleteWaterType as apiDeleteWaterType,
  fetchServicePrices as apiFetchServicePrices,
  createServicePrice as apiCreateServicePrice,
  updateServicePrice as apiUpdateServicePrice,
  deleteServicePrice as apiDeleteServicePrice,
  fetchJugBrands as apiFetchJugBrands,
  createJugBrand as apiCreateJugBrand,
  updateJugBrand as apiUpdateJugBrand,
  deleteJugBrand as apiDeleteJugBrand,
} from "../../../api/apiClient";

const GestionContext = createContext(null);
// ... (useGestion y el reducer se mantienen igual)
export const useGestion = () => {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error("useGestion must be used within a GestionProvider");
  }
  return context;
};

const initialState = {
  inventory: [],
  users: [],
  income: [],
  expenses: [],
  dailySalesRecords: [],
  waterTypes: [],
  servicePrices: [],
  jugBrands: [],
  loading: true,
  error: null,
};

const gestionReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "SET_INITIAL_DATA":
      return {
        ...state,
        inventory: action.payload.inventory || state.inventory,
        users: action.payload.users || state.users,
        income: action.payload.income || state.income,
        expenses: action.payload.expenses || state.expenses,
        dailySalesRecords: action.payload.dailySalesRecords || state.dailySalesRecords,
        waterTypes: action.payload.waterTypes || state.waterTypes,
        servicePrices: action.payload.servicePrices || state.servicePrices,
        jugBrands: action.payload.jugBrands || state.jugBrands,
        loading: false,
      };
    case "ADD_PRODUCT":
      return { ...state, inventory: [...state.inventory, action.payload] };
    case "ADD_USER":
        return { ...state, users: [...state.users, action.payload] };
    case "ADD_INCOME":
        return { ...state, income: [...state.income, action.payload] };
    case "ADD_EXPENSE":
        return { ...state, expenses: [...state.expenses, action.payload] };
    case "ADD_WATER_TYPE":
      return { ...state, waterTypes: [...state.waterTypes, action.payload] };
    case "ADD_SERVICE_PRICE":
        return { ...state, servicePrices: [...state.servicePrices, action.payload] };
    case "ADD_JUG_BRAND":
        return { ...state, jugBrands: [...state.jugBrands, action.payload] };
    case "UPDATE_PRODUCT_IN_STATE": // Nuevo caso para actualizar un producto en el estado local
        return {
            ...state,
            inventory: state.inventory.map(prod => prod.id === action.payload.id ? action.payload : prod)
        };
    case "DELETE_PRODUCT_FROM_STATE": // Nuevo caso para eliminar un producto del estado local
        return {
            ...state,
            inventory: state.inventory.filter(prod => prod.id !== action.payload)
        };
    default:
      return state;
  }
};


export const GestionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gestionReducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuth(); // Usar AuthContext

  const fetchManagementData = useCallback(async () => {
    // No hacer nada si no está autenticado
    if (!isAuthenticated) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [
        inventory, users, income, expenses, dailySalesRecords,
        waterTypes, servicePrices, jugBrands,
      ] = await Promise.all([
        apiFetchProducts(), apiFetchUsers(), apiFetchIncomes(), apiFetchExpenses(), apiFetchDailySalesRecords(),
        apiFetchWaterTypes(), apiFetchServicePrices(), apiFetchJugBrands(),
      ]);
      dispatch({
        type: "SET_INITIAL_DATA",
        payload: { inventory, users, income, expenses, dailySalesRecords, waterTypes, servicePrices, jugBrands },
      });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      Swal.fire('Error', error.message, 'error');
    }
  }, [isAuthenticated]); // Depender de isAuthenticated

  useEffect(() => {
    // Solo cargar datos si la autenticación no está cargando y el usuario está autenticado
    if (!authLoading && isAuthenticated) {
      fetchManagementData();
    }
  }, [authLoading, isAuthenticated, fetchManagementData]);

  // ... (resto del provider se mantiene igual)
  const createCrudActions = (modelName, api) => ({
    [`add${modelName}`]: useCallback(async (data) => {
      try {
        const newRecord = await api[`create${modelName}`](data);
        dispatch({ type: `ADD_${modelName.toUpperCase()}`, payload: newRecord });
        Swal.fire('Éxito', `${modelName} añadido exitosamente.`, 'success');
        return newRecord;
      } catch (error) {
        Swal.fire('Error', `Error al añadir ${modelName.toLowerCase()}: ${error.message}`, 'error');
        throw error;
      }
    }, []),
    [`update${modelName}`]: useCallback(async (id, data) => {
      try {
        const updatedRecord = await api[`update${modelName}`](id, data);
        await fetchManagementData(); // Refrescar todos los datos para asegurar consistencia
        Swal.fire('Éxito', `${modelName} actualizado exitosamente.`, 'success');
        return updatedRecord;
      } catch (error) {
        Swal.fire('Error', `Error al actualizar ${modelName.toLowerCase()}: ${error.message}`, 'error');
        throw error;
      }
    }, [fetchManagementData]),
    [`delete${modelName}`]: useCallback(async (id) => {
      try {
        await api[`delete${modelName}`](id);
        await fetchManagementData(); // Refrescar todos los datos
        Swal.fire('Éxito', `${modelName} eliminado exitosamente.`, 'success');
      } catch (error) {
        Swal.fire('Error', `Error al eliminar ${modelName.toLowerCase()}: ${error.message}`, 'error');
        throw error;
      }
    }, [fetchManagementData]),
  });

  const productActions = createCrudActions('Product', { createProduct: apiCreateProduct, updateProduct: apiUpdateProduct, deleteProduct: apiDeleteProduct });
  const userActions = createCrudActions('User', { createUser: apiCreateUser, updateUser: apiUpdateUser, deleteUser: apiDeleteUser });
  const waterTypeActions = createCrudActions('WaterType', { createWaterType: apiCreateWaterType, updateWaterType: apiUpdateWaterType, deleteWaterType: apiDeleteWaterType });
  const servicePriceActions = createCrudActions('ServicePrice', { createServicePrice: apiCreateServicePrice, updateServicePrice: apiUpdateServicePrice, deleteServicePrice: apiDeleteServicePrice });
  const jugBrandActions = createCrudActions('JugBrand', { createJugBrand: apiCreateJugBrand, updateJugBrand: apiUpdateJugBrand, deleteJugBrand: apiDeleteJugBrand });
  const expenseActions = createCrudActions('Expense', { createExpense: apiCreateExpense, updateExpense: apiUpdateExpense, deleteExpense: apiDeleteExpense });
  const incomeActions = createCrudActions('Income', { createIncome: apiCreateIncome, updateIncome: apiUpdateIncome, deleteIncome: apiDeleteIncome });

  // Custom actions that don't fit the generic CRUD pattern
  const addDailySalesRecord = useCallback(async (recordData) => {
    try {
      await apiCreateDailySalesRecord(recordData);
      await fetchManagementData();
      Swal.fire('Éxito', 'Registro de ventas diarias añadido exitosamente.', 'success');
    } catch (error) {
      Swal.fire('Error', `Error al añadir registro de ventas diarias: ${error.message}`, 'error');
      throw error;
    }
  }, [fetchManagementData]);

  const addDailySalesRecordsBulk = useCallback(async (recordsData) => {
    try {
      const response = await apiCreateDailySalesRecordsBulk(recordsData);
      await fetchManagementData(); 
      Swal.fire('Éxito', response.message || 'Registros de ventas diarias importados exitosamente.', 'success');
    } catch (error) {
      Swal.fire('Error', `Error al importar registros de ventas diarias: ${error.message}`, 'error');
      throw error;
    }
  }, [fetchManagementData]);

  const updateDailySalesRecord = useCallback(async (id, recordData) => {
    try {
      await apiUpdateDailySalesRecord(id, recordData);
      await fetchManagementData();
      Swal.fire('Éxito', 'Registro de ventas diarias actualizado exitosamente.', 'success');
    } catch (error) {
      Swal.fire('Error', `Error al actualizar registro de ventas diarias: ${error.message}`, 'error');
      throw error;
    }
  }, [fetchManagementData]);

  const deleteDailySalesRecord = useCallback(async (id) => {
    try {
      await apiDeleteDailySalesRecord(id);
      await fetchManagementData();
      Swal.fire('Éxito', 'Registro de ventas diarias eliminado exitosamente.', 'success');
    } catch (error) {
      Swal.fire('Error', `Error al eliminar registro de ventas diarias: ${error.message}`, 'error');
      throw error;
    }
  }, [fetchManagementData]);

  const value = {
    state,
    fetchManagementData,
    ...productActions,
    ...userActions,
    ...waterTypeActions,
    ...servicePriceActions,
    ...jugBrandActions,
    ...expenseActions,
    ...incomeActions,
    addDailySalesRecord,
    addDailySalesRecordsBulk,
    updateDailySalesRecord,
    deleteDailySalesRecord,
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
};
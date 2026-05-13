import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "../../../context/AuthContext";
import Swal from 'sweetalert2';
import {
  // Product
  fetchProducts as apiFetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  // User (Clients)
  fetchUsers as apiFetchUsers,
  fetchRoles as apiFetchRoles,
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
  // Empleados
  fetchEmpleados as apiFetchEmpleados,
  createEmpleado as apiCreateEmpleado,
  updateEmpleado as apiUpdateEmpleado,
  deleteEmpleado as apiDeleteEmpleado,
  // Logistics (Franchise & Store)
  fetchFranchises as apiFetchFranchises,
  createFranchise as apiCreateFranchise,
  updateFranchise as apiUpdateFranchise,
  deleteFranchise as apiDeleteFranchise,
  fetchStores as apiFetchStores,
  createStore as apiCreateStore,
  updateStore as apiUpdateStore,
  deleteStore as apiDeleteStore,
  // Instalaciones
  fetchInstallationModels as apiFetchInstallationModels,
  createInstallationModel as apiCreateInstallationModel,
  updateInstallationModel as apiUpdateInstallationModel,
  deleteInstallationModel as apiDeleteInstallationModel,
} from "../../../api/apiClient";

const GestionContext = createContext(null);

export const useGestion = () => {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error("useGestion must be used within a GestionProvider");
  }
  return context;
};

const initialState = {
  inventory: [],
  users: [], // Clientes y Personal
  roles: [], 
  income: [],
  expenses: [],
  waterTypes: [],
  servicePrices: [],
  jugBrands: [],
  empleados: [],
  franchises: [],
  stores: [],
  installationModels: [], // Nuevo
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
        roles: action.payload.roles || state.roles,
        income: action.payload.income || state.income,
        expenses: action.payload.expenses || state.expenses,
        waterTypes: action.payload.waterTypes || state.waterTypes,
        servicePrices: action.payload.servicePrices || state.servicePrices,
        jugBrands: action.payload.jugBrands || state.jugBrands,
        empleados: action.payload.empleados || state.empleados,
        franchises: action.payload.franchises || state.franchises,
        stores: action.payload.stores || state.stores,
        installationModels: action.payload.installationModels || state.installationModels, // Nuevo
        loading: false,
      };
    default:
      return state;
  }
};


export const GestionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gestionReducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const fetchManagementData = useCallback(async () => {
    if (!isAuthenticated) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [
        inventory, users, roles, income, expenses,
        waterTypes, servicePrices, jugBrands, empleados, franchises, stores, installationModels
      ] = await Promise.all([
        apiFetchProducts(), apiFetchUsers(), apiFetchRoles(), apiFetchIncomes(), apiFetchExpenses(),
        apiFetchWaterTypes(), apiFetchServicePrices(), apiFetchJugBrands(), apiFetchEmpleados(), apiFetchFranchises(), apiFetchStores(), apiFetchInstallationModels()
      ]);
      dispatch({
        type: "SET_INITIAL_DATA",
        payload: { inventory, users, roles, income, expenses, waterTypes, servicePrices, jugBrands, empleados, franchises, stores, installationModels },
      });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchManagementData();
    }
  }, [authLoading, isAuthenticated, fetchManagementData]);

  const createCrudActions = (modelName, api, label) => ({
    [`add${label || modelName}`]: useCallback(async (data) => {
      try {
        const newRecord = await api[`create${modelName}`](data);
        await fetchManagementData();
        return newRecord;
      } catch (error) {
        Swal.fire('Error', `Error al añadir: ${error.message}`, 'error');
        throw error;
      }
    }, [fetchManagementData]),
    [`update${label || modelName}`]: useCallback(async (id, data) => {
      try {
        const updatedRecord = await api[`update${modelName}`](id, data);
        await fetchManagementData();
        return updatedRecord;
      } catch (error) {
        Swal.fire('Error', `Error al actualizar: ${error.message}`, 'error');
        throw error;
      }
    }, [fetchManagementData]),
    [`delete${label || modelName}`]: useCallback(async (id) => {
      try {
        await api[`delete${modelName}`](id);
        await fetchManagementData();
      } catch (error) {
        Swal.fire('Error', `Error al eliminar: ${error.message}`, 'error');
        throw error;
      }
    }, [fetchManagementData]),
  });

  const productActions = createCrudActions('Product', { createProduct: apiCreateProduct, updateProduct: apiUpdateProduct, deleteProduct: apiDeleteProduct });
  
  // Acciones para CLIENTES (mapeadas a las funciones de User en la API)
  const clientActions = createCrudActions('User', { createUser: apiCreateUser, updateUser: apiUpdateUser, deleteUser: apiDeleteUser }, 'Client');
  
  const waterTypeActions = createCrudActions('WaterType', { createWaterType: apiCreateWaterType, updateWaterType: apiUpdateWaterType, deleteWaterType: apiDeleteWaterType });
  const servicePriceActions = createCrudActions('ServicePrice', { createServicePrice: apiCreateServicePrice, updateServicePrice: apiUpdateServicePrice, deleteServicePrice: apiDeleteServicePrice });
  const jugBrandActions = createCrudActions('JugBrand', { createJugBrand: apiCreateJugBrand, updateJugBrand: apiUpdateJugBrand, deleteJugBrand: apiDeleteJugBrand });
  const expenseActions = createCrudActions('Expense', { createExpense: apiCreateExpense, updateExpense: apiUpdateExpense, deleteExpense: apiDeleteExpense });
  const incomeActions = createCrudActions('Income', { createIncome: apiCreateIncome, updateIncome: apiUpdateIncome, deleteIncome: apiDeleteIncome });
  
  const empleadoActions = {
    ...createCrudActions('Empleado', { 
        createEmpleado: apiCreateEmpleado, 
        updateEmpleado: apiUpdateEmpleado, 
        deleteEmpleado: apiDeleteEmpleado 
    }),
    addEmpleado: useCallback(async (data) => {
        try {
            let userId = data.userId;
            if (data._createAccount) {
                const userPayload = {
                    name: data.nombreCompleto,
                    email: data._createAccount.email,
                    password: data._createAccount.password,
                    roleIds: data._createAccount.roleIds,
                    sexo: data._createAccount.sexo,
                    storeId: data._createAccount.storeId, // ✅ Vincular sucursal
                    type: 'COLABORADOR', // ✅ Asegurar que el backend sepa que es colaborador
                    phone: data.telefono,
                    street: data.street,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    postalCode: data.postalCode
                };
                const newUser = await apiCreateUser(userPayload);
                userId = newUser.id;
            }
            const { _createAccount, ...empleadoPayload } = data;
            const finalPayload = { ...empleadoPayload, userId };
            const newEmpleado = await apiCreateEmpleado(finalPayload);
            await fetchManagementData();
            Swal.fire('Éxito', 'Personal registrado correctamente.', 'success');
            return newEmpleado;
        } catch (error) {
            console.error("Error en alta de personal:", error);
            Swal.fire('Error', `No se pudo completar el registro: ${error.response?.data?.error || error.message}`, 'error');
            throw error;
        }
    }, [fetchManagementData]),
    updateEmpleado: useCallback(async (id, data) => {
        try {
            const updatedRecord = await apiUpdateEmpleado(id, data);
            await fetchManagementData();
            Swal.fire('Éxito', 'Expediente actualizado exitosamente.', 'success');
            return updatedRecord;
        } catch (error) {
            console.error("Error al actualizar empleado:", error);
            Swal.fire('Error', `Error al actualizar: ${error.message}`, 'error');
            throw error;
        }
    }, [fetchManagementData])
  };

  const franchiseActions = createCrudActions('Franchise', { createFranchise: apiCreateFranchise, updateFranchise: apiUpdateFranchise, deleteFranchise: apiDeleteFranchise });
  const storeActions = createCrudActions('Store', { createStore: apiCreateStore, updateStore: apiUpdateStore, deleteStore: apiDeleteStore });
  const installationModelActions = createCrudActions('InstallationModel', { createInstallationModel: apiCreateInstallationModel, updateInstallationModel: apiUpdateInstallationModel, deleteInstallationModel: apiDeleteInstallationModel });

  const value = {
    state,
    fetchManagementData,
    ...productActions,
    ...clientActions, // Esto proporciona addClient, updateClient, deleteClient
    ...waterTypeActions,
    ...servicePriceActions,
    ...jugBrandActions,
    ...expenseActions,
    ...incomeActions,
    ...empleadoActions,
    ...franchiseActions,
    ...storeActions,
    ...installationModelActions,
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
};

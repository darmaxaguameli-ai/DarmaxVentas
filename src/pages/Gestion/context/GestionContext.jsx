import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import {
  fetchProducts as apiFetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  fetchUsers as apiFetchUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
} from "../../../api/apiClient";

const GestionContext = createContext(null);

export const useGestion = () => {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error("useGestion must be used within a GestionProvider");
  }
  return context;
};

// Initial state - now with loading/error for API calls
const initialState = {
  inventory: [],
  loading: false,
  error: null,

  // Por ahora income/expenses siguen mock, luego los conectamos
  income: [
    {
      id: 1,
      description: "Venta de 10 garrafones 20L",
      amount: 350,
      date: "2025-11-24",
      pedidoId: "ORD-0001",
    },
    {
      id: 2,
      description: "Venta de 5 garrafones 10L",
      amount: 125,
      date: "2025-11-24",
      pedidoId: "ORD-0002",
    },
  ],
  expenses: [
    {
      id: 1,
      description: "Compra de filtros",
      amount: 1500,
      date: "2025-11-24",
    },
    {
      id: 2,
      description: "Gasolina de vehículo de reparto",
      amount: 800,
      date: "2025-11-24",
    },
  ],

  // 👇 YA NO simulados, estos vendrán de la BD
  users: [],

  dailySalesRecords: [],
};

const gestionReducer = (state, action) => {
  switch (action.type) {
    // API status
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    // Inventory
    case "SET_INVENTORY":
      return { ...state, inventory: action.payload, loading: false };
    case "ADD_PRODUCT":
      return { ...state, inventory: [...state.inventory, action.payload] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        inventory: state.inventory.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        inventory: state.inventory.filter(
          (p) => p.id !== action.payload.id
        ),
      };

    // Income
    case "ADD_INCOME":
      return {
        ...state,
        income: [
          ...state.income,
          { ...action.payload, id: crypto.randomUUID() },
        ],
      };
    case "UPDATE_INCOME":
      return {
        ...state,
        income: state.income.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case "DELETE_INCOME":
      return {
        ...state,
        income: state.income.filter((i) => i.id !== action.payload.id),
      };

    // Expenses
    case "ADD_EXPENSE":
      return {
        ...state,
        expenses: [
          ...state.expenses,
          { ...action.payload, id: crypto.randomUUID() },
        ],
      };
    case "UPDATE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter(
          (e) => e.id !== action.payload.id
        ),
      };

    // Users (conectados a API)
    case "SET_USERS":
      return { ...state, users: action.payload, loading: false };

    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? action.payload : u
        ),
      };

    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter(
          (u) => u.id !== action.payload.id
        ),
      };

    // Daily sales
    case "ADD_DAILY_SALES_RECORD": {
      const newRecord = {
        ...action.payload,
        id: `dsr-${crypto.randomUUID()}`,
      };
      return {
        ...state,
        dailySalesRecords: [...state.dailySalesRecords, newRecord],
      };
    }
    case "UPDATE_DAILY_SALES_RECORD":
      return {
        ...state,
        dailySalesRecords: state.dailySalesRecords.map((dsr) =>
          dsr.id === action.payload.id ? action.payload : dsr
        ),
      };
    case "DELETE_DAILY_SALES_RECORD":
      return {
        ...state,
        dailySalesRecords: state.dailySalesRecords.filter(
          (dsr) => dsr.id !== action.payload.id
        ),
      };

    default:
      return state;
  }
};

export const GestionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gestionReducer, initialState);

  // ===========================
  // INVENTARIO (Productos)
  // ===========================
  const fetchInventory = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const products = await apiFetchProducts();
      dispatch({ type: "SET_INVENTORY", payload: products });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await apiCreateProduct(productData);
      dispatch({ type: "ADD_PRODUCT", payload: newProduct });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const updateProductAction = useCallback(async (product) => {
    try {
      const updated = await apiUpdateProduct(product.id, product);
      dispatch({ type: "UPDATE_PRODUCT", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const deleteProductAction = useCallback(async (id) => {
    try {
      await apiDeleteProduct(id);
      dispatch({ type: "DELETE_PRODUCT", payload: { id } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  // ===========================
  // INCOME (mock por ahora)
  // ===========================
  const addIncome = (income) =>
    dispatch({ type: "ADD_INCOME", payload: income });
  const updateIncome = (income) =>
    dispatch({ type: "UPDATE_INCOME", payload: income });
  const deleteIncome = (id) =>
    dispatch({ type: "DELETE_INCOME", payload: { id } });

  // ===========================
  // EXPENSES (mock por ahora)
  // ===========================
  const addExpense = (expense) =>
    dispatch({ type: "ADD_EXPENSE", payload: expense });
  const updateExpense = (expense) =>
    dispatch({ type: "UPDATE_EXPENSE", payload: expense });
  const deleteExpense = (id) =>
    dispatch({ type: "DELETE_EXPENSE", payload: { id } });

  // ===========================
  // USERS (API REAL)
  // ===========================
  const fetchUsers = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const users = await apiFetchUsers();
      dispatch({ type: "SET_USERS", payload: users });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const addUser = useCallback(async (userData) => {
    try {
      const newUser = await apiCreateUser(userData);
      dispatch({ type: "ADD_USER", payload: newUser });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const updateUser = useCallback(async (user) => {
    try {
      const updated = await apiUpdateUser(user.id, user);
      dispatch({ type: "UPDATE_USER", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const deleteUser = useCallback(async (id) => {
    try {
      await apiDeleteUser(id);
      dispatch({ type: "DELETE_USER", payload: { id } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  // ===========================
  // DAILY SALES (mock)
  // ===========================
  const addDailySalesRecord = (record) => {
    const newRecordWithId = {
      ...record,
      id: `dsr-${crypto.randomUUID()}`,
    };
    dispatch({
      type: "ADD_DAILY_SALES_RECORD",
      payload: newRecordWithId,
    });
    return newRecordWithId;
  };
  const updateDailySalesRecord = (record) =>
    dispatch({
      type: "UPDATE_DAILY_SALES_RECORD",
      payload: record,
    });
  const deleteDailySalesRecord = (id) =>
    dispatch({
      type: "DELETE_DAILY_SALES_RECORD",
      payload: { id },
    });

  const value = {
    state,
    // productos
    fetchInventory,
    addProduct,
    updateProduct: updateProductAction,
    deleteProduct: deleteProductAction,
    // income
    addIncome,
    updateIncome,
    deleteIncome,
    // expenses
    addExpense,
    updateExpense,
    deleteExpense,
    // users (API)
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    // daily sales
    addDailySalesRecord,
    updateDailySalesRecord,
    deleteDailySalesRecord,
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
};

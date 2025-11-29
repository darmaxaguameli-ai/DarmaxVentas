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
} from "../../../api/apiClient";

const GestionContext = createContext(null); // 👈 mejor dejarlo explícito

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
  users: [
    {
      id: "cl-001",
      customId: "ADM-001",
      name: "Ana Sofía Rodríguez",
      email: "sofia.r@example.com",
      phone: "55-1234-5678",
      role: "ADMIN",
      street: "Av. Siempre Viva 123",
      neighborhood: "Centro",
      city: "Ciudad Ejemplo",
      postalCode: "12345",
      createdAt: new Date().toISOString(),
    },
  ],
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

    // Users
    case "ADD_USER": {
      const newUser = {
        ...action.payload,
        id: `cl-${crypto.randomUUID()}`,
        customId: `${action.payload.role
          .substring(0, 3)
          .toUpperCase()}-${String(
          Math.floor(Math.random() * 900) + 100
        )}`,
      };
      return { ...state, users: [...state.users, newUser] };
    }
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

  const addIncome = (income) =>
    dispatch({ type: "ADD_INCOME", payload: income });
  const updateIncome = (income) =>
    dispatch({ type: "UPDATE_INCOME", payload: income });
  const deleteIncome = (id) =>
    dispatch({ type: "DELETE_INCOME", payload: { id } });

  const addExpense = (expense) =>
    dispatch({ type: "ADD_EXPENSE", payload: expense });
  const updateExpense = (expense) =>
    dispatch({ type: "UPDATE_EXPENSE", payload: expense });
  const deleteExpense = (id) =>
    dispatch({ type: "DELETE_EXPENSE", payload: { id } });

  const addUser = (user) =>
    dispatch({ type: "ADD_USER", payload: user });
  const updateUser = (user) =>
    dispatch({ type: "UPDATE_USER", payload: user });
  const deleteUser = (id) =>
    dispatch({ type: "DELETE_USER", payload: { id } });

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
    fetchInventory,
    addProduct,
    updateProduct: updateProductAction,
    deleteProduct: deleteProductAction,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addUser,
    updateUser,
    deleteUser,
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

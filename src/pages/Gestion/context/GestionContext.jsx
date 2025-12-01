import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
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
  fetchIncomes as apiFetchIncomes,
  createIncome as apiCreateIncome,
  updateIncome as apiUpdateIncome,
  deleteIncome as apiDeleteIncome,
  fetchExpenses as apiFetchExpenses,
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
  fetchDailySalesRecords as apiFetchDailySalesRecords,
  createDailySalesRecord as apiCreateDailySalesRecord,
  createDailySalesRecordsBulk as apiCreateDailySalesRecordsBulk,
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
  users: [],
  income: [],
  expenses: [],
  dailySalesRecords: [],
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
        inventory: action.payload.inventory,
        users: action.payload.users,
        income: action.payload.income,
        expenses: action.payload.expenses,
        dailySalesRecords: action.payload.dailySalesRecords,
        loading: false,
      };

    // Inventory
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
        inventory: state.inventory.filter((p) => p.id !== action.payload.id),
      };

    // Income
    case "ADD_INCOME":
      return { ...state, income: [...state.income, action.payload] };
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
      return { ...state, expenses: [...state.expenses, action.payload] };
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
        expenses: state.expenses.filter((e) => e.id !== action.payload.id),
      };

    // Users
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
        users: state.users.filter((u) => u.id !== action.payload.id),
      };

    // Daily Sales
    case "ADD_DAILY_SALES_RECORD":
      return {
        ...state,
        dailySalesRecords: [...state.dailySalesRecords, action.payload],
      };
    
    default:
      return state;
  }
};

export const GestionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gestionReducer, initialState);

  const fetchManagementData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [inventory, users, income, expenses, dailySalesRecords] = await Promise.all([
        apiFetchProducts(),
        apiFetchUsers(),
        apiFetchIncomes(),
        apiFetchExpenses(),
        apiFetchDailySalesRecords(),
      ]);
      dispatch({ type: "SET_INITIAL_DATA", payload: { inventory, users, income, expenses, dailySalesRecords } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  useEffect(() => {
    fetchManagementData();
  }, [fetchManagementData]);

  // OTHER CRUD FUNCTIONS (addProduct, updateUser, etc. remain unchanged)
  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await apiCreateProduct(productData);
      dispatch({ type: "ADD_PRODUCT", payload: newProduct });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
  const updateProduct = useCallback(async (product) => {
    try {
      const updated = await apiUpdateProduct(product.id, product);
      dispatch({ type: "UPDATE_PRODUCT", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
  const deleteProduct = useCallback(async (id) => {
    try {
      await apiDeleteProduct(id);
      dispatch({ type: "DELETE_PRODUCT", payload: { id } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const addIncome = useCallback(async (incomeData) => {
    try {
      const newIncome = await apiCreateIncome(incomeData);
      dispatch({ type: "ADD_INCOME", payload: newIncome });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
    const updateIncome = useCallback(async (income) => {
    try {
      const updated = await apiUpdateIncome(income.id, income);
      dispatch({ type: "UPDATE_INCOME", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
  const deleteIncome = useCallback(async (id) => {
    try {
      await apiDeleteIncome(id);
      dispatch({ type: "DELETE_INCOME", payload: { id } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const addExpense = useCallback(async (expenseData) => {
    try {
      const newExpense = await apiCreateExpense(expenseData);
      dispatch({ type: "ADD_EXPENSE", payload: newExpense });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
    const updateExpense = useCallback(async (expense) => {
    try {
      const updated = await apiUpdateExpense(expense.id, expense);
      dispatch({ type: "UPDATE_EXPENSE", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);
  const deleteExpense = useCallback(async (id) => {
    try {
      await apiDeleteExpense(id);
      dispatch({ type: "DELETE_EXPENSE", payload: { id } });
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

  // DAILY SALES
  const addDailySalesRecord = useCallback(async (recordData) => {
    try {
      await apiCreateDailySalesRecord(recordData);
      // Re-fetch data to reflect the new record
      await fetchManagementData();
    } catch (error) {
      console.error("Failed to create daily sales record:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, [fetchManagementData]);

  const addDailySalesRecordsBulk = useCallback(async (recordsData) => {
    try {
      await apiCreateDailySalesRecordsBulk(recordsData);
      // On successful bulk import, re-fetch all data to update the state
      await fetchManagementData(); 
    } catch (error) {
      console.error("Failed to bulk create daily sales records:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, [fetchManagementData]);


  const value = {
    state,
    fetchManagementData, // Expose the refresh function
    addProduct,
    updateProduct,
    deleteProduct,
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
    addDailySalesRecordsBulk,
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
};

import React, { createContext, useContext, useReducer } from 'react';

const GestionContext = createContext();

export const useGestion = () => {
    const context = useContext(GestionContext);
    if (!context) {
        throw new Error("useGestion must be used within a GestionProvider");
    }
    return context;
};

// Initial state with more realistic mock data
const initialState = {
    inventory: [
        { id: 1, name: "Garrafón 20L", quantity: 150, price: 35, category: 'Garrafones' },
        { id: 2, name: "Garrafón 10L", quantity: 75, price: 25, category: 'Garrafones' },
        { id: 3, name: "Botella 1L", quantity: 300, price: 10, category: 'Botellas' },
        { id: 4, name: "Filtro de Sedimentos", quantity: 20, price: 120, category: 'Insumos' },
        { id: 5, name: "Tapas para Garrafón", quantity: 1000, price: 0.5, category: 'Insumos' },
    ],
    income: [
        { id: 1, description: "Venta de 10 garrafones 20L", amount: 350, date: "2025-11-24", category: 'Ventas' },
        { id: 2, description: "Venta de 5 garrafones 10L", amount: 125, date: "2025-11-24", category: 'Ventas' },
        { id: 3, description: "Venta de 20 botellas 1L", amount: 200, date: "2025-11-23", category: 'Ventas' },
        { id: 4, description: "Servicio de mantenimiento", amount: 500, date: "2025-11-22", category: 'Servicios' },
    ],
    expenses: [
        { id: 1, description: "Compra de filtros", amount: 1500, date: "2025-11-24", category: 'Insumos' },
        { id: 2, description: "Gasolina de vehículo de reparto", amount: 800, date: "2025-11-24", category: 'Operativos' },
        { id: 3, description: "Publicidad en redes sociales", amount: 220, date: "2025-11-22", category: 'Marketing' },
        { id: 4, description: "Pago de nómina", amount: 4500, date: "2025-11-20", category: 'Nómina' },
    ],
};

const gestionReducer = (state, action) => {
    switch (action.type) {
        // Inventory Actions
        case 'ADD_PRODUCT':
            return { ...state, inventory: [...state.inventory, { ...action.payload, id: Date.now() }] };
        case 'UPDATE_PRODUCT':
            return { ...state, inventory: state.inventory.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PRODUCT':
            return { ...state, inventory: state.inventory.filter(p => p.id !== action.payload.id) };
        
        // Income Actions
        case 'ADD_INCOME':
            return { ...state, income: [...state.income, { ...action.payload, id: Date.now() }] };
        case 'UPDATE_INCOME':
            return { ...state, income: state.income.map(i => i.id === action.payload.id ? action.payload : i) };
        case 'DELETE_INCOME':
            return { ...state, income: state.income.filter(i => i.id !== action.payload.id) };

        // Expense Actions
        case 'ADD_EXPENSE':
            return { ...state, expenses: [...state.expenses, { ...action.payload, id: Date.now() }] };
        case 'UPDATE_EXPENSE':
            return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
        case 'DELETE_EXPENSE':
            return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload.id) };
            
        default:
            return state;
    }
};

export const GestionProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gestionReducer, initialState);

    // Memoized actions to prevent unnecessary re-renders
    const actions = {
        addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', payload: product }),
        updateProduct: (product) => dispatch({ type: 'UPDATE_PRODUCT', payload: product }),
        deleteProduct: (id) => dispatch({ type: 'DELETE_PRODUCT', payload: { id } }),
        
        addIncome: (income) => dispatch({ type: 'ADD_INCOME', payload: income }),
        updateIncome: (income) => dispatch({ type: 'UPDATE_INCOME', payload: income }),
        deleteIncome: (id) => dispatch({ type: 'DELETE_INCOME', payload: { id } }),

        addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', payload: expense }),
        updateExpense: (expense) => dispatch({ type: 'UPDATE_EXPENSE', payload: expense }),
        deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', payload: { id } }),
    };

    const value = { state, ...actions };

    return (
        <GestionContext.Provider value={value}>
            {children}
        </GestionContext.Provider>
    );
};

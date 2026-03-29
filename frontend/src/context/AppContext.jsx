import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categoriesApi } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch (e) {
      console.error('Error loading categories', e);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return (
    <AppContext.Provider value={{
      categories, categoriesLoading, loadCategories,
      sidebarOpen, setSidebarOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

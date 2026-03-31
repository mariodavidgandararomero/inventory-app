import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import { API } from './AuthContext';
=======
import { categoriesApi } from '../services/api';
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
<<<<<<< HEAD
      const res = await API.get('/categories');
=======
      const res = await categoriesApi.getAll();
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
      setCategories(res.data);
    } catch (e) {
      console.error('Error loading categories', e);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return (
<<<<<<< HEAD
    <AppContext.Provider value={{ categories, categoriesLoading, loadCategories, sidebarOpen, setSidebarOpen }}>
=======
    <AppContext.Provider value={{
      categories, categoriesLoading, loadCategories,
      sidebarOpen, setSidebarOpen
    }}>
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

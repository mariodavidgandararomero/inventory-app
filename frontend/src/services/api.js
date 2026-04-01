// Re-exportamos la instancia de axios autenticada desde AuthContext
// Así toda la app usa el mismo interceptor de tokens.
export { API as default } from '../context/AuthContext';

import { API } from '../context/AuthContext';

export const dashboardApi = {
  get: () => API.get('/dashboard'),
};

export const categoriesApi = {
  getAll:  ()         => API.get('/categories'),
  create:  (data)     => API.post('/categories', data),
  update:  (id, data) => API.put(`/categories/${id}`, data),
  delete:  (id)       => API.delete(`/categories/${id}`),
};

export const productsApi = {
  getAll:      (params)     => API.get('/products', { params }),
  getById:     (id)         => API.get(`/products/${id}`),
  create:      (data)       => API.post('/products', data),
  update:      (id, data)   => API.put(`/products/${id}`, data),
  delete:      (id)         => API.delete(`/products/${id}`),
  updateStock: (id, data)   => API.post(`/products/${id}/stock`, data),
};

export const usersApi = {
  getAll:  ()         => API.get('/users'),
  getRoles: ()        => API.get('/users/roles'),
  create:  (data)     => API.post('/users', data),
  update:  (id, data) => API.put(`/users/${id}`, data),
  delete:  (id)       => API.delete(`/users/${id}`),
};
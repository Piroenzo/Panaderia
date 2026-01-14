import api from './client'
import { Product, ProductCreate, ProductUpdate } from '../types'

export const productsApi = {
  getAll: async (params?: { search?: string; category?: string; active?: boolean }) => {
    const response = await api.get<Product[]>('/products', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },
  
  create: async (data: ProductCreate) => {
    const response = await api.post<Product>('/products', data)
    return response.data
  },
  
  update: async (id: number, data: ProductUpdate) => {
    const response = await api.put<Product>(`/products/${id}`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/products/${id}`)
  },
}

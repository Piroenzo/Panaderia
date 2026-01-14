import api from './client'
import { Sale, SaleCreate, SaleUpdate, SalesSummary } from '../types'

export const salesApi = {
  getAll: async (params?: {
    start_date?: string
    end_date?: string
    payment_method?: string
  }) => {
    const response = await api.get<Sale[]>('/sales', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get<Sale>(`/sales/${id}`)
    return response.data
  },
  
  create: async (data: SaleCreate) => {
    const response = await api.post<Sale>('/sales', data)
    return response.data
  },
  
  update: async (id: number, data: SaleUpdate) => {
    const response = await api.put<Sale>(`/sales/${id}`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/sales/${id}`)
  },
  
  getSummary: async (params?: {
    start_date?: string
    end_date?: string
  }) => {
    const response = await api.get<SalesSummary>('/sales/stats/summary', { params })
    return response.data
  },
}

import api from './client'
import { CashClosing, CashClosingCreate, CashClosingUpdate } from '../types'

export const cashClosingApi = {
  getByDate: async (date: string) => {
    const response = await api.get<any>(`/cash-closing?closing_date=${date}`)
    const data = response.data
    // Si no existe cierre pero hay datos de ventas, retornar objeto con totales
    if (data.exists === false || !data.id) {
      // Retornar objeto con totales para mostrar en el frontend
      return {
        ...data,
        id: undefined,
        initial_cash: 0,
        counted_cash: 0,
        expenses: 0,
        expense_notes: '',
        withdrawals: 0,
        difference: 0,
        notes: '',
        created_at: '',
        updated_at: '',
      } as any
    }
    return data as CashClosing
  },
  
  getAll: async (params?: {
    start_date?: string
    end_date?: string
  }) => {
    const response = await api.get<CashClosing[]>('/cash-closing/list', { params })
    return response.data
  },
  
  create: async (data: CashClosingCreate) => {
    const response = await api.post<CashClosing>('/cash-closing', data)
    return response.data
  },
  
  update: async (id: number, data: CashClosingUpdate) => {
    const response = await api.put<CashClosing>(`/cash-closing/${id}`, data)
    return response.data
  },
}

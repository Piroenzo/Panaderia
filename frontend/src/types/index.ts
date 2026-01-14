export interface Product {
  id: number
  name: string
  category?: string
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  name: string
  category?: string
  price: number
  active?: boolean
}

export interface ProductUpdate {
  name?: string
  category?: string
  price?: number
  active?: boolean
}

export interface SaleItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  product_name?: string
}

export interface SaleItemCreate {
  product_id: number
  quantity: number
  unit_price: number
}

export interface Sale {
  id: number
  date: string
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  total: number
  notes?: string
  items: SaleItem[]
  created_at: string
  updated_at: string
}

export interface SaleCreate {
  date: string
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  items: SaleItemCreate[]
  notes?: string
}

export interface SaleUpdate {
  date?: string
  payment_method?: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  items?: SaleItemCreate[]
  notes?: string
}

export interface SalesSummary {
  total_amount: number
  total_count: number
  average_ticket: number
  payment_totals: Record<string, number>
}

export interface CashClosing {
  id: number
  date: string
  initial_cash: number
  counted_cash: number
  total_sales: number
  total_cash_sales: number
  expenses: number
  expense_notes?: string
  withdrawals: number
  difference: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface CashClosingCreate {
  date: string
  initial_cash?: number
  counted_cash: number
  expenses?: number
  expense_notes?: string
  withdrawals?: number
  notes?: string
}

export interface CashClosingUpdate {
  date?: string
  initial_cash?: number
  counted_cash?: number
  expenses?: number
  expense_notes?: string
  withdrawals?: number
  notes?: string
}

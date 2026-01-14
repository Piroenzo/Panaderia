import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { cashClosingApi } from '../api/cashClosing'
import { CashClosing as CashClosingType, CashClosingCreate, CashClosingUpdate } from '../types'
import { useToast } from '../hooks/useToast'
import { DollarSign, Calendar, Save } from 'lucide-react'

const CashClosing = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [closing, setClosing] = useState<CashClosingType | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const { showToast, ToastComponent } = useToast()

  const [formData, setFormData] = useState<CashClosingCreate>({
    date: format(new Date(), 'yyyy-MM-dd'),
    initial_cash: 0,
    counted_cash: 0,
    expenses: 0,
    expense_notes: '',
    withdrawals: 0,
    notes: '',
  })

  useEffect(() => {
    loadClosing()
  }, [selectedDate])

  const loadClosing = async () => {
    try {
      setLoadingData(true)
      const data = await cashClosingApi.getByDate(selectedDate)
      // Si tiene id, es un cierre existente
      if (data && data.id) {
        setClosing(data as CashClosingType)
        setFormData({
          date: data.date,
          initial_cash: data.initial_cash || 0,
          counted_cash: data.counted_cash || 0,
          expenses: data.expenses || 0,
          expense_notes: data.expense_notes || '',
          withdrawals: data.withdrawals || 0,
          notes: data.notes || '',
        })
      } else {
        // No existe cierre, pero tenemos datos de ventas
        setClosing(data as any) // Guardar datos de ventas aunque no haya cierre
        setFormData({
          date: selectedDate,
          initial_cash: 0,
          counted_cash: 0,
          expenses: 0,
          expense_notes: '',
          withdrawals: 0,
          notes: '',
        })
      }
    } catch (error: any) {
      console.error('Error loading closing:', error)
      // Si no existe cierre, está bien
      if (error.response?.status !== 404) {
        showToast(error.message || 'Error al cargar cierre de caja', 'error')
      }
      setClosing(null)
      setFormData({
        date: selectedDate,
        initial_cash: 0,
        counted_cash: 0,
        expenses: 0,
        expense_notes: '',
        withdrawals: 0,
        notes: '',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.counted_cash < 0) {
      showToast('El efectivo contado no puede ser negativo', 'error')
      return
    }

    try {
      setLoading(true)
      if (closing && closing.id) {
        // Preparar datos para actualizar (solo campos que cambiaron)
        const updateData: CashClosingUpdate = {
          date: formData.date,
          initial_cash: formData.initial_cash || 0,
          counted_cash: formData.counted_cash || 0,
          expenses: formData.expenses || 0,
          expense_notes: formData.expense_notes || undefined,
          withdrawals: formData.withdrawals || 0,
          notes: formData.notes || undefined,
        }
        // Actualizar cierre existente
        await cashClosingApi.update(closing.id, updateData)
        showToast('Cierre de caja actualizado correctamente', 'success')
      } else {
        // Preparar datos para crear (todos los campos requeridos)
        const createData: CashClosingCreate = {
          date: formData.date,
          initial_cash: formData.initial_cash || 0,
          counted_cash: formData.counted_cash || 0,
          expenses: formData.expenses || 0,
          expense_notes: formData.expense_notes || undefined,
          withdrawals: formData.withdrawals || 0,
          notes: formData.notes || undefined,
        }
        // Crear nuevo cierre
        await cashClosingApi.create(createData)
        showToast('Cierre de caja registrado correctamente', 'success')
      }
      loadClosing()
    } catch (error: any) {
      console.error('Error saving closing:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error al guardar cierre de caja'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calcular valores esperados
  const expectedCash = (formData.initial_cash || 0) + (closing?.total_cash_sales || 0) - (formData.expenses || 0) - (formData.withdrawals || 0)
  const difference = (formData.counted_cash || 0) - expectedCash

  return (
    <div>
      {ToastComponent}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Cierre de Caja</h2>
        <p className="text-gray-600 mt-1">Registra el cierre de caja del día</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de fecha */}
        <div className="card">
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Fecha del Cierre
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setFormData({ ...formData, date: e.target.value })
              }}
              className="input"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>

        {loadingData ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Resumen de ventas del día */}
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumen del Día
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Ventas del Día</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(closing?.total_sales || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ventas en Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(closing?.total_cash_sales || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Datos del Cierre</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fondo Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initial_cash || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initial_cash: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efectivo Contado *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.counted_cash || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          counted_cash: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gastos del Día
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.expenses || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expenses: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retiros
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.withdrawals || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          withdrawals: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas sobre Gastos
                  </label>
                  <textarea
                    value={formData.expense_notes || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_notes: e.target.value })
                    }
                    className="input"
                    rows={2}
                    placeholder="Ej: Compra de harina, servicios, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Notas adicionales sobre el cierre..."
                  />
                </div>
              </div>
            </div>

            {/* Cálculos */}
            <div className="card bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Cálculos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Fondo Inicial:</span>
                  <span className="font-semibold">
                    ${(formData.initial_cash || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">+ Ventas en Efectivo:</span>
                  <span className="font-semibold">
                    ${(closing?.total_cash_sales || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">- Gastos:</span>
                  <span className="font-semibold text-red-600">
                    -${(formData.expenses || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">- Retiros:</span>
                  <span className="font-semibold text-red-600">
                    -${(formData.withdrawals || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-700 font-medium">Efectivo Esperado:</span>
                  <span className="font-semibold">
                    ${expectedCash.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Efectivo Contado:</span>
                  <span className="font-semibold">
                    ${(formData.counted_cash || 0).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-semibold">Diferencia:</span>
                  <span
                    className={`text-2xl font-bold ${
                      difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {difference >= 0 ? '+' : ''}
                    ${difference.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {difference !== 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {difference > 0 ? 'Sobrante' : 'Faltante'} de efectivo
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={loading}
              >
                <Save className="h-5 w-5" />
                {loading
                  ? 'Guardando...'
                  : closing
                  ? 'Actualizar Cierre'
                  : 'Registrar Cierre'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default CashClosing

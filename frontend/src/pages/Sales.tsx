import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { productsApi } from '../api/products'
import { salesApi } from '../api/sales'
import { Product, SaleItemCreate } from '../types'
import { useToast } from '../hooks/useToast'
import { Plus, Trash2, X } from 'lucide-react'

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'>('efectivo')
  const [items, setItems] = useState<Array<SaleItemCreate & { id: string }>>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll({ active: true })
      setProducts(data)
    } catch (error: any) {
      showToast(error.message || 'Error al cargar productos', 'error')
    }
  }

  const addItem = () => {
    if (products.length === 0) {
      showToast('No hay productos disponibles', 'warning')
      return
    }
    const firstProduct = products[0]
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        product_id: firstProduct.id,
        quantity: 1,
        unit_price: firstProduct.price,
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof SaleItemCreate, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        return item
      })
    )
  }

  const getItemTotal = (item: SaleItemCreate) => {
    return item.quantity * item.unit_price
  }

  const getTotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      showToast('Debes agregar al menos un item', 'warning')
      return
    }

    try {
      setLoading(true)
      const saleData = {
        date: selectedDate,
        payment_method: paymentMethod,
        items: items.map(({ id, ...rest }) => rest),
        notes: notes || undefined,
      }
      await salesApi.create(saleData)
      showToast('Venta registrada correctamente', 'success')
      
      // Reset form
      setItems([])
      setNotes('')
      setPaymentMethod('efectivo')
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    } catch (error: any) {
      showToast(error.message || 'Error al registrar venta', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || 'Producto'
  }

  return (
    <div>
      {ToastComponent}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Nueva Venta</h2>
        <p className="text-gray-600 mt-1">Registra una nueva venta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago *
              </label>
              <select
                required
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
                  )
                }
                className="input"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Items de la Venta</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Agregar Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay items agregados</p>
              <p className="text-sm mt-2">Haz clic en "Agregar Item" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto *
                      </label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) =>
                          updateItem(item.id, 'product_id', parseInt(e.target.value))
                        }
                        className="input"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price.toLocaleString('es-AR')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Unitario *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            'unit_price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="input"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subtotal
                        </label>
                        <div className="input bg-gray-100 font-semibold">
                          ${getItemTotal(item).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Eliminar item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={3}
              placeholder="Notas adicionales sobre la venta..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total:</span>
              <span className="text-3xl font-bold text-primary-600">
                ${getTotal().toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setItems([])
              setNotes('')
            }}
            className="btn btn-secondary"
            disabled={loading}
          >
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0}>
            {loading ? 'Guardando...' : 'Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Sales

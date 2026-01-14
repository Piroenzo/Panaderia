import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { salesApi } from '../api/sales'
import { SalesSummary } from '../types'
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react'

const Dashboard = () => {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await salesApi.getSummary({
          start_date: today,
          end_date: today,
        })
        setSummary(data)
      } catch (error) {
        console.error('Error loading summary:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [today])

  const stats = [
    {
      label: 'Ventas de Hoy',
      value: summary?.total_count || 0,
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total Vendido',
      value: `$${summary?.total_amount.toLocaleString('es-AR') || '0'}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Ticket Promedio',
      value: `$${summary?.average_ticket.toLocaleString('es-AR') || '0'}`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Fecha',
      value: format(new Date(), 'dd/MM/yyyy', { locale: es }),
      icon: Calendar,
      color: 'text-orange-600 bg-orange-50',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Resumen del día</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/products"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">Gestionar Productos</h3>
              <p className="text-gray-600 text-sm">Agregar, editar o eliminar productos</p>
            </Link>

            <Link
              to="/sales"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">Nueva Venta</h3>
              <p className="text-gray-600 text-sm">Registrar una nueva venta</p>
            </Link>

            <Link
              to="/cash-closing"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">Cierre de Caja</h3>
              <p className="text-gray-600 text-sm">Realizar cierre de caja del día</p>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard

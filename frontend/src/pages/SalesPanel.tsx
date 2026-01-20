import { useEffect, useState } from "react";
import { format, parse, subDays } from "date-fns";
import { salesApi } from "../api/sales";
import { Sale, SalesSummary } from "../types";
import { useToast } from "../hooks/useToast";
import Modal from "../components/Modal";
import { Eye, Trash2, Receipt } from "lucide-react";

const SalesPanel = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadSales();
    loadSummary();
  }, [startDate, endDate, paymentMethodFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params: any = {
        start_date: startDate,
        end_date: endDate,
      };
      if (paymentMethodFilter) {
        params.payment_method = paymentMethodFilter;
      }
      const data = await salesApi.getAll(params);
      setSales(data);
    } catch (error: any) {
      showToast(error.message || "Error al cargar ventas", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await salesApi.getSummary({
        start_date: startDate,
        end_date: endDate,
      });
      setSummary(data);
    } catch (error: any) {
      console.error("Error loading summary:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;

    try {
      await salesApi.delete(id);
      showToast("Venta eliminada correctamente", "success");
      loadSales();
      loadSummary();
    } catch (error: any) {
      showToast(error.message || "Error al eliminar venta", "error");
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const sale = await salesApi.getById(id);
      setSelectedSale(sale);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      showToast(error.message || "Error al cargar detalles", "error");
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Panel de Ventas</h2>
        <p className="text-gray-600 mt-1">
          Consulta y gestiona todas las ventas
        </p>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Total Vendido</p>
            <p className="text-2xl font-bold text-gray-900">
              ${summary.total_amount.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Cantidad de Ventas</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.total_count}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Ticket Promedio</p>
            <p className="text-2xl font-bold text-gray-900">
              ${summary.average_ticket.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1 mb-2">
              Por Método de Pago
            </p>
            <div className="space-y-1">
              {Object.entries(summary.payment_totals).map(([method, total]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="capitalize">{method}:</span>
                  <span className="font-semibold">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate(format(subDays(new Date(), 7), "yyyy-MM-dd"));
                setEndDate(format(new Date(), "yyyy-MM-dd"));
                setPaymentMethodFilter("");
              }}
              className="btn btn-secondary w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : sales.length === 0 ? (
        <div className="card text-center py-12">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay ventas en este rango</p>
          <p className="text-gray-500 text-sm mt-2">
            Intenta ajustar las fechas o los filtros
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Método de Pago</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium">#{sale.id}</td>
                    <td>
                      {format(
                        parse(sale.date, "yyyy-MM-dd", new Date()),
                        "dd/MM/yyyy",
                      )}
                    </td>
                    <td>
                      <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td>{sale.items.length} item(s)</td>
                    <td className="font-semibold">
                      $
                      {sale.total.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(sale.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSale(null);
        }}
        title={`Detalles de Venta #${selectedSale?.id}`}
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">
                  {format(
                    parse(selectedSale.date, "yyyy-MM-dd", new Date()),
                    "dd/MM/yyyy",
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-medium capitalize">
                  {selectedSale.payment_method}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Items</p>
              <div className="border rounded-lg divide-y">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between">
                    <div>
                      <p className="font-medium">
                        {item.product_name || `Producto #${item.product_id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x $
                        {item.unit_price.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <p className="font-semibold">
                      $
                      {(item.quantity * item.unit_price).toLocaleString(
                        "es-AR",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  $
                  {selectedSale.total.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {selectedSale.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Notas</p>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedSale.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesPanel;

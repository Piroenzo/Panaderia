import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Products from './pages/Products'
import Sales from './pages/Sales'
import SalesPanel from './pages/SalesPanel'
import CashClosing from './pages/CashClosing'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales-panel" element={<SalesPanel />} />
          <Route path="/cash-closing" element={<CashClosing />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

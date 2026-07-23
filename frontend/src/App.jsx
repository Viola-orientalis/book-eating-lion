import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Cards from './pages/Cards'
import Payments from './pages/Payments'
import Statements from './pages/Statements'
import AdminBooks from './pages/AdminBooks'
import AdminOrders from './pages/AdminOrders'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        <Route
          path="cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        <Route
          path="cards"
          element={
            <RequireAuth>
              <Cards />
            </RequireAuth>
          }
        />
        <Route
          path="payments"
          element={
            <RequireAuth>
              <Payments />
            </RequireAuth>
          }
        />
        <Route
          path="statements"
          element={
            <RequireAuth>
              <Statements />
            </RequireAuth>
          }
        />

        <Route
          path="admin/books"
          element={
            <RequireAdmin>
              <AdminBooks />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/orders"
          element={
            <RequireAdmin>
              <AdminOrders />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

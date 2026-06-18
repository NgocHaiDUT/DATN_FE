import React from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DashboardPage } from './features/dashboard'
import { LoginPage, ProfilePage } from './features/auth'
import { UsersPage, UserDetailPage, UserPermissionPage, EditUserPage } from './features/users'
import { ShopsPage, ShopDetailPage, ShopStatisticsPage } from './features/shops'
import { ProductsPage, ProductDetailPage, BrandsPage, CategoriesPage } from './features/products'
import { OrdersPage } from './features/orders'
import { PayoutsPage } from './features/payouts/PayoutsPage'
import { RevenuePage } from './features/revenue'
import { VrReviewStatsPage } from './features/vr-reviews/VrReviewStatsPage'
import { TrashPage } from './features/trash/TrashPage'
import { Layout } from './shared/components'
import { useAuth } from './features/auth'

function App() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/', { replace: true })
  }

  // Route bảo vệ: nếu chưa login -> về /login
  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />
    return <>{children}</>
  }

  return (
    <Routes>
      {/* Login: không dùng Layout */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Các route bên trong Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout currentPage="dashboard" onNavigate={() => { }}>
              {/* Nội dung sẽ override bằng child routes via Outlet */}
            </Layout>
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersListRoute />} />
        <Route path="users/:userId" element={<UserDetailRoute />} />
        <Route path="users/:userId/edit" element={<EditUserRoute />} />
        <Route path="users/:userId/permissions" element={<UserPermissionRoute />} />
        <Route path="shops" element={<ShopsListRoute />} />
        <Route path="shops/:shopId" element={<ShopDetailRoute />} />
        <Route path="shops/:shopId/statistics" element={<ShopStatisticsRoute />} />
        <Route path="products" element={<ProductsListRoute />} />
        <Route path="products/brands" element={<BrandsListRoute />} />
        <Route path="products/categories" element={<CategoriesListRoute />} />
        <Route path="products/:productId" element={<ProductDetailRoute />} />
        <Route path="orders" element={<OrdersListRoute />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="vr-reviews" element={<VrReviewStatsPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* fallback: route không khớp -> về dashboard hoặc login */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App

function UsersListRoute() {
  const navigate = useNavigate()
  return <UsersPage onUserClick={(userId) => navigate(`/users/${userId}`)} />
}

function UserDetailRoute() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  if (!userId) {
    return <Navigate to="/users" replace />
  }

  return (
    <UserDetailPage
      userId={userId}
      onBack={() => navigate('/users')}
      onManagePermissions={() => navigate(`/users/${userId}/permissions`)}
      onEdit={() => navigate(`/users/${userId}/edit`)}
    />
  )
}

function EditUserRoute() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  if (!userId) {
    return <Navigate to="/users" replace />
  }

  return (
    <EditUserPage
      userId={userId}
      onBack={() => navigate(`/users/${userId}`)}
      onSuccess={() => navigate(`/users/${userId}`)}
    />
  )
}

function UserPermissionRoute() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const [userName, setUserName] = React.useState<string>('User')

  // Fetch user name for display
  React.useEffect(() => {
    const fetchUserName = async () => {
      try {
        const { UserApi } = await import('./features/users/data/api/userApi')
        const { UserRepositoryImpl } = await import('./features/users/data/repositories')
        const { GetUserByIdUseCase } = await import('./features/users/usecases')

        // Get token from localStorage
        const token = localStorage.getItem('accessToken')

        const repository = new UserRepositoryImpl(new UserApi(), token)
        const useCase = new GetUserByIdUseCase(repository)
        const user = await useCase.execute(userId!)
        setUserName(user.name)
      } catch (err) {
        console.error('Error fetching user name:', err)
      }
    }

    if (userId) {
      fetchUserName()
    }
  }, [userId])

  if (!userId) {
    return <Navigate to="/users" replace />
  }

  return (
    <UserPermissionPage
      userId={userId}
      userName={userName}
      onBack={() => navigate(`/users/${userId}`)}
    />
  )
}

function ShopsListRoute() {
  const navigate = useNavigate()
  return <ShopsPage onShopClick={(shopId) => navigate(`/shops/${shopId}`)} />
}

function ShopDetailRoute() {
  const navigate = useNavigate()
  const { shopId } = useParams<{ shopId: string }>()

  if (!shopId) {
    return <Navigate to="/shops" replace />
  }

  return (
    <ShopDetailPage
      shopId={shopId}
      onBack={() => navigate('/shops')}
      onSellerClick={(sellerId) => navigate(`/users/${sellerId}`)}
      onStaffClick={(staffId) => navigate(`/users/${staffId}`)}
      onViewStatistics={() => navigate(`/shops/${shopId}/statistics`)}
      onProductClick={(productId) => navigate(`/products/${productId}`)}
    />
  )
}

function ShopStatisticsRoute() {
  const navigate = useNavigate()
  const { shopId } = useParams<{ shopId: string }>()

  if (!shopId) {
    return <Navigate to="/shops" replace />
  }

  return <ShopStatisticsPage shopId={shopId} onBack={() => navigate(`/shops/${shopId}`)} />
}

function ProductsListRoute() {
  const navigate = useNavigate()
  return (
    <ProductsPage
      onProductClick={(productId) => navigate(`/products/${productId}`)}
      onNavigateToBrands={() => navigate('/products/brands')}
      onNavigateToCategories={() => navigate('/products/categories')}
    />
  )
}

function BrandsListRoute() {
  return <BrandsPage />
}

function CategoriesListRoute() {
  return <CategoriesPage />
}

function ProductDetailRoute() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()

  if (!productId) {
    return <Navigate to="/products" replace />
  }

  return (
    <ProductDetailPage
      productId={Number(productId)}
      onBack={() => navigate('/products')}
    />
  )
}

function OrdersListRoute() {
  return <OrdersPage />
}




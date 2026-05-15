import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Auth from './pages/auth/Auth'
import Profile from './pages/profile/Profile'
import Chat from './pages/chat/Chat'
import Blog from './pages/blog/Blog'
import Shop from './pages/shop/Shop'
import ShopSell from './pages/shop/ShopSell'
import ShopCart from './pages/shop/ShopCart'
import ShopOrders from './pages/shop/ShopOrders'
import ShopPaymentReturn from './pages/shop/ShopPaymentReturn'
import { useAppStore } from './store/store'
import { useEffect, useState } from 'react'
import { apiClient } from './lib/api.client'
import { GET_USER_INFO_ROUTE } from './utils/constant'
import Loading from './components/Loading'

const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? children : <Navigate to="/auth" />
}

// handle after login then not navigate to login
const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? <Navigate to="/chat" /> : children
}

function App() {
  const { userInfo, setUserInfo } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO_ROUTE, { withCredentials: true });
        if (response.status === 200 && response.data.user) {
          setUserInfo(response.data.user) // set user info to zustand
        } else {
          setUserInfo(undefined)
        }
      } catch (error) {
        // toast.error(error.response?.data?.message || "Get Info User Failed");
        setUserInfo(undefined)
      } finally {
        setLoading(false)
      }
    };
    if (!userInfo) {
      getUserData();
    } else {
      setLoading(false)
    }
  }, [userInfo])

  // if (loading) {
  //   return <Loading />
  // }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/auth' element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path='/chat' element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path='/blog' element={<PrivateRoute><Blog /></PrivateRoute>} />
        <Route path='/shop' element={<PrivateRoute><Shop /></PrivateRoute>} />
        <Route path='/shop/sell' element={<PrivateRoute><ShopSell /></PrivateRoute>} />
        <Route path='/shop/cart' element={<PrivateRoute><ShopCart /></PrivateRoute>} />
        <Route path='/shop/orders' element={<PrivateRoute><ShopOrders /></PrivateRoute>} />
        <Route path='/shop/payment/return' element={<PrivateRoute><ShopPaymentReturn /></PrivateRoute>} />
        <Route path='/' element={<Navigate to="/chat" replace />} />
        <Route path='*' element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

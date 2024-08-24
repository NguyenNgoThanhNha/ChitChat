import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Auth from './pages/auth/Auth'
import Profile from './pages/profile/Profile'
import Chat from './pages/chat/Chat'
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

  if (loading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/auth' element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path='/chat' element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path='*' element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

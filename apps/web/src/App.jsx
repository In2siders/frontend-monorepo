import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import '@repo/common/style.css'

import Home from './pages/home'
import Register from './pages/auth/register'
import Login from './pages/auth/login'
import { ChatOverlay } from './pages/chat/index'
import { ChatRoom } from './pages/chat/[chatId]'
import { NewChatRoom } from './pages/chat/new'
import { AuthProvider } from './providers/AuthProvider'

const General404 = () => (
  <h1>Page Not Found</h1>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />

          {/* Auth Routes */}
          <Route path="/auth">
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<General404 />} />
          </Route>

          {/* Chat Routes */}
          <Route path="/chat" element={<ChatOverlay />}>
            <Route index element={<General404 />} />
            <Route path="new" element={<NewChatRoom />} />
            <Route path=":chatId" element={<ChatRoom />} />
            <Route path="*" element={<General404 />} />
          </Route>

          <Route path="*" element={<General404 />} />
        </Routes>
        <Toaster position='bottom-right' />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

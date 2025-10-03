import '@repo/common/style.css'
import Home from './pages/home'
import Register from './pages/auth/register'
import Login from './pages/auth/login'
// import Chat from './pages/chat/index'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom'

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          {/* <Route path="/chat" element={<Chat />} /> */}
        </Routes>
      </div>
    </Router>
  )
}

export default App

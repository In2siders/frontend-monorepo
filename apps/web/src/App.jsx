import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router'

import '@repo/common/style.css'

import { Fragment } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/auth/login'
import Register from './pages/auth/register'
import { ChatRoom } from './pages/chat/[chatId]'
import { ChatOverlay } from './pages/chat/index'
import { JoinInvitePage } from './pages/chat/join'
import Home from './pages/home'
import MdxPage from './pages/mdx'

import * as HelpMdx from './posts/help-center.mdx'
import * as TosMdx from './posts/tos.mdx'
import * as PrivacyMdx from './posts/privacy.mdx'
import * as CookiesMdx from './posts/cookies.mdx'


const General404 = ({ toChats } = { toChats: false }) => (
  <Fragment>
    <h1>Page Not Found</h1>
    <Link to={toChats ? "/chat/" : "/"} className="text-blue-500 hover:underline">
      Go back to {toChats ? "Chats" : "Home"}
    </Link>
  </Fragment>
)

const ConditionalRoute = ({ condition, expectedValue, redirectTo, element }) => {
  if(condition === expectedValue) {
    return element ? element : <Outlet />;
  }

  return <Navigate to={redirectTo} replace />;
}

function App() {
  const { loading, auth } = useAuth();
  const isAuthenticated = auth.isAuthenticated;

  if(loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<ConditionalRoute condition={isAuthenticated} expectedValue={false} redirectTo="/chat/" element={<Home />} />} />

        {/* Auth Routes */}
        <Route path="/auth" element={<ConditionalRoute condition={isAuthenticated} expectedValue={false} redirectTo="/chat/" />}>
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<General404 />} />
        </Route>

        {/* Chat Routes */}
        <Route path="/chat" element={<ConditionalRoute condition={isAuthenticated} expectedValue={true} redirectTo="/auth/login" element={<ChatOverlay />} />} >
          <Route index element={null} />
          <Route path=":chatId" element={<ChatRoom />} />
          <Route path="join/:inviteCode/*" element={<JoinInvitePage />} />
          <Route path="*" element={<General404 toChats={true} />} />
        </Route>

        <Route path="/legal/tos" element={<MdxPage content={TosMdx} legalNav="/legal/tos" />} />
        <Route path="/legal/privacy" element={<MdxPage content={PrivacyMdx} legalNav="/legal/privacy" />} />
        <Route path="/legal/cookies" element={<MdxPage content={CookiesMdx} legalNav="/legal/cookies" />} />
        <Route path="/help" element={<MdxPage content={HelpMdx} />} />

        <Route path="*" element={<General404 toChats={isAuthenticated} />} />
      </Routes>
      <Toaster position='bottom-right' />
    </BrowserRouter>
  )
}

export default App

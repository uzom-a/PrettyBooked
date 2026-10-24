import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import RequireAuth from './components/layout/RequireAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Browse from './pages/Browse'
import ProviderProfile from './pages/ProviderProfile'
import Book from './pages/Book'
import MyBookings from './pages/MyBookings'
import CreateProfile from './pages/CreateProfile'
import Dashboard from './pages/Dashboard'
import AdminQueue from './pages/AdminQueue'
import CheckEmail from './pages/CheckEmail'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import LeaveReview from './pages/LeaveReview'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse/:category" element={<Browse />} />
            <Route path="/provider/:id" element={<ProviderProfile />} />
            <Route path="/book/:providerId" element={<RequireAuth><Book /></RequireAuth>} />
            <Route path="/bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
            <Route path="/create-profile" element={<RequireAuth><CreateProfile /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><AdminQueue /></RequireAuth>} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="/messages/:otherId" element={<RequireAuth><Conversation /></RequireAuth>} />
            <Route path="/leave-review" element={<RequireAuth><LeaveReview /></RequireAuth>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

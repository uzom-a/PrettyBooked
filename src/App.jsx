import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
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
            <Route path="/book/:providerId" element={<Book />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminQueue />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:otherId" element={<Conversation />} />
            <Route path="/leave-review" element={<LeaveReview />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

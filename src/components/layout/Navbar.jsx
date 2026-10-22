import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const unreadMessages = useUnreadMessageCount()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-blush-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="font-heading text-2xl font-bold text-blush-600 tracking-wide">
        PrettyBooked
      </Link>

      <div className="flex items-center gap-4">
        {profile ? (
          <>
            {profile.role === 'student' && (
              <Link to="/bookings" className="text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors">
                My Bookings
              </Link>
            )}
            {profile.role === 'provider' && (
              <Link to="/dashboard" className="text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors">
                Dashboard
              </Link>
            )}
            {(profile.role === 'student' || profile.role === 'provider') && (
              <Link to="/messages" className="relative text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors">
                Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-3 bg-blush-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            {profile.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors">
                Admin
              </Link>
            )}
            {(profile.role === 'student' || profile.role === 'provider') && (
              <NotificationBell profile={profile} />
            )}
            <button onClick={handleSignOut} className="text-sm font-medium text-gray-400 hover:text-blush-500 transition-colors">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors">
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

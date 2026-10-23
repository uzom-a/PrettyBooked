import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount'
import NotificationBell from './NotificationBell'

const linkClass = 'text-sm font-medium text-mauve-600 hover:text-blush-600 transition-colors'
const mobileLinkClass = 'flex items-center justify-between min-h-[44px] px-6 text-base font-medium text-mauve-600 hover:bg-blush-50 hover:text-blush-600 transition-colors'

function UnreadBadge({ count, className = '' }) {
  if (count <= 0) return null
  return (
    <span className={`bg-blush-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const unreadMessages = useUnreadMessageCount()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the phone menu when the page changes or Escape is pressed.
  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const isMember = profile?.role === 'student' || profile?.role === 'provider'
  const links = []
  if (profile?.role === 'student') links.push({ to: '/bookings', label: 'My bookings' })
  if (profile?.role === 'provider') links.push({ to: '/dashboard', label: 'Dashboard' })
  if (isMember) links.push({ to: '/messages', label: 'Messages', badge: unreadMessages })
  if (profile?.role === 'admin') links.push({ to: '/admin', label: 'Admin' })

  return (
    <nav className="relative bg-white border-b border-blush-100 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl font-bold text-blush-600 tracking-wide">
          PrettyBooked
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {profile ? (
            <>
              {links.map((l) => (
                <Link key={l.to} to={l.to} className={`relative hidden md:block ${linkClass}`}>
                  {l.label}
                  <UnreadBadge count={l.badge ?? 0} className="absolute -top-2 -right-3" />
                </Link>
              ))}
              {isMember && <NotificationBell profile={profile} />}
              <button onClick={handleSignOut} className="hidden md:block text-sm font-medium text-gray-400 hover:text-blush-500 transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`hidden md:block ${linkClass}`}>Log in</Link>
              <Link
                to="/signup"
                className="hidden md:block bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden relative w-11 h-11 flex items-center justify-center rounded-lg text-mauve-600 hover:bg-blush-50 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen
                ? <path d="M6 6l12 12M18 6L6 18" />
                : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {!menuOpen && <UnreadBadge count={unreadMessages} className="absolute top-1 right-1" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden absolute inset-x-0 top-full z-40 bg-white border-b border-blush-100 shadow-md py-2">
          {profile ? (
            <>
              {links.map((l) => (
                <Link key={l.to} to={l.to} className={mobileLinkClass}>
                  {l.label}
                  <UnreadBadge count={l.badge ?? 0} />
                </Link>
              ))}
              <button onClick={handleSignOut} className={`w-full text-left ${mobileLinkClass} text-gray-500`}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={mobileLinkClass}>Log in</Link>
              <div className="px-6 pt-2 pb-2">
                <Link
                  to="/signup"
                  className="flex items-center justify-center min-h-[44px] bg-black text-white rounded-full text-base font-semibold hover:bg-gray-800 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

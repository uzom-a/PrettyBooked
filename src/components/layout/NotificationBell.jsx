import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

const MESSAGES = {
  booking_pending: (p) => `New booking request from ${p.student_name || 'a student'} for ${p.service_name || 'a service'}`,
  booking_confirmed: (p) => `${p.provider_name || 'Your provider'} confirmed your booking for ${p.service_name || 'a service'}`,
  booking_cancelled: (p) => `${p.provider_name || 'Your provider'} cancelled your booking for ${p.service_name || 'a service'}`,
  booking_completed: (p) => `${p.provider_name || 'Your provider'} marked your booking as completed`,
}

function relativeTime(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function destinationFor(notification, profile) {
  if (notification.type === 'booking_pending') return '/dashboard'
  return '/bookings'
}

export default function NotificationBell({ profile }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleClick(n) {
    setOpen(false)
    if (!n.is_read) await markAsRead(n.id)
    navigate(destinationFor(n, profile))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        className="relative text-mauve-600 hover:text-blush-600 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blush-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-blush-100 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blush-100">
            <p className="font-semibold text-gray-800 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blush-600 hover:text-blush-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">You're all caught up 💗</p>
            ) : (
              notifications.map((n) => {
                const renderer = MESSAGES[n.type] || (() => 'New activity')
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-blush-50 hover:bg-blush-50 transition-colors ${n.is_read ? 'opacity-60' : ''}`}
                  >
                    <p className="text-sm text-gray-800">{renderer(n.payload || {})}</p>
                    <p className="text-xs text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

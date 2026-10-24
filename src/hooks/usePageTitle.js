import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const CATEGORY_TITLES = {
  braider: 'Braiders',
  'nail-tech': 'Nail techs',
  'lash-tech': 'Lash techs',
  seamstress: 'Seamstresses',
}

const PAGE_TITLES = {
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/bookings': 'My bookings',
  '/create-profile': 'Create your profile',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin',
  '/check-email': 'Check your email',
  '/messages': 'Messages',
  '/leave-review': 'Leave a review',
  '/privacy': 'Privacy policy',
  '/terms': 'Terms of use',
}

function titleFor(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const [, section, id] = pathname.split('/')
  if (section === 'browse') return CATEGORY_TITLES[id] ?? 'Browse'
  if (section === 'provider') return 'Stylist'
  if (section === 'book') return 'Book an appointment'
  if (section === 'messages') return 'Conversation'
  return null
}

export function usePageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const title = titleFor(pathname)
    document.title = title ? `${title} · PrettyBooked` : 'PrettyBooked'
  }, [pathname])
}

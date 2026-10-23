import Navbar from './Navbar'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function Layout({ children }) {
  usePageTitle()

  return (
    <div className="min-h-screen bg-blush-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

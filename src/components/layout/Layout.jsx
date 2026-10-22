import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-blush-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

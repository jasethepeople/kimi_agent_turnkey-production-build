import { Outlet } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink-950 text-parchment">
      <Navbar />
      {/* Navbar is sticky (in-flow); no offset needed on the content slot. */}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

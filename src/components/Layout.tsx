import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { FloatingActionButton } from './FloatingActionButton'
import { MobileNavigation } from './MobileNavigation'

export const Layout = () => {
  // Mobile sidebar overlay not needed since sidebar is hidden on mobile

const location = useLocation();

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-primary-50 to-indigo-50 via-white dark:from-slate-900 dark:via-slate-900/10 dark:to-purple-900/40">
      {/* No mobile sidebar overlay needed */}
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      
      {['/', '/contacts'].includes(location.pathname) && <FloatingActionButton />}
      <MobileNavigation />
    </div>
  )
}

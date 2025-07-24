import { Home, Plus, Settings as SettingsIcon, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface NavItem {
  icon: typeof Home
  path: string
  label: string
}

const navItems: NavItem[] = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: Plus, path: '/contact/new', label: 'Add' },
  { icon: SettingsIcon, path: '/settings', label: 'Settings' }
]

export const MobileNavigation = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  if (window.innerWidth > 768) return null

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400'
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

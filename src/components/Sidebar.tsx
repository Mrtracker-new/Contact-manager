import { LucideIcon, Settings, PlusCircle, Users, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useState } from 'react'

interface NavigationItem {
  name: string;
  to: string;
  icon: LucideIcon;
  description?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Contacts', to: '/', icon: Users, description: 'View all contacts' },
  { name: 'Add Contact', to: '/contact/new', icon: PlusCircle, description: 'Create new contact' },
  { name: 'Settings', to: '/settings', icon: Settings, description: 'App preferences' },
]

export const Sidebar = () => {
  const [hovered, setHovered] = useState<string | null>(null)
  const { isSidebarOpen, closeSidebar } = useStore()

  return (
    <div 
      id="sidebar"
className={`flex-shrink-0 w-80 py-6 px-4 bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-2xl transition-all duration-300 z-50 hidden md:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static fixed top-0 left-0 `}
    >
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-center h-20 px-6 mb-8 relative overflow-hidden">
          <div className="relative flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
              <span className="text-white font-bold text-xs tracking-wider">BY RNR</span>
            </div>
            <div className="text-white">
              <h1 className="font-bold text-2xl tracking-tight">Contact</h1>
              <p className="text-white/80 text-sm font-medium">Manager</p>
            </div>
          </div>
          <Sparkles className="absolute top-2 right-2 w-5 h-5 text-white/60 animate-bounce" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-3">
          <div className="mb-6">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-4">Navigation</p>
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 768) {
                  closeSidebar()
                }
              }}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 mx-2 rounded-2xl text-sm font-medium 
                transition-all duration-200 cursor-pointer relative group
                ${isActive 
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg transition-all duration-200 group-hover:scale-110 ${
                  hovered === item.name ? 'bg-white/20' : ''
                }`}>
                  <item.icon className='w-5 h-5' />
                </div>
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-white/60 group-hover:text-white/80">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              {hovered === item.name && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full animate-slide-in"></div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 mt-8">
          <div className="text-center">
            <p className="text-xs text-white/60">By RNR</p>
            <p className="text-xs text-white/40">v2.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

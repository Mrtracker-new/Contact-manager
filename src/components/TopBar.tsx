import { Grid, List } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { SearchInput } from './SearchInput'

export const TopBar = () => {
const { viewMode, setViewMode } = useStore()
  const location = useLocation()
  const displayToggleButtons = location.pathname === '/' || location.pathname === '/contacts'
  const showSearchInput = location.pathname === '/'

  return (
    <header className="h-16 bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg dark:from-slate-900 dark:to-purple-900 
      flex items-center justify-between px-5 sm:px-8">
      <div className="flex items-center gap-3 flex-1">
        {showSearchInput && (
          <div className="flex-1 max-w-xl hidden md:block">
            <SearchInput />
          </div>
        )}
        <div className="md:hidden flex-1">
          <h1 className="text-lg font-semibold text-white">Contact Manager</h1>
        </div>
      </div>

{displayToggleButtons && (
        <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-3 rounded-xl transition-all duration-200 touch-manipulation ${
            viewMode === 'grid' 
              ? 'bg-white/20 text-white scale-105 shadow-lg' 
              : 'hover:bg-white/10 text-white/80 hover:text-white hover:scale-105'
          }`}
          aria-label="Grid view"
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-3 rounded-xl transition-all duration-200 touch-manipulation ${
            viewMode === 'list' 
              ? 'bg-white/20 text-white scale-105 shadow-lg' 
              : 'hover:bg-white/10 text-white/80 hover:text-white hover:scale-105'
          }`}
          aria-label="List view"
        >
          <List className="w-5 h-5" />
        </button>
        </div>
      )}
    </header>
  )
}

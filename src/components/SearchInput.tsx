import { Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useState, useEffect } from 'react'

export const SearchInput = () => {
  const { searchFilters, updateSearchFilters } = useStore()
  const [value, setValue] = useState(searchFilters.query)

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchFilters({ query: value })
    }, 300)

    return () => clearTimeout(timer)
  }, [value, updateSearchFilters])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search contacts..."
        className="input pl-10 text-sm sm:text-base h-12 touch-manipulation text-gray-900 dark:text-white"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
      />
    </div>
  )
}

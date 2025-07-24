import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export const FloatingActionButton = () => {
  return (
    <Link
      to="/contact/new"
      className="fixed bottom-20 right-6 z-50
        md:hidden
        w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 
        text-white rounded-full shadow-lg shadow-primary-500/30
        flex items-center justify-center
        hover:from-primary-700 hover:to-primary-800
        hover:shadow-xl hover:shadow-primary-500/50
        active:scale-95 transform transition-all duration-300
        border border-primary-500/20
        mobile-touch-target touch-manipulation"
      aria-label="Add new contact"
    >
      <Plus className="w-6 h-6" />
    </Link>
  )
}

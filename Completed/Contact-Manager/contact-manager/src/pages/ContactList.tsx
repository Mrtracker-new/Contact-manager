import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Star, Phone, Mail, Calendar } from 'lucide-react'
import { db } from '../db/database'
import { useStore } from '../store/useStore'
import { Contact } from '../types'
import { dateUtils } from '../utils'
import { ProfilePicture } from '../components/ProfilePicture'
import Fuse from 'fuse.js'

export const ContactList = () => {
  const { viewMode, searchFilters } = useStore()
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const contacts = useLiveQuery(() => {
    try {
      return db.contacts.toArray()
    } catch (err) {
      console.error('Error loading contacts:', err)
      setError('Failed to load contacts')
      return []
    }
  }, [])

  useEffect(() => {
    if (!contacts) {
      setFilteredContacts([])
      return
    }

    console.log('Processing contacts:', contacts.length)
    let result = [...contacts]

    // Apply search
    if (searchFilters.query && searchFilters.query.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'email', 'phone', 'tags'],
        threshold: 0.3,
      })
      result = fuse.search(searchFilters.query.trim()).map(r => r.item)
    }

    // Apply filters
    switch (searchFilters.filterBy) {
      case 'favorites':
        result = result.filter(c => c.isFavorite)
        break
      case 'recent':
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        result = result.filter(c => new Date(c.createdAt) > oneWeekAgo)
        break
      case 'birthday':
        result = result.filter(c => {
          if (!c.birthday) return false
          const days = dateUtils.getDaysUntilBirthday(c.birthday)
          return days <= 30
        })
        break
      case 'all':
      default:
        // No additional filtering for 'all'
        break
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (searchFilters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'favorite':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
        default:
          return 0
      }
    })

    console.log('Filtered contacts:', result.length)
    setFilteredContacts(result)
  }, [contacts, searchFilters])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400">{error}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-4 py-2 mt-4"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!contacts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (filteredContacts.length === 0) {
    const getEmptyStateContent = () => {
      if (searchFilters.query) {
        return {
          title: 'No contacts found',
          message: 'Try adjusting your search terms or clearing the search to see all contacts.',
          buttonText: 'Clear Search',
          buttonAction: () => useStore.getState().updateSearchFilters({ query: '' })
        }
      }
      
      switch (searchFilters.filterBy) {
        case 'favorites':
          return {
            title: 'No favorite contacts',
            message: 'You haven\'t marked any contacts as favorites yet. Star contacts to add them to your favorites.',
            buttonText: 'View All Contacts',
            buttonAction: () => useStore.getState().updateSearchFilters({ filterBy: 'all' })
          }
        case 'recent':
          return {
            title: 'No recent contacts',
            message: 'No contacts have been added in the past week. Add a new contact to get started.',
            buttonText: 'Add Contact',
            buttonLink: '/contact/new'
          }
        case 'birthday':
          return {
            title: 'No upcoming birthdays',
            message: 'None of your contacts have birthdays in the next 30 days. Add birthday information to existing contacts or view all contacts.',
            buttonText: 'View All Contacts',
            buttonAction: () => useStore.getState().updateSearchFilters({ filterBy: 'all' })
          }
        default:
          return {
            title: 'No contacts found',
            message: 'Start building your contact list by adding your first contact.',
            buttonText: 'Add Contact',
            buttonLink: '/contact/new'
          }
      }
    }
    
    const emptyState = getEmptyStateContent()
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{emptyState.title}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {emptyState.message}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            {emptyState.buttonLink ? (
              <Link
                to={emptyState.buttonLink}
                className="btn-primary px-4 py-2"
              >
                {emptyState.buttonText}
              </Link>
            ) : (
              <button
                onClick={emptyState.buttonAction}
                className="btn-secondary px-4 py-2"
              >
                {emptyState.buttonText}
              </button>
            )}
            {searchFilters.filterBy !== 'all' && !searchFilters.query && (
              <Link
                to="/contact/new"
                className="btn-primary px-4 py-2"
              >
                Add Contact
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in mobile-content-safe">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4">
        <div>
          <h1 className="section-header text-xl sm:text-2xl">
            Contacts ({filteredContacts.length})
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Manage your contacts and connections
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={searchFilters.filterBy}
            onChange={(e) => useStore.getState().updateSearchFilters({ filterBy: e.target.value as any })}
            className="input text-sm sm:text-base min-w-[140px] h-12 sm:h-12"
          >
            <option value="all">All Contacts</option>
            <option value="favorites">Favorites</option>
            <option value="recent">Recent</option>
            <option value="birthday">Upcoming Birthdays</option>
          </select>
          <select
            value={searchFilters.sortBy}
            onChange={(e) => useStore.getState().updateSearchFilters({ sortBy: e.target.value as any })}
            className="input text-sm sm:text-base min-w-[140px] h-12 sm:h-12"
          >
            <option value="name">Name</option>
            <option value="createdAt">Date Added</option>
            <option value="updatedAt">Last Updated</option>
            <option value="favorite">Favorites First</option>
          </select>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredContacts.map((contact) => (
            <Link
              key={contact.id}
              to={`/contact/${contact.id}`}
              className="contact-card animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <ProfilePicture
                  profilePicture={contact.profilePicture}
                  name={contact.name}
                  size="large"
                />
                {contact.isFavorite && (
                  <Star className="w-5 h-5 text-yellow-500 fill-current animate-bounce" />
                )}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {contact.name}
              </h3>
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length > 3 && (
                    <span className="tag opacity-60">+{contact.tags.length - 3}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <Link
              key={contact.id}
              to={`/contact/${contact.id}`}
              className="contact-list-item animate-fade-in"
            >
              <div className="contact-avatar-container">
                <ProfilePicture
                  profilePicture={contact.profilePicture}
                  name={contact.name}
                  size="medium"
                />
              </div>
              <div className="contact-info-container">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="contact-name-mobile">
                    {contact.name}
                  </h3>
                  {contact.isFavorite && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="contact-details-mobile">
                  {contact.email && (
                    <div className="contact-detail-item">
                      <Mail className="w-4 h-4" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="contact-detail-item">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.birthday && (
                    <div className="contact-detail-item">
                      <Calendar className="w-4 h-4" />
                      <span>{dateUtils.formatDate(contact.birthday, 'MMM d')}</span>
                    </div>
                  )}
                </div>
                {contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="contact-tag-mobile">
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="contact-tag-mobile opacity-60">+{contact.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

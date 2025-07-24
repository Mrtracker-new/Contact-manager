import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Star, Phone, Mail, Calendar, Search as SearchIcon, X, Clock, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import { Contact } from '../types'
import { dateUtils } from '../utils'
import { useStore } from '../store/useStore';
import { ProfilePicture } from '../components/ProfilePicture'
import Fuse from 'fuse.js'

export const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const { recentSearches, recentlyViewedContacts, addRecentSearch, addRecentlyViewedContact, clearRecentSearches } = useStore()

  useEffect(() => {
    if (!contacts || !searchQuery.trim()) {
      setFilteredContacts([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    
    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(contacts, {
      keys: ['name', 'email', 'phone', 'tags'],
      threshold: 0.3,
      includeScore: true
    })
    
    const results = fuse.search(searchQuery.trim())
    setFilteredContacts(results.map(r => r.item))
    setIsSearching(false)
  }, [contacts, searchQuery])

  const clearSearch = () => {
    setSearchQuery('')
    setFilteredContacts([])
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      addRecentSearch(query.trim())
    }
  }

  const handleContactClick = (contact: Contact) => {
    if (contact.id !== undefined) {
      addRecentlyViewedContact(contact.id)
    }
  }

  const getRecentlyViewedContactsData = () => {
    if (!contacts) return []
    return recentlyViewedContacts
      .map((id: number) => contacts.find(c => c.id === id))
      .filter(Boolean) as Contact[]
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in mobile-content-safe">
      <div className="mb-6 sm:mb-8">
        <h1 className="section-header text-xl sm:text-2xl">
          Search Contacts
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
          Find contacts quickly by name, email, phone, or tags
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6 relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search contacts..."
            className="input w-full pl-12 pr-12 text-lg"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {!searchQuery.trim() && (
          <div className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.slice(0, 5).map((search: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      <SearchIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Viewed Contacts */}
            {getRecentlyViewedContactsData().length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recently Viewed
                </h3>
                <div className="space-y-2">
                  {getRecentlyViewedContactsData().slice(0, 3).map((contact) => (
                    <Link
                      key={contact.id}
                      to={`/contact/${contact.id}`}
                      onClick={() => handleContactClick(contact)}
                      className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ProfilePicture
                          profilePicture={contact.profilePicture}
                          name={contact.name}
                          size="small"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">{contact.name}</h4>
                            {contact.isFavorite && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          {contact.email && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{contact.email}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {recentSearches.length === 0 && getRecentlyViewedContactsData().length === 0 && (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Start typing to search
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Search by name, email, phone number, or tags
                </p>
              </div>
            )}
          </div>
        )}

        {searchQuery.trim() && isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Searching...</p>
          </div>
        )}

        {searchQuery.trim() && !isSearching && filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No contacts found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search terms or check spelling
            </p>
          </div>
        )}

        {filteredContacts.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/contact/${contact.id}`}
                  onClick={() => handleContactClick(contact)}
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
                          <span className="truncate">{contact.email}</span>
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
                      <div className="contact-tags-mobile">
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
          </>
        )}
      </div>
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useEffect } from 'react'
import { Star, StarOff, Phone, Mail, Calendar, XCircle, Edit3, Save, X } from 'lucide-react'
import { dbOperations } from '../db/database'
import { useStore } from '../store/useStore'
import { dateUtils } from '../utils'
import { NoteSection } from '../components/NoteSection2'
import { AttachmentSection } from '../components/AttachmentSection'
import { LinkSection } from '../components/LinkSection'
import { ProfilePicture } from '../components/ProfilePicture'
import toast from 'react-hot-toast'

export const ContactDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableContact, setEditableContact] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    profilePicture: ''
  })

const contact = useLiveQuery(() => dbOperations.getContact(Number(id)), [id])

useEffect(() => {
    if (contact) {
      useStore.setState({ selectedContactId: contact.id })
      // Initialize editable contact state when contact data is loaded
      setEditableContact({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        birthday: contact.birthday ? contact.birthday.toISOString().split('T')[0] : '',
        profilePicture: contact.profilePicture || ''
      })
    }
  }, [contact])

const toggleFavorite = async () => {
    if (contact) {
      await dbOperations.updateContact(contact.id!, { isFavorite: !contact.isFavorite })
    }
  }

const deleteContact = async () => {
    if (contact) {
      setLoading(true)
      await dbOperations.deleteContact(contact.id!)
      setLoading(false)
      toast.success('Contact deleted successfully')
      navigate('/')
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (contact && editableContact.name.trim()) {
      setLoading(true)
      try {
        await dbOperations.updateContact(contact.id!, {
          name: editableContact.name.trim(),
          email: editableContact.email.trim() || undefined,
          phone: editableContact.phone.trim() || undefined,
          birthday: editableContact.birthday ? new Date(editableContact.birthday) : undefined
        })
        setIsEditing(false)
        toast.success('Contact updated successfully')
      } catch (error) {
        toast.error('Failed to update contact')
      } finally {
        setLoading(false)
      }
    } else {
      toast.error('Name is required')
    }
  }

  const handleCancel = () => {
    if (contact) {
      setEditableContact({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        birthday: contact.birthday ? contact.birthday.toISOString().split('T')[0] : '',
        profilePicture: contact.profilePicture || ''
      })
    }
    setIsEditing(false)
  }

  const handleProfilePictureChange = async (imageData: string | null) => {
    if (contact) {
      setLoading(true)
      try {
        await dbOperations.updateContact(contact.id!, { profilePicture: imageData || undefined })
        setEditableContact(prev => ({ ...prev, profilePicture: imageData || '' }))
        toast.success('Profile picture updated successfully')
      } catch (error) {
        toast.error('Failed to update profile picture')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (field: keyof typeof editableContact, value: string) => {
    setEditableContact(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!contact) {
return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

return (
      <div className="p-4 sm:p-6 space-y-6 mobile-content-safe">
        {/* Profile Picture Section */}
        <div className="flex justify-center pb-6">
          <ProfilePicture
            profilePicture={contact.profilePicture}
            name={contact.name}
            size="xlarge"
            editable={isEditing}
            onImageChange={handleProfilePictureChange}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editableContact.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full mb-2"
                placeholder="Contact name"
                autoFocus
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {contact.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave} 
                  className="btn-primary p-3 sm:p-2 touch-manipulation"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="text-sm sm:text-base">Saving...</span>
                  ) : (
                    <span className="flex items-center gap-1 sm:gap-2">
                      <Save className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base">Save</span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleCancel} 
                  className="btn-ghost p-3 sm:p-2 touch-manipulation"
                  disabled={loading}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base">Cancel</span>
                  </span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleEdit} 
                  className="btn-ghost p-3 sm:p-2 touch-manipulation"
                  aria-label="Edit contact"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base">Edit</span>
                  </span>
                </button>
                <button 
                  onClick={toggleFavorite} 
                  className="btn-ghost p-3 sm:p-2 touch-manipulation"
                  aria-label={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {contact.isFavorite ? <StarOff className="w-6 h-6 sm:w-5 sm:h-5 text-red-600" /> : <Star className="w-6 h-6 sm:w-5 sm:h-5 text-yellow-500" />}
                </button>
                <button 
                  onClick={deleteContact} 
                  className="btn-danger p-3 sm:p-2 touch-manipulation"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="text-sm sm:text-base">Deleting...</span>
                  ) : (
                    <span className="flex items-center gap-1 sm:gap-2">
                      <XCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base">Delete</span>
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Contact Info Card */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Contact Information
          </h2>
          {(contact.email || isEditing) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editableContact.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 py-1"
                    placeholder="Email address"
                  />
                ) : (
                  <p className="text-slate-900 dark:text-slate-100 truncate">{contact.email}</p>
                )}
              </div>
              {!isEditing && contact.email && (
                <a 
                  href={`mailto:${contact.email}`} 
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-manipulation"
                  aria-label="Send email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
          {(contact.phone || isEditing) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editableContact.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 py-1"
                    placeholder="Phone number"
                  />
                ) : (
                  <p className="text-slate-900 dark:text-slate-100">{contact.phone}</p>
                )}
              </div>
              {!isEditing && contact.phone && (
                <a 
                  href={`tel:${contact.phone}`} 
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-manipulation"
                  aria-label="Call phone"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
          {(contact.birthday || isEditing) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400">Birthday</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editableContact.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 py-1"
                  />
                ) : (
<p className="text-slate-900 dark:text-slate-100">{contact.birthday ? dateUtils.formatDate(contact.birthday, 'MMM d') : ''}</p>
                )}
              </div>
            </div>
          )}
        </div>
        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        <NoteSection contactId={contact.id!} />
        <AttachmentSection contactId={contact.id!} />
        <LinkSection contactId={contact.id!} />
      </div>
    )
}

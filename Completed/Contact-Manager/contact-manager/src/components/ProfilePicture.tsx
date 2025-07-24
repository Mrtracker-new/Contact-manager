import React, { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfilePictureProps {
  profilePicture?: string
  name: string
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  editable?: boolean
  onImageChange?: (imageData: string | null) => void
  className?: string
}

const sizeClasses = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-12 h-12 text-sm',
  large: 'w-16 h-16 text-base',
  xlarge: 'w-24 h-24 text-lg'
}

const iconSizes = {
  small: 'w-3 h-3',
  medium: 'w-4 h-4',
  large: 'w-5 h-5',
  xlarge: 'w-6 h-6'
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  profilePicture,
  name,
  size = 'medium',
  editable = false,
  onImageChange,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsLoading(true)

    try {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 300x300)
        const maxSize = 300
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        onImageChange?.(compressedDataUrl)
        setIsLoading(false)
        toast.success('Profile picture updated!')
      }

      img.onerror = () => {
        toast.error('Failed to process image')
        setIsLoading(false)
      }

      // Read the file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)

    } catch (error) {
      toast.error('Failed to upload image')
      setIsLoading(false)
    }

    // Clear the input
    event.target.value = ''
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange?.(null)
    toast.success('Profile picture removed')
  }

  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full flex items-center justify-center font-bold
          transition-all duration-300 relative overflow-hidden
          ${editable ? 'cursor-pointer hover:scale-105' : ''}
          ${profilePicture 
            ? 'ring-2 ring-white/20' 
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg'
          }
        `}
        onClick={handleImageClick}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full border-2 border-white/30 border-t-white w-1/2 h-1/2" />
        ) : profilePicture ? (
          <img
            src={profilePicture}
            alt={`${name}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                  ${initials}
                </div>
              `
            }}
          />
        ) : (
          <span>{initials}</span>
        )}

        {editable && !isLoading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className={`${iconSizes[size]} text-white`} />
          </div>
        )}
      </div>

      {/* Remove button for editable mode when image exists */}
      {editable && profilePicture && !isLoading && (
        <button
          onClick={handleRemoveImage}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
          title="Remove profile picture"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      )}
    </div>
  )
}

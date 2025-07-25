import { useStore } from '../store/useStore'
import { exportUtils, encryption } from '../utils'
import { dbOperations } from '../db/database'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Download, Upload, Palette, Monitor, Sun, Moon, Info, Settings as SettingsIcon, Shield, Database, HardDrive, Wifi, WifiOff, Lock, Key, FileCheck, AlertCircle, CheckCircle, FileSpreadsheet, Github, ExternalLink, Heart } from 'lucide-react'

type ThemeType = 'light' | 'dark' | 'system'

export const Settings = () => {
  const { settings, updateSettings } = useStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [exportPassword, setExportPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [showExportPassword, setShowExportPassword] = useState(false)
  const [showImportPassword, setShowImportPassword] = useState(false)
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Get storage information
  useEffect(() => {
    const getStorageInfo = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          setStorageInfo({
            used: estimate.usage || 0,
            total: estimate.quota || 0
          })
        } catch (error) {
          console.error('Failed to get storage estimate:', error)
        }
      }
    }
    
    getStorageInfo()
  }, [])

  const handleThemeChange = (theme: ThemeType) => {
    updateSettings({ theme })
    // Immediately update document class for better responsiveness
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System theme - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }

  const handleExportData = async (format: 'json' | 'excel' = 'json') => {
    if (isExporting) return
    
    setIsExporting(true)
    try {
      const data = await dbOperations.exportData()
      let exportData: any = data
      
      // Encrypt data if password is provided and encryption is enabled (JSON only)
      if (format === 'json' && settings.enableDataEncryption && exportPassword) {
        const jsonString = JSON.stringify(data)
        const encryptedData = {
          encrypted: true,
          data: encryption.encrypt(jsonString, exportPassword),
          timestamp: Date.now(),
          version: '2.0.0'
        }
        exportData = encryptedData
      }
      
      const fileExtension = format === 'excel' ? 'xlsx' : 'json'
      const fileName = `contacts-backup-${Date.now()}.${fileExtension}`
      
      // Check if running on Capacitor (mobile) - more robust detection
      const isCapacitor = typeof window !== 'undefined' && 
                         (window as any).Capacitor && 
                         (window as any).Capacitor.isNativePlatform && 
                         (window as any).Capacitor.isNativePlatform()
      
      if (isCapacitor) {
        try {
          const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
          const { Share } = await import('@capacitor/share')
          const { Toast } = await import('@capacitor/toast')
          
          let fileContent: string
          
          if (format === 'excel') {
            // For Excel export on mobile, we need to create the buffer first
            const XLSX = await import('xlsx')
            const workbook = XLSX.utils.book_new()
            
            // Add contacts sheet
            if (data.contacts && data.contacts.length > 0) {
              const contactsData = data.contacts.map((contact: any) => ({
                ID: contact.id || '',
                Name: contact.name || '',
                Email: contact.email || '',
                Phone: contact.phone || '',
                Birthday: contact.birthday ? new Date(contact.birthday).toLocaleDateString() : '',
                Tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
                'Is Favorite': contact.isFavorite ? 'Yes' : 'No',
                'Profile Picture': contact.profilePicture ? 'Has Image' : 'No Image',
                'Custom Fields': Array.isArray(contact.customFields) ? 
                  contact.customFields.map((field: any) => `${field.label}: ${field.value}`).join('; ') : '',
                'Created At': contact.createdAt ? new Date(contact.createdAt).toLocaleString() : ''
              }))
              const contactsSheet = XLSX.utils.json_to_sheet(contactsData)
              XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts')
            }
            
            // Add other sheets (simplified for mobile)
            if (data.notes && data.notes.length > 0) {
              const notesSheet = XLSX.utils.json_to_sheet(data.notes)
              XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes')
            }
            
            if (data.links && data.links.length > 0) {
              const linksSheet = XLSX.utils.json_to_sheet(data.links)
              XLSX.utils.book_append_sheet(workbook, linksSheet, 'Links')
            }
            
            // Create Excel buffer and convert to base64 properly
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const uint8Array = new Uint8Array(excelBuffer)
            
            // Convert to base64 using more reliable method
            fileContent = btoa(
              uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
            )
          } else {
            // JSON export
            fileContent = JSON.stringify(exportData, null, 2)
          }
          
          // Try to write file to different directories
          let result
          let savedLocation = ''
          
          const writeOptions = {
            path: fileName,
            data: fileContent,
            encoding: format === 'excel' ? Encoding.UTF8 : Encoding.UTF8
          }
          
          // For Excel files, we need to write as base64
          if (format === 'excel') {
            writeOptions.encoding = undefined as any // Let Capacitor handle binary data
          }
          
          try {
            // Try Documents directory first (most reliable on Android)
            result = await Filesystem.writeFile({
              ...writeOptions,
              directory: Directory.Documents
            })
            savedLocation = 'Documents folder'
          } catch (docError) {
            console.log('Documents folder not accessible, trying Cache:', docError)
            try {
              // Try Cache directory (always accessible)
              result = await Filesystem.writeFile({
                ...writeOptions,
                directory: Directory.Cache
              })
              savedLocation = 'temporary cache'
            } catch (cacheError) {
              console.log('Cache folder not accessible, trying Data:', cacheError)
              try {
                // Try Data directory as fallback
                result = await Filesystem.writeFile({
                  ...writeOptions,
                  directory: Directory.Data
                })
                savedLocation = 'app data folder'
              } catch (dataError) {
                console.error('All directory attempts failed:', dataError)
                throw new Error('Unable to save file to device storage')
              }
            }
          }
          
          // Show native toast for better visibility
          await Toast.show({
            text: `✅ Backup saved successfully to ${savedLocation}!`,
            duration: 'long',
            position: 'bottom'
          })
          
          toast.success(`Backup saved to ${savedLocation}: ${fileName}`)
          
          // Ask user if they want to share the file
          const userWantsToShare = await new Promise(resolve => {
            const confirmDialog = document.createElement('div')
            confirmDialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
            confirmDialog.innerHTML = `
              <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
                <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Backup Saved Successfully!</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6">Your backup has been saved to ${savedLocation}. Would you like to share it now?</p>
                <div class="flex gap-3">
                  <button id="share-yes" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Share Now</button>
                  <button id="share-no" class="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium">Done</button>
                </div>
              </div>
            `
            
            document.body.appendChild(confirmDialog)
            
            confirmDialog.querySelector('#share-yes')?.addEventListener('click', () => {
              document.body.removeChild(confirmDialog)
              resolve(true)
            })
            
            confirmDialog.querySelector('#share-no')?.addEventListener('click', () => {
              document.body.removeChild(confirmDialog)
              resolve(false)
            })
          })
          
          if (userWantsToShare) {
            try {
              await Share.share({
                title: 'Contact Manager Backup',
                text: `Contact Manager backup file (${fileName})`,
                url: result.uri,
                dialogTitle: 'Share Backup File'
              })
            } catch (shareError) {
              console.log('Share cancelled or failed:', shareError)
              toast('Share cancelled', { icon: 'ℹ️' })
            }
          }
          
        } catch (capacitorError) {
          console.error('Capacitor export error:', capacitorError)
          toast.error('Failed to save to device. Trying alternative method...')
          
          // Fallback: try to create a downloadable blob and share it
          try {
            const { Share } = await import('@capacitor/share')
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            
            await Share.share({
              title: 'Contact Manager Backup',
              text: 'Contact Manager backup file',
              url: url,
              dialogTitle: 'Share Backup File'
            })
            
            toast.success('Backup shared successfully!')
          } catch (fallbackError) {
            console.error('Fallback share error:', fallbackError)
            // Final fallback to regular download
            exportUtils.downloadJSON(exportData, fileName.replace('.json', ''))
            toast.success('Data exported successfully!')
          }
        }
      } else {
        // Browser - use appropriate export method
        if (format === 'excel') {
          await exportUtils.downloadExcel(data, fileName.replace('.xlsx', ''))
          toast.success('Data exported to Excel successfully!')
          // Add specific warning about Excel limitations
          setTimeout(() => {
            toast('⚠️ Check the "IMPORTANT - READ FIRST" sheet in your Excel file for data limitations info!', {
              duration: 6000,
              style: {
                background: '#EFF6FF',
                color: '#1E40AF',
                border: '1px solid #3B82F6'
              }
            })
          }, 1000)
        } else {
          exportUtils.downloadJSON(exportData, fileName.replace('.json', ''))
          toast.success('Data exported successfully!')
        }
      }
      
      setExportPassword('')
    } catch (error) {
      console.error('Export error:', error)
      
      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('Excel')) {
          toast.error(`Excel export failed: ${error.message}. Try JSON export for large datasets.`)
        } else if (error.message.includes('too large')) {
          toast.error('Data is too large for Excel format. Please use JSON export instead.')
        } else {
          toast.error(`Export failed: ${error.message}`)
        }
      } else {
        toast.error('Failed to export data. Please try again or use JSON format.')
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || isImporting) return

    setIsImporting(true)
    try {
      const fileType = exportUtils.getFileType(file)
      let data: any
      
      if (fileType === 'excel') {
        // Import from Excel
        data = await exportUtils.readExcelFile(file)
        
        // Check for truncated data and warn user
        let hasTruncatedData = false
        const checkForTruncation = (obj: any): void => {
          if (typeof obj === 'string' && obj.includes('[TRUNCATED')) {
            hasTruncatedData = true
            return
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                checkForTruncation(obj[key])
                if (hasTruncatedData) return
              }
            }
          }
        }
        
        checkForTruncation(data)
        
        if (hasTruncatedData) {
          toast.success('Excel file imported successfully!', {
            duration: 3000
          })
          toast('⚠️ Some profile pictures or attachments may be incomplete due to Excel size limits. Use JSON export for full data fidelity.', {
            duration: 8000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #F59E0B'
            }
          })
        } else {
          toast.success('Excel file imported successfully!')
          toast('⚠️ Remember, Excel may not include full images or attachments. For complete data, use JSON!', {
            duration: 8000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #F59E0B'
            }
          })
        }
      } else if (fileType === 'json') {
        // Import from JSON
        const rawData = await exportUtils.readJSONFile(file)
        data = rawData
        
        // Check if data is encrypted
        if (rawData.encrypted) {
          if (!importPassword) {
            toast.error('This backup is encrypted. Please enter the password.')
            setIsImporting(false)
            e.target.value = ''
            return
          }
          
          try {
            const decryptedString = encryption.decrypt(rawData.data, importPassword)
            data = JSON.parse(decryptedString)
          } catch (decryptError) {
            toast.error('Failed to decrypt backup. Please check your password.')
            setIsImporting(false)
            e.target.value = ''
            return
          }
        }
        
        toast.success('JSON backup imported successfully!')
      } else {
        throw new Error('Unsupported file format. Please use .json or .xlsx files.')
      }
      
      await dbOperations.importData(data)
      setImportPassword('')
    } catch (error) {
      console.error('Import error:', error)
      toast.error(`Failed to import data: ${error instanceof Error ? error.message : 'Please check the file format.'}`)
    } finally {
      setIsImporting(false)
      // Reset file input
      e.target.value = ''
    }
  }
  
  // Handle mobile import using file picker
  const handleMobileImport = async () => {
    if (isImporting) return
    
    setIsImporting(true)
    try {
      const isCapacitor = typeof window !== 'undefined' && 
                         (window as any).Capacitor && 
                         (window as any).Capacitor.isNativePlatform && 
                         (window as any).Capacitor.isNativePlatform()
      
      if (!isCapacitor) {
        toast.error('Mobile import is only available on mobile devices')
        return
      }
      
      // Use Capacitor's Filesystem to show file picker
      const { Toast } = await import('@capacitor/toast')
      
      // For now, we'll create a simple file selector dialog
      // In a real implementation, you might want to use a file picker plugin
      const fileContent = await new Promise<string | null>((resolve) => {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
        modal.innerHTML = `
          <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Import Backup File</h3>
            <p class="text-slate-600 dark:text-slate-400 mb-4">Please select your backup file (.json or .xlsx):</p>
            <input type="file" id="mobile-file-input" accept=".json,.xlsx,.xls" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4" />
            <div class="flex gap-3">
              <button id="import-confirm" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Import</button>
              <button id="import-cancel" class="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        `
        
        document.body.appendChild(modal)
        
        const fileInput = modal.querySelector('#mobile-file-input') as HTMLInputElement
        let selectedFile: File | null = null
        
        fileInput.addEventListener('change', (e) => {
          const files = (e.target as HTMLInputElement).files
          if (files && files[0]) {
            selectedFile = files[0]
          }
        })
        
        modal.querySelector('#import-confirm')?.addEventListener('click', async () => {
          if (!selectedFile) {
            await Toast.show({
              text: 'Please select a file first',
              duration: 'short'
            })
            return
          }
          
          try {
            const content = await selectedFile.text()
            document.body.removeChild(modal)
            resolve(content)
          } catch (error) {
            console.error('Error reading file:', error)
            await Toast.show({
              text: 'Failed to read file',
              duration: 'short'
            })
            document.body.removeChild(modal)
            resolve(null)
          }
        })
        
        modal.querySelector('#import-cancel')?.addEventListener('click', () => {
          document.body.removeChild(modal)
          resolve(null)
        })
      })
      
      if (!fileContent) {
        await Toast.show({
          text: 'Import cancelled',
          duration: 'short'
        })
        return
      }
      
      // Process the file content
      let data: any
      
      try {
        // Try to parse as JSON first
        const rawData = JSON.parse(fileContent)
        
        // Check if data is encrypted
        if (rawData.encrypted) {
          if (!importPassword) {
            // Prompt for password
            const password = await new Promise<string | null>((resolve) => {
              const modal = document.createElement('div')
              modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
              modal.innerHTML = `
                <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
                  <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Encrypted Backup</h3>
                  <p class="text-slate-600 dark:text-slate-400 mb-4">This backup is encrypted. Please enter the password:</p>
                  <input type="password" id="decrypt-password" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4" placeholder="Enter password" />
                  <div class="flex gap-3">
                    <button id="decrypt-confirm" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Decrypt</button>
                    <button id="decrypt-cancel" class="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium">Cancel</button>
                  </div>
                </div>
              `
              
              document.body.appendChild(modal)
              
              const passwordInput = modal.querySelector('#decrypt-password') as HTMLInputElement
              passwordInput.focus()
              
              modal.querySelector('#decrypt-confirm')?.addEventListener('click', () => {
                const password = passwordInput.value
                document.body.removeChild(modal)
                resolve(password || null)
              })
              
              modal.querySelector('#decrypt-cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal)
                resolve(null)
              })
              
              // Handle Enter key
              passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                  const password = passwordInput.value
                  document.body.removeChild(modal)
                  resolve(password || null)
                }
              })
            })
            
            if (!password) {
              await Toast.show({
                text: 'Import cancelled - no password provided',
                duration: 'short'
              })
              return
            }
            
            try {
              const decryptedString = encryption.decrypt(rawData.data, password)
              data = JSON.parse(decryptedString)
            } catch (decryptError) {
              await Toast.show({
                text: 'Failed to decrypt backup. Incorrect password.',
                duration: 'long'
              })
              return
            }
          } else {
            // Use the password from the input field
            try {
              const decryptedString = encryption.decrypt(rawData.data, importPassword)
              data = JSON.parse(decryptedString)
            } catch (decryptError) {
              toast.error('Failed to decrypt backup. Please check your password.')
              return
            }
          }
        } else {
          data = rawData
        }
        
        // Import the data
        await dbOperations.importData(data)
        
        await Toast.show({
          text: '✅ JSON backup imported successfully!',
          duration: 'long',
          position: 'bottom'
        })
        
        toast.success('JSON backup imported successfully!')
        
      } catch (jsonError) {
        // If JSON parsing fails, it might be an Excel file
        console.log('Not a JSON file, checking if it\'s Excel...')
        
        try {
          // For Excel files on mobile, we need to handle them differently
          // This is a simplified approach - in reality, you might need a more robust solution
          await Toast.show({
            text: '❌ Excel files cannot be imported directly on mobile. Please use JSON format or share the Excel file with the app.',
            duration: 'long'
          })
          
          toast.error('Excel files are not supported for direct mobile import. Please use JSON format or share the Excel file with the app.')
          return
          
        } catch (excelError) {
          console.error('File processing error:', excelError)
          await Toast.show({
            text: '❌ Invalid backup file format',
            duration: 'long'
          })
          
          toast.error('Invalid backup file format. Please use .json or .xlsx files.')
        }
      }
      
      setImportPassword('')
      
    } catch (error) {
      console.error('Mobile import error:', error)
      const { Toast } = await import('@capacitor/toast')
      await Toast.show({
        text: '❌ Failed to import file. Please try again.',
        duration: 'long'
      })
      
      toast.error('Failed to import file. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  return (
    <div className="p-6 max-w-3xl mx-auto mobile-content-safe">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Theme Preference</label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={settings.theme === 'light'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
                  className="sr-only"
                />
                <Sun className="w-6 h-6 mb-2 text-yellow-500" />
                <span className="text-sm font-medium">Light</span>
              </label>
              
              <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={settings.theme === 'dark'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
                  className="sr-only"
                />
                <Moon className="w-6 h-6 mb-2 text-slate-600" />
                <span className="text-sm font-medium">Dark</span>
              </label>
              
              <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.theme === 'system' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={settings.theme === 'system'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
                  className="sr-only"
                />
                <Monitor className="w-6 h-6 mb-2 text-slate-500" />
                <span className="text-sm font-medium">System</span>
              </label>
            </div>
          </div>

        </div>

        {/* Security Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security & Privacy</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 max-w-md w-full">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="block font-medium text-sm">Data Encryption</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Encrypt exported backups</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableDataEncryption}
                  onChange={(e) => updateSettings({ enableDataEncryption: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </label>
            </div>
            
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-1">Privacy First</h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    All your data is stored locally on your device. No information is sent to external servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Offline */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Storage & Offline</h2>
          </div>
          
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <span className="block font-medium text-slate-900 dark:text-slate-100">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isOnline ? 'Connected to internet' : 'Working offline'}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isOnline ? 'Connected' : 'Offline Mode'}
              </div>
            </div>

            {/* Storage Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Storage Used</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatFileSize(storageInfo.used)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  of {formatFileSize(storageInfo.total)} available
                </div>
                {storageInfo.total > 0 && (
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((storageInfo.used / storageInfo.total) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-sm">Offline Ready</span>
                </div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  100%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  All features work offline
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Offline First Design</h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Your contacts are stored locally using IndexedDB for instant access and full offline functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Data */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Backup & Data</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="block font-medium text-slate-900 dark:text-slate-100">Auto Backup</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">Automatically backup your contacts</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded"
              />
            </div>
            
            {settings.autoBackup && (
              <div className="ml-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => updateSettings({ backupFrequency: e.target.value as any })}
                  className="input max-w-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            {/* Export/Import with Encryption */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              {settings.enableDataEncryption && (
                <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900 dark:text-amber-100">Encryption Settings</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-amber-800 dark:text-amber-200">Export Password</label>
                      <div className="relative">
                        <input
                          type={showExportPassword ? 'text' : 'password'}
                          value={exportPassword}
                          onChange={(e) => setExportPassword(e.target.value)}
                          placeholder="Enter password to encrypt export"
                          className="input pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowExportPassword(!showExportPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showExportPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-amber-800 dark:text-amber-200">Import Password</label>
                      <div className="relative">
                        <input
                          type={showImportPassword ? 'text' : 'password'}
                          value={importPassword}
                          onChange={(e) => setImportPassword(e.target.value)}
                          placeholder="Enter password to decrypt import"
                          className="input pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowImportPassword(!showImportPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showImportPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Export Options */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Export Options</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button 
                      onClick={() => handleExportData('json')} 
                      disabled={isExporting || (settings.enableDataEncryption && !exportPassword)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Export as JSON'}
                    </button>
                    
                    <button 
                      onClick={() => handleExportData('excel')} 
                      disabled={isExporting}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Export as Excel'}
                    </button>
                  </div>
                </div>
                
                {/* Import Options */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Import Options</h4>
                  <div className="grid gap-3 md:grid-cols-1">
                    {(() => {
                      const isCapacitor = typeof window !== 'undefined' && 
                                         (window as any).Capacitor && 
                                         (window as any).Capacitor.isNativePlatform && 
                                         (window as any).Capacitor.isNativePlatform()
                      
                      if (isCapacitor) {
                        // Mobile: Show import button and instructions
                        return (
                          <div className="space-y-3">
                            {/* Import Button */}
                            <button 
                              onClick={handleMobileImport}
                              disabled={isImporting}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              {isImporting ? 'Importing...' : 'Import Backup File'}
                            </button>
                            
                            {/* Instructions */}
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📱 Mobile Import Options</h4>
                              <div className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                <p className="font-medium mb-2">Method 1: Use Import Button (Recommended)</p>
                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 mb-3">
                                  <li>• Tap the "Import Backup File" button above</li>
                                  <li>• Select your backup file (.json or .xlsx) from storage</li>
                                  <li>• The app will automatically import your data</li>
                                </ul>
                                
                                <p className="font-medium mb-2">Method 2: Share to App</p>
                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                                  <li>• Locate your backup file in file manager or email</li>
                                  <li>• Tap "Share" and select "Contact Manager"</li>
                                  <li>• The app will automatically import your data</li>
                                </ul>
                              </div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
                                💡 Both methods support .json and .xlsx backup files with full encryption support.
                              </p>
                            </div>
                          </div>
                        )
                      } else {
                        // Web/Desktop: Use file input
                        return (
                          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" />
                            {isImporting ? 'Importing...' : 'Import Data (JSON or Excel)'}
                            <input
                              type="file"
                              accept=".json,.xlsx,.xls"
                              onChange={handleImportData}
                              disabled={isImporting}
                              className="hidden"
                            />
                          </label>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Export/Import Guide
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Export creates a complete backup of all your contacts, notes, links, and attachments</li>
                    <li>• Import will replace all existing data with the backup data</li>
                    <li>• JSON format: Full compatibility with app features + encryption support</li>
                    <li>• Excel format: Human-readable spreadsheet for easy editing and viewing</li>
                    <li>• Profile pictures and attachment files are preserved in both formats</li>
                    <li>• Excel format may truncate very large files/images for compatibility</li>
                    <li>• Excel files can be imported back into the app after editing</li>
                    <li>• {settings.enableDataEncryption ? 'Encrypted exports require a password to restore (JSON only)' : 'Enable encryption for secure JSON backups'}</li>
                  </ul>
                </div>
                
                {/* Mobile Storage Info */}
                {(() => {
                  const isCapacitor = typeof window !== 'undefined' && 
                                     (window as any).Capacitor && 
                                     (window as any).Capacitor.isNativePlatform && 
                                     (window as any).Capacitor.isNativePlatform()
                  return isCapacitor ? (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <HardDrive className="w-4 h-4" />
                        Mobile Storage Location
                      </h4>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Exported files are saved to your device's Documents folder</li>
                        <li>• You can share the backup file directly after export</li>
                        <li>• Use your device's file manager to access saved backups</li>
                        <li>• Files are named: contacts-backup-[timestamp].json</li>
                      </ul>
                    </div>
                  ) : null
                })()}
                
                {/* Browser Storage Info */}
                {(() => {
                  const isCapacitor = typeof window !== 'undefined' && 
                                     (window as any).Capacitor && 
                                     (window as any).Capacitor.isNativePlatform && 
                                     (window as any).Capacitor.isNativePlatform()
                  return !isCapacitor ? (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-900 dark:text-green-100">
                        <Download className="w-4 h-4" />
                        Browser Download
                      </h4>
                      <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                        <li>• Files are downloaded to your default Downloads folder</li>
                        <li>• Check your browser's download manager for the file location</li>
                        <li>• Files are named: contacts-backup-[timestamp].json</li>
                      </ul>
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 text-center">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">v2.0.0</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Version</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Offline</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Storage</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Cross-platform</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Compatibility</div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-center">
                A modern, privacy-focused contact management application designed for organizing and managing your personal and professional contacts with ease.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Information */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About the Author</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This project was developed by Rolan. Always learning, always building.
          </p>
          <div className="flex gap-4">
            <a href="https://github.com/Mrtracker-new" target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://rolan-rnr.netlify.app/" target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
              <ExternalLink className="w-4 h-4" /> Portfolio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { ContactList } from './pages/ContactList'
import { ContactDetail } from './pages/ContactDetail'
import { NewContact } from './pages/NewContact'
import { Settings } from './pages/Settings'
import { Search } from './pages/Search'
import { useStore } from './store/useStore'
import { dbOperations } from './db/database'
import { exportUtils, encryption } from './utils'
import toast from 'react-hot-toast'

function App() {
  const { settings } = useStore()
  const [isReady, setIsReady] = useState(false)
  const navigate = useNavigate()

  // Handle mobile file imports
  useEffect(() => {
    const handleAppUrl = async (url: string) => {
      console.log('Handling app URL:', url)
      
      // Check if this is a file import URL
      if (url.includes('file://') || url.includes('content://')) {
        try {
          const isCapacitor = typeof window !== 'undefined' && 
                             (window as any).Capacitor && 
                             (window as any).Capacitor.isNativePlatform && 
                             (window as any).Capacitor.isNativePlatform()
          
          if (!isCapacitor) return
          
          const { Filesystem } = await import('@capacitor/filesystem')
          const { Toast } = await import('@capacitor/toast')
          
          await Toast.show({
            text: 'File received! Processing import...',
            duration: 'short',
            position: 'center'
          })
          
          // Read the file
          const result = await Filesystem.readFile({
            path: url
          })
          
          const fileContent = result.data as string
          const fileName = url.split('/').pop() || 'backup'
          
          // Determine file type
          let data: any
          if (fileName.includes('.json')) {
            try {
              const rawData = JSON.parse(fileContent)
              
              // Check if data is encrypted
              if (rawData.encrypted) {
                // Prompt for password
                const password = await new Promise<string | null>((resolve) => {
                  const modal = document.createElement('div')
                  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
                  modal.innerHTML = `
                    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
                      <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Encrypted Backup</h3>
                      <p class="text-slate-600 dark:text-slate-400 mb-4">This backup is encrypted. Please enter the password:</p>
                      <input type="password" id="import-password" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4" placeholder="Enter password" />
                      <div class="flex gap-3">
                        <button id="import-confirm" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Import</button>
                        <button id="import-cancel" class="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium">Cancel</button>
                      </div>
                    </div>
                  `
                  
                  document.body.appendChild(modal)
                  
                  const passwordInput = modal.querySelector('#import-password') as HTMLInputElement
                  passwordInput.focus()
                  
                  modal.querySelector('#import-confirm')?.addEventListener('click', () => {
                    const password = passwordInput.value
                    document.body.removeChild(modal)
                    resolve(password || null)
                  })
                  
                  modal.querySelector('#import-cancel')?.addEventListener('click', () => {
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
                    text: 'Import cancelled',
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
                data = rawData
              }
              
              // Import the data
              await dbOperations.importData(data)
              
              await Toast.show({
                text: '✅ Backup imported successfully!',
                duration: 'long',
                position: 'bottom'
              })
              
              toast.success('Backup imported successfully!')
              
              // Navigate to contacts list
              navigate('/')
              
            } catch (jsonError) {
              console.error('JSON parsing error:', jsonError)
              await Toast.show({
                text: '❌ Invalid JSON backup file',
                duration: 'long'
              })
            }
          } else if (fileName.includes('.xlsx') || fileName.includes('.xls')) {
            try {
              // For Excel files, we need to handle them differently
              // Create a File object from the content
              const uint8Array = new Uint8Array(atob(fileContent).split('').map(char => char.charCodeAt(0)))
              const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
              const file = new File([blob], fileName, { type: blob.type })
              
              data = await exportUtils.readExcelFile(file)
              
              // Import the data
              await dbOperations.importData(data)
              
              await Toast.show({
                text: '✅ Excel backup imported successfully!',
                duration: 'long',
                position: 'bottom'
              })
              
              toast.success('Excel backup imported successfully!')
              toast('⚠️ Remember, Excel may not include full images or attachments. For complete data, use JSON!', {
                duration: 8000,
                style: {
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #F59E0B'
                }
              })
              
              // Navigate to contacts list
              navigate('/')
              
            } catch (excelError) {
              console.error('Excel parsing error:', excelError)
              await Toast.show({
                text: '❌ Invalid Excel backup file',
                duration: 'long'
              })
            }
          } else {
            await Toast.show({
              text: '❌ Unsupported file format. Use .json or .xlsx files.',
              duration: 'long'
            })
          }
          
        } catch (error) {
          console.error('Error handling shared file:', error)
          const { Toast } = await import('@capacitor/toast')
          await Toast.show({
            text: '❌ Failed to import file. Please try again.',
            duration: 'long'
          })
        }
      }
    }
    
    // Set up Capacitor App URL listener for mobile
    const setupCapacitorListeners = async () => {
      try {
        const isCapacitor = typeof window !== 'undefined' && 
                          (window as any).Capacitor && 
                          (window as any).Capacitor.isNativePlatform && 
                          (window as any).Capacitor.isNativePlatform()
        
        if (isCapacitor) {
          const { App } = await import('@capacitor/app')
          
          // Listen for app URL open events (when files are shared with the app)
          App.addListener('appUrlOpen', (event) => {
            console.log('App URL opened:', event.url)
            handleAppUrl(event.url)
          })
          
          // Also handle the initial URL if app was opened with a file
          const urlInfo = await App.getLaunchUrl()
          if (urlInfo && urlInfo.url) {
            handleAppUrl(urlInfo.url)
          }
        }
      } catch (error) {
        console.error('Error setting up Capacitor listeners:', error)
      }
    }
    
    setupCapacitorListeners()
  }, [])

  useEffect(() => {
    try {
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        // Apply theme
        if (settings?.theme === 'dark' || 
            (settings?.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        setIsReady(true)
      }, 100)

      return () => clearTimeout(timer)
    } catch (error) {
      console.error('Error initializing app:', error)
      setIsReady(true) // Still show the app even if theme fails
    }
  }, [settings?.theme])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ContactList />} />
          <Route path="search" element={<Search />} />
          <Route path="contact/new" element={<NewContact />} />
          <Route path="contact/:id" element={<ContactDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            minWidth: '300px',
            maxWidth: '500px',
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
          blank: {
            style: {
              background: settings?.theme === 'dark' ? '#1e293b' : '#fff',
              color: settings?.theme === 'dark' ? '#fff' : '#1e293b',
              border: settings?.theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
            },
          },
        }}
      />
    </>
  )
}

export default App

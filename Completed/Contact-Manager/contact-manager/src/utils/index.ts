import CryptoJS from 'crypto-js';
import { format, parseISO, isValid } from 'date-fns';

// Encryption utilities
export const encryption = {
  encrypt: (data: string, password: string): string => {
    return CryptoJS.AES.encrypt(data, password).toString();
  },
  
  decrypt: (encryptedData: string, password: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  },
  
  hashPassword: (password: string): string => {
    return CryptoJS.SHA256(password).toString();
  }
};

// File utilities
export const fileUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  getFileExtension: (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },
  
  getMimeType: (filename: string): string => {
    const ext = fileUtils.getFileExtension(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      
      // Videos
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  },
  
  isImageFile: (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  },
  
  isVideoFile: (mimeType: string): boolean => {
    return mimeType.startsWith('video/');
  },
  
  isDocumentFile: (mimeType: string): boolean => {
    return mimeType.includes('pdf') || 
           mimeType.includes('word') || 
           mimeType.includes('sheet') || 
           mimeType.includes('presentation') ||
           mimeType.includes('text');
  },
  
  openFile: (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Check if running in Capacitor (mobile app)
        if (typeof window !== 'undefined' && (window as any).Capacitor) {
          // Use Capacitor's file system plugin
          import('@capacitor/filesystem').then(() => {
            // Try to open the file using the default app
            if ((window as any).Capacitor.isNativePlatform()) {
              // On mobile, try to use the device's default app
              window.open(filePath, '_system');
              resolve();
            } else {
              reject(new Error('File opening not supported on this platform'));
            }
          }).catch(() => {
            reject(new Error('Capacitor Filesystem plugin not available'));
          });
        }
        // Check if running in Electron (has access to file system)
        else if (typeof window !== 'undefined' && (window as any).electronAPI) {
          // If running in Electron
          (window as any).electronAPI.openFile(filePath);
          resolve();
        }
        // Check if running in Tauri (desktop app)
        else if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          const modulePath = '@tauri-apps/api/shell';
          import(/* @vite-ignore */ modulePath).then(({ open }) => {
            open(filePath).then(resolve).catch(reject);
          }).catch(() => {
            reject(new Error('Tauri shell API not available'));
          });
        }
        // Check if we have access to Node.js APIs (desktop environment)
        else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // If running in a Node.js environment (like desktop app)
          const { exec } = require('child_process');
          const os = require('os');
          
          let command: string;
          const platform = os.platform();
          
          if (platform === 'win32') {
            // Windows
            command = `start "" "${filePath}"`;
          } else if (platform === 'darwin') {
            // macOS
            command = `open "${filePath}"`;
          } else {
            // Linux
            command = `xdg-open "${filePath}"`;
          }
          
          exec(command, (error: Error | null) => {
            if (error) {
              reject(new Error(`Failed to open file: ${error.message}`));
            } else {
              resolve();
            }
          });
        } else {
          // For web browsers, we have limited options due to security restrictions
          
          // If it's a URL (http/https), open it directly
          if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            window.open(filePath, '_blank');
            resolve();
          } 
          // For blob URLs, try to open them
          else if (filePath.startsWith('blob:')) {
            window.open(filePath, '_blank');
            resolve();
          }
          // For local file paths, we can't directly open them in browsers
          else {
            // Add more comprehensive path validation
            console.log('Checking file path format:', filePath);
            
            // Check for null, undefined, or empty string
            if (!filePath || filePath.trim() === '') {
              reject(new Error('File path is empty or invalid'));
              return;
            }
            
            // Normalize the path
            const normalizedPath = filePath.trim();
            
            // Check for various path formats
            const isUnixPath = normalizedPath.startsWith('/');
            const isWindowsPath = normalizedPath.match(/^[A-Za-z]:[/\\]/);
            const isRelativePath = normalizedPath.startsWith('./') || normalizedPath.startsWith('../');
            const isUNCPath = normalizedPath.startsWith('\\\\'); // Windows UNC paths
            
            console.log('Path analysis:', {
              isUnixPath,
              isWindowsPath,
              isRelativePath,
              isUNCPath,
              normalizedPath
            });
            
            if (isUnixPath || isWindowsPath || isRelativePath || isUNCPath) {
              // This looks like a local file path
              // Try to open as file:// URL first (works in some desktop environments)
              let fileUrl: string;
              
              if (isUnixPath) {
                fileUrl = `file://${normalizedPath}`;
              } else if (isWindowsPath) {
                fileUrl = `file:///${normalizedPath.replace(/\\/g, '/')}`;
              } else if (isUNCPath) {
                // Convert UNC path to file URL
                fileUrl = `file:${normalizedPath.replace(/\\/g, '/')}`;
              } else {
                // Relative path - try to resolve it
                fileUrl = `file://${normalizedPath}`;
              }
              
              console.log('Attempting to open file URL:', fileUrl);
              
              try {
                window.open(fileUrl, '_blank');
                resolve();
              } catch (openError) {
                console.log('Failed to open file URL, falling back to clipboard:', openError);
                // If that fails, copy the file path to clipboard and inform user
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(normalizedPath).then(() => {
                    resolve();
                  }).catch(() => {
                    reject(new Error('Unable to open file and clipboard access denied'));
                  });
                } else {
                  // Fallback: create a temporary text area to copy the path
                  const textArea = document.createElement('textarea');
                  textArea.value = normalizedPath;
                  document.body.appendChild(textArea);
                  textArea.select();
                  try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    resolve();
                  } catch (copyError) {
                    document.body.removeChild(textArea);
                    reject(new Error('Unable to open file in browser environment'));
                  }
                }
              }
            } else {
              // Not a recognized file path format
              console.log('Unrecognized file path format:', normalizedPath);
              reject(new Error(`Invalid file path format: ${normalizedPath}`));
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  
  getFileStats: async (_filePath: string): Promise<{ size: number; exists: boolean }> => {
    // This would need to be implemented with file system access
    // For now, return default values
    return { size: 0, exists: true };
  }
};

// Date utilities
export const dateUtils = {
  formatDate: (date: Date | string, formatString: string = 'PPP'): string => {
    if (typeof date === 'string') {
      date = parseISO(date);
    }
    return isValid(date) ? format(date, formatString) : '';
  },
  
  getAge: (birthday: Date): number => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },
  
  getDaysUntilBirthday: (birthday: Date): number => {
    const today = new Date();
    const thisYear = today.getFullYear();
    const birthDate = new Date(birthday);
    
    let nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
      nextBirthday = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    
    const diffTime = Math.abs(nextBirthday.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
};

// URL utilities
export const urlUtils = {
  isValidUrl: (string: string): boolean => {
    try {
      const url = new URL(string);
      // Additional validation checks
      // Check for valid protocol
      if (!['http:', 'https:', 'ftp:', 'ftps:'].includes(url.protocol)) {
        return false;
      }
      // Check for hostname
      if (!url.hostname || url.hostname.length < 3) {
        return false;
      }
      // Check for valid domain structure
      if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  },
  
  getDomain: (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (_) {
      return '';
    }
  },
  
  detectLinkType: (url: string): 'linkedin' | 'website' | 'drive' | 'github' | 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'video' | 'image' | 'document' | 'download' | 'blog' | 'other' => {
    const domain = urlUtils.getDomain(url).toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Social media platforms
    if (domain.includes('linkedin.com')) return 'linkedin';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
    if (domain.includes('instagram.com')) return 'instagram';
    if (domain.includes('facebook.com') || domain.includes('fb.com')) return 'facebook';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
    
    // Development platforms
    if (domain.includes('github.com') || domain.includes('gitlab.com') || domain.includes('bitbucket.org')) return 'github';
    
    // Cloud storage and documents
    if (domain.includes('drive.google.com') || domain.includes('docs.google.com') || 
        domain.includes('sheets.google.com') || domain.includes('slides.google.com')) return 'drive';
    if (domain.includes('dropbox.com') || domain.includes('onedrive.live.com') || 
        domain.includes('box.com') || domain.includes('icloud.com')) return 'document';
    
    // Media types based on file extensions
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)($|\?)/)) return 'image';
    if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)($|\?)/)) return 'video';
    if (urlLower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)($|\?)/)) return 'document';
    if (urlLower.match(/\.(zip|rar|7z|tar|gz|exe|dmg|pkg|deb|rpm)($|\?)/)) return 'download';
    
    // Blog platforms
    if (domain.includes('medium.com') || domain.includes('wordpress.com') || 
        domain.includes('blogger.com') || domain.includes('substack.com') ||
        domain.includes('dev.to') || domain.includes('hashnode.com')) return 'blog';
    
    // Video platforms
    if (domain.includes('vimeo.com') || domain.includes('twitch.tv') || 
        domain.includes('dailymotion.com') || domain.includes('tiktok.com')) return 'video';
    
    // General website detection
    if (domain.includes('.com') || domain.includes('.org') || domain.includes('.net') ||
        domain.includes('.edu') || domain.includes('.gov') || domain.includes('.io') ||
        domain.includes('.co') || domain.includes('.me') || domain.includes('.dev')) return 'website';
    
    return 'other';
  },
  
  formatUrl: (url: string): string => {
    let formattedUrl = url.trim();
    
    // Add protocol if missing
    if (!formattedUrl.match(/^[a-zA-Z]+:\/\//)) {
      // Check if it's likely an email
      if (formattedUrl.includes('@') && !formattedUrl.includes('://')) {
        formattedUrl = `mailto:${formattedUrl}`;
      } else {
        formattedUrl = `https://${formattedUrl}`;
      }
    }
    
    return formattedUrl;
  }
};

// Export/Import utilities
export const exportUtils = {
  downloadJSON: (data: any, filename: string): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  downloadExcel: async (data: any, filename: string): Promise<void> => {
    try {
      const XLSX = await import('xlsx');
      
      // Debug: Log the data being exported
      console.log('Excel Export - Starting export...');
      console.log('Excel Export - Contacts count:', data.contacts?.length || 0);
      console.log('Excel Export - Notes count:', data.notes?.length || 0);
      console.log('Excel Export - Links count:', data.links?.length || 0);
      console.log('Excel Export - Attachments count:', data.attachments?.length || 0);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Helper function to truncate large data
      const truncateData = (str: string, maxLength: number = 32000): string => {
        if (!str || typeof str !== 'string') return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '... [TRUNCATED - Full data preserved in JSON export]';
      };
      
      // Convert contacts to Excel format
      if (data.contacts && data.contacts.length > 0) {
        try {
          const contactsData = data.contacts.map((contact: any) => {
            const result: any = {
              ID: contact.id || '',
              Name: contact.name || '',
              Email: contact.email || '',
              Phone: contact.phone || '',
              Birthday: contact.birthday ? new Date(contact.birthday).toLocaleDateString() : '',
              Tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
              'Is Favorite': contact.isFavorite ? 'Yes' : 'No',
              'Profile Picture': contact.profilePicture ? 'Yes (Base64 data included)' : 'No',
              'Custom Fields': Array.isArray(contact.customFields) ? 
                contact.customFields.map((field: any) => `${field.label}: ${field.value}`).join('; ') : '',
              'Created At': contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '',
              'Updated At': contact.updatedAt ? new Date(contact.updatedAt).toLocaleString() : ''
            };
            
            // Handle profile picture data carefully
            if (contact.profilePicture) {
              try {
                result['Profile Picture Data'] = truncateData(contact.profilePicture, 10000);
              } catch (error) {
                console.warn('Error processing profile picture for contact:', contact.id, error);
                result['Profile Picture Data'] = '[Error processing image data]';
              }
            } else {
              result['Profile Picture Data'] = '';
            }
            
            return result;
          });
          
          const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
          XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');
          console.log('Excel Export - Contacts sheet created successfully');
        } catch (error) {
          console.error('Error creating contacts sheet:', error);
          throw new Error('Failed to process contacts data for Excel export');
        }
      }
      
      // Convert notes to Excel format
      if (data.notes && data.notes.length > 0) {
        const notesData = data.notes.map((note: any) => ({
          ID: note.id || '',
          'Contact ID': note.contactId || '',
          Title: note.title || '',
          Content: note.content || '',
          Tags: Array.isArray(note.tags) ? note.tags.join(', ') : '',
          'Created At': note.createdAt ? new Date(note.createdAt).toLocaleString() : '',
          'Updated At': note.updatedAt ? new Date(note.updatedAt).toLocaleString() : ''
        }));
        
        const notesSheet = XLSX.utils.json_to_sheet(notesData);
        XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');
      }
      
      // Convert links to Excel format
      if (data.links && data.links.length > 0) {
        const linksData = data.links.map((link: any) => ({
          ID: link.id || '',
          'Contact ID': link.contactId || '',
          Title: link.title || '',
          URL: link.url || '',
          Type: link.type || '',
          Description: link.description || '',
          'Created At': link.createdAt ? new Date(link.createdAt).toLocaleString() : ''
        }));
        
        const linksSheet = XLSX.utils.json_to_sheet(linksData);
        XLSX.utils.book_append_sheet(workbook, linksSheet, 'Links');
      }
      
      // Convert attachments info to Excel format (with file data for reimport)
      if (data.attachments && data.attachments.length > 0) {
        try {
          const attachmentsData = data.attachments.map((attachment: any) => {
            const result: any = {
              ID: attachment.id || '',
              'Contact ID': attachment.contactId || '',
              Name: attachment.name || '',
              Type: attachment.type || '',
              'File Size': attachment.size ? fileUtils.formatFileSize(attachment.size) : '',
              'MIME Type': attachment.mimeType || '',
              'File Path': attachment.filePath || '',
              'Has Data': attachment.data ? 'Yes' : 'No',
              'Created At': attachment.createdAt ? new Date(attachment.createdAt).toLocaleString() : ''
            };
            
            // Handle large attachment data carefully
            if (attachment.data) {
              try {
                // For very large files, only include a preview in Excel and note about JSON export
                if (typeof attachment.data === 'string' && attachment.data.length > 50000) {
                  result['File Data'] = '[Large file - Full data preserved in JSON export only]';
                } else {
                  result['File Data'] = truncateData(attachment.data, 20000);
                }
              } catch (error) {
                console.warn('Error processing attachment data for:', attachment.name, error);
                result['File Data'] = '[Error processing file data]';
              }
            } else {
              result['File Data'] = '';
            }
            
            // Handle thumbnail data
            if (attachment.thumbnail) {
              try {
                result['Thumbnail'] = truncateData(attachment.thumbnail, 5000);
              } catch (error) {
                console.warn('Error processing thumbnail for:', attachment.name, error);
                result['Thumbnail'] = '[Error processing thumbnail]';
              }
            } else {
              result['Thumbnail'] = '';
            }
            
            return result;
          });
          
          const attachmentsSheet = XLSX.utils.json_to_sheet(attachmentsData);
          XLSX.utils.book_append_sheet(workbook, attachmentsSheet, 'Attachments');
          console.log('Excel Export - Attachments sheet created successfully');
        } catch (error) {
          console.error('Error creating attachments sheet:', error);
          throw new Error('Failed to process attachments data for Excel export');
        }
      }
      
      // Add a comprehensive warning sheet about data limitations
      const warningData = [
        {
          'WARNING': '⚠️ EXCEL FORMAT LIMITATIONS',
          'Details': 'This Excel file may have incomplete data due to format constraints.',
          'Impact': 'Images, attachments, and large text fields may be truncated or missing.',
          'Solution': 'Use JSON export for complete data preservation with full fidelity.'
        },
        {
          'WARNING': '📸 Profile Pictures',
          'Details': 'Profile pictures are included but may be truncated for Excel compatibility.',
          'Impact': 'Very large images might display as "[TRUNCATED]" in Excel.',
          'Solution': 'JSON export preserves full image data without size limitations.'
        },
        {
          'WARNING': '📎 File Attachments',
          'Details': 'File attachments are stored as Base64 data in the Attachments sheet.',
          'Impact': 'Large files may be truncated or cause Excel performance issues.',
          'Solution': 'JSON export maintains all attachment data perfectly.'
        },
        {
          'WARNING': '🔒 Data Security',
          'Details': 'Excel format does not support data encryption.',
          'Impact': 'All data in Excel files is stored in plain text.',
          'Solution': 'Use JSON export with encryption enabled for secure backups.'
        },
        {
          'WARNING': '↩️ Import Compatibility',
          'Details': 'Excel files can be imported back, but data may be incomplete.',
          'Impact': 'Some truncated data will remain incomplete after re-import.',
          'Solution': 'Always keep a JSON backup for complete data recovery.'
        },
        {
          'WARNING': '💡 Best Practice',
          'Details': 'Excel is great for viewing and editing contact information.',
          'Impact': 'Perfect for sharing contact lists and making bulk edits.',
          'Solution': 'Use Excel for editing, then export as JSON for complete backup.'
        }
      ];
      const warningSheet = XLSX.utils.json_to_sheet(warningData);
      XLSX.utils.book_append_sheet(workbook, warningSheet, '⚠️ IMPORTANT - READ FIRST');
      
      console.log('Excel Export - Writing workbook to buffer...');
      
      // Write the workbook to a buffer with error handling
      let excelBuffer;
      try {
        excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        console.log('Excel Export - Workbook written successfully, size:', excelBuffer.length, 'bytes');
      } catch (writeError) {
        console.error('Error writing Excel workbook:', writeError);
        throw new Error('Failed to generate Excel file - data may be too large for Excel format');
      }
      
      // Create blob and download
      try {
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Excel Export - File download initiated successfully');
      } catch (downloadError) {
        console.error('Error downloading Excel file:', downloadError);
        throw new Error('Failed to download Excel file');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      // Provide more specific error message
      if (error instanceof Error) {
        throw new Error(`Excel export failed: ${error.message}`);
      } else {
        throw new Error('Failed to export to Excel format - please try JSON export for large datasets');
      }
    }
  },
  
  readJSONFile: (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  readExcelFile: async (file: File): Promise<any> => {
    try {
      const XLSX = await import('xlsx');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            const result: any = {
              contacts: [],
              notes: [],
              links: [],
              attachments: []
            };
            
            // Read Contacts sheet
            if (workbook.SheetNames.includes('Contacts')) {
              const contactsSheet = workbook.Sheets['Contacts'];
              const contactsData = XLSX.utils.sheet_to_json(contactsSheet);
              
              result.contacts = contactsData.map((row: any) => {
                // Parse custom fields
                let customFields: any[] = [];
                if (row['Custom Fields']) {
                  const fieldsStr = row['Custom Fields'];
                  const fieldPairs = fieldsStr.split(';').map((pair: string) => pair.trim());
                  customFields = fieldPairs.map((pair: string) => {
                    const [label, value] = pair.split(':').map((s: string) => s.trim());
                    return {
                      id: Math.random().toString(36).substr(2, 9),
                      label: label || '',
                      value: value || ''
                    };
                  }).filter((field: any) => field.label && field.value);
                }
                
                return {
                  id: row.ID || undefined,
                  name: row.Name || '',
                  email: row.Email || '',
                  phone: row.Phone || '',
                  birthday: row.Birthday ? new Date(row.Birthday) : undefined,
                  tags: row.Tags ? row.Tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
                  customFields: customFields,
                  isFavorite: row['Is Favorite'] === 'Yes',
                  profilePicture: row['Profile Picture Data'] || undefined, // Restore profile picture from Base64 data
                  createdAt: row['Created At'] ? new Date(row['Created At']) : new Date(),
                  updatedAt: row['Updated At'] ? new Date(row['Updated At']) : new Date()
                };
              });
            }
            
            // Read Notes sheet
            if (workbook.SheetNames.includes('Notes')) {
              const notesSheet = workbook.Sheets['Notes'];
              const notesData = XLSX.utils.sheet_to_json(notesSheet);
              
              result.notes = notesData.map((row: any) => ({
                id: row.ID || undefined,
                contactId: parseInt(row['Contact ID']) || 0,
                title: row.Title || '',
                content: row.Content || '',
                tags: row.Tags ? row.Tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
                createdAt: row['Created At'] ? new Date(row['Created At']) : new Date(),
                updatedAt: row['Updated At'] ? new Date(row['Updated At']) : new Date()
              }));
            }
            
            // Read Links sheet
            if (workbook.SheetNames.includes('Links')) {
              const linksSheet = workbook.Sheets['Links'];
              const linksData = XLSX.utils.sheet_to_json(linksSheet);
              
              result.links = linksData.map((row: any) => ({
                id: row.ID || undefined,
                contactId: parseInt(row['Contact ID']) || 0,
                title: row.Title || '',
                url: row.URL || '',
                type: row.Type || 'other',
                description: row.Description || '',
                createdAt: row['Created At'] ? new Date(row['Created At']) : new Date()
              }));
            }
            
            // Read Attachments sheet - now with file data support
            if (workbook.SheetNames.includes('Attachments')) {
              const attachmentsSheet = workbook.Sheets['Attachments'];
              const attachmentsData = XLSX.utils.sheet_to_json(attachmentsSheet);
              
              result.attachments = attachmentsData.map((row: any) => {
                const attachment: any = {
                  id: row.ID || undefined,
                  contactId: parseInt(row['Contact ID']) || 0,
                  name: row.Name || '',
                  type: row.Type || 'other',
                  size: 0, // Will be calculated if data is present
                  mimeType: row['MIME Type'] || 'application/octet-stream',
                  filePath: row['File Path'] || '',
                  createdAt: row['Created At'] ? new Date(row['Created At']) : new Date()
                };
                
                // Restore file data if present
                if (row['File Data'] && typeof row['File Data'] === 'string' && row['File Data'].trim() !== '') {
                  try {
                    // Try to restore the Base64 data
                    const base64Data = row['File Data'];
                    attachment.data = base64Data;
                    
                    // Calculate approximate size from Base64 (Base64 is ~33% larger than binary)
                    attachment.size = Math.round((base64Data.length * 3) / 4);
                  } catch (error) {
                    console.warn('Failed to restore attachment data for:', row.Name, error);
                  }
                }
                
                // Restore thumbnail if present
                if (row['Thumbnail'] && typeof row['Thumbnail'] === 'string' && row['Thumbnail'].trim() !== '') {
                  attachment.thumbnail = row['Thumbnail'];
                }
                
                return attachment;
              });
            }
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error reading Excel file:', error);
      throw new Error('Failed to read Excel file');
    }
  },
  
  // Helper function to detect file type
  getFileType: (file: File): 'json' | 'excel' | 'unknown' => {
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'json') return 'json';
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    return 'unknown';
  }
};

// Array utilities
export const arrayUtils = {
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },
  
  groupBy: <T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const group = key(item);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }
};

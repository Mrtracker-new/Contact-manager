import { Filesystem } from '@capacitor/filesystem';

// Constants for file limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for documents
const MAX_PHOTO_SIZE = 100 * 1024; // 100KB for photos
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

// Function to handle document selection from file picker
export const handleDocumentSelection = async (fileEvent) => {
  try {
    const files = fileEvent.target.files;
    if (!files || files.length === 0) return [];
    
    const processedDocs = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        
        // Validate file size only
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File too large (max 10MB): ${file.name}`);
        }
        
        // Generate a unique ID
        const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Process the file
        const processedDoc = {
          id: docId,
          name: file.name,
          file: file,
          type: file.type || 'application/octet-stream',
          size: file.size
        };
        
        processedDocs.push(processedDoc);
      } catch (fileError) {
        console.error(`Error processing file ${files[i].name}:`, fileError);
        // Continue with other files
      }
    }
    
    if (processedDocs.length === 0) {
      throw new Error('No valid documents were processed');
    }
    
    return processedDocs;
  } catch (error) {
    console.error('Error processing documents:', error);
    throw new Error('Failed to process documents: ' + error.message);
  }
};

// Function to handle document selection from Capacitor file picker
export const handleCapacitorDocumentSelection = async (result) => {
  try {
    if (!result || !result.files || result.files.length === 0) return [];
    
    const processedDocs = [];
    
    for (const fileData of result.files) {
      try {
        // For Android content:// URIs
        if (fileData.path && fileData.path.startsWith('content://')) {
          try {
            // Try Filesystem API first for content URIs
            const fileContents = await Filesystem.readFile({
              path: fileData.path,
              directory: undefined
            });
            
            if (fileContents && fileContents.data) {
              const base64Data = fileContents.data;
              const mimeType = fileData.mimeType || 'application/octet-stream';
              const blob = base64ToBlob(base64Data, mimeType);
              
              if (blob) {
                const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                processedDocs.push({
                  id: docId,
                  name: fileData.name,
                  file: blob,
                  type: mimeType,
                  size: blob.size
                });
                continue;
              }
            }
          } catch (fsError) {
            console.warn('Filesystem API failed, trying fetch:', fsError);
          }
          
          try {
            // Fallback to fetch if Filesystem API fails
            const response = await fetch(fileData.path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            
            const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            processedDocs.push({
              id: docId,
              name: fileData.name,
              file: blob,
              type: fileData.mimeType || blob.type,
              size: blob.size
            });
          } catch (fetchError) {
            console.error('Fetch failed for content URI:', fetchError);
            // Continue with other files
          }
        } else {
          // Handle regular file paths
          const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const response = await fetch(fileData.webPath || fileData.path);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          
          processedDocs.push({
            id: docId,
            name: fileData.name,
            file: blob,
            type: fileData.mimeType || blob.type,
            size: blob.size
          });
        }
      } catch (fileError) {
        console.error('Error processing file:', fileData.path, fileError);
        // Continue with other files
      }
    }
    
    if (processedDocs.length === 0) {
      throw new Error('No documents were successfully processed');
    }
    
    return processedDocs;
  } catch (error) {
    console.error('Error processing Capacitor documents:', error);
    throw new Error('Failed to process documents: ' + error.message);
  }
};

// Helper function to convert base64 to Blob
export function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  if (!base64 || typeof base64 !== 'string') {
    return null;
  }
  
  // Handle data URIs
  let base64Data = base64;
  if (base64.startsWith('data:')) {
    const parts = base64.split(',');
    if (parts.length < 2) return null;
    
    mimeType = parts[0].split(':')[1]?.split(';')[0] || mimeType;
    base64Data = parts[1];
  }
  
  try {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
}

// Function to validate document before saving
export const validateDocument = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max 10MB): ${file.name}`);
  }
  
  // Allow any file type, but log unsupported types
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    console.warn(`Unsupported file type: ${file.type} for file: ${file.name}`);
  }
  
  return true;
};

// Improved function to safely create and manage blob URLs with caching
const urlCache = new Map();

export const createSafeObjectURL = (blob) => {
  if (!blob || !(blob instanceof Blob)) {
    return null;
  }
  
  // Generate a unique key for this blob based on size and type
  const blobKey = `${blob.size}-${blob.type}-${Date.now()}`;
  
  // Check if we already have a URL for this blob
  if (urlCache.has(blobKey)) {
    return urlCache.get(blobKey);
  }
  
  // Create a new URL and cache it
  const url = URL.createObjectURL(blob);
  urlCache.set(blobKey, url);
  
  // Limit cache size to prevent memory leaks
  if (urlCache.size > 100) {
    // Remove oldest entry
    const oldestKey = urlCache.keys().next().value;
    const oldUrl = urlCache.get(oldestKey);
    URL.revokeObjectURL(oldUrl);
    urlCache.delete(oldestKey);
  }
  
  return url;
};

// Improved function to safely revoke blob URLs
export const revokeSafeObjectURL = (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) {
    return;
  }
  
  // Find and remove from cache
  for (const [key, cachedUrl] of urlCache.entries()) {
    if (cachedUrl === url) {
      urlCache.delete(key);
      break;
    }
  }
  
  // Revoke the URL
  URL.revokeObjectURL(url);
};

// Add a function to convert blob to base64 for storage
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    if (!blob || !(blob instanceof Blob)) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Improved image compression function
export const compressImage = async (imageFile, maxWidth = 800, quality = 0.7) => {
  if (!imageFile) {
    throw new Error('No file provided');
  }

  // Handle both Blob and File objects
  const file = imageFile instanceof File ? imageFile : new File([imageFile], 'image.jpg', { type: imageFile.type || 'image/jpeg' });
  
  // Validate file type
  if (!file.type || !file.type.startsWith('image/')) {
    console.error('Invalid file type:', file.type);
    throw new Error('Please select a valid image file (JPEG, PNG, etc.)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      // Set a timeout for image loading
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timed out'));
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        
        try {
          // Create canvas with proper dimensions
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          // Set minimum dimensions
          if (width < 100) width = 100;
          if (height < 100) height = 100;

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Use better quality settings for image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Clear the canvas first
          ctx.clearRect(0, 0, width, height);
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Check if the compressed size is still too large
              if (blob.size > MAX_PHOTO_SIZE) {
                // Try with lower quality
                canvas.toBlob(
                  (finalBlob) => {
                    if (!finalBlob) {
                      reject(new Error('Failed to compress image'));
                      return;
                    }
                    resolve(finalBlob);
                  },
                  'image/jpeg',
                  quality * 0.5 // Further reduce quality
                );
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(new Error(`Image processing failed: ${error.message}`));
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Image loading error:', error);
        reject(new Error('Failed to load image. Please try a different image.'));
      };

      // Set the image source after setting up error handlers
      try {
        img.src = e.target.result;
      } catch (error) {
        reject(new Error(`Failed to set image source: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      console.error('File reading error:', error);
      reject(new Error('Failed to read image file. Please try again.'));
    };

    // Read the file as data URL
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to read file: ${error.message}`));
    }
  });
};

// Add this function to your documentHandler.js file
export const dataURItoBlob = (dataURI) => {
  try {
    // Convert base64/URLEncoded data component to raw binary data
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = decodeURIComponent(dataURI.split(',')[1]);
    }

    // Separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // Write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  } catch (error) {
    console.error('Error converting data URI to Blob:', error);
    return null;
  }
};
import { Filesystem } from '@capacitor/filesystem';

// Function to handle document selection from file picker
export const handleDocumentSelection = async (fileEvent) => {
  try {
    const files = fileEvent.target.files;
    if (!files || files.length === 0) return [];
    
    const processedDocs = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      processedDocs.push({
        id: docId,
        name: file.name,
        file: file,
        type: file.type,
        size: file.size
      });
    }
    
    return processedDocs;
  } catch (error) {
    console.error('Error processing documents:', error);
    throw new Error('Failed to process documents');
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
          // Read the file as base64
          const fileContents = await Filesystem.readFile({
            path: fileData.path,
            directory: undefined // Not using a directory since we have a content URI
          });
          
          // Create a blob from the base64 data
          const base64Data = fileContents.data;
          const mimeType = fileData.mimeType || 'application/octet-stream';
          const blob = base64ToBlob(base64Data, mimeType);
          
          const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          processedDocs.push({
            id: docId,
            name: fileData.name,
            file: blob,
            type: mimeType,
            size: blob.size
          });
        } else {
          // Handle regular file paths
          const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const response = await fetch(fileData.webPath || fileData.path);
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
    
    return processedDocs;
  } catch (error) {
    console.error('Error processing Capacitor documents:', error);
    throw new Error('Failed to process documents');
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
  
  // Check file size (10MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max 10MB): ${file.name}`);
  }
  
  return true;
};

// Add a function to safely create and manage blob URLs
export const createSafeObjectURL = (blob) => {
  if (!blob || !(blob instanceof Blob)) {
    return null;
  }
  return URL.createObjectURL(blob);
};

// Add a function to safely revoke blob URLs
export const revokeSafeObjectURL = (url) => {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
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

// Add the missing compressImage function
export const compressImage = async (imageFile, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      return resolve(imageFile); // Return original if not an image
    }

    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas dimensions and draw image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            // Create a new file from the blob
            const compressedFile = new File([blob], imageFile.name, {
              type: imageFile.type,
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          imageFile.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
  });
};
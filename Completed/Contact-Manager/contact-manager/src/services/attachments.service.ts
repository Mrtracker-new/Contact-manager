/*
 * Enhanced Attachments Service
 * Single-file, drop-in replacement compatible with Web, Capacitor (Android/iOS), Electron & Tauri
 */

import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { dbOperations } from '../db/database';
import { fileUtils } from '../utils';
import { FileOpener } from '../plugins';
import type { Attachment } from '../types';

/* ------------------------------------------------------------------ */
/* 1. Platform detection                                                */
/* ------------------------------------------------------------------ */
const platform = (() => {
  const w = globalThis as any;
  return {
    isMobile: !!w.Capacitor,
    isNativePlatform: Capacitor.isNativePlatform?.() ?? false,
    isElectron: !!w.electronAPI,
    isTauri: !!w.__TAURI__,
    isNode: typeof process !== 'undefined' && !!process.versions?.node,
    isWeb: false,
  };
})();
platform.isWeb = !platform.isMobile && !platform.isElectron && !platform.isTauri && !platform.isNode;

/* ------------------------------------------------------------------ */
/* 2. Utilities                                                         */
/* ------------------------------------------------------------------ */
const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
  const blob = new Blob([buffer]);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
};

const mimeToExt = (mime: string): string =>
  ({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'video/mp4': 'mp4',
  }[mime] ?? 'bin');

/* ------------------------------------------------------------------ */
/* 3. Thumbnail generation                                              */
/* ------------------------------------------------------------------ */
export const generateThumbnail = async (data: ArrayBuffer, mime: string, max = 256): Promise<string | null> => {
  if (!fileUtils.isImageFile(mime) && !fileUtils.isVideoFile(mime)) return null;
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = max / Math.max(w, h);
      const canvas = Object.assign(document.createElement('canvas'), { width: w * scale, height: h * scale });
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/* ------------------------------------------------------------------ */
/* 4. CRUD operations                                                   */
/* ------------------------------------------------------------------ */
export const getContactAttachments = async (contactId: number): Promise<Attachment[]> =>
  dbOperations.getContactAttachments(contactId).catch(() => []);

export const addAttachment = async (
  contactId: number,
  files: FileList
): Promise<{ success: boolean; message: string }> => {
  try {
    for (const file of Array.from(files)) {
      const buffer = await file.arrayBuffer();
      const thumbnail = await generateThumbnail(buffer, file.type);
      await dbOperations.addAttachment({
        contactId,
        type: fileUtils.isImageFile(file.type)
          ? 'image'
          : fileUtils.isVideoFile(file.type)
          ? 'video'
          : 'document',
        name: file.name,
        size: file.size,
        mimeType: file.type || fileUtils.getMimeType(file.name),
        data: buffer,
        thumbnail: thumbnail || undefined,
        createdAt: new Date(),
      });
    }
    return { success: true, message: 'Files stored successfully!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to add attachments.' };
  }
};

export const deleteAttachment = (id: number) => dbOperations.deleteAttachment(id);

/* ------------------------------------------------------------------ */
/* 5. File actions                                                      */
/* ------------------------------------------------------------------ */
export const openFile = async (attachment: Attachment): Promise<{ success: boolean; message: string }> => {
  if (!attachment.data) return { success: false, message: 'No data to open.' };
  
  try {
    const blob = new Blob([attachment.data], { type: attachment.mimeType });
    const url = URL.createObjectURL(blob);
    
    // Android/Mobile specific handling
    if (platform.isNativePlatform) {
      return await openFileOnMobile(attachment, blob, url);
    }
    
    // Web browser handling
    return await openFileOnWeb(attachment, blob, url);
    
  } catch (error) {
    console.error('Error opening file:', error);
    return { success: false, message: 'Could not open file.' };
  }
};

// Helper function for mobile file opening
const openFileOnMobile = async (
  attachment: Attachment, 
  blob: Blob, 
  url: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // For mobile platforms, save to temp directory and open with system app
    console.log('Converting file to base64 for mobile storage...');
    const base64Data = await arrayBufferToBase64(await blob.arrayBuffer());
    const fileName = ensureFileExtension(attachment.name, attachment.mimeType);
    
    console.log(`Writing file to cache: ${fileName} (${attachment.mimeType})`);
    
    // Write file to cache directory with error handling
    let writeResult;
    try {
      writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });
      console.log('File written to cache successfully:', writeResult.uri);
    } catch (writeError: any) {
      console.error('Failed to write file to cache:', writeError);
      throw new Error(`Cannot write file to cache: ${writeError.message || 'Unknown error'}`);
    }
    
    // Use our custom FileOpener plugin to safely open files on Android
    try {
      // Convert file URI to proper path for the plugin
      let filePath = writeResult.uri;
      
      // Log the original URI for debugging
      console.log('Original file URI:', filePath);
      
      // Ensure proper path format
      if (filePath.startsWith('file://')) {
        filePath = filePath.substring(7); // Remove 'file://' prefix
      }
      
      console.log('Opening file with FileOpener plugin:', filePath);
      console.log('MIME type:', attachment.mimeType);
      
      // Call the community FileOpener plugin with timeout
      await Promise.race([
        FileOpener.open({
          filePath,
          contentType: attachment.mimeType,
          openWithDefault: true
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('FileOpener timeout after 10 seconds')), 10000)
        )
      ]);
      
      // If we get here, it opened successfully
      // Cleanup after delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      
      return { 
        success: true, 
        message: `Opening ${getFileTypeDescription(attachment.mimeType)}...` 
      };
    } catch (pluginError: any) {
      console.error('FileOpener plugin failed:', pluginError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to open file';
      if (pluginError.message) {
        if (pluginError.message.includes('No app found')) {
          errorMessage = `No app installed to open ${getFileTypeDescription(attachment.mimeType)} files`;
        } else if (pluginError.message.includes('FileProvider')) {
          errorMessage = 'File access denied - security restriction';
        } else if (pluginError.message.includes('timeout')) {
          errorMessage = 'File opening timed out - the file may be too large';
        } else {
          errorMessage = pluginError.message;
        }
      }
      
      throw new Error(errorMessage);
    }
    
  } catch (error: any) {
    console.error('Mobile file opening failed:', error);
    URL.revokeObjectURL(url);
    
    return { 
      success: false, 
      message: error.message || 'Failed to open file on mobile device.' 
    };
  }
};

// Helper function for web file opening
const openFileOnWeb = async (
  attachment: Attachment, 
  blob: Blob, 
  url: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Create proper file name with extension
    const fileName = ensureFileExtension(attachment.name, attachment.mimeType);
    
    // For viewable content (images, PDFs, text, etc.), open in new tab
    if (isViewableInBrowser(attachment.mimeType)) {
      try {
        // Use temporary anchor element to open file in new tab without triggering download
        const tempAnchor = document.createElement('a');
        tempAnchor.href = url;
        tempAnchor.target = '_blank';
        tempAnchor.rel = 'noopener noreferrer';
        tempAnchor.style.display = 'none';
        
        // Append to body, click, then remove
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        document.body.removeChild(tempAnchor);
        
        // Cleanup after delay (longer for viewing)
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        
        return { 
          success: true, 
          message: `Opening ${getFileTypeDescription(attachment.mimeType)}...` 
        };
      } catch (error) {
        // Fallback to download if anchor approach fails
        console.warn('Anchor opening failed, falling back to download:', error);
        saveAs(blob, fileName);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return { success: true, message: 'Failed to open in tab. File downloaded instead.' };
      }
    } else {
      // For non-viewable files, download directly
      saveAs(blob, fileName);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { success: true, message: 'File downloaded.' };
    }
    
  } catch (error) {
    console.error('Web file opening failed:', error);
    URL.revokeObjectURL(url);
    return { success: false, message: 'Failed to open file in browser.' };
  }
};

// Helper function to ensure file has proper extension
const ensureFileExtension = (fileName: string, mimeType: string): string => {
  const ext = fileUtils.getFileExtension(fileName);
  if (!ext) {
    const properExt = mimeToExt(mimeType);
    return `${fileName}.${properExt}`;
  }
  return fileName;
};

// Helper function to check if file can be viewed in browser
const isViewableInBrowser = (mimeType: string): boolean => {
  return (
    fileUtils.isImageFile(mimeType) ||
    mimeType.includes('pdf') ||
    mimeType.includes('text/') ||
    mimeType.includes('application/json') ||
    mimeType.includes('video/mp4') ||
    mimeType.includes('video/webm') ||
    mimeType.includes('audio/')
  );
};

// Helper function to get user-friendly file type description
const getFileTypeDescription = (mimeType: string): string => {
  if (fileUtils.isImageFile(mimeType)) return 'image';
  if (fileUtils.isVideoFile(mimeType)) return 'video';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('text')) return 'text file';
  if (mimeType.includes('audio')) return 'audio file';
  return 'file';
};

// Helper function to create a share modal for web browsers
const createShareModal = (attachment: Attachment, fileUrl: string): HTMLElement => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.style.zIndex = '9999';
  
  const content = document.createElement('div');
  content.className = 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4';
  
  const fileName = ensureFileExtension(attachment.name, attachment.mimeType);
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Share File</h3>
      <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" id="close-share-modal">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="mb-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">File: <span class="font-medium">${fileName}</span></p>
      <p class="text-sm text-gray-600 dark:text-gray-400">Size: <span class="font-medium">${fileUtils.formatFileSize(attachment.size)}</span></p>
    </div>
    
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shareable Link:</label>
        <div class="flex">
          <input 
            type="text" 
            value="${fileUrl}" 
            readonly 
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            id="share-url-input"
          />
          <button 
            class="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-sm"
            id="copy-url-btn"
          >
            Copy
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: This link will expire in 30 seconds</p>
      </div>
      
      <div class="flex space-x-2">
        <button 
          class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          id="download-file-btn"
        >
          Download File
        </button>
        <button 
          class="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          id="close-modal-btn"
        >
          Close
        </button>
      </div>
    </div>
  `;
  
  modal.appendChild(content);
  
  // Event listeners
  const closeModal = () => {
    if (modal.parentNode) {
      document.body.removeChild(modal);
    }
    URL.revokeObjectURL(fileUrl);
  };
  
  // Close button
  content.querySelector('#close-share-modal')?.addEventListener('click', closeModal);
  content.querySelector('#close-modal-btn')?.addEventListener('click', closeModal);
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Copy URL button
  content.querySelector('#copy-url-btn')?.addEventListener('click', async () => {
    const input = content.querySelector('#share-url-input') as HTMLInputElement;
    if (input) {
      input.select();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(input.value);
        } else {
          // Fallback for older browsers
          document.execCommand('copy');
        }
        const btn = content.querySelector('#copy-url-btn');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  });
  
  // Download button
  content.querySelector('#download-file-btn')?.addEventListener('click', () => {
    const blob = new Blob([attachment.data!], { type: attachment.mimeType });
    saveAs(blob, fileName);
    closeModal();
  });
  
  // ESC key to close
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);
  
  return modal;
};

export const shareFile = async (attachment: Attachment): Promise<{ success: boolean; message: string }> => {
  if (!attachment.data) return { success: false, message: 'No data to share.' };
  try {
    const blob = new Blob([attachment.data], { type: attachment.mimeType });
    const fileName = ensureFileExtension(attachment.name, attachment.mimeType);

    // Capacitor (Mobile platforms)
    if (platform.isNativePlatform) {
      const base64 = await arrayBufferToBase64(await blob.arrayBuffer());
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache, recursive: true });
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: fileName });
      await Share.share({ title: 'Share file', url: uri });
      return { success: true, message: 'File shared!' };
    }

    // Web Share API (Modern browsers)
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName)] })) {
      await navigator.share({
        files: [new File([blob], fileName, { type: attachment.mimeType })],
        title: attachment.name,
      });
      return { success: true, message: 'File shared!' };
    }

    // Web fallback: Create shareable link and copy to clipboard
    try {
      const url = URL.createObjectURL(blob);
      
      // Try to copy URL to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        
        // Show a temporary link that user can share
        const shareModal = createShareModal(attachment, url);
        document.body.appendChild(shareModal);
        
        // Cleanup after 30 seconds or when modal is closed
        setTimeout(() => {
          if (shareModal.parentNode) {
            document.body.removeChild(shareModal);
          }
          URL.revokeObjectURL(url);
        }, 30000);
        
        return { success: true, message: 'File link copied to clipboard! A share dialog is now open.' };
      }
      
      // If clipboard API is not available, just show the share modal
      const shareModal = createShareModal(attachment, url);
      document.body.appendChild(shareModal);
      
      setTimeout(() => {
        if (shareModal.parentNode) {
          document.body.removeChild(shareModal);
        }
        URL.revokeObjectURL(url);
      }, 30000);
      
      return { success: true, message: 'Share dialog opened. You can copy the link or download the file.' };
      
    } catch (fallbackError) {
      console.warn('Share fallback failed, downloading instead:', fallbackError);
      // Final fallback: download the file
      return downloadFile(attachment);
    }
    
  } catch (err: any) {
    return { success: false, message: err.message || 'Share failed' };
  }
};

export const downloadFile = async (attachment: Attachment): Promise<{ success: boolean; message: string }> => {
  if (!attachment.data) return { success: false, message: 'No data to download.' };
  try {
    const blob = new Blob([attachment.data], { type: attachment.mimeType });
    const fileName = ensureFileExtension(attachment.name, attachment.mimeType);

    if (platform.isNativePlatform) {
      const base64 = await arrayBufferToBase64(await blob.arrayBuffer());
      await Filesystem.writeFile({ 
        path: fileName, 
        data: base64, 
        directory: Directory.Documents, 
        recursive: true 
      });
      return { success: true, message: `File "${fileName}" saved to Documents.` };
    }

    // For web, use file-saver with proper filename
    saveAs(blob, fileName);
    return { success: true, message: `File "${fileName}" downloaded.` };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, message: 'Download failed.' };
  }
};

/* ------------------------------------------------------------------ */
/* 6. Helpers                                                           */
/* ------------------------------------------------------------------ */
export const getFileIcon = (mime: string): string => {
  if (fileUtils.isImageFile(mime)) return '🖼️';
  if (fileUtils.isVideoFile(mime)) return '🎥';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('word')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('presentation')) return '📈';
  if (mime.includes('audio')) return '🎵';
  if (mime.includes('zip')) return '🗜️';
  return '📎';
};

export const formatFileInfo = (att: Attachment) => ({
  icon: getFileIcon(att.mimeType),
  sizeText: fileUtils.formatFileSize(att.size),
  typeText: att.type.charAt(0).toUpperCase() + att.type.slice(1),
  statusText: att.data ? 'Stored' : 'Linked',
  statusColor: att.data ? 'blue' : 'green',
});

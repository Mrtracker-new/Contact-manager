import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { FileOpener, SafeBrowser } from '../plugins';

export interface OpenFileOptions {
  filePath: string;
  mimeType?: string;
  fallbackToExternalBrowser?: boolean;
}

export interface OpenUrlOptions {
  url: string;
  toolbarColor?: string;
  presentationStyle?: boolean;
}

/**
 * Safely opens a file using the appropriate method based on the platform
 * and file type. Handles file:// URIs properly on Android.
 */
export async function openFile(options: OpenFileOptions): Promise<void> {
  const { filePath, mimeType, fallbackToExternalBrowser = true } = options;

  if (!filePath) {
    throw new Error('File path is required');
  }

// On native platforms, use the community plugin
  if (Capacitor.isNativePlatform()) {
    try {
      // First try with the community FileOpener
      await FileOpener.open({
        filePath,
        contentType: mimeType,
        openWithDefault: true
      });

      console.log('File opened successfully');
      return;
    } catch (error) {
      console.error('FileOpener failed:', error);
      
      // If FileOpener fails and it's a file:// URI, try SafeBrowser
      if (filePath.startsWith('file://') && fallbackToExternalBrowser) {
        try {
          const result = await SafeBrowser.open({ url: filePath });
          console.log('File opened with SafeBrowser:', result);
          return;
        } catch (safeBrowserError) {
          console.error('SafeBrowser also failed:', safeBrowserError);
          throw new Error(`Failed to open file: ${safeBrowserError}`);
        }
      }
      
      throw error;
    }
  } else {
    // On web, try to open as URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      await Browser.open({ url: filePath });
    } else {
      // For local files on web, create a blob URL or handle differently
      throw new Error('Local file opening not supported on web platform');
    }
  }
}

/**
 * Safely opens a URL using the appropriate method
 */
export async function openUrl(options: OpenUrlOptions): Promise<void> {
  const { url, toolbarColor, presentationStyle } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  // On native platforms, prefer SafeBrowser for file:// URIs
  if (Capacitor.isNativePlatform() && url.startsWith('file://')) {
    try {
      const result = await SafeBrowser.open({
        url,
        toolbarColor,
        presentationStyle
      });
      console.log('URL opened with SafeBrowser:', result);
      return;
    } catch (error) {
      console.error('SafeBrowser failed:', error);
      throw error;
    }
  }

  // For regular URLs, use the standard Browser plugin
  try {
    await Browser.open({
      url,
      toolbarColor,
      presentationStyle: presentationStyle ? 'popover' : 'fullscreen'
    });
  } catch (error) {
    console.error('Browser.open failed:', error);
    throw error;
  }
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav'
  };

  return mimeTypes[extension || ''] || '*/*';
}

/**
 * Comprehensive file opener that automatically determines the best method
 */
export async function openFileOrUrl(pathOrUrl: string, options?: {
  mimeType?: string;
  toolbarColor?: string;
  presentationStyle?: boolean;
  fallbackToExternalBrowser?: boolean;
}): Promise<void> {
  const {
    mimeType,
    toolbarColor,
    presentationStyle,
    fallbackToExternalBrowser = true
  } = options || {};

  // Determine if it's a URL or file path
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    await openUrl({
      url: pathOrUrl,
      toolbarColor,
      presentationStyle
    });
  } else if (pathOrUrl.startsWith('file://') || pathOrUrl.includes('/')) {
    await openFile({
      filePath: pathOrUrl,
      mimeType: mimeType || getMimeTypeFromExtension(pathOrUrl),
      fallbackToExternalBrowser
    });
  } else {
    throw new Error('Invalid file path or URL format');
  }
}

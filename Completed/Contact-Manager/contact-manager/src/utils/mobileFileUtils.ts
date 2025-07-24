import { Capacitor } from '@capacitor/core';

// Mobile-specific file handling utilities for Android/iOS
export const mobileFileUtils = {
  // Check if running on mobile platform
  isMobile: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  // Handle file import on mobile devices
  importFile: async (): Promise<File | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      // For mobile, we'll use a different approach
      // Since we can't use file input directly, we'll guide users to share files with the app
      const { Toast } = await import('@capacitor/toast');
      
      await Toast.show({
        text: 'To import a backup file, share it with this app from your file manager or email.',
        duration: 'long',
        position: 'center'
      });

      return null;
    } catch (error) {
      console.error('Mobile file import error:', error);
      return null;
    }
  },

  // Handle file export with proper sharing
  exportFile: async (data: any, fileName: string, format: 'json' | 'excel' = 'json'): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const { Toast } = await import('@capacitor/toast');

      let fileContent: string;

      if (format === 'excel') {
        // Create Excel file
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        
        // Add contacts sheet (simplified for mobile)
        if (data.contacts && data.contacts.length > 0) {
          const contactsData = data.contacts.map((contact: any) => ({
            ID: contact.id || '',
            Name: contact.name || '',
            Email: contact.email || '',
            Phone: contact.phone || '',
            Birthday: contact.birthday ? new Date(contact.birthday).toLocaleDateString() : '',
            Tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
            'Is Favorite': contact.isFavorite ? 'Yes' : 'No',
            'Created At': contact.createdAt ? new Date(contact.createdAt).toLocaleString() : ''
          }));
          const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
          XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');
        }

        // Add notes
        if (data.notes && data.notes.length > 0) {
          const notesData = data.notes.map((note: any) => ({
            ID: note.id || '',
            'Contact ID': note.contactId || '',
            Title: note.title || '',
            Content: note.content || '',
            Tags: Array.isArray(note.tags) ? note.tags.join(', ') : '',
            'Created At': note.createdAt ? new Date(note.createdAt).toLocaleString() : ''
          }));
          const notesSheet = XLSX.utils.json_to_sheet(notesData);
          XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');
        }

        // Add links
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

        // Create Excel buffer and convert to base64
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const uint8Array = new Uint8Array(excelBuffer);
        let binary = '';
        uint8Array.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        fileContent = btoa(binary);
      } else {
        // JSON export
        fileContent = JSON.stringify(data, null, 2);
      }

      // Try to write file to cache directory (most reliable)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: fileContent,
        directory: Directory.Cache,
        encoding: format === 'excel' ? undefined : Encoding.UTF8
      });

      // Show success toast
      await Toast.show({
        text: `✅ Backup file created successfully!`,
        duration: 'short',
        position: 'bottom'
      });

      // Share the file
      await Share.share({
        title: 'Contact Manager Backup',
        text: `Contact Manager backup file (${fileName})`,
        url: result.uri,
        dialogTitle: 'Share Backup File'
      });

      return true;
    } catch (error) {
      console.error('Mobile file export error:', error);
      
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({
        text: '❌ Failed to export file. Please try again.',
        duration: 'long',
        position: 'center'
      });
      
      return false;
    }
  },

  // Read file content from URI (for when files are shared with the app)
  readFileFromUri: async (uri: string): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      
      const result = await Filesystem.readFile({
        path: uri
      });

      return result.data as string;
    } catch (error) {
      console.error('Error reading file from URI:', error);
      return null;
    }
  },

  // Get file info from URI
  getFileInfo: async (uri: string): Promise<{ name: string; size: number } | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      
      const stat = await Filesystem.stat({
        path: uri
      });

      return {
        name: uri.split('/').pop() || 'unknown',
        size: stat.size
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
};

// App URL scheme handler for file imports
export const handleAppUrl = async (url: string): Promise<void> => {
  console.log('Handling app URL:', url);
  
  // Check if this is a file import URL
  if (url.includes('file://') || url.includes('content://')) {
    try {
      const { Toast } = await import('@capacitor/toast');
      
      await Toast.show({
        text: 'File received! Processing import...',
        duration: 'short',
        position: 'center'
      });

      // Here you would trigger the import process
      // This would need to be connected to your import logic
      
    } catch (error) {
      console.error('Error handling app URL:', error);
    }
  }
};

export default mobileFileUtils;

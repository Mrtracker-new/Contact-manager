import { Preferences } from '@capacitor/preferences';
import { Toast } from '@capacitor/toast';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { base64ToBlob, compressImage, blobToBase64 } from './documentHandler';

// Constants for storage limits
const MAX_CONTACT_SIZE = 500 * 1024; // 500KB
const MAX_PHOTO_SIZE = 100 * 1024; // 100KB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Cache for contact data
let contactsCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 1000; // 1 second cache for better performance

// Utility functions
const showToast = async (message) => {
  if (window.Capacitor) {
    await Toast.show({ 
      text: message, 
      duration: 'short', 
      position: 'bottom' 
    });
  } else {
    console.log(message);
  }
};

// Helper function to process documents for storage
const processDocumentsForStorage = async (documents) => {
  if (!documents || !Array.isArray(documents)) return [];
  
  return await Promise.all(documents.map(async (doc) => {
    try {
      if (!doc || !doc.data) return null;

      // If document is already a base64 string, use it directly
      if (doc.data.startsWith('data:')) {
        return {
          ...doc,
          data: doc.data,
          isFileSystem: false
        };
      }

      // If document is a blob, convert to base64
      if (doc.data instanceof Blob) {
        const base64Data = await blobToBase64(doc.data);
        if (!base64Data) return null;

        // If document is too large, store in filesystem
        if (doc.data.size > MAX_DOCUMENT_SIZE) {
          const fileName = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Ensure the documents directory exists
          try {
            await Filesystem.mkdir({
              path: 'documents',
              directory: Directory.Data,
              recursive: true
            });
          } catch (error) {
            // Directory might already exist, continue
          }

          // Save to filesystem
          await Filesystem.writeFile({
            path: `documents/${fileName}`,
            data: base64Data,
            directory: Directory.Data
          });

          return {
            ...doc,
            data: `file://${fileName}`,
            isFileSystem: true
          };
        }
        
        return {
          ...doc,
          data: base64Data,
          isFileSystem: false
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing document:', error);
      return null;
    }
  })).then(results => results.filter(Boolean));
};

// Helper function to process contact for storage
const processContactForStorage = async (contact) => {
  try {
    const processedContact = { ...contact };
    
    // Process photo if exists and is valid
    if (contact.photo instanceof Blob) {
      try {
        const base64Photo = await blobToBase64(contact.photo);
        if (base64Photo) {
          processedContact.photo = base64Photo;
        }
      } catch (error) {
        console.error('Error processing photo:', error);
        processedContact.photo = null;
      }
    } else if (typeof contact.photo === 'string' && contact.photo.startsWith('data:')) {
      processedContact.photo = contact.photo;
    } else if (contact.photo) {
      // Try to preserve the photo if it exists but isn't a Blob or data URL
      processedContact.photo = contact.photo;
    } else {
      processedContact.photo = null;
    }

    // Process documents if they exist
    if (contact.documents && Array.isArray(contact.documents)) {
      processedContact.documents = await Promise.all(contact.documents.map(async doc => {
        try {
          if (!doc) return null;

          // If document is already a base64 string, use it directly
          if (doc.data && doc.data.startsWith('data:')) {
            return {
              ...doc,
              data: doc.data,
              isFileSystem: false
            };
          }

          // If document has a file property that's a Blob
          if (doc.file instanceof Blob) {
            const base64Data = await blobToBase64(doc.file);
            if (!base64Data) return null;

            return {
              id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: doc.name,
              data: base64Data,
              type: doc.type,
              size: doc.file.size,
              isFileSystem: false
            };
          }

          // Keep existing document data if no changes
          return doc;
        } catch (error) {
          console.error('Error processing document:', error);
          return null;
        }
      })).then(results => results.filter(Boolean));
    } else {
      processedContact.documents = [];
    }

    return processedContact;
  } catch (error) {
    console.error('Error processing contact:', error);
    throw error;
  }
};

// Helper function to load document from storage
const loadDocumentFromStorage = async (document) => {
  if (!document) return null;
  
  if (document.isFileSystem) {
    try {
      const fileName = document.data.replace('file://', '');
      const result = await Filesystem.readFile({
        path: `documents/${fileName}`,
        directory: Directory.Data
      });
      return {
        ...document,
        data: result.data
      };
    } catch (error) {
      console.error('Error loading document from filesystem:', error);
      return null;
    }
  }
  
  return document;
};

// Helper function to load contact from storage
const loadContactFromStorage = async (contact) => {
  try {
    if (!contact) return null;
    
    const loadedContact = { ...contact };
    
    // Handle photo conversion
    if (contact.photo && typeof contact.photo === 'string' && contact.photo.startsWith('data:')) {
      try {
        // Convert photo data URL to Blob for display
        loadedContact.photo = base64ToBlob(contact.photo);
        // Always keep the original data URL as a backup
        loadedContact.photoData = { data: contact.photo, type: contact.photo.split(';')[0].split(':')[1] || 'image/jpeg' };
      } catch (error) {
        console.error('Error converting photo:', error);
        // Instead of setting to null, keep the original data
        loadedContact.photo = null;
        // Ensure we still have the photoData even if conversion fails
        if (!loadedContact.photoData) {
          loadedContact.photoData = { data: contact.photo, type: 'image/jpeg' };
        }
      }
    }
    
    return loadedContact;
  } catch (error) {
    console.error('Error loading contact from storage:', error);
    throw error;
  }
};

// Storage operations
const storage = {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      if (!value) return null;

      const parsedValue = JSON.parse(value);
      return parsedValue;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      // Convert value to string
      const stringValue = JSON.stringify(value);
      
      // Store in preferences
      await Preferences.set({
        key,
        value: stringValue
      });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  },

  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }
};

// Contact validation
const validateContact = async (contact, existingId = null) => {
  try {
    if (!contact?.name?.trim()) {
      throw new Error('Contact name is required');
    }

    return true;
  } catch (error) {
    console.error('Contact validation error:', error);
    throw error;
  }
};

// Storage operations
export const initializeStorage = async () => {
  try {
    const contacts = await storage.get('contacts');
    if (!Array.isArray(contacts)) {
      await storage.set('contacts', []);
    }
    return true;
  } catch (error) {
    console.error('Storage initialization failed:', error);
    return false;
  }
};

export const getContacts = async () => {
  try {
    const contacts = await storage.get('contacts') || [];
    
    // Process all contacts to ensure proper photo and document handling
    const processedContacts = await Promise.all(contacts.map(async (contact) => {
      if (!contact) return null;
      return await loadContactFromStorage(contact);
    }));

    return processedContacts.filter(Boolean);
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
};

export const getContactById = async (id) => {
  try {
    const contacts = await storage.get('contacts') || [];
    const contact = contacts.find(c => c.id === id);
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    // Ensure we have a valid contact with all necessary fields
    const safeContact = {
      ...contact,
      documents: Array.isArray(contact.documents) ? contact.documents : [],
      tags: Array.isArray(contact.tags) ? contact.tags : [],
      groups: Array.isArray(contact.groups) ? contact.groups : []
    };

    return await loadContactFromStorage(safeContact);
  } catch (error) {
    console.error('Error getting contact:', error);
    throw error;
  }
};

export const saveContact = async (contact) => {
  try {
    const contacts = await storage.get('contacts') || [];
    const processedContact = await processContactForStorage(contact);
    
    const existingIndex = contacts.findIndex(c => c.id === contact.id);
    if (existingIndex >= 0) {
      // Merge with existing contact to preserve data
      const existingContact = contacts[existingIndex];
      contacts[existingIndex] = {
        ...existingContact,
        ...processedContact,
        id: existingContact.id,
        createdAt: existingContact.createdAt,
        updatedAt: new Date().toISOString()
      };
    } else {
      processedContact.id = Date.now().toString();
      processedContact.createdAt = new Date().toISOString();
      processedContact.updatedAt = new Date().toISOString();
      contacts.push(processedContact);
    }

    // Save to storage
    await storage.set('contacts', contacts);
    
    // Return the processed contact for immediate display
    return await loadContactFromStorage(contacts[existingIndex >= 0 ? existingIndex : contacts.length - 1]);
  } catch (error) {
    console.error('Error saving contact:', error);
    throw error;
  }
};

export const deleteContact = async (id) => {
  try {
    const contacts = await getContacts();
    const filteredContacts = contacts.filter(c => c.id !== id);
    await storage.set('contacts', filteredContacts);
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
    return false;
  }
};

// Import/export functions
export const exportContacts = async () => {
  try {
    const contacts = await getContacts();
    const blob = new Blob([JSON.stringify(contacts)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

export const importContacts = async (file) => {
  try {
    const text = await file.text();
    const contacts = JSON.parse(text);
    
    if (!Array.isArray(contacts)) {
      throw new Error('Invalid contacts format');
    }
    
    await storage.set('contacts', contacts);
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Invalid contacts file');
  }
};

// Initialize storage when module loads
initializeStorage();

// Helper functions for add/update operations
export const addContact = async (contact) => {
  try {
    const contacts = await storage.get('contacts') || [];
    
    // Check for existing contact first
    const existingIndex = contacts.findIndex(c => c.id === contact.id);
    const newContact = {
      ...contact,
      id: existingIndex > -1 ? contact.id : `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: existingIndex > -1 ? contacts[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const processedContact = await processContactForStorage(newContact);

    if (existingIndex > -1) {
      // Preserve any fields that might be missing in the update
      contacts[existingIndex] = {
        ...contacts[existingIndex],
        ...processedContact,
        id: contacts[existingIndex].id, // Ensure ID doesn't change
        createdAt: contacts[existingIndex].createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      };
    } else {
      contacts.push(processedContact);
    }

    await storage.set('contacts', contacts);
    contactsCache = null;
    return processedContact;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

export const updateContact = async (id, updatedContact) => {
  try {
    const contacts = await storage.get('contacts') || [];
    const index = contacts.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Contact not found');
    }

    const existingContact = contacts[index];
    const processedUpdates = await processContactForStorage(updatedContact);
    
    // Create merged contact data - ensure we preserve photo if it exists in original but not in update
    const mergedContact = {
      ...existingContact,
      ...processedUpdates,
      id: existingContact.id, // Ensure ID doesn't change
      createdAt: existingContact.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
      // Preserve photo if it exists in original but not in update
      photo: processedUpdates.photo || existingContact.photo
    };

    // Update the contact in the list
    contacts[index] = mergedContact;
    
    // Save to storage
    await storage.set('contacts', contacts);
    
    // Clear cache to ensure fresh data
    contactsCache = null;

    // Return the processed contact for immediate display
    return await loadContactFromStorage(mergedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

// Update loadContacts function
export const loadContacts = async () => {
  try {
    if (contactsCache) return contactsCache;

    const contacts = await storage.get('contacts') || [];
    if (Array.isArray(contacts)) {
      contactsCache = await Promise.all(
        contacts.map(contact => loadContactFromStorage(contact))
      );
      return contactsCache;
    }
    return [];
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};
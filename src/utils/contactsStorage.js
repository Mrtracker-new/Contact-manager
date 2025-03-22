// Remove unused imports
import { Preferences } from '@capacitor/preferences';
import { Toast } from '@capacitor/toast';
import { base64ToBlob } from './documentHandler'; // Keep only used import
import { openDB } from 'idb';

// Utility functions
const showToast = async (message) => {
  if (window.Capacitor) {
    await Toast.show({ text: message, duration: 'short', position: 'bottom' });
  } else {
    console.log(message);
  }
};

const validateContact = (contact) => {
  if (!contact.name?.trim()) throw new Error('Contact name is required');
  return true;
};

const fileToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject('Invalid file object');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Storage operations
export const initializeStorage = async () => {
  try {
    const contacts = await getContacts();
    if (!Array.isArray(contacts)) {
      const initialValue = JSON.stringify([]);
      if (window.Capacitor) {
        await Preferences.set({ key: 'contacts', value: initialValue });
      } else {
        localStorage.setItem('contacts', initialValue);
      }
    }
    return true;
  } catch (error) {
    console.error('Storage initialization failed:', error);
    return false;
  }
};

export const getContacts = async () => {
  try {
    let contacts = [];
    if (window.Capacitor) {
      const { value } = await Preferences.get({ key: 'contacts' });
      contacts = value ? JSON.parse(value) : [];
    } else {
      contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    }
    return Array.isArray(contacts) ? contacts : [];
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};

export const getContactById = async (id) => {
  try {
    const contacts = await getContacts();
    const contact = contacts.find(c => c.id === id);
    if (!contact) return null;

    // Improved document processing
    const processDocuments = (docs) => {
      if (!Array.isArray(docs)) return [];
      return docs.map(doc => {
        try {
          if (!doc?.fileData) return null;
          return {
            ...doc,
            id: doc.id || Date.now().toString(),
            name: doc.name || 'Unnamed Document',
            file: base64ToBlob(doc.fileData, doc.type),
            type: doc.type || 'application/octet-stream'
          };
        } catch (error) {
          console.error('Error processing document:', error);
          return null;
        }
      }).filter(Boolean);
    };

    return {
      ...contact,
      documents: processDocuments(contact.documents || []),
      photo: contact.photoData ? base64ToBlob(contact.photoData.data) : null
    };
  } catch (error) {
    console.error('Error getting contact:', error);
    return null;
  }
};

export const updateContact = async (contact) => {
  try {
    validateContact(contact);
    const contacts = await getContacts();
    const index = contacts.findIndex(c => c.id === contact.id);

    if (index === -1) throw new Error('Contact not found');

    // Improved document processing for storage
    if (contact.documents) {
      contact.documents = (await Promise.all(
        contact.documents.map(async (doc) => {
          try {
            if (!doc) return null;
            
            // Preserve existing formatted documents
            if (doc.fileData && !doc.file) return doc;
            
            // Process new documents
            if (doc.file instanceof Blob) {
              return {
                ...doc,
                fileData: await blobToBase64(doc.file),
                type: doc.file.type || 'application/octet-stream',
                name: doc.name || 'Document'
              };
            }
            return doc;
          } catch (error) {
            console.error('Error processing document:', error);
            return null;
          }
        })
      )).filter(Boolean);
    }

    // Process photo
    if (contact.photo instanceof Blob) {
      contact.photoData = {
        data: await blobToBase64(contact.photo),
        type: contact.photo.type
      };
      delete contact.photo;
    }

    contacts[index] = contact;
    
    if (window.Capacitor) {
      await Preferences.set({ key: 'contacts', value: JSON.stringify(contacts) });
    } else {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }

    return contact;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const saveContact = async (contact) => {
  try {
    validateContact(contact);
    const contacts = await getContacts();
    
    // Process new contact
    if (!contact.id) {
      contact.id = Date.now().toString();
      contact.createdAt = new Date().toISOString();
      
      if (contact.photo instanceof Blob) {
        contact.photoData = {
          data: await blobToBase64(contact.photo),
          type: contact.photo.type
        };
        delete contact.photo;
      }

      if (contact.documents) {
        contact.documents = await Promise.all(
          contact.documents.map(async (doc) => ({
            ...doc,
            fileData: doc.file ? await blobToBase64(doc.file) : doc.fileData
          }))
        );
      }

      contacts.push(contact);
    }

    // Fix the storage implementation
    if (window.Capacitor) {
      await Preferences.set({ 
        key: 'contacts', 
        value: JSON.stringify(contacts) 
      });
    } else {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }

    return contact;
  } catch (error) {
    console.error('Error saving contact:', error);
    throw error;
  }
};

// Add this alias export
export const addContact = saveContact;

export const deleteContact = async (id) => {
  try {
    let contacts = await getContacts();
    contacts = contacts.filter(c => c.id !== id);
    
    if (window.Capacitor) {
      await Preferences.set({ key: 'contacts', value: JSON.stringify(contacts) });
    } else {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }
    
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
    const blob = new Blob([JSON.stringify(contacts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    
    if (window.Capacitor) {
      await Preferences.set({ key: 'contacts', value: JSON.stringify(contacts) });
    } else {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }
    
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Invalid contacts file');
  }
};

// Initialize storage when module loads
initializeStorage();
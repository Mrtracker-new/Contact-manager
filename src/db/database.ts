import Dexie, { Table } from 'dexie';
import { Contact, Attachment, Note, Link } from '../types';

export class ContactManagerDB extends Dexie {
  contacts!: Table<Contact>;
  attachments!: Table<Attachment>;
  notes!: Table<Note>;
  links!: Table<Link>;

  constructor() {
    super('ContactManagerDB');
    
    // Version 1 - Original schema
    this.version(1).stores({
      contacts: '++id, name, email, phone, *tags, isFavorite, createdAt, updatedAt',
      attachments: '++id, contactId, type, name, filePath, createdAt',
      notes: '++id, contactId, title, *tags, createdAt, updatedAt',
      links: '++id, contactId, type, title, createdAt'
    });
    
    // Version 2 - Add missing attachment fields
    this.version(2).stores({
      contacts: '++id, name, email, phone, *tags, isFavorite, createdAt, updatedAt',
      attachments: '++id, contactId, type, name, size, mimeType, data, filePath, createdAt',
      notes: '++id, contactId, title, *tags, createdAt, updatedAt',
      links: '++id, contactId, type, title, createdAt'
    });
    
    // Version 3 - Add thumbnail field to attachments
    this.version(3).stores({
      contacts: '++id, name, email, phone, *tags, isFavorite, createdAt, updatedAt',
      attachments: '++id, contactId, type, name, size, mimeType, data, filePath, thumbnail, createdAt',
      notes: '++id, contactId, title, *tags, createdAt, updatedAt',
      links: '++id, contactId, type, title, createdAt'
    });
    
    // Version 4 - Add profile picture field to contacts
    this.version(4).stores({
      contacts: '++id, name, email, phone, *tags, isFavorite, profilePicture, createdAt, updatedAt',
      attachments: '++id, contactId, type, name, size, mimeType, data, filePath, thumbnail, createdAt',
      notes: '++id, contactId, title, *tags, createdAt, updatedAt',
      links: '++id, contactId, type, title, createdAt'
    });
    
    // Version 5 - Add description field to links
    this.version(5).stores({
      contacts: '++id, name, email, phone, *tags, isFavorite, profilePicture, createdAt, updatedAt',
      attachments: '++id, contactId, type, name, size, mimeType, data, filePath, thumbnail, createdAt',
      notes: '++id, contactId, title, *tags, createdAt, updatedAt',
      links: '++id, contactId, type, title, url, description, createdAt'
    });
  }
}

export const db = new ContactManagerDB();

// Database operations helper functions
export const dbOperations = {
  // Contact operations
  async addContact(contact: Omit<Contact, 'id'>): Promise<number> {
    try {
      console.log('Adding contact:', contact);
      
      // Ensure all required fields are present
      const contactToAdd = {
        ...contact,
        name: contact.name || 'Unnamed Contact',
        tags: contact.tags || [],
        customFields: contact.customFields || [],
        createdAt: contact.createdAt || new Date(),
        updatedAt: contact.updatedAt || new Date(),
        isFavorite: contact.isFavorite || false
      };
      
      console.log('Processed contact:', contactToAdd);
      
      const id = await db.contacts.add(contactToAdd);
      console.log('Contact added with ID:', id);
      
      // Verify the contact was actually added
      const addedContact = await db.contacts.get(id);
      console.log('Verified added contact:', addedContact);
      
      return id as number;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  },

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    await db.contacts.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async deleteContact(id: number): Promise<void> {
    await db.transaction('rw', db.contacts, db.attachments, db.notes, db.links, async () => {
      await db.contacts.delete(id);
      await db.attachments.where('contactId').equals(id).delete();
      await db.notes.where('contactId').equals(id).delete();
      await db.links.where('contactId').equals(id).delete();
    });
  },

  async getContact(id: number): Promise<Contact | undefined> {
    return await db.contacts.get(id);
  },

  async getAllContacts(): Promise<Contact[]> {
    return await db.contacts.toArray();
  },

  // Attachment operations
  async addAttachment(attachment: Omit<Attachment, 'id'>): Promise<number> {
    return await db.attachments.add(attachment) as number;
  },

  async deleteAttachment(id: number): Promise<void> {
    await db.attachments.delete(id);
  },

  async getContactAttachments(contactId: number): Promise<Attachment[]> {
    return await db.attachments.where('contactId').equals(contactId).toArray();
  },

  // Note operations
  async addNote(note: Omit<Note, 'id'>): Promise<number> {
    try {
      console.log('Adding note:', note);
      const id = await db.notes.add(note) as number;
      console.log('Note added with ID:', id);
      
      // Verify the note was actually added
      const addedNote = await db.notes.get(id);
      console.log('Verified added note:', addedNote);
      
      return id;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  async updateNote(id: number, updates: Partial<Note>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async deleteNote(id: number): Promise<void> {
    await db.notes.delete(id);
  },

  async getContactNotes(contactId: number): Promise<Note[]> {
    return await db.notes.where('contactId').equals(contactId).toArray();
  },

  // Link operations
  async addLink(link: Omit<Link, 'id'>): Promise<number> {
    try {
      console.log('Adding link:', link);
      const id = await db.links.add(link) as number;
      console.log('Link added with ID:', id);
      
      // Verify the link was actually added
      const addedLink = await db.links.get(id);
      console.log('Verified added link:', addedLink);
      
      return id;
    } catch (error) {
      console.error('Error adding link:', error);
      throw error;
    }
  },

  async updateLink(id: number, updates: Partial<Link>): Promise<void> {
    await db.links.update(id, updates);
  },

  async deleteLink(id: number): Promise<void> {
    await db.links.delete(id);
  },

  async getContactLinks(contactId: number): Promise<Link[]> {
    return await db.links.where('contactId').equals(contactId).toArray();
  },

  // Search operations
  async searchContacts(query: string): Promise<Contact[]> {
    const lowerQuery = query.toLowerCase();
    return await db.contacts
      .filter(contact => 
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.email?.toLowerCase().includes(lowerQuery) ||
        contact.phone?.includes(query) ||
        contact.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  // Backup operations
  async exportData(): Promise<{
    contacts: Contact[];
    attachments: Attachment[];
    notes: Note[];
    links: Link[];
  }> {
    const contacts = await db.contacts.toArray();
    const attachments = await db.attachments.toArray();
    const notes = await db.notes.toArray();
    const links = await db.links.toArray();

    // Process attachments to ensure data is properly serialized
    const processedAttachments = await Promise.all(attachments.map(async (attachment) => {
      const processed = { ...attachment };
      
      // Convert Blob/ArrayBuffer data to Base64 string for JSON serialization
      if (attachment.data) {
        try {
          if (attachment.data instanceof Blob) {
            const arrayBuffer = await attachment.data.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            uint8Array.forEach((byte) => {
              binary += String.fromCharCode(byte);
            });
            processed.data = btoa(binary);
          } else if (attachment.data instanceof ArrayBuffer) {
            const uint8Array = new Uint8Array(attachment.data);
            let binary = '';
            uint8Array.forEach((byte) => {
              binary += String.fromCharCode(byte);
            });
            processed.data = btoa(binary);
          } else if (typeof attachment.data === 'string') {
            // If it's already a string (Base64 or blob URL), keep it as is
            processed.data = attachment.data;
          }
        } catch (error) {
          console.warn('Failed to serialize attachment data for attachment:', attachment.id, error);
          // Remove the data field if serialization fails
          delete processed.data;
        }
      }
      
      return processed;
    }));

    return { contacts, attachments: processedAttachments, notes, links };
  },

  async importData(data: {
    contacts: Contact[];
    attachments: Attachment[];
    notes: Note[];
    links: Link[];
  }): Promise<void> {
    console.log('Importing data...', {
      contacts: data.contacts?.length || 0,
      attachments: data.attachments?.length || 0,
      notes: data.notes?.length || 0,
      links: data.links?.length || 0
    });

    await db.transaction('rw', db.contacts, db.attachments, db.notes, db.links, async () => {
      await db.contacts.clear();
      await db.attachments.clear();
      await db.notes.clear();
      await db.links.clear();

      // Process contacts to ensure proper data types
      const processedContacts = data.contacts.map(contact => ({
        ...contact,
        createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
        updatedAt: contact.updatedAt ? new Date(contact.updatedAt) : new Date(),
        birthday: contact.birthday ? new Date(contact.birthday) : undefined,
        tags: contact.tags || [],
        customFields: contact.customFields || [],
        isFavorite: contact.isFavorite || false,
        // Ensure profilePicture is preserved
        profilePicture: contact.profilePicture || undefined
      }));

      // Process attachments to restore data from Base64
      const processedAttachments = data.attachments.map(attachment => {
        const processed = {
          ...attachment,
          createdAt: attachment.createdAt ? new Date(attachment.createdAt) : new Date(),
          size: attachment.size || 0,
          mimeType: attachment.mimeType || 'application/octet-stream'
        };

        // Convert Base64 string back to Blob if data exists
        if (attachment.data && typeof attachment.data === 'string') {
          try {
            // Check if it's a Base64 string (not a blob URL)
            if (!attachment.data.startsWith('blob:') && !attachment.data.startsWith('data:')) {
              const binaryString = atob(attachment.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              processed.data = new Blob([bytes], { type: attachment.mimeType });
            } else {
              // Keep blob URLs or data URLs as strings
              processed.data = attachment.data;
            }
          } catch (error) {
            console.warn('Failed to restore attachment data for attachment:', attachment.id, error);
            // Keep the original data if conversion fails
            processed.data = attachment.data;
          }
        }

        return processed;
      });

      // Process notes with proper dates
      const processedNotes = data.notes.map(note => ({
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        tags: note.tags || []
      }));

      // Process links with proper dates
      const processedLinks = data.links.map(link => ({
        ...link,
        createdAt: link.createdAt ? new Date(link.createdAt) : new Date()
      }));

      console.log('Adding processed data to database...');
      await db.contacts.bulkAdd(processedContacts);
      await db.attachments.bulkAdd(processedAttachments);
      await db.notes.bulkAdd(processedNotes);
      await db.links.bulkAdd(processedLinks);

      console.log('Import completed successfully!');
    });
  }
};

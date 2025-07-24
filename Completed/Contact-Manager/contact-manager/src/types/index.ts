export interface Contact {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  birthday?: Date;
  profilePicture?: string; // Base64 encoded image or blob URL
  tags: string[];
  customFields: CustomField[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  encryptedData?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface Attachment {
  id?: number;
  contactId: number;
  type: 'document' | 'image' | 'video' | 'other';
  name: string;
  size: number;
  mimeType: string;
  data?: Blob | ArrayBuffer | string; // Optional for backwards compatibility, string for blob URLs
  filePath?: string; // Path to the file on disk
  thumbnail?: string; // Base64 encoded thumbnail for images/videos
  createdAt: Date;
}

export interface Note {
  id?: number;
  contactId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Link {
  id?: number;
  contactId: number;
  title: string;
  url: string;
  type: 'linkedin' | 'website' | 'drive' | 'github' | 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'video' | 'image' | 'document' | 'download' | 'blog' | 'other';
  description?: string;
  createdAt: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  enableDataEncryption: boolean;
  clearClipboardAfter: number; // in seconds, 0 = disabled
  autoLockTimeout: number; // in minutes, 0 = disabled
  requirePasswordOnStartup: boolean;
  enableActivityLog: boolean;
  enableContactHistory: boolean;
  enableCloudSync: boolean;
  syncProvider: 'google' | 'dropbox' | 'none'; // specify sync providers if needed
  maxAttachmentSize: number; // in MB
  enableHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  enableReducedMotion: boolean;
}

export type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'favorite';
export type FilterOption = 'all' | 'favorites' | 'recent' | 'birthday';

export interface SearchFilters {
  query: string;
  tags: string[];
  sortBy: SortOption;
  filterBy: FilterOption;
}

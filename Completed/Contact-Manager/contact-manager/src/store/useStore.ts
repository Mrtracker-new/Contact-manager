import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, SearchFilters } from '../types';

interface AppState {
  // App settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Search and filters
  searchFilters: SearchFilters;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  
  // Search history
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Recently viewed contacts
  recentlyViewedContacts: number[];
  addRecentlyViewedContact: (contactId: number) => void;
  clearRecentlyViewedContacts: () => void;
  
  // Selected contact
  selectedContactId: number | null;
  setSelectedContactId: (id: number | null) => void;
  
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  
  // Authentication
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  
  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Default settings
      settings: {
        theme: 'system',
        autoBackup: false,
        backupFrequency: 'weekly',
        enableDataEncryption: false,
        clearClipboardAfter: 30, // 30 seconds default
        autoLockTimeout: 0, // disabled by default
        requirePasswordOnStartup: false,
        enableActivityLog: true,
        enableContactHistory: true,
        enableCloudSync: false,
        syncProvider: 'none',
        maxAttachmentSize: 50, // 50MB default
        enableHighContrast: false,
        fontSize: 'medium',
        enableReducedMotion: false,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Default search filters
      searchFilters: {
        query: '',
        tags: [],
        sortBy: 'name',
        filterBy: 'all',
      },
      updateSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters },
        })),
      
      // Search history
      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => {
          if (!query.trim()) return state;
          const newSearches = [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 10);
          return { recentSearches: newSearches };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      // Recently viewed contacts
      recentlyViewedContacts: [],
      addRecentlyViewedContact: (contactId) =>
        set((state) => {
          const newRecent = [contactId, ...state.recentlyViewedContacts.filter(id => id !== contactId)].slice(0, 5);
          return { recentlyViewedContacts: newRecent };
        }),
      clearRecentlyViewedContacts: () => set({ recentlyViewedContacts: [] }),
      
      // Selected contact
      selectedContactId: null,
      setSelectedContactId: (id) => set({ selectedContactId: id }),
      
      // UI state
      isSidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
      
      // Authentication
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      
      // View mode
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'contact-manager-storage',
      partialize: (state) => ({
        settings: state.settings,
        viewMode: state.viewMode,
        recentSearches: state.recentSearches,
        recentlyViewedContacts: state.recentlyViewedContacts,
      }),
    }
  )
);

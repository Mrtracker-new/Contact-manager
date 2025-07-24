import { registerPlugin } from '@capacitor/core';
import { FileOpener as CommunityFileOpener } from '@capacitor-community/file-opener';

export interface SafeBrowserPlugin {
  open(options: { url: string; toolbarColor?: string; presentationStyle?: boolean }): Promise<{ success: boolean; message: string }>;
}

const SafeBrowser = registerPlugin<SafeBrowserPlugin>('SafeBrowser');

// Export the community FileOpener plugin
export { CommunityFileOpener as FileOpener, SafeBrowser };

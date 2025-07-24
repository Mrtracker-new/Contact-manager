import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import toast from "react-hot-toast";
import { dbOperations } from "../db/database";
import { urlUtils } from "../utils";
import { Link } from "../types";
import { Link as LinkIcon, ExternalLink, Trash2, Globe, Github, Linkedin, FileText, Plus, Loader2, Twitter, Instagram, Facebook, Youtube, Video, FileImage, Download, Upload, Edit3, Check, X, AlertCircle, Info } from "lucide-react";

interface UrlMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
}

// Type guard to ensure the type is valid
const ensureValidLinkType = (type: string): Link['type'] => {
  const validTypes: Link['type'][] = [
    'linkedin', 'website', 'drive', 'github', 'twitter', 'instagram', 'facebook', 
    'youtube', 'video', 'image', 'document', 'download', 'blog', 'other'
  ];
  
  return validTypes.includes(type as Link['type']) ? type as Link['type'] : 'other';
};

export const LinkSection = ({ contactId }: { contactId: number }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingLink, setEditingLink] = useState<number | null>(null);
  const [bulkUrls, setBulkUrls] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string; suggestions: string[] }>({ isValid: true, message: "", suggestions: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit form state
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCustomType, setEditCustomType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Use Dexie's live query to get real-time updates
  const links = useLiveQuery(
    () => dbOperations.getContactLinks(contactId),
    [contactId]
  ) || [];

  // Enhanced URL validation with suggestions
  const validateUrl = (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setUrlValidation({ isValid: true, message: "", suggestions: [] });
      return;
    }

    const trimmedUrl = inputUrl.trim();
    const suggestions: string[] = [];
    
    // Check for common mistakes and provide suggestions
    if (!trimmedUrl.includes('.')) {
      setUrlValidation({ 
        isValid: false, 
        message: "URL appears to be missing a domain extension", 
        suggestions: [`${trimmedUrl}.com`, `${trimmedUrl}.org`, `${trimmedUrl}.net`]
      });
      return;
    }

    if (!trimmedUrl.match(/^[a-zA-Z]+:\/\//)) {
      suggestions.push(`https://${trimmedUrl}`);
      if (!trimmedUrl.startsWith('www.')) {
        suggestions.push(`https://www.${trimmedUrl}`);
      }
    }

    const processedUrl = urlUtils.formatUrl(trimmedUrl);
    const isValid = urlUtils.isValidUrl(processedUrl);
    
    if (!isValid) {
      // Check for common typos
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'linkedin.com', 'github.com', 'twitter.com', 'facebook.com'];
      const domain = urlUtils.getDomain(processedUrl);
      const similarDomains = commonDomains.filter(d => 
        d.includes(domain.replace('www.', '')) || domain.replace('www.', '').includes(d)
      );
      
      if (similarDomains.length > 0) {
        suggestions.push(...similarDomains.map(d => `https://${d}`));
      }
    }

    setUrlValidation({ 
      isValid, 
      message: isValid ? "Valid URL" : "Invalid URL format", 
      suggestions: [...new Set(suggestions)].slice(0, 3)
    });
  };

  // Fetch URL metadata
  const fetchUrlMetadata = async (targetUrl: string): Promise<UrlMetadata> => {
    try {
      // In a real application, you would use a service like:
      // - Link preview API
      // - Your own backend service
      // - Browser extension APIs
      
      // For this demo, we'll simulate metadata fetching
      const domain = urlUtils.getDomain(targetUrl);
      const detectedType = urlUtils.detectLinkType(targetUrl);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock metadata based on URL
      const mockMetadata: UrlMetadata = {
        title: domain || "Website",
        description: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} link`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      };
      
      // Enhanced metadata for known sites
      if (domain.includes('linkedin.com')) {
        mockMetadata.title = "LinkedIn Profile";
        mockMetadata.description = "Professional networking profile";
      } else if (domain.includes('github.com')) {
        mockMetadata.title = "GitHub Repository";
        mockMetadata.description = "Code repository and projects";
      } else if (domain.includes('twitter.com')) {
        mockMetadata.title = "Twitter Profile";
        mockMetadata.description = "Social media profile";
      }
      
      return mockMetadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return {};
    }
  };

  // Handle URL input changes with real-time validation
  const handleUrlChange = (value: string) => {
    setUrl(value);
    validateUrl(value);
    
    // Auto-fetch metadata for valid URLs
    if (value.trim() && urlUtils.isValidUrl(urlUtils.formatUrl(value.trim()))) {
      const timer = setTimeout(async () => {
        if (!title.trim()) {
          setIsFetchingMetadata(true);
          try {
            const metadata = await fetchUrlMetadata(urlUtils.formatUrl(value.trim()));
            if (metadata.title && !title.trim()) {
              setTitle(metadata.title);
            }
            if (metadata.description && !description.trim()) {
              setDescription(metadata.description);
            }
          } catch (error) {
            console.error('Failed to fetch metadata:', error);
          } finally {
            setIsFetchingMetadata(false);
          }
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  };

  const handleAddLink = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL", {
        duration: 4000,
        icon: '⚠️',
      });
      return;
    }

    // Format URL properly
    const processedUrl = urlUtils.formatUrl(url.trim());

    if (!urlUtils.isValidUrl(processedUrl)) {
      toast.error("Please enter a valid URL", {
        duration: 4000,
        icon: '❌',
      });
      return;
    }

    setIsAdding(true);
    try {
      const linkData = {
        contactId,
        title: title.trim() || urlUtils.getDomain(processedUrl),
        url: processedUrl,
        type: ensureValidLinkType(customType.trim() || urlUtils.detectLinkType(processedUrl)),
        description: description.trim(),
        createdAt: new Date(),
      };
      
      await dbOperations.addLink(linkData);
      
      // Reset form
      setUrl("");
      setTitle("");
      setCustomType("");
      setDescription("");
      setShowForm(false);
      setShowAdvanced(false);
      setUrlValidation({ isValid: true, message: "", suggestions: [] });
      
      toast.success("Link added successfully!", {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error("Failed to add link. Please try again.", {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Bulk import functionality
  const handleBulkImport = async () => {
    if (!bulkUrls.trim()) {
      toast.error("Please enter URLs to import", { icon: '⚠️' });
      return;
    }

    const urls = bulkUrls.split('\n').filter(line => line.trim()).map(line => line.trim());
    let successCount = 0;
    let errorCount = 0;

    setIsAdding(true);
    
    for (const rawUrl of urls) {
      try {
        const processedUrl = urlUtils.formatUrl(rawUrl);
        if (urlUtils.isValidUrl(processedUrl)) {
          await dbOperations.addLink({
            contactId,
            title: urlUtils.getDomain(processedUrl),
            url: processedUrl,
            type: ensureValidLinkType(urlUtils.detectLinkType(processedUrl)),
            createdAt: new Date(),
          });
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setIsAdding(false);
    setBulkUrls("");
    setShowBulkImport(false);

    if (successCount > 0) {
      toast.success(`${successCount} links imported successfully!`, { icon: '✅' });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} links failed to import`, { icon: '❌' });
    }
  };

  // Import from file
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBulkUrls(content);
      setShowBulkImport(true);
    };
    reader.readAsText(file);
  };

  const handleDeleteLink = async (linkId: number) => {
    try {
      await dbOperations.deleteLink(linkId);
      toast.success("Link removed", { 
        duration: 3000,
        icon: '🗑️',
      });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error("Failed to remove link", {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  // Edit link functionality
  const handleEditLink = (link: Link) => {
    setEditingLink(link.id!);
    setEditUrl(link.url);
    setEditTitle(link.title);
    setEditCustomType(link.type);
    setEditDescription(link.description || "");
  };

  const handleCancelEdit = () => {
    setEditingLink(null);
    setEditUrl("");
    setEditTitle("");
    setEditCustomType("");
    setEditDescription("");
  };

  const handleSaveEdit = async (linkId: number) => {
    if (!editUrl.trim()) {
      toast.error("Please enter a URL", {
        duration: 4000,
        icon: '⚠️',
      });
      return;
    }

    // Format URL properly
    const processedUrl = urlUtils.formatUrl(editUrl.trim());

    if (!urlUtils.isValidUrl(processedUrl)) {
      toast.error("Please enter a valid URL", {
        duration: 4000,
        icon: '❌',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        title: editTitle.trim() || urlUtils.getDomain(processedUrl),
        url: processedUrl,
        type: ensureValidLinkType(editCustomType.trim() || urlUtils.detectLinkType(processedUrl)),
        description: editDescription.trim(),
      };
      
      await dbOperations.updateLink(linkId, updateData);
      
      // Reset edit form
      handleCancelEdit();
      
      toast.success("Link updated successfully!", {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error("Failed to update link. Please try again.", {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Enhanced link icon with more types
  const getLinkIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <FileImage className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'drive': 
      case 'document': return <FileText className="w-4 h-4" />;
      case 'website': 
      case 'blog': return <Globe className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  // Get link type color
  const getLinkTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'linkedin': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'github': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
      case 'twitter': return 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400';
      case 'instagram': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      case 'facebook': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'youtube': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'video': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'image': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'drive':
      case 'document': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400';
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Links</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="btn-ghost p-2 text-xs"
            title="Bulk import links"
            aria-label="Bulk import links"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-ghost p-2 text-sm"
            aria-label="Add new link"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Bulk Import Links</h3>
            <button
              onClick={() => setShowBulkImport(false)}
              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder="Enter URLs, one per line:\nhttps://example.com\nhttps://github.com/username\nhttps://linkedin.com/in/username"
            className="input w-full h-32 resize-none"
            disabled={isAdding}
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={handleBulkImport}
              className="btn-primary flex items-center gap-2"
              disabled={isAdding || !bulkUrls.trim()}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Links
                </>
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost flex items-center gap-2"
              disabled={isAdding}
            >
              <FileText className="w-4 h-4" />
              From File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tip: You can also import from a text file containing URLs
          </p>
        </div>
      )}

      {/* Enhanced Add Link Form */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 space-y-3">
          {/* URL Input with real-time validation */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Enter URL (e.g., https://example.com)"
                className={`input w-full pr-10 ${
                  url && !urlValidation.isValid ? 'border-red-300 focus:border-red-500' : 
                  url && urlValidation.isValid ? 'border-green-300 focus:border-green-500' : ''
                }`}
                disabled={isAdding}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
              />
              {isFetchingMetadata && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}
              {url && urlValidation.isValid && !isFetchingMetadata && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
              {url && !urlValidation.isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            
            {/* URL Validation Feedback */}
            {url && urlValidation.message && (
              <div className={`text-xs flex items-center gap-1 ${
                urlValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {urlValidation.isValid ? 
                  <Check className="w-3 h-3" /> : 
                  <AlertCircle className="w-3 h-3" />
                }
                {urlValidation.message}
              </div>
            )}
            
            {/* URL Suggestions */}
            {urlValidation.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">Did you mean:</p>
                <div className="flex flex-wrap gap-1">
                  {urlValidation.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setUrl(suggestion);
                        handleUrlChange(suggestion);
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title (auto-filled from URL)"
            className="input w-full"
            disabled={isAdding}
          />

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm"
          >
            <Info className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Custom Type
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="input w-full text-xs"
                    disabled={isAdding}
                  >
                    <option value="">Auto-detect</option>
                    <option value="website">Website</option>
                    <option value="blog">Blog</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                    <option value="twitter">Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="document">Document</option>
                    <option value="drive">Google Drive</option>
                    <option value="download">Download</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description or notes about this link"
                  className="input w-full h-16 resize-none text-xs"
                  disabled={isAdding}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleAddLink} 
              className="btn-primary flex items-center gap-2"
              disabled={isAdding || !urlValidation.isValid || !url.trim()}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Link
                </>
              )}
            </button>
            <button 
              onClick={() => {
                setShowForm(false);
                setUrl("");
                setTitle("");
                setCustomType("");
                setDescription("");
                setShowAdvanced(false);
                setUrlValidation({ isValid: true, message: "", suggestions: [] });
              }} 
              className="btn-ghost"
              disabled={isAdding}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Links Display */}
      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id}>
              {editingLink === link.id ? (
                // Edit Form
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-3 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getLinkTypeColor(link.type)}`}>
                      {getLinkIcon(link.type)}
                    </div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Edit Link</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="Enter URL"
                        className="input w-full"
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Link title"
                        className="input w-full"
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Type
                        </label>
                        <select
                          value={editCustomType}
                          onChange={(e) => setEditCustomType(e.target.value)}
                          className="input w-full"
                          disabled={isUpdating}
                        >
                          <option value="website">Website</option>
                          <option value="blog">Blog</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="github">GitHub</option>
                          <option value="twitter">Twitter</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="youtube">YouTube</option>
                          <option value="video">Video</option>
                          <option value="image">Image</option>
                          <option value="document">Document</option>
                          <option value="drive">Google Drive</option>
                          <option value="download">Download</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Optional description"
                        className="input w-full h-16 resize-none"
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleSaveEdit(link.id!)}
                      className="btn-primary flex items-center gap-2"
                      disabled={isUpdating || !editUrl.trim()}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-ghost flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Regular Link Display
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getLinkTypeColor(link.type)}`}>
                    {getLinkIcon(link.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {link.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {link.url}
                        </p>
                        {link.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {link.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getLinkTypeColor(link.type)}`}>
                            {link.type}
                          </span>
                          {link.createdAt && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Added {new Date(link.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditLink(link)}
                      className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                      aria-label="Edit link"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                      aria-label="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteLink(link.id!)}
                      className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                      aria-label="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && !showBulkImport && (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-900 dark:text-gray-100">
              No links added yet
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
              Add links to websites, social profiles, or documents
            </p>
          </div>
        )
      )}
    </div>
  );
};

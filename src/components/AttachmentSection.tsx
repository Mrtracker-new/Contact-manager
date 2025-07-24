import React, { useState, useEffect, useRef } from 'react';
import {
  getContactAttachments,
  addAttachment,
  deleteAttachment,
  openFile,
  downloadFile,
  shareFile,
  formatFileInfo,
} from '../services/attachments.service';
import toast from 'react-hot-toast';
import {
  Paperclip,
  Download,
  ExternalLink,
  FolderOpen,
  Upload,
  X,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Share2,
} from 'lucide-react';
import { Attachment } from '../types';
import { fileUtils } from '../utils';

interface AttachmentSectionProps {
  contactId: number;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({ contactId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentUploadFile, setCurrentUploadFile] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAttachments();
  }, [contactId]);

  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const data = await getContactAttachments(contactId);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Failed to load attachments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // If we already have selected files, we're adding more
      handleFiles(e.dataTransfer.files, selectedFiles.length > 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // If we already have selected files, we're adding more
      handleFiles(e.target.files, selectedFiles.length > 0);
    }
  };

  const handleFiles = (files: FileList, isAddingMore: boolean = false) => {
    const fileArray = Array.from(files);
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    const newValidFiles: File[] = [];
    const oversizedFiles: string[] = [];
    const duplicateFiles: string[] = [];
    
    // Get existing file names for duplicate check
    const existingFileNames = selectedFiles.map(f => f.name);
    
    fileArray.forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
      } else if (existingFileNames.includes(file.name)) {
        duplicateFiles.push(file.name);
      } else {
        newValidFiles.push(file);
      }
    });
    
    if (oversizedFiles.length > 0) {
      toast.error(
        `The following files exceed the 50MB limit and were not added: ${oversizedFiles.join(', ')}`,
        { duration: 5000 }
      );
    }
    
    if (duplicateFiles.length > 0) {
      toast(
        `The following files were already selected: ${duplicateFiles.join(', ')}`,
        { icon: '⚠️', duration: 3000 }
      );
    }
    
    // If we're adding more files or if we already have files, append them
    if (isAddingMore || selectedFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...newValidFiles]);
    } else {
      // First time selecting files
      setSelectedFiles(newValidFiles);
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;
      
      for (const file of selectedFiles) {
        setCurrentUploadFile(file.name);
        
        const fileList = new DataTransfer();
        fileList.items.add(file);
        
        const result = await addAttachment(contactId, fileList.files);
        
        if (!result.success) {
          toast.error(`Failed to upload ${file.name}: ${result.message}`);
        }
        
        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }
      
      toast.success(`Successfully uploaded ${completedFiles} file(s)!`);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadAttachments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setCurrentUploadFile('');
    }
  };

  const handleOpenFile = async (attachment: Attachment) => {
    const result = await openFile(attachment);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    const result = await downloadFile(attachment);
    if (result.success) {
      toast.success(result.message);
    } else if (result.message.includes('linked')) {
      toast(result.message, { icon: 'ℹ️' });
    } else {
      toast.error(result.message);
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;

    try {
      await deleteAttachment(attachmentId);
      toast.success('Attachment removed successfully!');
      await loadAttachments();
    } catch (error) {
      toast.error('Failed to remove attachment.');
      console.error('Error removing attachment:', error);
    }
  };

  const handleShare = async (attachment: Attachment) => {
    const result = await shareFile(attachment);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (fileUtils.isImageFile(mimeType)) return <Image className="w-5 h-5" />;
    if (fileUtils.isVideoFile(mimeType)) return <Film className="w-5 h-5" />;
    if (mimeType.includes('audio')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="mt-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attachments</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {attachments.length} file{attachments.length !== 1 ? 's' : ''}
        </span>
      </div>


      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />

        {selectedFiles.length === 0 ? (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Click to upload
              </button>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Any file type up to 50MB
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Selected Files ({selectedFiles.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {getFileTypeIcon(file.type || fileUtils.getMimeType(file.name))}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileUtils.formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={uploadFiles}
                disabled={isLoading}
                className="flex-1 relative bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-hidden"
              >
                {isLoading && (
                  <div
                    className="absolute inset-0 bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span className="relative z-10 text-sm sm:text-base truncate">
                  {isLoading ? (
                    <span className="block sm:hidden">Uploading... {uploadProgress}%</span>
                  ) : (
                    <span className="block sm:hidden">Upload {selectedFiles.length}</span>
                  )}
                  <span className="hidden sm:block">
                    {isLoading ? `Uploading ${currentUploadFile} (${uploadProgress}%)` : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
                  </span>
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Add more
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attachments List */}
      {isLoading && attachments.length === 0 ? (
        <div className="mt-6 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading attachments...</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="mt-6 text-center py-8">
          <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No attachments yet</p>
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Attached Files
          </h3>
          <div className="grid gap-3">
            {attachments.map((attachment) => {
              const fileInfo = formatFileInfo(attachment);
              return (
                <div
                  key={attachment.id}
                  className="card p-3 sm:p-4 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* File Icon */}
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      {getFileTypeIcon(attachment.mimeType)}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2">
                        {/* File Name */}
                        <h4 className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 truncate pr-2">
                          {attachment.name}
                        </h4>
                        
                        {/* File Details */}
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                            {fileInfo.sizeText}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                            {fileInfo.typeText}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                              fileInfo.statusColor === 'blue'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            }`}
                          >
                            {fileInfo.statusColor === 'blue' ? (
                              <FolderOpen className="w-3 h-3" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            {fileInfo.statusText}
                          </span>
                        </div>
                        
                        {/* Date Added */}
                        {attachment.createdAt && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Added {new Date(attachment.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex sm:flex-col gap-1 flex-shrink-0 justify-end">
                      <button
                        onClick={() => handleOpenFile(attachment)}
                        className="mobile-touch-target text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Open file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(attachment)}
                        className="mobile-touch-target text-slate-600 dark:text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Share file"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="mobile-touch-target text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => attachment.id && handleRemoveAttachment(attachment.id)}
                        className="mobile-touch-target text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;

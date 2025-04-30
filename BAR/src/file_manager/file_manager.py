
import os
import json
import time
import shutil
import threading
import logging
import base64
import hashlib
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from cryptography.hazmat.primitives import hashes

from ..crypto.encryption import EncryptionManager
from .file_scanner import FileScanner


class FileManager:
    """Manages secure file operations for the BAR application."""
    
    def __init__(self, base_directory: str):
        """Initialize the file manager.
        
        Args:
            base_directory: The base directory for storing all files and metadata
        """
        self.base_directory = Path(base_directory)
        self.files_directory = self.base_directory / "files"
        self.metadata_directory = self.base_directory / "metadata"
        self.blacklist_directory = self.base_directory / "blacklist"
        
        # Create directories if they don't exist
        self.files_directory.mkdir(parents=True, exist_ok=True)
        self.metadata_directory.mkdir(parents=True, exist_ok=True)
        self.blacklist_directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize the encryption manager
        self.encryption_manager = EncryptionManager()
        
        # Setup logging first
        self._setup_logging()
        
        # Initialize the file scanner
        self.file_scanner = FileScanner(self)
        
        # Start the file monitoring thread AFTER all other initialization
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(target=self._monitor_files, daemon=True)
        self.monitor_thread.start()
    
    def _setup_logging(self):
        """Set up logging for the file manager."""
        log_dir = self.base_directory / "logs"
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / "file_operations.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger("FileManager")
    
    def _is_media_file(self, filename: str, content: bytes) -> bool:
        """Determine if a file is a media file based on its extension and content.
        
        Args:
            filename: The name of the file
            content: The file content
            
        Returns:
            True if the file is a media file, False otherwise
        """
        # Check file extension first (case insensitive)
        media_extensions = {
            # Images
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg',
            # Audio
            '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
            # Video
            '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm', '.flv',
            # Other media
            '.pdf', '.psd', '.ai', '.eps'
        }
        
        _, ext = os.path.splitext(filename.lower())
        if ext in media_extensions:
            return True
            
        # Check for magic bytes/signatures for common media formats
        # This is a basic implementation - could be expanded for more formats
        signatures = {
            # JPEG
            b'\xff\xd8\xff': True,
            # PNG
            b'\x89PNG\r\n\x1a\n': True,
            # GIF
            b'GIF87a': True,
            b'GIF89a': True,
            # PDF
            b'%PDF': True,
            # MP4/M4A/etc
            b'ftyp': True,
            # WEBP
            b'RIFF': True
        }
        
        # Check first 20 bytes for signatures
        header = content[:20] if len(content) >= 20 else content
        for sig, is_media in signatures.items():
            if sig in header:
                return is_media
                
        return False
    
    def create_secure_file(self, content: bytes, filename: str, password: str, 
                          security_settings: Dict[str, Any]) -> str:
        """Create a new secure file with the specified security settings.
        
        Args:
            content: The file content to encrypt and store
            filename: The name of the file
            password: The password to encrypt the file with
            security_settings: Dictionary containing security parameters:
                - expiration_time: Optional timestamp when the file should expire
                - max_access_count: Optional maximum number of times the file can be accessed
                - deadman_switch: Optional period of inactivity after which the file is deleted
                - disable_export: Optional flag to prevent exporting (view-only mode)
                
        Returns:
            The ID of the created file
        """
        # Generate a unique file ID
        file_id = self._generate_file_id()
        
        # Check if this is a media file and automatically set disable_export if not explicitly set
        is_media = self._is_media_file(filename, content)
        if is_media and "disable_export" not in security_settings:
            # Automatically make media files view-only unless explicitly overridden
            security_settings["disable_export"] = True
            self.logger.info(f"Automatically set view-only mode for media file: {filename}")
        
        # Encrypt the file content
        encrypted_content = self.encryption_manager.encrypt_file_content(content, password)
        
        # Create metadata
        current_time = datetime.now()
        metadata = {
            "file_id": file_id,
            "filename": filename,
            "creation_time": current_time.isoformat(),
            "last_accessed": current_time.isoformat(),
            "access_count": 0,
            "file_type": "media" if is_media else "document",
            "security": {
                "expiration_time": security_settings.get("expiration_time"),
                "max_access_count": security_settings.get("max_access_count"),
                "deadman_switch": security_settings.get("deadman_switch"),  # in days
                "disable_export": security_settings.get("disable_export", False),  # prevents exporting of view-only files
            },
            "encryption": encrypted_content
        }
        
        # Save the file metadata
        metadata_path = self.metadata_directory / f"{file_id}.json"
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        self.logger.info(f"Created secure file: {file_id} ({filename})")
        return file_id
    
    def access_file(self, file_id: str, password: str) -> Tuple[bytes, Dict[str, Any]]:
        """Access a secure file, checking security constraints.
        
        Args:
            file_id: The ID of the file to access
            password: The password to decrypt the file
            
        Returns:
            Tuple containing (file_content, metadata)
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            ValueError: If the password is incorrect or the file has expired
        """
        # Check if the file exists
        metadata_path = self.metadata_directory / f"{file_id}.json"
        if not metadata_path.exists():
            raise FileNotFoundError(f"File with ID {file_id} not found")
        
        # Load metadata
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Check security constraints
        if not self._check_security_constraints(metadata):
            # File has expired or reached max access count
            self._secure_delete_file(file_id)
            raise ValueError("File has expired or reached maximum access count")
        
        # Initialize failed attempts tracking if not present
        if "failed_password_attempts" not in metadata:
            metadata["failed_password_attempts"] = 0
            
        # Define max failed attempts
        max_failed_attempts = 3  # Maximum number of failed password attempts allowed
        
        # Decrypt the file content
        try:
            file_content = self.encryption_manager.decrypt_file_content(
                metadata["encryption"], password)
            # Reset failed attempts on successful decryption
            metadata["failed_password_attempts"] = 0
        except ValueError:
            # Increment failed attempts
            metadata["failed_password_attempts"] += 1
            self.logger.warning(f"Failed decryption attempt for file: {file_id}. Attempt {metadata['failed_password_attempts']} of {max_failed_attempts}")
            
            # Save updated metadata with failed attempts count
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
                
            # Check if max failed attempts reached
            if metadata["failed_password_attempts"] >= max_failed_attempts:
                self.logger.warning(f"Maximum failed attempts reached for file: {file_id}. Permanently deleting file.")
                self._secure_delete_file(file_id)
                raise ValueError(f"File has been permanently deleted after {max_failed_attempts} failed password attempts")
            
            raise ValueError(f"Incorrect password. {max_failed_attempts - metadata['failed_password_attempts']} attempts remaining before permanent deletion")
        
        # Update access metadata
        current_time = datetime.now()
        metadata["last_accessed"] = current_time.isoformat()
        metadata["access_count"] += 1
        
        # Save updated metadata
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        # Check if this access has triggered self-destruction
        if metadata["security"]["max_access_count"] and \
           metadata["access_count"] >= metadata["security"]["max_access_count"]:
            # Schedule deletion after returning the content
            threading.Thread(target=self._secure_delete_file, args=(file_id,), daemon=True).start()
        
        self.logger.info(f"Accessed file: {file_id} ({metadata['filename']})")
        return file_content, metadata
    
    def list_files(self) -> List[Dict[str, Any]]:
        """List all available secure files with their metadata (excluding encryption details).
        
        Returns:
            List of dictionaries containing file metadata with additional UI-friendly fields:
            - is_view_only: Boolean indicating if the file is view-only (cannot be exported)
            - file_type: String indicating the type of file ("media" or "document")
            - file_type_display: User-friendly display name for the file type
        """
        files = []
        for metadata_file in self.metadata_directory.glob("*.json"):
            with open(metadata_file, "r") as f:
                metadata = json.load(f)
            
            # Remove sensitive encryption details
            if "encryption" in metadata:
                metadata_copy = metadata.copy()
                del metadata_copy["encryption"]
                
                # Add UI-friendly fields
                metadata_copy["is_view_only"] = metadata_copy.get("security", {}).get("disable_export", False)
                
                # Set file type display name
                file_type = metadata_copy.get("file_type", "document")
                metadata_copy["file_type"] = file_type
                
                if file_type == "media":
                    # Determine more specific media type based on filename
                    filename = metadata_copy.get("filename", "").lower()
                    if any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]):
                        metadata_copy["file_type_display"] = "Image"
                    elif any(filename.endswith(ext) for ext in [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]):
                        metadata_copy["file_type_display"] = "Audio"
                    elif any(filename.endswith(ext) for ext in [".mp4", ".avi", ".mov", ".wmv", ".mkv", ".webm", ".flv"]):
                        metadata_copy["file_type_display"] = "Video"
                    elif filename.endswith(".pdf"):
                        metadata_copy["file_type_display"] = "PDF Document"
                    else:
                        metadata_copy["file_type_display"] = "Media File"
                else:
                    metadata_copy["file_type_display"] = "Document"
                
                files.append(metadata_copy)
        
        return files
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a secure file.
        
        Args:
            file_id: The ID of the file to delete
            
        Returns:
            True if the file was deleted, False if it doesn't exist
        """
        return self._delete_file(file_id)
    
    def _delete_file(self, file_id: str) -> bool:
        """Internal method to delete a file and its metadata.
        
        Args:
            file_id: The ID of the file to delete
            
        Returns:
            True if the file was deleted, False if it doesn't exist
        """
        metadata_path = self.metadata_directory / f"{file_id}.json"
        
        if not metadata_path.exists():
            return False
        
        # Get filename for logging
        try:
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
                filename = metadata.get("filename", "unknown")
        except:
            filename = "unknown"
        
        # Delete the metadata file
        metadata_path.unlink()
        
        self.logger.info(f"Deleted file: {file_id} ({filename})")
        return True
        
    def _secure_delete_file(self, file_id: str, blacklist: bool = True) -> bool:
        """Securely delete a file and its metadata to prevent recovery.
        
        This method uses secure deletion techniques to permanently remove the file
        from the device, making it unrecoverable even with specialized recovery tools.
        It also adds the file's content hash to a blacklist to prevent reimporting.
        
        Args:
            file_id: The ID of the file to delete
            blacklist: Whether to add the file to the blacklist (default: True)
            
        Returns:
            True if the file was deleted, False if it doesn't exist
        """
        from ..security.secure_delete import SecureDelete
        
        # Validate file_id
        if not file_id or not isinstance(file_id, str):
            self.logger.error(f"Invalid file_id provided: {type(file_id)}")
            return False
            
        metadata_path = self.metadata_directory / f"{file_id}.json"
        
        if not metadata_path.exists():
            return False
        
        # Default filename in case we can't read it from metadata
        filename = "unknown"
        
        # Get filename for logging and check for any file paths
        try:
            with open(metadata_path, "r") as f:
                try:
                    metadata = json.load(f)
                    filename = metadata.get("filename", "unknown")
                    
                    # If blacklisting is enabled, add file information to blacklist
                    # Handle this in a separate try block to prevent it from affecting the rest of the deletion
                    if blacklist:
                        try:
                            self._add_to_blacklist(metadata)
                        except Exception as blacklist_error:
                            self.logger.error(f"Error adding file to blacklist: {str(blacklist_error)}")
                            # Continue with deletion even if blacklisting fails
                    
                    # Process associated files in separate try blocks to ensure one failure doesn't stop others
                    
                    # If there's an actual file stored on disk (for BAR files), delete it too
                    if "file_path" in metadata:
                        try:
                            file_path = Path(metadata["file_path"])
                            if file_path.exists() and file_path.is_file():
                                # Initialize secure delete
                                secure_delete = SecureDelete(self.logger)
                                # Securely delete the actual file
                                secure_delete.secure_delete_file(str(file_path))
                                self.logger.info(f"Securely deleted actual file at: {file_path}")
                        except Exception as file_error:
                            self.logger.error(f"Error deleting associated file: {str(file_error)}")
                    
                    # Check for any exported files that might be associated with this file_id
                    try:
                        export_dir = self.base_directory / "exports"
                        if export_dir.exists() and export_dir.is_dir():
                            for export_file in export_dir.glob(f"*{file_id}*"):
                                if export_file.exists() and export_file.is_file():
                                    secure_delete = SecureDelete(self.logger)
                                    secure_delete.secure_delete_file(str(export_file))
                                    self.logger.info(f"Securely deleted exported file: {export_file}")
                    except Exception as export_error:
                        self.logger.error(f"Error deleting exported files: {str(export_error)}")
                    
                    # Check for any temporary files that might be associated with this file_id
                    try:
                        temp_dir = self.base_directory / "temp"
                        if temp_dir.exists() and temp_dir.is_dir():
                            for temp_file in temp_dir.glob(f"*{file_id}*"):
                                if temp_file.exists() and temp_file.is_file():
                                    secure_delete = SecureDelete(self.logger)
                                    secure_delete.secure_delete_file(str(temp_file))
                                    self.logger.info(f"Securely deleted temporary file: {temp_file}")
                    except Exception as temp_error:
                        self.logger.error(f"Error deleting temporary files: {str(temp_error)}")
                    
                    # Check for any portable files that might be associated with this file_id
                    try:
                        portable_dir = self.base_directory / "portable"
                        if portable_dir.exists() and portable_dir.is_dir():
                            for portable_file in portable_dir.glob(f"*{file_id}*"):
                                if portable_file.exists() and portable_file.is_file():
                                    secure_delete = SecureDelete(self.logger)
                                    secure_delete.secure_delete_file(str(portable_file))
                                    self.logger.info(f"Securely deleted portable file: {portable_file}")
                    except Exception as portable_error:
                        self.logger.error(f"Error deleting portable files: {str(portable_error)}")
                    
                    # Search for and delete any .bar files with matching content hash across the system
                    # Do this in a separate thread to prevent blocking and potential crashes
                    if "content_hash" in metadata:
                        content_hash = metadata.get("content_hash")
                        if content_hash:
                            try:
                                # Use a thread with a timeout to prevent hanging
                                search_thread = threading.Thread(
                                    target=self._find_and_delete_matching_bar_files,
                                    args=(content_hash,),
                                    daemon=True
                                )
                                search_thread.start()
                                # Don't wait for completion - let it run in background
                            except Exception as thread_error:
                                self.logger.error(f"Error starting search thread: {str(thread_error)}")
                except json.JSONDecodeError as json_error:
                    self.logger.error(f"Error parsing metadata JSON: {str(json_error)}")
        except Exception as e:
            self.logger.error(f"Error reading metadata during secure deletion: {str(e)}")
        
        # Initialize secure delete
        secure_delete = SecureDelete(self.logger)
        
        # Securely delete the metadata file
        try:
            secure_delete.secure_delete_file(str(metadata_path))
        except Exception as delete_error:
            self.logger.error(f"Error securely deleting metadata file: {str(delete_error)}")
            # Try regular deletion as fallback
            try:
                os.remove(str(metadata_path))
                self.logger.warning(f"Fell back to regular deletion for metadata file: {metadata_path}")
            except Exception as fallback_error:
                self.logger.error(f"Failed to delete metadata file even with fallback: {str(fallback_error)}")
        
        self.logger.info(f"Securely deleted file: {file_id} ({filename})")
        return True
    
    def export_file(self, file_id: str, export_path: str) -> bool:
        """Export a secure file for sharing.
        
        Args:
            file_id: The ID of the file to export
            export_path: The path where the exported file should be saved
            
        Returns:
            True if the file was exported successfully, False otherwise
            
        Raises:
            ValueError: If the file is marked as view-only and cannot be exported
        """
        metadata_path = self.metadata_directory / f"{file_id}.json"
        
        if not metadata_path.exists():
            return False
        
        # Load metadata to check export restrictions
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Check if export is disabled for this file
        if metadata.get("security", {}).get("disable_export", False):
            self.logger.warning(f"Attempted to export view-only file: {file_id}")
            raise ValueError("This file has been marked as view-only and cannot be exported")
        
        # Copy the metadata file to the export location
        try:
            shutil.copy(metadata_path, export_path)
            self.logger.info(f"Exported file: {file_id} to {export_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to export file {file_id}: {str(e)}")
            return False
            
    def export_portable_file(self, file_id: str, password: str, export_path: str) -> bool:
        """Export a secure file in a portable format that can be imported on another device.
        
        This creates a special file format that contains both the encrypted content and
        all necessary metadata to maintain security settings when transferred to another device.
        
        Args:
            file_id: The ID of the file to export
            password: The password to decrypt and verify the file
            export_path: The path where the exported file should be saved
            
        Returns:
            True if the file was exported successfully, False otherwise
            
        Raises:
            ValueError: If the password is incorrect or if the file is view-only
            FileNotFoundError: If the file doesn't exist
        """
        metadata_path = self.metadata_directory / f"{file_id}.json"
        
        if not metadata_path.exists():
            raise FileNotFoundError(f"File with ID {file_id} not found")
        
        # Load metadata
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Check if the file is marked as view-only before attempting decryption
        if metadata["security"].get("disable_export", False):
            self.logger.warning(f"Attempted to export view-only file: {file_id}")
            raise ValueError("This file has been marked as view-only and cannot be exported")
        
        # Verify password by attempting decryption
        try:
            file_content = self.encryption_manager.decrypt_file_content(
                metadata["encryption"], password)
        except ValueError:
            self.logger.warning(f"Failed decryption attempt during export for file: {file_id}")
            raise ValueError("Incorrect password")
        
        # Create portable file format
        portable_data = {
            "bar_portable_file": True,
            "version": "1.0",
            "filename": metadata["filename"],
            "creation_time": metadata["creation_time"],
            "file_type": metadata.get("file_type", "document"),  # Preserve file type information
            "security": metadata["security"],
            "encryption": metadata["encryption"],
            "content_hash": self._hash_content(file_content),
            "failed_password_attempts": metadata.get("failed_password_attempts", 0),
            "access_count": metadata.get("access_count", 0)  # Preserve access count when exporting
        }
        
        # Save the portable file
        try:
            with open(export_path, "w") as f:
                json.dump(portable_data, f, indent=2)
            
            self.logger.info(f"Exported portable file: {file_id} to {export_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to export portable file {file_id}: {str(e)}")
            raise ValueError(f"Failed to export file: {str(e)}")
    
    def import_portable_file(self, import_path: str, password: str) -> str:
        """Import a portable secure file.
        
        Args:
            import_path: The path of the portable file to import
            password: The password to decrypt the file
            
        Returns:
            The ID of the imported file
            
        Raises:
            ValueError: If the file is not a valid BAR portable file or password is incorrect
        """
        try:
            # Load and validate the file
            with open(import_path, "r") as f:
                portable_data = json.load(f)
            
            # Check if it's a valid BAR portable file
            if not portable_data.get("bar_portable_file"):
                raise ValueError("Not a valid BAR portable file")
            
            # Check if the file is in the blacklist
            content_hash = portable_data.get("content_hash")
            if content_hash and self._is_blacklisted(content_hash):
                raise ValueError("This file has been permanently deleted due to security violations and cannot be reimported")
            
            # Check if the encryption data contains hardware binding
            encryption_data = portable_data.get("encryption", {})
            hardware_bound = False
            
            # Check if we need to handle hardware binding
            if "hardware_id_hash" in encryption_data:
                hardware_bound = True
                # Store the original hardware ID hash
                original_hw_hash = encryption_data.get("hardware_id_hash")
                
                # Temporarily remove hardware binding for decryption
                encryption_data_copy = encryption_data.copy()
                if "hardware_id_hash" in encryption_data_copy:
                    del encryption_data_copy["hardware_id_hash"]
                    encryption_data_copy["hardware_bound"] = False
                
                # Try to decrypt with modified encryption data first
                try:
                    file_content = self.encryption_manager.decrypt_file_content(
                        encryption_data_copy, password)
                    # If successful, use the modified encryption data without hardware binding
                    portable_data["encryption"] = encryption_data_copy
                    self.logger.info(f"Successfully decrypted file from different device by bypassing hardware binding")
                except ValueError:
                    # If that fails, try with original encryption data
                    try:
                        file_content = self.encryption_manager.decrypt_file_content(
                            encryption_data, password)
                    except ValueError:
                        raise ValueError("Incorrect password or incompatible hardware binding")
            else:
                # No hardware binding, proceed normally
                try:
                    file_content = self.encryption_manager.decrypt_file_content(
                        encryption_data, password)
                except ValueError:
                    raise ValueError("Incorrect password")
            
            # Generate a new file ID
            file_id = self._generate_file_id()
            
            # Create metadata
            metadata = {
                "file_id": file_id,
                "filename": portable_data["filename"],
                "creation_time": portable_data["creation_time"],
                "last_accessed": datetime.now().isoformat(),
                # Preserve access count from the exported file instead of resetting to 0
                "access_count": portable_data.get("access_count", 0),
                # Preserve file type information
                "file_type": portable_data.get("file_type", "document"),
                "security": portable_data["security"],
                "encryption": portable_data["encryption"],
                "content_hash": content_hash or self._hash_content(file_content),
                # Preserve the failed password attempts counter from the exported file
                "failed_password_attempts": portable_data.get("failed_password_attempts", 0)
            }
            
            # Log if this is a view-only file
            if metadata["security"].get("disable_export", False):
                self.logger.info(f"Imported view-only file: {file_id} ({metadata['filename']})")
            
            # Save the metadata file
            metadata_path = self.metadata_directory / f"{file_id}.json"
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
            
            if hardware_bound:
                self.logger.info(f"Imported portable file from different device: {file_id} ({metadata['filename']})")
            else:
                self.logger.info(f"Imported portable file: {file_id} ({metadata['filename']})")
            return file_id
            
        except Exception as e:
            self.logger.error(f"Failed to import portable file: {str(e)}")
            raise ValueError(f"Failed to import file: {str(e)}")
    
    def _hash_content(self, content: bytes) -> str:
        """Create a hash of file content for integrity verification.
        
        Args:
            content: The file content to hash
            
        Returns:
            Base64-encoded hash of the content
        """
        digest = hashes.Hash(hashes.SHA256())
        digest.update(content)
        content_hash = digest.finalize()
        return base64.b64encode(content_hash).decode('utf-8')
    
    def import_file(self, import_path: str) -> str:
        """Import a secure file.
        
        Args:
            import_path: The path of the file to import
            
        Returns:
            The ID of the imported file
            
        Raises:
            ValueError: If the file is not a valid BAR file
        """
        try:
            # Load and validate the file
            with open(import_path, "r") as f:
                metadata = json.load(f)
            
            # Check if it's a valid BAR file
            if "file_id" not in metadata or "encryption" not in metadata:
                raise ValueError("Not a valid BAR file")
            
            file_id = metadata["file_id"]
            
            # Check if a file with this ID already exists
            target_path = self.metadata_directory / f"{file_id}.json"
            if target_path.exists():
                # Generate a new file ID
                old_file_id = file_id
                file_id = self._generate_file_id()
                metadata["file_id"] = file_id
                target_path = self.metadata_directory / f"{file_id}.json"
                self.logger.info(f"Renamed imported file from {old_file_id} to {file_id}")
            
            # Save the metadata file
            with open(target_path, "w") as f:
                json.dump(metadata, f, indent=2)
            
            self.logger.info(f"Imported file: {file_id} ({metadata.get('filename', 'unknown')})")
            return file_id
            
        except Exception as e:
            self.logger.error(f"Failed to import file: {str(e)}")
            raise ValueError(f"Failed to import file: {str(e)}")
    
    def update_security_settings(self, file_id: str, security_settings: Dict[str, Any]) -> bool:
        """Update the security settings for a file.
        
        Args:
            file_id: The ID of the file to update
            security_settings: Dictionary containing security parameters to update
                
        Returns:
            True if the settings were updated, False if the file doesn't exist
        """
        metadata_path = self.metadata_directory / f"{file_id}.json"
        
        if not metadata_path.exists():
            return False
        
        # Load metadata
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Update security settings
        for key, value in security_settings.items():
            if key in metadata["security"]:
                metadata["security"][key] = value
        
        # Save updated metadata
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        self.logger.info(f"Updated security settings for file: {file_id}")
        return True
    
    def _check_security_constraints(self, metadata: Dict[str, Any]) -> bool:
        """Check if a file meets its security constraints.
        
        Args:
            metadata: The file metadata
            
        Returns:
            True if the file can be accessed, False if it should be deleted
        """
        current_time = datetime.now()
        
        # Check expiration time
        if metadata["security"]["expiration_time"]:
            expiration_time = datetime.fromisoformat(metadata["security"]["expiration_time"])
            if current_time > expiration_time:
                self.logger.info(f"File {metadata['file_id']} has expired")
                return False
        
        # Check max access count
        if metadata["security"]["max_access_count"] and \
           metadata["access_count"] >= metadata["security"]["max_access_count"]:
            self.logger.info(f"File {metadata['file_id']} has reached max access count")
            return False
        
        # Check deadman switch
        if metadata["security"]["deadman_switch"]:
            last_accessed = datetime.fromisoformat(metadata["last_accessed"])
            inactive_days = (current_time - last_accessed).days
            
            if inactive_days > metadata["security"]["deadman_switch"]:
                self.logger.info(f"File {metadata['file_id']} triggered deadman switch")
                return False
        
        return True
    
    def _monitor_files(self):
        """Monitor files for security constraints and trigger self-destruction."""
        while self.monitoring_active:
            try:
                # Get all file metadata
                for metadata_file in self.metadata_directory.glob("*.json"):
                    try:
                        with open(metadata_file, "r") as f:
                            metadata = json.load(f)
                        
                        # Check security constraints
                        if not self._check_security_constraints(metadata):
                            file_id = metadata["file_id"]
                            self._secure_delete_file(file_id)
                    except Exception as e:
                        self.logger.error(f"Error monitoring file {metadata_file}: {str(e)}")
                
                # Sleep for a while before checking again
                time.sleep(60)  # Check every minute
            except Exception as e:
                self.logger.error(f"Error in file monitoring thread: {str(e)}")
                time.sleep(60)  # Sleep and try again
    
    def _generate_file_id(self) -> str:
        """Generate a unique file ID.
        
        Returns:
            A unique file ID
        """
        import uuid
        return str(uuid.uuid4())
    
    def shutdown(self):
        """Shutdown the file manager and stop monitoring."""
        self.monitoring_active = False
        if self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2)
        
        # Stop any ongoing scans
        if hasattr(self, 'file_scanner') and self.file_scanner.scan_in_progress:
            self.file_scanner.stop_scan()
            
        self.logger.info("File manager shutdown")
    
    def scan_device_for_bar_files(self, device_path: str, recursive: bool = True, callback=None) -> Dict[str, Any]:
        """Scan a device for .bar files.
        
        Args:
            device_path: The path to the device or directory to scan
            recursive: Whether to scan subdirectories recursively
            callback: Optional callback function to report progress
            
        Returns:
            Dictionary containing scan results
        """
        self.logger.info(f"Starting scan for .bar files at {device_path}")
        return self.file_scanner.scan_device(device_path, recursive, callback)
    
    def get_scan_progress(self) -> Dict[str, Any]:
        """Get the current scan progress.
        
        Returns:
            Dictionary with scan progress information
        """
        return self.file_scanner.get_scan_progress()
    
    def get_scan_results(self) -> Dict[str, Any]:
        """Get the results of the last scan.
        
        Returns:
            Dictionary with scan results
        """
        return self.file_scanner.get_scan_results()
    
    def stop_scan(self) -> Dict[str, Any]:
        """Stop an ongoing scan.
        
        Returns:
            Dictionary with status information
        """
        self.logger.info("Stopping file scan")
        return self.file_scanner.stop_scan()
    
    def import_found_bar_file(self, file_path: str, password: str) -> Dict[str, Any]:
        """Import a found .bar file into the system.
        
        Args:
            file_path: Path to the .bar file to import
            password: Password to decrypt the file
            
        Returns:
            Dictionary with import results
        """
        self.logger.info(f"Importing found .bar file: {file_path}")
        return self.file_scanner.import_found_file(file_path, password)
    
    def scan_all_devices(self, callback=None) -> Dict[str, Any]:
        """Scan all connected devices for .bar files.
        
        Args:
            callback: Optional callback function to report progress
            
        Returns:
            Dictionary containing scan results
        """
        self.logger.info("Starting scan for .bar files on all connected devices")
        return self.file_scanner.scan_removable_devices(callback)
    
    def get_available_devices(self) -> List[Dict[str, Any]]:
        """Get a list of available devices that can be scanned.
        
        Returns:
            List of dictionaries containing device information
        """
        return self.file_scanner.get_available_devices()

    def _add_to_blacklist(self, metadata: Dict[str, Any]) -> bool:
        """Add a file's content hash to the blacklist to prevent reimporting.
        
        Args:
            metadata: The file metadata containing content hash and other information
            
        Returns:
            True if the file was added to the blacklist, False otherwise
        """
        try:
            # Extract content hash and other relevant information
            content_hash = metadata.get("content_hash")
            
            # Safely handle encryption data if content_hash is not available
            if not content_hash and "encryption" in metadata:
                try:
                    # If content hash is not available but we have the encrypted content,
                    # we can still create a hash of the encrypted data
                    encryption_data = metadata.get("encryption", {})
                    
                    # Handle different types of encryption data
                    if isinstance(encryption_data, dict):
                        content_str = json.dumps(encryption_data, sort_keys=True)
                    elif isinstance(encryption_data, str):
                        content_str = encryption_data
                    else:
                        content_str = str(encryption_data)
                        
                    content_hash = hashlib.sha256(content_str.encode('utf-8')).hexdigest()
                except Exception as hash_error:
                    self.logger.warning(f"Failed to create hash from encryption data: {str(hash_error)}")
                    # Generate a fallback hash using file_id and timestamp to ensure uniqueness
                    fallback_str = f"{metadata.get('file_id', 'unknown')}_{datetime.now().isoformat()}"
                    content_hash = hashlib.sha256(fallback_str.encode('utf-8')).hexdigest()
            
            if not content_hash:
                self.logger.warning("Cannot add file to blacklist: no content hash available")
                return False
            
            # Ensure the blacklist directory exists
            self.blacklist_directory.mkdir(parents=True, exist_ok=True)
            
            # Create blacklist entry
            blacklist_entry = {
                "content_hash": content_hash,
                "filename": metadata.get("filename", "unknown"),
                "file_id": metadata.get("file_id", "unknown"),
                "blacklisted_at": datetime.now().isoformat(),
                "reason": "security_violation",  # Default reason
                "original_creation_time": metadata.get("creation_time")
            }
            
            # Create a safe filename for the blacklist entry
            # Replace any potentially problematic characters with underscores
            safe_hash = re.sub(r'[^a-zA-Z0-9_-]', '_', content_hash)
            
            # Save to blacklist file
            blacklist_path = self.blacklist_directory / f"{safe_hash}.json"
            with open(blacklist_path, "w") as f:
                json.dump(blacklist_entry, f, indent=2)
            
            self.logger.info(f"Added file to blacklist: {metadata.get('filename', 'unknown')} (hash: {content_hash[:8] if len(content_hash) >= 8 else content_hash}...)")
            return True
            
        except Exception as e:
            self.logger.error(f"Error adding file to blacklist: {str(e)}")
            # Don't let blacklist errors crash the application
            return False
    
    def _is_blacklisted(self, content_hash: str) -> bool:
        """Check if a file's content hash is in the blacklist.
        
        Args:
            content_hash: The content hash to check
            
        Returns:
            True if the file is blacklisted, False otherwise
        """
        try:
            # Create a safe filename for the blacklist entry
            # Replace any potentially problematic characters with underscores
            safe_hash = re.sub(r'[^a-zA-Z0-9_-]', '_', content_hash)
            
            # Check if the hash exists in the blacklist directory
            blacklist_path = self.blacklist_directory / f"{safe_hash}.json"
            return blacklist_path.exists()
        except Exception as e:
            self.logger.error(f"Error checking blacklist: {str(e)}")
            return False
    
    def _find_and_delete_matching_bar_files(self, content_hash: str) -> int:
        """Find and securely delete any .bar files with matching content hash across the system.
        
        This helps ensure that when a file is deleted due to security violations,
        all copies of it are removed from the device.
        
        Args:
            content_hash: The content hash to search for
            
        Returns:
            Number of matching files deleted
        """
        try:
            # Validate content_hash to prevent crashes
            if not content_hash or not isinstance(content_hash, str):
                self.logger.warning(f"Invalid content hash provided: {type(content_hash)}")
                return 0
                
            from ..security.secure_delete import SecureDelete
            secure_delete = SecureDelete(self.logger)
            deleted_count = 0
            
            # Get all available devices - handle potential errors
            try:
                devices = self.file_scanner.get_available_devices()
            except Exception as dev_error:
                self.logger.error(f"Error getting available devices: {str(dev_error)}")
                return 0
            
            # Limit search to prevent excessive resource usage
            max_search_time = 60  # seconds
            start_time = time.time()
            
            for device in devices:
                # Check if we've exceeded the maximum search time
                if time.time() - start_time > max_search_time:
                    self.logger.warning("Maximum search time exceeded, stopping search")
                    break
                    
                device_path = device.get("path")
                if not device_path:
                    continue
                    
                # Skip network drives and CD-ROMs for performance and permission reasons
                if device.get("type") in ["Network", "CD-ROM"]:
                    continue
                
                try:
                    # Search for .bar files in common directories
                    search_dirs = [
                        Path(device_path) / "Users",  # Windows user directories
                        Path(device_path) / "Documents",  # Common document location
                        Path(device_path) / "Downloads",  # Common download location
                    ]
                    
                    for search_dir in search_dirs:
                        if not search_dir.exists() or not search_dir.is_dir():
                            continue
                            
                        # Search for .bar files with a timeout check
                        try:
                            for bar_file in search_dir.rglob("*.bar"):
                                # Check timeout periodically
                                if time.time() - start_time > max_search_time:
                                    self.logger.warning("Maximum search time exceeded during directory scan")
                                    break
                                    
                                try:
                                    # Check if this .bar file contains the matching content hash
                                    with open(bar_file, "r") as f:
                                        try:
                                            data = json.load(f)
                                            file_hash = data.get("content_hash")
                                            
                                            if file_hash and file_hash == content_hash:
                                                # Found a match, securely delete it
                                                if secure_delete.secure_delete_file(str(bar_file)):
                                                    self.logger.info(f"Deleted matching .bar file: {bar_file}")
                                                    deleted_count += 1
                                        except (json.JSONDecodeError, UnicodeDecodeError):
                                            # Not a valid JSON file, skip
                                            pass
                                except (PermissionError, OSError, FileNotFoundError):
                                    # Can't access file, skip
                                    pass
                        except Exception as rglob_error:
                            self.logger.warning(f"Error during directory scan of {search_dir}: {str(rglob_error)}")
                            continue
                except Exception as e:
                    self.logger.warning(f"Error searching device {device_path}: {str(e)}")
            
            if deleted_count > 0:
                hash_prefix = content_hash[:8] if len(content_hash) >= 8 else content_hash
                self.logger.info(f"Deleted {deleted_count} matching .bar files with content hash {hash_prefix}...")
            
            return deleted_count
        except Exception as e:
            self.logger.error(f"Error finding and deleting matching files: {str(e)}")
            # Don't let file search errors crash the application
            return 0
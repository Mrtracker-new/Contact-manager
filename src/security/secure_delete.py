import os
import random
import logging
from pathlib import Path
from typing import Optional


class SecureDelete:
    """Provides secure file deletion capabilities to prevent recovery of deleted files."""
    
    # Constants for secure deletion
    DEFAULT_PASSES = 3  # Number of overwrite passes
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """Initialize the secure deletion manager.
        
        Args:
            logger: Optional logger instance
        """
        self.logger = logger or logging.getLogger("SecureDelete")
    
    def secure_delete_file(self, file_path: str, passes: int = DEFAULT_PASSES) -> bool:
        """Securely delete a file by overwriting its contents multiple times before deletion.
        
        Args:
            file_path: Path to the file to delete
            passes: Number of overwrite passes (default: 3)
            
        Returns:
            True if deletion was successful, False otherwise
        """
        path = Path(file_path)
        
        if not path.exists() or not path.is_file():
            self.logger.warning(f"File not found: {file_path}")
            return False
        
        try:
            # Get file size
            file_size = path.stat().st_size
            
            # Open file for binary writing
            with open(file_path, "r+b") as f:
                # Multiple overwrite passes
                for pass_num in range(passes):
                    # Seek to beginning of file
                    f.seek(0)
                    
                    # Overwrite with different patterns based on pass number
                    if pass_num == 0:
                        # First pass: all zeros
                        pattern = bytes([0x00] * 4096)  # 4KB chunks
                    elif pass_num == 1:
                        # Second pass: all ones
                        pattern = bytes([0xFF] * 4096)  # 4KB chunks
                    else:
                        # Subsequent passes: random data
                        pattern = os.urandom(4096)  # 4KB chunks of random data
                    
                    # Write pattern in chunks
                    bytes_written = 0
                    while bytes_written < file_size:
                        chunk_size = min(4096, file_size - bytes_written)
                        f.write(pattern[:chunk_size])
                        bytes_written += chunk_size
                    
                    # Flush to disk
                    f.flush()
                    os.fsync(f.fileno())
                
                # Final pass: truncate file to 0 bytes
                f.truncate(0)
                f.flush()
                os.fsync(f.fileno())
            
            # Delete the file
            os.remove(file_path)
            self.logger.info(f"Securely deleted file: {file_path} with {passes} passes")
            return True
            
        except Exception as e:
            self.logger.error(f"Error during secure deletion of {file_path}: {str(e)}")
            return False
    
    def secure_delete_directory(self, dir_path: str, passes: int = DEFAULT_PASSES) -> bool:
        """Securely delete all files in a directory and its subdirectories.
        
        Args:
            dir_path: Path to the directory to delete
            passes: Number of overwrite passes (default: 3)
            
        Returns:
            True if deletion was successful, False otherwise
        """
        path = Path(dir_path)
        
        if not path.exists() or not path.is_dir():
            self.logger.warning(f"Directory not found: {dir_path}")
            return False
        
        try:
            # Delete files first
            for file_path in path.rglob("*"):
                if file_path.is_file():
                    self.secure_delete_file(str(file_path), passes)
            
            # Then remove empty directories
            for dirpath, dirnames, filenames in os.walk(dir_path, topdown=False):
                for dirname in dirnames:
                    full_path = os.path.join(dirpath, dirname)
                    try:
                        os.rmdir(full_path)
                    except OSError:
                        pass  # Directory not empty, will be handled in next iteration
            
            # Finally remove the root directory
            try:
                os.rmdir(dir_path)
            except OSError as e:
                self.logger.warning(f"Could not remove directory {dir_path}: {str(e)}")
                return False
            
            self.logger.info(f"Securely deleted directory: {dir_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error during secure deletion of directory {dir_path}: {str(e)}")
            return False
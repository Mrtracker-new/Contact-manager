import os
import json
import logging
import base64
import platform
import re
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import threading
import ctypes

class FileScanner:
    """Scans devices for .bar files and validates them."""
    
    # Constants for file validation
    BAR_FILE_EXTENSION = ".bar"
    BAR_FILE_SIGNATURE = "bar_portable_file"
    BAR_FILE_MIN_SIZE = 50  # Minimum size in bytes for a valid .bar file
    BAR_FILE_VERSION_PATTERN = r'^\d+\.\d+$'  # Pattern for valid version numbers (e.g., 1.0)
    
    def __init__(self, file_manager):
        """Initialize the file scanner.
        
        Args:
            file_manager: The FileManager instance to use for file operations
        """
        self.file_manager = file_manager
        self.logger = logging.getLogger("FileScanner")
        self.scan_in_progress = False
        self.scan_results = {}
        self.scan_progress = {"total_files": 0, "processed_files": 0, "found_bar_files": 0, "invalid_bar_files": 0}
        self.scan_thread = None
        self.last_device_scan = None
    
    def get_available_devices(self) -> List[Dict[str, Any]]:
        """Get a list of available devices that can be scanned.
        
        Returns:
            List of dictionaries containing device information
        """
        devices = []
        
        # Windows-specific implementation
        if platform.system() == "Windows":
            # Get all drive letters
            bitmask = ctypes.windll.kernel32.GetLogicalDrives()
            for letter in range(65, 91):  # A-Z
                if bitmask & (1 << (letter - 65)):
                    drive_letter = chr(letter) + ":\\"
                    try:
                        drive_type = ctypes.windll.kernel32.GetDriveTypeW(drive_letter)
                        # 2: Removable drive, 3: Fixed drive, 4: Network drive, 5: CD-ROM, 6: RAM disk
                        drive_type_name = {
                            2: "Removable",
                            3: "Fixed",
                            4: "Network",
                            5: "CD-ROM",
                            6: "RAM Disk"
                        }.get(drive_type, "Unknown")
                        
                        # Get volume information
                        volume_name_buffer = ctypes.create_unicode_buffer(1024)
                        filesystem_buffer = ctypes.create_unicode_buffer(1024)
                        serial_number = ctypes.c_ulong(0)
                        
                        result = ctypes.windll.kernel32.GetVolumeInformationW(
                            drive_letter,
                            volume_name_buffer,
                            ctypes.sizeof(volume_name_buffer),
                            ctypes.byref(serial_number),
                            None,
                            None,
                            filesystem_buffer,
                            ctypes.sizeof(filesystem_buffer)
                        )
                        
                        volume_name = volume_name_buffer.value if result else ""
                        filesystem = filesystem_buffer.value if result else ""
                        
                        # Get free space
                        free_bytes = ctypes.c_ulonglong(0)
                        total_bytes = ctypes.c_ulonglong(0)
                        total_free_bytes = ctypes.c_ulonglong(0)
                        
                        result = ctypes.windll.kernel32.GetDiskFreeSpaceExW(
                            drive_letter,
                            ctypes.byref(free_bytes),
                            ctypes.byref(total_bytes),
                            ctypes.byref(total_free_bytes)
                        )
                        
                        # Add device to list
                        devices.append({
                            "path": drive_letter,
                            "type": drive_type_name,
                            "name": volume_name or f"Drive {drive_letter[0]}",
                            "filesystem": filesystem,
                            "total_space": total_bytes.value if result else 0,
                            "free_space": free_bytes.value if result else 0,
                            "is_removable": drive_type == 2
                        })
                    except Exception as e:
                        self.logger.warning(f"Error getting info for drive {drive_letter}: {str(e)}")
        else:
            # Basic implementation for non-Windows systems
            # Just add the root directory and common mount points
            devices.append({"path": "/", "type": "Fixed", "name": "Root", "is_removable": False})
            
            # Check common mount points for removable devices
            for mount_point in ["/media", "/mnt"]:
                if os.path.exists(mount_point):
                    try:
                        for item in os.listdir(mount_point):
                            full_path = os.path.join(mount_point, item)
                            if os.path.ismount(full_path):
                                devices.append({
                                    "path": full_path,
                                    "type": "Removable",
                                    "name": item,
                                    "is_removable": True
                                })
                    except Exception as e:
                        self.logger.warning(f"Error checking mount point {mount_point}: {str(e)}")
        
        self.last_device_scan = datetime.now().isoformat()
        return devices
    
    def scan_device(self, root_path: str, recursive: bool = True, callback=None) -> Dict[str, Any]:
        """Scan a device for .bar files.
        
        Args:
            root_path: The root path to start scanning from
            recursive: Whether to scan subdirectories recursively
            callback: Optional callback function to report progress
            
        Returns:
            Dictionary containing scan results
        """
        if self.scan_in_progress:
            return {"status": "error", "message": "A scan is already in progress"}
        
        # Validate the path exists
        if not os.path.exists(root_path):
            return {"status": "error", "message": f"Path does not exist: {root_path}"}
        
        # Reset scan progress
        self.scan_progress = {"total_files": 0, "processed_files": 0, "found_bar_files": 0, "invalid_bar_files": 0}
        self.scan_results = {
            "status": "in_progress", 
            "files": [], 
            "start_time": datetime.now().isoformat(),
            "root_path": root_path,
            "recursive": recursive
        }
        self.scan_in_progress = True
        
        # Start scan in a separate thread
        self.scan_thread = threading.Thread(
            target=self._scan_thread, 
            args=(root_path, recursive, callback),
            daemon=True
        )
        self.scan_thread.start()
        
        return {"status": "started", "message": f"Scan started at {root_path}"}
    
    def _scan_thread(self, root_path: str, recursive: bool, callback):
        """Thread function to perform the actual scan.
        
        Args:
            root_path: The root path to start scanning from
            recursive: Whether to scan subdirectories recursively
            callback: Optional callback function to report progress
        """
        try:
            root = Path(root_path)
            if not root.exists():
                self.scan_results = {"status": "error", "message": f"Path does not exist: {root_path}"}
                self.scan_in_progress = False
                if callback:
                    callback(self.scan_results)
                return
            
            # Get device info if available
            device_info = None
            for device in self.get_available_devices():
                if root_path.startswith(device["path"]):
                    device_info = device
                    break
            
            if device_info:
                self.scan_results["device_info"] = device_info
            
            # Count total files for progress reporting
            self._count_total_files(root, recursive)
            
            # Perform the scan
            scan_start_time = time.time()
            self._scan_directory(root, recursive, callback)
            scan_duration = time.time() - scan_start_time
            
            # Update final results
            self.scan_results["status"] = "completed"
            self.scan_results["end_time"] = datetime.now().isoformat()
            self.scan_results["duration_seconds"] = round(scan_duration, 2)
            self.scan_results["stats"] = {
                "total_files_scanned": self.scan_progress["processed_files"],
                "bar_files_found": self.scan_progress["found_bar_files"],
                "invalid_bar_files": self.scan_progress["invalid_bar_files"],
                "scan_speed_files_per_second": round(self.scan_progress["processed_files"] / max(scan_duration, 0.1), 2)
            }
            
            # Group files by integrity score
            if self.scan_results["files"]:
                integrity_groups = {}
                for file_info in self.scan_results["files"]:
                    score = file_info.get("integrity_score", 0)
                    score_range = f"{(score // 10) * 10}-{((score // 10) * 10) + 9}"
                    if score_range not in integrity_groups:
                        integrity_groups[score_range] = 0
                    integrity_groups[score_range] += 1
                
                self.scan_results["integrity_distribution"] = integrity_groups
            
            self.logger.info(f"Scan completed: found {self.scan_progress['found_bar_files']} .bar files in {scan_duration:.2f} seconds")
        except Exception as e:
            self.scan_results = {"status": "error", "message": f"Scan error: {str(e)}"}
            self.logger.error(f"Error during file scan: {str(e)}")
        finally:
            self.scan_in_progress = False
            if callback:
                callback(self.scan_results)
    
    def _count_total_files(self, directory: Path, recursive: bool):
        """Count total files to scan for progress reporting.
        
        Args:
            directory: The directory to count files in
            recursive: Whether to count files in subdirectories
        """
        try:
            for item in directory.iterdir():
                if item.is_file():
                    self.scan_progress["total_files"] += 1
                elif item.is_dir() and recursive:
                    self._count_total_files(item, recursive)
        except (PermissionError, OSError) as e:
            self.logger.warning(f"Could not access {directory}: {str(e)}")
    
    def _scan_directory(self, directory: Path, recursive: bool, callback):
        """Scan a directory for .bar files.
        
        Args:
            directory: The directory to scan
            recursive: Whether to scan subdirectories recursively
            callback: Optional callback function to report progress
        """
        try:
            for item in directory.iterdir():
                if item.is_file():
                    self.scan_progress["processed_files"] += 1
                    
                    # Check if it's a .bar file
                    if item.suffix.lower() == self.BAR_FILE_EXTENSION:
                        bar_info = self._validate_bar_file(item)
                        if bar_info:
                            self.scan_results["files"].append(bar_info)
                            self.scan_progress["found_bar_files"] += 1
                    
                    # Report progress periodically
                    if callback and self.scan_progress["processed_files"] % 100 == 0:
                        progress_data = {
                            "status": "in_progress",
                            "progress": self.scan_progress,
                            "files_found": len(self.scan_results["files"])
                        }
                        callback(progress_data)
                        
                elif item.is_dir() and recursive:
                    self._scan_directory(item, recursive, callback)
        except (PermissionError, OSError) as e:
            self.logger.warning(f"Could not access {directory}: {str(e)}")
    
    def _validate_bar_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Validate if a file is a valid .bar file and extract metadata.
        
        Args:
            file_path: Path to the file to validate
            
        Returns:
            Dictionary with file metadata if valid, None otherwise
        """
        try:
            # Check file size first (quick check)
            file_size = file_path.stat().st_size
            if file_size < self.BAR_FILE_MIN_SIZE:
                self.logger.debug(f"File too small to be a valid .bar file: {file_path} ({file_size} bytes)")
                return None
            
            # Try to open and parse as JSON
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        self.logger.debug(f"Invalid JSON format in file: {file_path}")
                        self.scan_progress["invalid_bar_files"] += 1
                        return None
                
                # Check for BAR file signature
                if not data.get(self.BAR_FILE_SIGNATURE, False):
                    self.logger.debug(f"Missing BAR file signature: {file_path}")
                    self.scan_progress["invalid_bar_files"] += 1
                    return None
                
                # Validate version format if present
                version = data.get("version", "unknown")
                if version != "unknown" and not re.match(self.BAR_FILE_VERSION_PATTERN, version):
                    self.logger.debug(f"Invalid version format in .bar file: {file_path} (version: {version})")
                    self.scan_progress["invalid_bar_files"] += 1
                    return None
                
                # Check for required fields
                required_fields = ["filename", "encryption"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.logger.debug(f"Missing required fields in .bar file: {file_path} (missing: {missing_fields})")
                    self.scan_progress["invalid_bar_files"] += 1
                    return None
                
                # Extract basic metadata
                metadata = {
                    "path": str(file_path),
                    "filename": data.get("filename", file_path.name),
                    "creation_time": data.get("creation_time", None),
                    "version": version,
                    "has_security": "security" in data,
                    "size": file_size,
                    "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                    "content_hash": data.get("content_hash", None)
                }
                
                # Add security info if available (without sensitive details)
                if "security" in data:
                    security = data["security"]
                    metadata["security_info"] = {
                        "has_expiration": security.get("expiration_time") is not None,
                        "has_access_limit": security.get("max_access_count") is not None,
                        "has_deadman_switch": security.get("deadman_switch") is not None
                    }
                    
                    # Check if file has expired
                    if security.get("expiration_time") is not None:
                        try:
                            expiration_time = datetime.fromisoformat(security["expiration_time"])
                            metadata["expired"] = datetime.now() > expiration_time
                            if metadata["expired"]:
                                metadata["expiration_status"] = "Expired"
                            else:
                                metadata["expiration_status"] = "Valid"
                        except (ValueError, TypeError):
                            metadata["expiration_status"] = "Unknown"
                
                # Calculate integrity score (0-100)
                integrity_score = 100
                
                # Deduct points for missing optional fields
                optional_fields = ["creation_time", "content_hash", "security"]
                for field in optional_fields:
                    if field not in data:
                        integrity_score -= 10
                
                # Deduct points for missing version
                if version == "unknown":
                    integrity_score -= 10
                
                metadata["integrity_score"] = max(0, integrity_score)
                
                return metadata
                
            except (UnicodeDecodeError, IOError, OSError) as e:
                self.logger.debug(f"Error reading file {file_path}: {str(e)}")
                self.scan_progress["invalid_bar_files"] += 1
                return None
                
        except (PermissionError, OSError, UnicodeDecodeError) as e:
            self.logger.warning(f"Could not access or read {file_path}: {str(e)}")
            self.scan_progress["invalid_bar_files"] += 1
            return None
    
    def get_scan_progress(self) -> Dict[str, Any]:
        """Get the current scan progress.
        
        Returns:
            Dictionary with scan progress information
        """
        if not self.scan_in_progress:
            return {"status": "not_running"}
        
        total = max(1, self.scan_progress["total_files"])  # Avoid division by zero
        percentage = (self.scan_progress["processed_files"] / total) * 100
        
        # Calculate estimated time remaining
        elapsed_time = 0
        estimated_remaining = 0
        if "start_time" in self.scan_results:
            start_time = datetime.fromisoformat(self.scan_results["start_time"])
            elapsed_time = (datetime.now() - start_time).total_seconds()
            
            if self.scan_progress["processed_files"] > 0 and percentage < 100:
                files_per_second = self.scan_progress["processed_files"] / max(elapsed_time, 0.1)
                remaining_files = total - self.scan_progress["processed_files"]
                estimated_remaining = remaining_files / max(files_per_second, 0.1)
        
        return {
            "status": "in_progress",
            "progress": self.scan_progress,
            "percentage": round(percentage, 2),
            "files_found": len(self.scan_results["files"]),
            "elapsed_seconds": round(elapsed_time, 1),
            "estimated_remaining_seconds": round(estimated_remaining, 1),
            "scan_speed_files_per_second": round(self.scan_progress["processed_files"] / max(elapsed_time, 0.1), 2)
        }
    
    def get_scan_results(self) -> Dict[str, Any]:
        """Get the results of the last scan.
        
        Returns:
            Dictionary with scan results
        """
        # Add a timestamp to the results
        results = self.scan_results.copy()
        results["retrieved_at"] = datetime.now().isoformat()
        return results
        
    def scan_removable_devices(self, callback=None) -> Dict[str, Any]:
        """Scan all removable devices for .bar files.
        
        Args:
            callback: Optional callback function to report progress
            
        Returns:
            Dictionary containing scan results
        """
        if self.scan_in_progress:
            return {"status": "error", "message": "A scan is already in progress"}
        
        # Get all removable devices
        devices = self.get_available_devices()
        removable_devices = [device for device in devices if device.get("is_removable", False)]
        
        if not removable_devices:
            return {"status": "error", "message": "No removable devices found"}
        
        # Reset scan progress
        self.scan_progress = {"total_files": 0, "processed_files": 0, "found_bar_files": 0, "invalid_bar_files": 0}
        self.scan_results = {
            "status": "in_progress", 
            "files": [], 
            "start_time": datetime.now().isoformat(),
            "devices": removable_devices
        }
        self.scan_in_progress = True
        
        # Start scan in a separate thread
        self.scan_thread = threading.Thread(
            target=self._scan_removable_devices_thread, 
            args=(removable_devices, callback),
            daemon=True
        )
        self.scan_thread.start()
        
        return {"status": "started", "message": f"Scan started on {len(removable_devices)} removable devices"}
    
    def _scan_removable_devices_thread(self, devices: List[Dict[str, Any]], callback):
        """Thread function to scan multiple removable devices.
        
        Args:
            devices: List of device information dictionaries
            callback: Optional callback function to report progress
        """
        try:
            scan_start_time = time.time()
            total_devices = len(devices)
            devices_scanned = 0
            
            for device in devices:
                if not self.scan_in_progress:
                    # Scan was stopped by user
                    break
                
                device_path = device["path"]
                self.logger.info(f"Scanning removable device: {device['name']} ({device_path})")
                
                # Count files on this device
                try:
                    root = Path(device_path)
                    self._count_total_files(root, True)
                except Exception as e:
                    self.logger.warning(f"Error counting files on device {device_path}: {str(e)}")
                    continue
                
                # Scan the device
                try:
                    self._scan_directory(root, True, callback)
                except Exception as e:
                    self.logger.warning(f"Error scanning device {device_path}: {str(e)}")
                
                devices_scanned += 1
                
                # Update progress if callback provided
                if callback:
                    progress_data = {
                        "status": "in_progress",
                        "progress": self.scan_progress,
                        "devices": {
                            "total": total_devices,
                            "scanned": devices_scanned
                        },
                        "current_device": device["name"]
                    }
                    callback(progress_data)
            
            scan_duration = time.time() - scan_start_time
            
            # Update final results
            self.scan_results["status"] = "completed"
            self.scan_results["end_time"] = datetime.now().isoformat()
            self.scan_results["duration_seconds"] = round(scan_duration, 2)
            self.scan_results["stats"] = {
                "total_files_scanned": self.scan_progress["processed_files"],
                "bar_files_found": self.scan_progress["found_bar_files"],
                "invalid_bar_files": self.scan_progress["invalid_bar_files"],
                "devices_scanned": devices_scanned,
                "scan_speed_files_per_second": round(self.scan_progress["processed_files"] / max(scan_duration, 0.1), 2)
            }
            
            # Group files by integrity score
            if self.scan_results["files"]:
                integrity_groups = {}
                for file_info in self.scan_results["files"]:
                    score = file_info.get("integrity_score", 0)
                    score_range = f"{(score // 10) * 10}-{((score // 10) * 10) + 9}"
                    if score_range not in integrity_groups:
                        integrity_groups[score_range] = 0
                    integrity_groups[score_range] += 1
                
                self.scan_results["integrity_distribution"] = integrity_groups
            
            self.logger.info(f"Multi-device scan completed: found {self.scan_progress['found_bar_files']} .bar files across {devices_scanned} devices in {scan_duration:.2f} seconds")
        except Exception as e:
            self.scan_results = {"status": "error", "message": f"Scan error: {str(e)}"}
            self.logger.error(f"Error during multi-device file scan: {str(e)}")
        finally:
            self.scan_in_progress = False
            if callback:
                callback(self.scan_results)
    
    def stop_scan(self) -> Dict[str, Any]:
        """Stop an ongoing scan.
        
        Returns:
            Dictionary with status information
        """
        if not self.scan_in_progress:
            return {"status": "not_running"}
        
        self.scan_in_progress = False
        if self.scan_thread and self.scan_thread.is_alive():
            self.scan_thread.join(timeout=1)
        
        self.scan_results["status"] = "stopped"
        self.scan_results["end_time"] = datetime.now().isoformat()
        
        return {"status": "stopped", "message": "Scan stopped by user"}
    
    def import_found_file(self, file_path: str, password: str) -> Dict[str, Any]:
        """Import a found .bar file into the system.
        
        Args:
            file_path: Path to the .bar file to import
            password: Password to decrypt the file
            
        Returns:
            Dictionary with import results
        """
        try:
            # Validate the file first
            file_info = self._validate_bar_file(Path(file_path))
            if not file_info:
                return {
                    "status": "error",
                    "message": "Invalid .bar file format"
                }
            
            # Check if file has expired
            if file_info.get("expired", False):
                return {
                    "status": "error",
                    "message": "This .bar file has expired and cannot be imported"
                }
            
            # Use the file manager to import the file
            file_id = self.file_manager.import_portable_file(file_path, password)
            
            return {
                "status": "success",
                "file_id": file_id,
                "file_info": file_info,
                "message": f"File imported successfully with ID: {file_id}"
            }
        except ValueError as e:
            self.logger.warning(f"Error importing file {file_path}: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
        except Exception as e:
            self.logger.error(f"Error importing file {file_path}: {str(e)}")
            return {
                "status": "error",
                "message": f"Import failed: {str(e)}"
            }
# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True

import os
import uuid
import socket
import hashlib
import platform
from typing import Dict, Any, Optional


cdef class HardwareIdentifier:
    """Generates and manages hardware-specific identifiers for device binding.
    
    This class provides methods to create unique hardware identifiers based on
    various system characteristics, which can be used to bind user credentials
    to specific devices for enhanced security.
    """
    
    def __init__(self):
        """Initialize the hardware identifier manager."""
        self.cache = {}
    
    cpdef str get_hardware_id(self):
        """Generate a unique hardware identifier for the current device.
        
        This method collects various hardware and system identifiers and
        combines them into a unique fingerprint that identifies this device.
        
        Returns:
            A string containing the hardware identifier hash
        """
        # Collect hardware information
        hw_info = self._collect_hardware_info()
        
        # Create a string representation of the hardware info
        hw_str = "|".join([f"{k}:{v}" for k, v in sorted(hw_info.items())])
        
        # Generate a hash of the hardware info
        hw_hash = hashlib.sha256(hw_str.encode('utf-8')).hexdigest()
        
        return hw_hash
    
    cdef dict _collect_hardware_info(self):
        """Collect hardware and system information.
        
        Returns:
            Dictionary containing hardware information
        """
        cdef dict info = {}
        cdef int mac
        cdef str mac_str, system_drive
        cdef object c, disk
        cdef object volume_name_buffer, file_system_name_buffer, volume_serial_number
        
        # Get MAC address (using uuid.getnode which returns the MAC as an integer)
        mac = uuid.getnode()
        mac_str = ':'.join(['{:02x}'.format((mac >> elements) & 0xff) for elements in range(0, 8*6, 8)][::-1])
        info['mac'] = mac_str
        
        # Get hostname
        info['hostname'] = socket.gethostname()
        
        # Get platform information
        info['system'] = platform.system()
        info['release'] = platform.release()
        info['machine'] = platform.machine()
        
        # Get processor information
        info['processor'] = platform.processor()
        
        # Get disk serial number (Windows only)
        if platform.system() == 'Windows':
            try:
                # Get system drive
                system_drive = os.environ.get('SystemDrive', 'C:')
                # Use Windows Management Instrumentation (WMI) to get disk serial
                import wmi
                c = wmi.WMI()
                for disk in c.Win32_LogicalDisk():
                    if disk.DeviceID == system_drive:
                        if disk.VolumeSerialNumber:
                            info['disk_serial'] = disk.VolumeSerialNumber
                        break
            except Exception:
                # If WMI fails, try to get volume information using Windows API
                try:
                    import ctypes
                    system_drive = os.environ.get('SystemDrive', 'C:') + '\\'
                    volume_name_buffer = ctypes.create_unicode_buffer(1024)
                    file_system_name_buffer = ctypes.create_unicode_buffer(1024)
                    volume_serial_number = ctypes.c_ulong(0)
                    
                    ctypes.windll.kernel32.GetVolumeInformationW(
                        ctypes.c_wchar_p(system_drive),
                        volume_name_buffer,
                        ctypes.sizeof(volume_name_buffer),
                        ctypes.pointer(volume_serial_number),
                        None,
                        None,
                        file_system_name_buffer,
                        ctypes.sizeof(file_system_name_buffer)
                    )
                    
                    info['disk_serial'] = format(volume_serial_number.value, 'X')
                except Exception:
                    # If all methods fail, use a fallback
                    info['disk_serial'] = 'unknown'
        
        return info
    
    cpdef bint verify_hardware_id(self, str stored_id):
        """Verify if the current hardware matches a stored hardware ID.
        
        Args:
            stored_id: Previously generated hardware ID to compare against
            
        Returns:
            True if the hardware IDs match, False otherwise
        """
        cdef str current_id = self.get_hardware_id()
        return current_id == stored_id
    
    cpdef dict get_hardware_fingerprint(self):
        """Get a detailed hardware fingerprint for the current device.
        
        Returns:
            Dictionary containing detailed hardware information
        """
        cdef dict hw_info = self._collect_hardware_info()
        cdef str hw_id = self.get_hardware_id()
        
        return {
            "hardware_id": hw_id,
            "collected_at": platform.node(),
            "details": hw_info
        }
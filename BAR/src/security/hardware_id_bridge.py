"""Bridge module for hardware identification.

This module attempts to use the Cython-compiled version of the hardware ID module
for better performance and security through obfuscation. If the compiled version
is not available, it falls back to the pure Python implementation.
"""

try:
    # Try to import the Cython-compiled version
    from .hardware_id_cy import HardwareIdentifier
    # Set a flag to indicate we're using the compiled version
    USING_COMPILED = True
except ImportError:
    # Fall back to the pure Python implementation
    from .hardware_id import HardwareIdentifier
    # Set a flag to indicate we're using the Python version
    USING_COMPILED = False

# Export the HardwareIdentifier class
__all__ = ['HardwareIdentifier', 'USING_COMPILED']
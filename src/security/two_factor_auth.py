import base64
import os
import time
import hmac
import hashlib
import qrcode
import io
from typing import Tuple, Optional
from datetime import datetime


class TwoFactorAuth:
    """Handles two-factor authentication using TOTP (Time-based One-Time Password)."""
    
    # Constants for TOTP
    DIGITS = 6  # Number of digits in the OTP
    PERIOD = 30  # Time period in seconds
    ALGORITHM = 'sha1'  # Hash algorithm
    
    def __init__(self):
        """Initialize the two-factor authentication manager."""
        pass
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a random secret key for TOTP.
        
        Returns:
            A base32 encoded secret key
        """
        # Generate 20 random bytes (160 bits)
        random_bytes = os.urandom(20)
        # Encode in base32 for easy entry by users
        return base64.b32encode(random_bytes).decode('utf-8')
    
    @staticmethod
    def get_totp_token(secret: str, time_step: int = None) -> str:
        """Generate a TOTP token for the given secret and time step.
        
        Args:
            secret: The base32 encoded secret key
            time_step: Optional specific time step to use (for testing)
            
        Returns:
            A TOTP token as a string
        """
        if time_step is None:
            # Get current time step (default 30-second intervals)
            time_step = int(time.time() // TwoFactorAuth.PERIOD)
        
        # Convert time step to bytes (8 bytes, big-endian)
        time_bytes = time_step.to_bytes(8, byteorder='big')
        
        # Decode the base32 secret
        secret_bytes = base64.b32decode(secret)
        
        # Calculate HMAC-SHA1
        hmac_hash = hmac.new(secret_bytes, time_bytes, TwoFactorAuth.ALGORITHM)
        hmac_result = hmac_hash.digest()
        
        # Dynamic truncation
        offset = hmac_result[-1] & 0x0F
        code = ((hmac_result[offset] & 0x7F) << 24 |
                (hmac_result[offset + 1] & 0xFF) << 16 |
                (hmac_result[offset + 2] & 0xFF) << 8 |
                (hmac_result[offset + 3] & 0xFF))
        
        # Modulo and padding
        code = code % (10 ** TwoFactorAuth.DIGITS)
        return str(code).zfill(TwoFactorAuth.DIGITS)
    
    @staticmethod
    def verify_totp(token: str, secret: str) -> bool:
        """Verify a TOTP token against a secret.
        
        Args:
            token: The token to verify
            secret: The base32 encoded secret key
            
        Returns:
            True if the token is valid, False otherwise
        """
        # Check current time step and adjacent time steps (for clock skew)
        current_time_step = int(time.time() // TwoFactorAuth.PERIOD)
        
        # Check current and adjacent time steps (-1, 0, +1)
        for time_step in [current_time_step - 1, current_time_step, current_time_step + 1]:
            if token == TwoFactorAuth.get_totp_token(secret, time_step):
                return True
        
        return False
    
    @staticmethod
    def generate_qr_code(username: str, app_name: str, secret: str) -> bytes:
        """Generate a QR code for easy setup in authenticator apps.
        
        Args:
            username: The username for the account
            app_name: The name of the application
            secret: The base32 encoded secret key
            
        Returns:
            The QR code as bytes (PNG format)
        """
        # Create the otpauth URL
        otpauth_url = f"otpauth://totp/{app_name}:{username}?secret={secret}&issuer={app_name}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(otpauth_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        return img_bytes.getvalue()
    
    @staticmethod
    def get_remaining_seconds() -> int:
        """Get the number of seconds remaining in the current time period.
        
        Returns:
            Seconds remaining until the next TOTP token
        """
        return TwoFactorAuth.PERIOD - (int(time.time()) % TwoFactorAuth.PERIOD)
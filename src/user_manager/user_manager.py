import os
import json
import logging
import re
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

from ..crypto.encryption import EncryptionManager
from ..security.two_factor_auth import TwoFactorAuth
from ..security.session_manager import SessionManager
from ..security.audit_log import AuditLog
from ..security.hardware_id_bridge import HardwareIdentifier


class UserManager:
    """Manages user accounts for the BAR application."""
    
    # Constants for security settings
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_COMPLEXITY_REGEX = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
    
    # User roles
    ROLE_ADMIN = "admin"
    ROLE_USER = "user"
    ROLE_GUEST = "guest"
    
    def __init__(self, base_directory: str):
        """Initialize the user manager.
        
        Args:
            base_directory: The base directory for storing user data
        """
        self.base_directory = Path(base_directory)
        self.users_directory = self.base_directory / "users"
        
        # Create directory if it doesn't exist
        self.users_directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize the encryption manager
        self.encryption_manager = EncryptionManager()
        
        # Initialize two-factor authentication
        self.two_factor_auth = TwoFactorAuth()
        
        # Initialize session manager
        self.session_manager = SessionManager()
        
        # Initialize audit log
        self.audit_log = AuditLog(str(self.base_directory))
        
        # Failed login attempts tracking {username: {count: int, last_attempt: datetime}}
        self.failed_login_attempts = {}
        
        # Setup logging
        self._setup_logging()
    
    def _setup_logging(self):
        """Set up logging for the user manager."""
        log_dir = self.base_directory / "logs"
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / "user_operations.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger("UserManager")
    
    def register_user(self, username: str, password: str, display_name: str = None, role: str = None, bind_to_hardware: bool = True) -> Tuple[bool, Optional[str]]:
        """Register a new user.
        
        Args:
            username: The username for the new account
            password: The password for the new account
            display_name: Optional display name for the user
            role: Optional user role (defaults to ROLE_USER if not specified)
            bind_to_hardware: Whether to bind the user credentials to this device
            
        Returns:
            Tuple containing (success, error_message)
            success: True if registration was successful, False otherwise
            error_message: Error message if registration failed, None otherwise
        
        Args:
            username: The username for the new account
            password: The password for the new account
            display_name: Optional display name for the user
            role: Optional user role (defaults to ROLE_USER if not specified)
            
        Returns:
            Tuple containing (success, error_message)
            success: True if registration was successful, False otherwise
            error_message: Error message if registration failed, None otherwise
        """
        # Check if username already exists
        user_file = self.users_directory / f"{username}.json"
        if user_file.exists():
            error_msg = f"Registration failed: Username '{username}' already exists"
            self.logger.warning(error_msg)
            return False, error_msg
        
        # Validate password complexity
        if not self._validate_password_complexity(password):
            error_msg = "Password does not meet complexity requirements"
            self.logger.warning(f"Registration failed for {username}: {error_msg}")
            return False, error_msg
        
        # Hash the password with optional hardware binding
        password_hash = self.encryption_manager.hash_password(password, bind_to_hardware)
        
        # Create user data
        user_data = {
            "username": username,
            "display_name": display_name or username,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "password": password_hash,
            "role": role or self.ROLE_USER,
            "account_status": "active",
            "failed_login_attempts": 0,
            "locked_until": None,
            "two_factor_enabled": False,
            "two_factor_secret": None,
            "hardware_bound": bind_to_hardware,
            "settings": {
                "theme": "default",
                "default_security": {
                    "expiration_time": None,
                    "max_access_count": None,
                    "deadman_switch": None
                }
            }
        }
        
        # Save user data
        with open(user_file, "w") as f:
            json.dump(user_data, f, indent=2)
        
        # Log the registration event
        self.audit_log.log_event(
            self.audit_log.LOGIN_SUCCESS,
            username,
            {"action": "user_registration", "role": user_data["role"]}
        )
        
        self.logger.info(f"User registered: {username}")
        return True, None
    
    def authenticate_user(self, username: str, password: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Authenticate a user.
        
        Args:
            username: The username to authenticate
            password: The password to verify
            
        Returns:
            Tuple containing (success, error_message, session_id)
            success: True if authentication was successful, False otherwise
            error_message: Error message if authentication failed, None otherwise
            session_id: Session ID if authentication was successful, None otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            self.logger.warning(f"Authentication failed: User '{username}' not found")
            self.audit_log.log_event(
                self.audit_log.LOGIN_FAILURE,
                username,
                {"reason": "user_not_found"},
                level=self.audit_log.WARNING
            )
            return False, "User not found", None
        
        # Check if account is locked
        if user_data.get("account_status") == "locked":
            locked_until = user_data.get("locked_until")
            if locked_until:
                locked_until_dt = datetime.fromisoformat(locked_until)
                if datetime.now() < locked_until_dt:
                    remaining_minutes = int((locked_until_dt - datetime.now()).total_seconds() / 60)
                    error_msg = f"Account is locked. Try again in {remaining_minutes} minutes."
                    self.logger.warning(f"Authentication failed: {error_msg}")
                    self.audit_log.log_event(
                        self.audit_log.LOGIN_FAILURE,
                        username,
                        {"reason": "account_locked", "locked_until": locked_until},
                        level=self.audit_log.WARNING
                    )
                    return False, error_msg, None
                else:
                    # Unlock the account if lockout period has passed
                    user_data["account_status"] = "active"
                    user_data["locked_until"] = None
                    user_data["failed_login_attempts"] = 0
        
        # Check if account is hardware-bound and verify hardware ID
        if user_data.get("hardware_bound", False):
            # Get the password hash data
            password_hash = user_data.get("password", {})
            
            # Check if the password hash indicates hardware binding
            if password_hash.get("hardware_bound", False):
                # Try to verify the password with hardware binding
                # This will internally check if the hardware ID matches
                if not self.encryption_manager.verify_password(password, password_hash):
                    # Check if it's a hardware mismatch or wrong password
                    # We'll try to verify without checking hardware ID to determine
                    from ..security.hardware_id_bridge import HardwareIdentifier
                    hw_id = HardwareIdentifier().get_hardware_id()
                    current_hw_hash = hashlib.sha256(hw_id.encode('utf-8')).hexdigest()
                    
                    if password_hash.get("hardware_id_hash") and current_hw_hash != password_hash.get("hardware_id_hash"):
                        # It's a hardware mismatch
                        error_msg = "Authentication failed: This account can only be accessed from the device it was created on."
                        self.logger.warning(f"Hardware binding authentication failed for user: {username}")
                        
                        self.audit_log.log_event(
                            self.audit_log.SECURITY_ALERT,
                            username,
                            {"reason": "hardware_id_mismatch", "current_hw_hash": current_hw_hash},
                            level=self.audit_log.WARNING
                        )
                        return False, error_msg, None
        
        # Verify password
        if not self.encryption_manager.verify_password(password, user_data["password"]):
            # Increment failed login attempts
            user_data["failed_login_attempts"] = user_data.get("failed_login_attempts", 0) + 1
            
            # Check if account should be locked
            if user_data["failed_login_attempts"] >= self.MAX_LOGIN_ATTEMPTS:
                locked_until = datetime.now() + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)
                user_data["account_status"] = "locked"
                user_data["locked_until"] = locked_until.isoformat()
                error_msg = f"Account locked due to too many failed login attempts. Try again in {self.LOCKOUT_DURATION_MINUTES} minutes."
                self.logger.warning(f"Account locked: {username} - {error_msg}")
                self._save_user_data(username, user_data)
                
                self.audit_log.log_event(
                    self.audit_log.SECURITY_ALERT,
                    username,
                    {"action": "account_locked", "reason": "max_failed_attempts", "locked_until": locked_until.isoformat()},
                    level=self.audit_log.WARNING
                )
                return False, error_msg, None
            
            self._save_user_data(username, user_data)
            
            attempts_left = self.MAX_LOGIN_ATTEMPTS - user_data["failed_login_attempts"]
            error_msg = f"Incorrect password. {attempts_left} attempts remaining before account lockout."
            self.logger.warning(f"Authentication failed: Incorrect password for user '{username}'")
            
            self.audit_log.log_event(
                self.audit_log.LOGIN_FAILURE,
                username,
                {"reason": "incorrect_password", "attempts_remaining": attempts_left},
                level=self.audit_log.WARNING
            )
            return False, error_msg, None
        
        # Check if account is hardware-bound and verify hardware ID
        if user_data.get("hardware_bound", False):
            # Get current hardware ID
            from ..security.hardware_id_bridge import HardwareIdentifier
            hw_id = HardwareIdentifier().get_hardware_id()
            current_hw_hash = hashlib.sha256(hw_id.encode('utf-8')).hexdigest()
            
            # Get the password hash data
            password_hash = user_data.get("password", {})
            
            # Check if the password hash indicates hardware binding
            if password_hash.get("hardware_bound", False) and password_hash.get("hardware_id_hash"):
                # Check if hardware ID matches
                if current_hw_hash != password_hash.get("hardware_id_hash"):
                    # It's a hardware mismatch
                    error_msg = "Authentication failed: This account can only be accessed from the device it was created on."
                    self.logger.warning(f"Hardware binding authentication failed for user: {username}")
                    
                    self.audit_log.log_event(
                        self.audit_log.SECURITY_ALERT,
                        username,
                        {"reason": "hardware_id_mismatch", "current_hw_hash": current_hw_hash},
                        level=self.audit_log.WARNING
                    )
                    return False, error_msg, None
        
        # Check if two-factor authentication is enabled
        if user_data.get("two_factor_enabled", False) and user_data.get("two_factor_secret"):
            # Return a special status indicating 2FA is required
            return False, "two_factor_required", None
        
        # Authentication successful - reset failed login attempts
        user_data["failed_login_attempts"] = 0
        user_data["account_status"] = "active"
        user_data["locked_until"] = None
        
        # Update last login time
        user_data["last_login"] = datetime.now().isoformat()
        self._save_user_data(username, user_data)
        
        # Create a session
        session_id = self.session_manager.create_session(username, {"role": user_data.get("role", self.ROLE_USER)})
        
        self.logger.info(f"User authenticated: {username}")
        
        # Log successful login
        self.audit_log.log_event(
            self.audit_log.LOGIN_SUCCESS,
            username,
            {"session_id": session_id}
        )
        
        return True, None, session_id
    
    def get_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        """Get a user's profile data.
        
        Args:
            username: The username to get profile for
            
        Returns:
            Dictionary containing user profile data, or None if user doesn't exist
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return None
        
        # Remove sensitive data
        profile = user_data.copy()
        del profile["password"]
        if "two_factor_secret" in profile:
            del profile["two_factor_secret"]
        
        return profile
    
    def verify_two_factor(self, username: str, token: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Verify a two-factor authentication token.
        
        Args:
            username: The username to verify the token for
            token: The two-factor authentication token
            
        Returns:
            Tuple containing (success, error_message, session_id)
            success: True if verification was successful, False otherwise
            error_message: Error message if verification failed, None otherwise
            session_id: Session ID if verification was successful, None otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found", None
        
        if not user_data.get("two_factor_enabled") or not user_data.get("two_factor_secret"):
            return False, "Two-factor authentication not enabled for this user", None
        
        # Verify the token
        if not self.two_factor_auth.verify_totp(token, user_data["two_factor_secret"]):
            self.logger.warning(f"Two-factor authentication failed for user: {username}")
            
            self.audit_log.log_event(
                self.audit_log.LOGIN_FAILURE,
                username,
                {"reason": "invalid_2fa_token"},
                level=self.audit_log.WARNING
            )
            
            return False, "Invalid two-factor authentication token", None
        
        # Update last login time
        user_data["last_login"] = datetime.now().isoformat()
        self._save_user_data(username, user_data)
        
        # Create a session
        session_id = self.session_manager.create_session(username, {"role": user_data.get("role", self.ROLE_USER)})
        
        self.logger.info(f"User authenticated with 2FA: {username}")
        
        # Log successful login
        self.audit_log.log_event(
            self.audit_log.LOGIN_SUCCESS,
            username,
            {"session_id": session_id, "two_factor": True}
        )
        
        return True, None, session_id
    
    def enable_two_factor(self, username: str, password: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """Enable two-factor authentication for a user.
        
        Args:
            username: The username to enable 2FA for
            password: The user's password for verification
            
        Returns:
            Tuple containing (success, error_message, setup_data)
            success: True if 2FA was enabled, False otherwise
            error_message: Error message if enabling 2FA failed, None otherwise
            setup_data: Dictionary containing setup information if successful, None otherwise
        """
        # Authenticate the user first (without creating a session)
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found", None
        
        # Verify password
        if not self.encryption_manager.verify_password(password, user_data["password"]):
            self.logger.warning(f"2FA setup failed: Incorrect password for user '{username}'")
            return False, "Incorrect password", None
        
        # Generate a new secret key
        secret = self.two_factor_auth.generate_secret()
        
        # Update user data
        user_data["two_factor_enabled"] = True
        user_data["two_factor_secret"] = secret
        self._save_user_data(username, user_data)
        
        # Generate QR code for easy setup
        qr_code = self.two_factor_auth.generate_qr_code(username, "BAR App", secret)
        
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SETTINGS_CHANGE,
            username,
            {"action": "enable_two_factor"}
        )
        
        self.logger.info(f"Two-factor authentication enabled for user: {username}")
        
        # Return setup information
        return True, None, {
            "secret": secret,
            "qr_code": base64.b64encode(qr_code).decode('utf-8')
        }
    
    def disable_two_factor(self, username: str, password: str, token: str) -> Tuple[bool, Optional[str]]:
        """Disable two-factor authentication for a user.
        
        Args:
            username: The username to disable 2FA for
            password: The user's password for verification
            token: Current valid 2FA token for verification
            
        Returns:
            Tuple containing (success, error_message)
            success: True if 2FA was disabled, False otherwise
            error_message: Error message if disabling 2FA failed, None otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found"
        
        # Verify password
        if not self.encryption_manager.verify_password(password, user_data["password"]):
            self.logger.warning(f"2FA disable failed: Incorrect password for user '{username}'")
            return False, "Incorrect password"
        
        # Verify 2FA is enabled
        if not user_data.get("two_factor_enabled") or not user_data.get("two_factor_secret"):
            return False, "Two-factor authentication not enabled for this user"
        
        # Verify the token
        if not self.two_factor_auth.verify_totp(token, user_data["two_factor_secret"]):
            self.logger.warning(f"2FA disable failed: Invalid token for user '{username}'")
            return False, "Invalid two-factor authentication token"
        
        # Disable 2FA
        user_data["two_factor_enabled"] = False
        user_data["two_factor_secret"] = None
        self._save_user_data(username, user_data)
        
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SETTINGS_CHANGE,
            username,
            {"action": "disable_two_factor"}
        )
        
        self.logger.info(f"Two-factor authentication disabled for user: {username}")
        return True, None
    
    def update_user_settings(self, username: str, settings: Dict[str, Any], session_id: Optional[str] = None) -> bool:
        """Update a user's settings.
        
        Args:
            username: The username to update settings for
            settings: Dictionary containing settings to update
            session_id: Optional session ID for authorization
            
        Returns:
            True if settings were updated, False if user doesn't exist
        """
        # Validate session if provided
        if session_id and not self.validate_session(session_id, username):
            self.logger.warning(f"Settings update failed: Invalid session for user '{username}'")
            return False
        user_data = self._get_user_data(username)
        if not user_data:
            return False
        
        # Update settings
        for key, value in settings.items():
            if key in user_data["settings"]:
                if isinstance(value, dict) and isinstance(user_data["settings"][key], dict):
                    # Merge nested dictionaries
                    user_data["settings"][key].update(value)
                else:
                    user_data["settings"][key] = value
        
        # Save updated user data
        self._save_user_data(username, user_data)
        
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SETTINGS_CHANGE,
            username,
            {"action": "update_settings"}
        )
        
        self.logger.info(f"Updated settings for user: {username}")
        return True
    
    def change_password(self, username: str, current_password: str, new_password: str, session_id: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """Change a user's password.
        
        Args:
            username: The username to change password for
            current_password: The current password for verification
            new_password: The new password to set
            session_id: Optional session ID for authorization
            
        Returns:
            Tuple containing (success, error_message)
            success: True if password was changed, False otherwise
            error_message: Error message if password change failed, None otherwise
        """
        # Validate session if provided
        if session_id and not self.validate_session(session_id, username):
            return False, "Invalid session"
            
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found"
        
        # Verify current password
        if not self.encryption_manager.verify_password(current_password, user_data["password"]):
            self.logger.warning(f"Password change failed: Incorrect current password for user '{username}'")
            return False, "Incorrect current password"
        
        # Validate new password complexity
        if not self._validate_password_complexity(new_password):
            error_msg = "New password does not meet complexity requirements"
            self.logger.warning(f"Password change failed for {username}: {error_msg}")
            return False, error_msg
        
        # Check if the account is hardware-bound
        is_hardware_bound = user_data.get("hardware_bound", False)
        
        # Hash the new password, maintaining hardware binding status
        password_hash = self.encryption_manager.hash_password(new_password, is_hardware_bound)
        user_data["password"] = password_hash
        
        # Save updated user data
        self._save_user_data(username, user_data)
        
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SETTINGS_CHANGE,
            username,
            {"action": "password_change"}
        )
        
        self.logger.info(f"Password changed for user: {username}")
        return True, None
    
    def list_users(self, session_id: Optional[str] = None, requesting_username: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all registered users.
        
        Args:
            session_id: Optional session ID for authorization
            requesting_username: Username of the user making the request
            
        Returns:
            List of dictionaries containing user data (excluding passwords)
        """
        # Check if session is valid and user has admin role
        if session_id and requesting_username:
            if not self.validate_session(session_id, requesting_username):
                self.logger.warning(f"List users failed: Invalid session for user '{requesting_username}'")
                return []
                
            # Check if user has admin role for full list
            user_data = self._get_user_data(requesting_username)
            if user_data and user_data.get("role") != self.ROLE_ADMIN:
                # Non-admin users can only see their own data
                user_data_copy = user_data.copy()
                del user_data_copy["password"]
                if "two_factor_secret" in user_data_copy:
                    del user_data_copy["two_factor_secret"]
                return [user_data_copy]
        
        users = []
        for user_file in self.users_directory.glob("*.json"):
            try:
                with open(user_file, "r") as f:
                    user_data = json.load(f)
                
                # Remove sensitive data
                user_data_copy = user_data.copy()
                del user_data_copy["password"]
                if "two_factor_secret" in user_data_copy:
                    del user_data_copy["two_factor_secret"]
                users.append(user_data_copy)
            except Exception as e:
                self.logger.error(f"Error reading user file {user_file}: {str(e)}")
        
        # Log the event if session is provided
        if session_id and requesting_username:
            self.audit_log.log_event(
                self.audit_log.INFO,
                requesting_username,
                {"action": "list_users"}
            )
            
        return users
    
    def delete_user(self, username: str, password: str, session_id: Optional[str] = None, admin_username: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """Delete a user account.
        
        Args:
            username: The username to delete
            password: The password for verification
            session_id: Optional session ID for authorization
            admin_username: Optional admin username if an admin is deleting the account
            
        Returns:
            Tuple containing (success, error_message)
            success: True if the user was deleted, False otherwise
            error_message: Error message if deletion failed, None otherwise
        """
        # Check if this is an admin action
        is_admin_action = False
        if admin_username and session_id:
            admin_data = self._get_user_data(admin_username)
            if admin_data and admin_data.get("role") == self.ROLE_ADMIN:
                if self.validate_session(session_id, admin_username):
                    is_admin_action = True
                else:
                    return False, "Invalid admin session"
            else:
                return False, "Insufficient permissions"
        
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found"
        
        # Verify password if not an admin action
        if not is_admin_action:
            if not self.encryption_manager.verify_password(password, user_data["password"]):
                self.logger.warning(f"User deletion failed: Incorrect password for user '{username}'")
                return False, "Incorrect password"
            
            # Validate session if provided
            if session_id and not self.validate_session(session_id, username):
                return False, "Invalid session"
        
        # Delete user file
        user_file = self.users_directory / f"{username}.json"
        user_file.unlink()
        
        # End all sessions for this user
        self.session_manager.end_all_user_sessions(username)
        
        # Log the event
        log_username = admin_username if is_admin_action else username
        self.audit_log.log_event(
            self.audit_log.SECURITY_ALERT,
            log_username,
            {"action": "user_deletion", "target_user": username, "by_admin": is_admin_action},
            level=self.audit_log.WARNING
        )
        
        self.logger.info(f"User deleted: {username}" + (f" by admin: {admin_username}" if is_admin_action else ""))
        return True, None
    
    def _get_user_data(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user data from file.
        
        Args:
            username: The username to get data for
            
        Returns:
            Dictionary containing user data, or None if user doesn't exist
        """
        user_file = self.users_directory / f"{username}.json"
        if not user_file.exists():
            return None
        
        try:
            with open(user_file, "r") as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error reading user file for {username}: {str(e)}")
            return None
    
    def _save_user_data(self, username: str, user_data: Dict[str, Any]) -> bool:
        """Save user data to file.
        
        Args:
            username: The username to save data for
            user_data: The user data to save
            
        Returns:
            True if data was saved successfully, False otherwise
        """
        user_file = self.users_directory / f"{username}.json"
        
        try:
            with open(user_file, "w") as f:
                json.dump(user_data, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving user file for {username}: {str(e)}")
            return False
            
    def _validate_password_complexity(self, password: str) -> bool:
        """Validate password complexity requirements.
        
        Args:
            password: The password to validate
            
        Returns:
            True if the password meets complexity requirements, False otherwise
        """
        # Check minimum length
        if len(password) < self.PASSWORD_MIN_LENGTH:
            return False
            
        # Check complexity using regex
        # Must contain at least one lowercase letter, one uppercase letter,
        # one digit, and one special character
        pattern = re.compile(self.PASSWORD_COMPLEXITY_REGEX)
        return bool(pattern.match(password))
    
    def validate_session(self, session_id: str, username: str) -> bool:
        """Validate if a session is active and belongs to the specified user.
        
        Args:
            session_id: The session ID to validate
            username: The username the session should belong to
            
        Returns:
            True if the session is valid for the user, False otherwise
        """
        # First check if session is valid
        if not self.session_manager.validate_session(session_id):
            return False
            
        # Then check if session belongs to the user
        session_data = self.session_manager.get_session_data(session_id)
        if not session_data or session_data.get("username") != username:
            return False
            
        return True
    
    def logout_user(self, session_id: str) -> bool:
        """Log out a user by ending their session.
        
        Args:
            session_id: The session ID to end
            
        Returns:
            True if the session was ended, False otherwise
        """
        # Get username before ending session
        session_data = self.session_manager.get_session_data(session_id)
        username = session_data.get("username") if session_data else None
        
        # End the session
        result = self.session_manager.end_session(session_id)
        
        # Log the event if successful
        if result and username:
            self.audit_log.log_event(
                self.audit_log.LOGOUT,
                username,
                {"session_id": session_id}
            )
            self.logger.info(f"User logged out: {username}")
            
        return result
    
    def lock_account(self, username: str, duration_minutes: int = LOCKOUT_DURATION_MINUTES, 
                    reason: str = "manual_lock", admin_username: Optional[str] = None) -> bool:
        """Lock a user account.
        
        Args:
            username: The username of the account to lock
            duration_minutes: The duration in minutes to lock the account for
            reason: The reason for locking the account
            admin_username: Optional username of admin performing the action
            
        Returns:
            True if the account was locked, False otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False
            
        # Set account status to locked
        locked_until = datetime.now() + timedelta(minutes=duration_minutes)
        user_data["account_status"] = "locked"
        user_data["locked_until"] = locked_until.isoformat()
        
        # Save user data
        if not self._save_user_data(username, user_data):
            return False
            
        # End all sessions for this user
        self.session_manager.end_all_user_sessions(username)
        
        # Log the event
        log_username = admin_username or "system"
        self.audit_log.log_event(
            self.audit_log.SECURITY_ALERT,
            log_username,
            {"action": "account_locked", "target_user": username, "reason": reason, 
             "locked_until": locked_until.isoformat(), "by_admin": bool(admin_username)},
            level=self.audit_log.WARNING
        )
        
        self.logger.info(f"Account locked: {username}" + 
                        (f" by admin: {admin_username}" if admin_username else ""))
        return True
    
    def unlock_account(self, username: str, admin_username: Optional[str] = None) -> bool:
        """Unlock a user account.
        
        Args:
            username: The username of the account to unlock
            admin_username: Optional username of admin performing the action
            
        Returns:
            True if the account was unlocked, False otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False
            
        # Check if account is locked
        if user_data.get("account_status") != "locked":
            return False
            
        # Set account status to active
        user_data["account_status"] = "active"
        user_data["locked_until"] = None
        user_data["failed_login_attempts"] = 0
        
        # Save user data
        if not self._save_user_data(username, user_data):
            return False
            
        # Log the event
        log_username = admin_username or "system"
        self.audit_log.log_event(
            self.audit_log.SECURITY_ALERT,
            log_username,
            {"action": "account_unlocked", "target_user": username, "by_admin": bool(admin_username)},
            level=self.audit_log.INFO
        )
        
        self.logger.info(f"Account unlocked: {username}" + 
                        (f" by admin: {admin_username}" if admin_username else ""))
        return True
    
    def change_user_role(self, username: str, new_role: str, admin_username: str, 
                        session_id: str) -> Tuple[bool, Optional[str]]:
        """Change a user's role.
        
        Args:
            username: The username to change role for
            new_role: The new role to assign
            admin_username: Username of admin performing the action
            session_id: Session ID of the admin
            
        Returns:
            Tuple containing (success, error_message)
            success: True if role was changed, False otherwise
            error_message: Error message if role change failed, None otherwise
        """
        # Validate admin session
        admin_data = self._get_user_data(admin_username)
        if not admin_data or admin_data.get("role") != self.ROLE_ADMIN:
            return False, "Insufficient permissions"
            
        if not self.validate_session(session_id, admin_username):
            return False, "Invalid admin session"
            
        # Get user data
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found"
            
        # Validate role
        if new_role not in [self.ROLE_ADMIN, self.ROLE_USER, self.ROLE_GUEST]:
            return False, "Invalid role"
            
        # Update role
        user_data["role"] = new_role
        
        # Save user data
        if not self._save_user_data(username, user_data):
            return False, "Failed to save user data"
            
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SETTINGS_CHANGE,
            admin_username,
            {"action": "role_change", "target_user": username, "new_role": new_role},
            level=self.audit_log.WARNING
        )
        
        self.logger.info(f"Role changed for user {username} to {new_role} by admin: {admin_username}")
        return True, None
    
    def initiate_password_reset(self, username: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Initiate a password reset for a user.
        
        Args:
            username: The username to reset password for
            
        Returns:
            Tuple containing (success, error_message, reset_token)
            success: True if password reset was initiated, False otherwise
            error_message: Error message if reset failed, None otherwise
            reset_token: Reset token if successful, None otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found", None
            
        # Generate a reset token
        reset_token = self.encryption_manager.generate_token()
        reset_expiry = datetime.now() + timedelta(hours=24)
        
        # Store reset information
        user_data["password_reset"] = {
            "token": reset_token,
            "expires": reset_expiry.isoformat()
        }
        
        # Save user data
        if not self._save_user_data(username, user_data):
            return False, "Failed to save reset information", None
            
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SECURITY_ALERT,
            username,
            {"action": "password_reset_initiated", "expires": reset_expiry.isoformat()},
            level=self.audit_log.WARNING
        )
        
        self.logger.info(f"Password reset initiated for user: {username}")
        return True, None, reset_token
    
    def complete_password_reset(self, username: str, reset_token: str, new_password: str) -> Tuple[bool, Optional[str]]:
        """Complete a password reset for a user.
        
        Args:
            username: The username to reset password for
            reset_token: The reset token to verify
            new_password: The new password to set
            
        Returns:
            Tuple containing (success, error_message)
            success: True if password was reset, False otherwise
            error_message: Error message if reset failed, None otherwise
        """
        user_data = self._get_user_data(username)
        if not user_data:
            return False, "User not found"
            
        # Check if reset was initiated
        reset_info = user_data.get("password_reset")
        if not reset_info:
            return False, "No password reset was initiated"
            
        # Verify token
        if reset_info.get("token") != reset_token:
            return False, "Invalid reset token"
            
        # Check if token has expired
        try:
            expiry = datetime.fromisoformat(reset_info.get("expires"))
            if datetime.now() > expiry:
                # Remove expired reset info
                del user_data["password_reset"]
                self._save_user_data(username, user_data)
                return False, "Reset token has expired"
        except (ValueError, TypeError):
            return False, "Invalid reset information"
            
        # Validate new password complexity
        if not self._validate_password_complexity(new_password):
            return False, "New password does not meet complexity requirements"
            
        # Hash the new password
        password_hash = self.encryption_manager.hash_password(new_password)
        user_data["password"] = password_hash
        
        # Remove reset information
        del user_data["password_reset"]
        
        # Reset failed login attempts
        user_data["failed_login_attempts"] = 0
        user_data["account_status"] = "active"
        user_data["locked_until"] = None
        
        # Save user data
        if not self._save_user_data(username, user_data):
            return False, "Failed to save new password"
            
        # End all sessions for this user
        self.session_manager.end_all_user_sessions(username)
        
        # Log the event
        self.audit_log.log_event(
            self.audit_log.SECURITY_ALERT,
            username,
            {"action": "password_reset_completed"},
            level=self.audit_log.WARNING
        )
        
        self.logger.info(f"Password reset completed for user: {username}")
        return True, None
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable


class SessionManager:
    """Manages user sessions with security features like automatic timeout.
    
    This class handles:
    - Session creation and validation
    - Automatic session timeout after inactivity
    - Session locking and unlocking
    - Session tracking and management
    """
    
    # Default session timeout in minutes
    DEFAULT_TIMEOUT = 15
    
    def __init__(self, timeout_minutes: int = DEFAULT_TIMEOUT):
        """Initialize the session manager.
        
        Args:
            timeout_minutes: Inactivity period in minutes before automatic logout
        """
        self.timeout_minutes = timeout_minutes
        self.sessions = {}
        self.lock = threading.RLock()
        
        # Start the session monitor thread
        self.monitor_active = True
        self.monitor_thread = threading.Thread(target=self._monitor_sessions, daemon=True)
        self.monitor_thread.start()
    
    def create_session(self, username: str, additional_data: Optional[Dict[str, Any]] = None) -> str:
        """Create a new user session.
        
        Args:
            username: The username for the session
            additional_data: Optional additional session data
            
        Returns:
            Session ID for the new session
        """
        with self.lock:
            # Generate a unique session ID
            session_id = self._generate_session_id()
            
            # Create session data
            session_data = {
                "username": username,
                "created_at": datetime.now(),
                "last_activity": datetime.now(),
                "is_locked": False,
                "data": additional_data or {}
            }
            
            # Store the session
            self.sessions[session_id] = session_data
            
            return session_id
    
    def validate_session(self, session_id: str) -> bool:
        """Validate if a session is active and not expired.
        
        Args:
            session_id: The session ID to validate
            
        Returns:
            True if the session is valid, False otherwise
        """
        with self.lock:
            if session_id not in self.sessions:
                return False
            
            session = self.sessions[session_id]
            
            # Check if session is locked
            if session["is_locked"]:
                return False
            
            # Check if session has expired
            last_activity = session["last_activity"]
            timeout = timedelta(minutes=self.timeout_minutes)
            if datetime.now() - last_activity > timeout:
                # Session has expired, remove it
                self.end_session(session_id)
                return False
            
            # Update last activity time
            session["last_activity"] = datetime.now()
            return True
    
    def update_activity(self, session_id: str) -> bool:
        """Update the last activity timestamp for a session.
        
        Args:
            session_id: The session ID to update
            
        Returns:
            True if the session was updated, False if it doesn't exist
        """
        with self.lock:
            if session_id not in self.sessions:
                return False
            
            # Update last activity time
            self.sessions[session_id]["last_activity"] = datetime.now()
            return True
    
    def lock_session(self, session_id: str) -> bool:
        """Lock a session.
        
        Args:
            session_id: The session ID to lock
            
        Returns:
            True if the session was locked, False if it doesn't exist
        """
        with self.lock:
            if session_id not in self.sessions:
                return False
            
            self.sessions[session_id]["is_locked"] = True
            return True
    
    def unlock_session(self, session_id: str) -> bool:
        """Unlock a session.
        
        Args:
            session_id: The session ID to unlock
            
        Returns:
            True if the session was unlocked, False if it doesn't exist
        """
        with self.lock:
            if session_id not in self.sessions:
                return False
            
            self.sessions[session_id]["is_locked"] = False
            self.sessions[session_id]["last_activity"] = datetime.now()
            return True
    
    def end_session(self, session_id: str) -> bool:
        """End a session.
        
        Args:
            session_id: The session ID to end
            
        Returns:
            True if the session was ended, False if it doesn't exist
        """
        with self.lock:
            if session_id not in self.sessions:
                return False
            
            del self.sessions[session_id]
            return True
    
    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data.
        
        Args:
            session_id: The session ID
            
        Returns:
            Session data dictionary or None if the session doesn't exist
        """
        with self.lock:
            if session_id not in self.sessions:
                return None
            
            return self.sessions[session_id].copy()
    
    def get_session_by_username(self, username: str) -> Optional[str]:
        """Get session ID for a username.
        
        Args:
            username: The username to look for
            
        Returns:
            Session ID or None if no session exists for the username
        """
        with self.lock:
            for session_id, session in self.sessions.items():
                if session["username"] == username:
                    return session_id
            
            return None
    
    def set_timeout(self, minutes: int) -> None:
        """Set the session timeout period.
        
        Args:
            minutes: Timeout period in minutes
        """
        with self.lock:
            self.timeout_minutes = minutes
    
    def _generate_session_id(self) -> str:
        """Generate a unique session ID.
        
        Returns:
            A unique session ID
        """
        import uuid
        return str(uuid.uuid4())
    
    def _monitor_sessions(self) -> None:
        """Monitor sessions for expiration."""
        while self.monitor_active:
            with self.lock:
                current_time = datetime.now()
                expired_sessions = []
                
                # Find expired sessions
                for session_id, session in self.sessions.items():
                    last_activity = session["last_activity"]
                    timeout = timedelta(minutes=self.timeout_minutes)
                    
                    if current_time - last_activity > timeout:
                        expired_sessions.append(session_id)
                
                # Remove expired sessions
                for session_id in expired_sessions:
                    del self.sessions[session_id]
            
            # Sleep for a while before checking again
            time.sleep(60)  # Check every minute
    
    def shutdown(self) -> None:
        """Shutdown the session manager."""
        self.monitor_active = False
        if self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2)
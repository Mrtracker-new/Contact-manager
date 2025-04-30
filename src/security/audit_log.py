import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path


class AuditLog:
    """Provides comprehensive security audit logging capabilities.
    
    This class handles logging of security-related events such as:
    - Login attempts (successful and failed)
    - File access operations
    - Security setting changes
    - Suspicious activities
    """
    
    # Log levels
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    
    # Event types
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    LOGOUT = "LOGOUT"
    FILE_CREATE = "FILE_CREATE"
    FILE_ACCESS = "FILE_ACCESS"
    FILE_DELETE = "FILE_DELETE"
    SETTINGS_CHANGE = "SETTINGS_CHANGE"
    SECURITY_ALERT = "SECURITY_ALERT"
    
    def __init__(self, base_directory: str):
        """Initialize the audit log manager.
        
        Args:
            base_directory: The base directory for storing audit logs
        """
        self.base_directory = Path(base_directory)
        self.logs_directory = self.base_directory / "logs" / "audit"
        
        # Create directory if it doesn't exist
        self.logs_directory.mkdir(parents=True, exist_ok=True)
        
        # Set up logging
        self._setup_logging()
    
    def _setup_logging(self):
        """Set up logging for the audit log."""
        # Create a logger
        self.logger = logging.getLogger("AuditLog")
        self.logger.setLevel(logging.INFO)
        
        # Create handlers
        log_file = self.logs_directory / "audit.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # Create formatters
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        
        # Add handlers to logger
        self.logger.addHandler(file_handler)
    
    def log_event(self, event_type: str, username: str, details: Dict[str, Any], 
                 level: str = INFO, ip_address: Optional[str] = None) -> None:
        """Log a security event.
        
        Args:
            event_type: Type of event (use class constants)
            username: Username associated with the event
            details: Additional details about the event
            level: Log level (INFO, WARNING, ERROR, CRITICAL)
            ip_address: Optional IP address associated with the event
        """
        # Create event data
        event_data = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "username": username,
            "ip_address": ip_address,
            "details": details
        }
        
        # Log to file
        log_message = json.dumps(event_data)
        
        # Use appropriate log level
        if level == self.WARNING:
            self.logger.warning(log_message)
        elif level == self.ERROR:
            self.logger.error(log_message)
        elif level == self.CRITICAL:
            self.logger.critical(log_message)
        else:  # Default to INFO
            self.logger.info(log_message)
        
        # Also write to structured log file
        self._write_structured_log(event_data)
    
    def _write_structured_log(self, event_data: Dict[str, Any]) -> None:
        """Write event data to a structured log file.
        
        Args:
            event_data: The event data to write
        """
        # Use date-based log files
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = self.logs_directory / f"audit_{today}.json"
        
        # Read existing logs
        logs = []
        if log_file.exists():
            try:
                with open(log_file, "r") as f:
                    logs = json.load(f)
            except json.JSONDecodeError:
                # File exists but is not valid JSON, start fresh
                logs = []
        
        # Append new log
        logs.append(event_data)
        
        # Write back to file
        with open(log_file, "w") as f:
            json.dump(logs, f, indent=2)
    
    def get_recent_events(self, count: int = 100, event_type: Optional[str] = None, 
                         username: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent audit log events, optionally filtered.
        
        Args:
            count: Maximum number of events to return
            event_type: Optional event type to filter by
            username: Optional username to filter by
            
        Returns:
            List of event dictionaries
        """
        # Get all log files, sorted by date (newest first)
        log_files = sorted(self.logs_directory.glob("audit_*.json"), reverse=True)
        
        events = []
        for log_file in log_files:
            if len(events) >= count:
                break
                
            try:
                with open(log_file, "r") as f:
                    file_events = json.load(f)
                    
                    # Apply filters
                    if event_type or username:
                        filtered_events = []
                        for event in file_events:
                            if event_type and event["event_type"] != event_type:
                                continue
                            if username and event["username"] != username:
                                continue
                            filtered_events.append(event)
                        file_events = filtered_events
                    
                    # Add events up to the count limit
                    remaining = count - len(events)
                    events.extend(file_events[:remaining])
            except (json.JSONDecodeError, IOError):
                # Skip invalid files
                continue
        
        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x["timestamp"], reverse=True)
        return events[:count]
    
    def log_login_attempt(self, username: str, success: bool, ip_address: Optional[str] = None,
                        details: Optional[Dict[str, Any]] = None) -> None:
        """Log a login attempt.
        
        Args:
            username: The username attempting to log in
            success: Whether the login was successful
            ip_address: Optional IP address of the login attempt
            details: Optional additional details
        """
        event_type = self.LOGIN_SUCCESS if success else self.LOGIN_FAILURE
        level = self.INFO if success else self.WARNING
        
        details = details or {}
        details["success"] = success
        
        self.log_event(event_type, username, details, level, ip_address)
    
    def log_file_access(self, username: str, file_id: str, filename: str,
                       ip_address: Optional[str] = None) -> None:
        """Log a file access event.
        
        Args:
            username: The username accessing the file
            file_id: The ID of the accessed file
            filename: The name of the accessed file
            ip_address: Optional IP address of the access
        """
        details = {
            "file_id": file_id,
            "filename": filename
        }
        
        self.log_event(self.FILE_ACCESS, username, details, self.INFO, ip_address)
    
    def log_security_alert(self, username: str, alert_type: str, details: Dict[str, Any],
                         ip_address: Optional[str] = None) -> None:
        """Log a security alert.
        
        Args:
            username: The username associated with the alert
            alert_type: The type of security alert
            details: Details about the alert
            ip_address: Optional IP address associated with the alert
        """
        details["alert_type"] = alert_type
        
        self.log_event(self.SECURITY_ALERT, username, details, self.WARNING, ip_address)
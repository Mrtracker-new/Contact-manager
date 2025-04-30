import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple, List

from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QMessageBox, QFormLayout, QWidget, QCheckBox, QSpinBox, QDateTimeEdit,
    QFileDialog, QTabWidget, QTextEdit, QGroupBox, QProgressBar, QApplication
)
from PyQt5.QtCore import Qt, QDateTime
from PyQt5.QtGui import QFont, QIcon
import time
from .styles import StyleManager


class FileDialog(QDialog):
    """Dialog for adding or importing secure files."""
    
    def __init__(self, default_security: Dict[str, Any], parent=None, 
                 filename: str = None, file_content: bytes = None):
        """Initialize the file dialog.
        
        Args:
            default_security: Default security settings
            parent: The parent widget
            filename: Optional filename for imported files
            file_content: Optional file content for imported files
        """
        super().__init__(parent)
        
        self.default_security = default_security
        self.filename = filename
        self.file_content = file_content
        self.file_path = None
        
        self.setWindowTitle("Add Secure File")
        self.setMinimumWidth(500)
        self.setMinimumHeight(400)
        self.setModal(True)
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        
        # Apply dialog styling
        self.setStyleSheet(StyleManager.get_dialog_style())
        
        # Title
        title_label = QLabel("Add Secure File")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        # File information
        file_group = QGroupBox("File Information")
        file_layout = QFormLayout(file_group)
        file_layout.setSpacing(10)
        layout.addWidget(file_group)
        
        # Filename field
        self.filename_label = QLabel("Filename:")
        self.filename_edit = QLineEdit()
        self.filename_edit.setStyleSheet(StyleManager.get_form_style())
        if self.filename:
            self.filename_edit.setText(self.filename)
        file_layout.addRow(self.filename_label, self.filename_edit)
        
        # File selection (only if not importing)
        if not self.file_content:
            file_select_layout = QHBoxLayout()
            file_select_layout.setSpacing(10)
            self.file_path_edit = QLineEdit()
            self.file_path_edit.setReadOnly(True)
            self.file_path_edit.setPlaceholderText("Select a file...")
            self.file_path_edit.setStyleSheet(StyleManager.get_form_style())
            file_select_layout.addWidget(self.file_path_edit)
            
            self.browse_button = QPushButton("Browse")
            self.browse_button.setStyleSheet(StyleManager.get_button_style("default"))
            self.browse_button.clicked.connect(self._browse_file)
            file_select_layout.addWidget(self.browse_button)
            
            file_layout.addRow("Select File:", file_select_layout)
        
        # Security settings
        security_group = QGroupBox("Security Settings")
        security_layout = QFormLayout(security_group)
        layout.addWidget(security_group)
        
        # Expiration time
        self.expiration_check = QCheckBox("Enable")
        self.expiration_datetime = QDateTimeEdit()
        self.expiration_datetime.setDateTime(QDateTime.currentDateTime().addDays(7))
        self.expiration_datetime.setCalendarPopup(True)
        self.expiration_datetime.setEnabled(False)
        self.expiration_check.toggled.connect(self.expiration_datetime.setEnabled)
        
        # Set default if provided
        if "expiration_time" in self.default_security and self.default_security["expiration_time"]:
            self.expiration_check.setChecked(True)
            self.expiration_datetime.setDateTime(
                QDateTime.fromString(self.default_security["expiration_time"], Qt.ISODate))
        
        expiration_layout = QHBoxLayout()
        expiration_layout.addWidget(self.expiration_check)
        expiration_layout.addWidget(self.expiration_datetime)
        security_layout.addRow("Expiration Time:", expiration_layout)
        
        # Max access count
        self.access_check = QCheckBox("Enable")
        self.access_spin = QSpinBox()
        self.access_spin.setRange(1, 100)
        self.access_spin.setValue(3)
        self.access_spin.setEnabled(False)
        self.access_check.toggled.connect(self.access_spin.setEnabled)
        
        # Set default if provided
        if "max_access_count" in self.default_security and self.default_security["max_access_count"]:
            self.access_check.setChecked(True)
            self.access_spin.setValue(self.default_security["max_access_count"])
        
        access_layout = QHBoxLayout()
        access_layout.addWidget(self.access_check)
        access_layout.addWidget(self.access_spin)
        security_layout.addRow("Max Access Count:", access_layout)
        
        # Deadman switch
        self.deadman_check = QCheckBox("Enable")
        self.deadman_spin = QSpinBox()
        self.deadman_spin.setRange(1, 365)
        self.deadman_spin.setValue(30)
        self.deadman_spin.setEnabled(False)
        self.deadman_check.toggled.connect(self.deadman_spin.setEnabled)
        
        # Set default if provided
        if "deadman_switch" in self.default_security and self.default_security["deadman_switch"]:
            self.deadman_check.setChecked(True)
            self.deadman_spin.setValue(self.default_security["deadman_switch"])
        
        deadman_layout = QHBoxLayout()
        deadman_layout.addWidget(self.deadman_check)
        deadman_layout.addWidget(self.deadman_spin)
        security_layout.addRow("Deadman Switch (days):", deadman_layout)
        
        # Disable export option (for images and other viewable files)
        self.disable_export_check = QCheckBox("Disable exporting (view-only)")
        self.disable_export_check.setToolTip("When enabled, this file can be viewed in the app but cannot be exported")
        
        # Set default if provided
        if "disable_export" in self.default_security and self.default_security["disable_export"]:
            self.disable_export_check.setChecked(True)
        
        # Connect checkbox state change to warning function
        self.disable_export_check.stateChanged.connect(self._check_view_only_compatibility)
        
        security_layout.addRow("", self.disable_export_check)
        
        # Password protection
        password_group = QGroupBox("Password Protection")
        password_layout = QFormLayout(password_group)
        layout.addWidget(password_group)
        
        # Password field
        self.password_label = QLabel("Password:")
        self.password_edit = QLineEdit()
        self.password_edit.setPlaceholderText("Enter a strong password")
        self.password_edit.setEchoMode(QLineEdit.Password)
        password_layout.addRow(self.password_label, self.password_edit)
        
        # Confirm password field
        self.confirm_password_label = QLabel("Confirm Password:")
        self.confirm_password_edit = QLineEdit()
        self.confirm_password_edit.setPlaceholderText("Confirm your password")
        self.confirm_password_edit.setEchoMode(QLineEdit.Password)
        password_layout.addRow(self.confirm_password_label, self.confirm_password_edit)
        
        # Security note
        security_note = QLabel("Note: This password is used to encrypt your file. "
                              "If you forget it, your data cannot be recovered.")
        security_note.setWordWrap(True)
        layout.addWidget(security_note)
        
        # Encryption progress bar (initially hidden)
        self.encryption_progress = QProgressBar()
        self.encryption_progress.setRange(0, 100)
        self.encryption_progress.setValue(0)
        self.encryption_progress.setVisible(False)
        self.encryption_progress.setStyleSheet("QProgressBar {border: 1px solid #ccc; border-radius: 5px; text-align: center;}"
                                             "QProgressBar::chunk {background-color: #4CAF50; width: 10px;}")
        layout.addWidget(self.encryption_progress)
        
        # Buttons
        button_layout = QHBoxLayout()
        layout.addLayout(button_layout)
        
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        self.add_button = QPushButton("Add File")
        self.add_button.setDefault(True)
        self.add_button.clicked.connect(self._add_file)
        button_layout.addWidget(self.add_button)
    
    def _browse_file(self):
        """Open a file dialog to select a file."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select File", "", "All Files (*)")
        
        if file_path:
            self.file_path = file_path
            self.file_path_edit.setText(file_path)
            
            # Set filename if not already set
            if not self.filename_edit.text():
                self.filename_edit.setText(os.path.basename(file_path))
            
            # Check if it's a media file and warn if view-only is already checked
            is_media, is_video_or_audio = self._is_media_file(file_path)
            if is_video_or_audio and self.disable_export_check.isChecked():
                warning_msg = (
                    "Warning: You have selected a video or audio file while the view-only option is enabled.\n\n"
                    "Video and audio files cannot be properly displayed in view-only mode "
                    "and may not be accessible when this restriction is enabled.\n\n"
                    "It is recommended to uncheck the 'Disable exporting (view-only)' option for this type of file."
                )
                QMessageBox.warning(self, "Media File Restriction Warning", warning_msg)
                
                # Focus on the checkbox to make it easier for the user to uncheck it
                self.disable_export_check.setFocus()
    
    def _is_media_file(self, file_path=None, content=None):
        """Detect if the file is a media file (video, audio, etc.).
        
        Args:
            file_path: Path to the file (optional)
            content: File content (optional)
            
        Returns:
            Tuple of (is_media, is_video)
        """
        # Check by file extension if path is provided
        if file_path:
            # Common video file extensions
            video_extensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm"]
            # Common audio file extensions
            audio_extensions = [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]
            # Common image file extensions
            image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"]
            
            ext = os.path.splitext(file_path)[1].lower()
            
            is_video = ext in video_extensions
            is_audio = ext in audio_extensions
            is_image = ext in image_extensions
            
            # Return if it's media and if it's specifically video
            return (is_video or is_audio or is_image, is_video or is_audio)
        
        # If content is provided, try to detect by content signatures
        # This is a simplified approach and might not be 100% accurate
        elif content:
            # Check for common video/audio file signatures
            # MP4 signature
            if content.startswith(b'\x00\x00\x00\x18ftyp') or content.startswith(b'\x00\x00\x00\x20ftyp'):
                return True, True
            # Check for common image signatures
            # JPEG signature
            if content.startswith(b'\xff\xd8\xff'):
                return True, False
            # PNG signature
            if content.startswith(b'\x89PNG\r\n\x1a\n'):
                return True, False
            # GIF signature
            if content.startswith(b'GIF87a') or content.startswith(b'GIF89a'):
                return True, False
        
        # Default: not detected as media
        return False, False
    
    def _add_file(self):
        """Validate input and accept the dialog."""
        # Check filename
        filename = self.filename_edit.text().strip()
        if not filename:
            QMessageBox.warning(self, "Missing Filename", "Please enter a filename.")
            self.filename_edit.setFocus()
            return
        
        # Check file selection (if not importing)
        if not self.file_content and not self.file_path:
            QMessageBox.warning(self, "No File Selected", "Please select a file.")
            return
        
        # Check password
        password = self.password_edit.text()
        confirm_password = self.confirm_password_edit.text()
        
        if not password:
            QMessageBox.warning(self, "Missing Password", "Please enter a password.")
            self.password_edit.setFocus()
            return
        
        if password != confirm_password:
            QMessageBox.warning(self, "Password Mismatch", "Passwords do not match.")
            self.confirm_password_edit.clear()
            self.confirm_password_edit.setFocus()
            return
        
        # Check password strength
        if len(password) < 8:
            result = QMessageBox.warning(
                self, 
                "Weak Password", 
                "Your password is less than 8 characters, which is considered weak. "
                "Are you sure you want to continue?",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            if result == QMessageBox.No:
                self.password_edit.setFocus()
                return
        
        # Show encryption progress if adding a file (not importing)
        if not self.file_content and self.file_path:
            self.encryption_progress.setVisible(True)
            self.encryption_progress.setValue(25)  # Start progress
            QApplication.processEvents()  # Update UI
            
            # Simulate encryption progress (in a real app, this would happen during actual encryption)
            for i in range(25, 101, 25):
                self.encryption_progress.setValue(i)
                QApplication.processEvents()  # Update UI
                time.sleep(0.2)  # Short delay to show progress
            
            # If we're not importing, read the file content
            try:
                with open(self.file_path, "rb") as f:
                    self.file_content = f.read()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to read file: {str(e)}")
                return
        
        # Check if it's a media file and warn if trying to set as view-only
        is_media, is_video_or_audio = self._is_media_file(self.file_path, self.file_content)
        if is_media and self.disable_export_check.isChecked():
            if is_video_or_audio:
                warning_msg = (
                    "Warning: You are trying to mark a video or audio file as view-only.\n\n"
                    "Video and audio files cannot be properly displayed in view-only mode "
                    "and may not be accessible when this restriction is enabled.\n\n"
                    "Do you want to continue with the view-only restriction?"
                )
                result = QMessageBox.warning(
                    self, "Media File Restriction Warning", 
                    warning_msg,
                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No
                )
                
                if result == QMessageBox.No:
                    return
        
        # Accept the dialog
        self.accept()
    
    def get_filename(self) -> str:
        """Get the filename.
        
        Returns:
            The filename
        """
        return self.filename_edit.text().strip()
    
    def get_file_data(self) -> bytes:
        """Get the file data.
        
        Returns:
            The file data
        """
        return self.file_content
    
    def get_password(self) -> str:
        """Get the password.
        
        Returns:
            The password
        """
        return self.password_edit.text()
    
    def get_security_settings(self) -> Dict[str, Any]:
        """Get the security settings.
        
        Returns:
            Dictionary containing security settings
        """
        security_settings = {}
        
        # Expiration time
        if self.expiration_check.isChecked():
            security_settings["expiration_time"] = self.expiration_datetime.dateTime().toString(Qt.ISODate)
        else:
            security_settings["expiration_time"] = None
        
        # Max access count
        if self.access_check.isChecked():
            security_settings["max_access_count"] = self.access_spin.value()
        else:
            security_settings["max_access_count"] = None
        
        # Deadman switch
        if self.deadman_check.isChecked():
            security_settings["deadman_switch"] = self.deadman_spin.value()
        else:
            security_settings["deadman_switch"] = None
        
        # Disable export option
        security_settings["disable_export"] = self.disable_export_check.isChecked()
        
        return security_settings
    
    def _check_view_only_compatibility(self, state):
        """Check if the selected file is compatible with view-only mode.
        
        Args:
            state: The checkbox state (Qt.Checked or Qt.Unchecked)
        """
        # Only check when the checkbox is checked and we have a file path
        if state == Qt.Checked and self.file_path:
            is_media, is_video_or_audio = self._is_media_file(self.file_path)
            if is_video_or_audio:
                warning_msg = (
                    "Warning: You have selected a video or audio file while the view-only option is enabled.\n\n"
                    "Video and audio files cannot be properly displayed in view-only mode "
                    "and may not be accessible when this restriction is enabled.\n\n"
                    "It is recommended to uncheck the 'Disable exporting (view-only)' option for this type of file."
                )
                QMessageBox.warning(self, "Media File Restriction Warning", warning_msg)
                
                # Focus on the checkbox to make it easier for the user to uncheck it
                self.disable_export_check.setFocus()
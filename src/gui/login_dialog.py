import sys
from typing import Optional

from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QMessageBox, QFormLayout, QWidget, QCheckBox, QGroupBox
)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QIcon, QPixmap, QFont

from .styles import StyleManager

from ..user_manager.user_manager import UserManager


class LoginDialog(QDialog):
    """Dialog for user login."""
    
    def __init__(self, user_manager: UserManager, parent=None):
        """Initialize the login dialog.
        
        Args:
            user_manager: The user account manager
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.user_manager = user_manager
        self.username = ""
        self.register_requested = False
        
        self.setWindowTitle("BAR - Login")
        self.setMinimumWidth(400)
        self.setMinimumHeight(300)
        self.setModal(True)
        
        # Apply theme to dialog
        self.setStyleSheet("""
            QDialog {
                background-color: #2c2c2c;
                color: #ffffff;
            }
            QLabel {
                color: #ffffff;
            }
            QGroupBox {
                border: 1px solid #444;
                border-radius: 4px;
                margin-top: 20px;
                padding-top: 24px;
                color: #ffffff;
            }
            QGroupBox::title {
                color: #ffffff;
            }
        """)
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel("BAR - Burn After Reading")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setStyleSheet("color: #3daee9; margin-bottom: 15px;")
        layout.addWidget(title_label)
        
        # Subtitle
        subtitle_label = QLabel("Secure File Storage")
        subtitle_label.setAlignment(Qt.AlignCenter)
        subtitle_font = QFont()
        subtitle_font.setPointSize(10)
        subtitle_label.setFont(subtitle_font)
        subtitle_label.setStyleSheet("color: #eff0f1; margin-bottom: 20px;")
        layout.addWidget(subtitle_label)
        
        # Login group
        login_group = QGroupBox("Login to Your Account")
        login_layout = QVBoxLayout(login_group)
        layout.addWidget(login_group)
        
        # Form layout for login fields
        form_layout = QFormLayout()
        login_layout.addLayout(form_layout)
        
        # Username field
        self.username_label = QLabel("Username:")
        self.username_edit = QLineEdit()
        self.username_edit.setPlaceholderText("Enter your username")
        form_layout.addRow(self.username_label, self.username_edit)
        
        # Password field
        self.password_label = QLabel("Password:")
        self.password_edit = QLineEdit()
        self.password_edit.setPlaceholderText("Enter your password")
        self.password_edit.setEchoMode(QLineEdit.Password)
        form_layout.addRow(self.password_label, self.password_edit)
        
        # Remember me checkbox
        self.remember_check = QCheckBox("Remember username")
        login_layout.addWidget(self.remember_check)
        
        # Buttons
        button_layout = QHBoxLayout()
        login_layout.addLayout(button_layout)
        
        self.register_button = QPushButton("Create Account")
        self.register_button.clicked.connect(self._request_register)
        self.register_button.setStyleSheet(StyleManager.get_button_style())
        button_layout.addWidget(self.register_button)
        
        self.login_button = QPushButton("Login")
        self.login_button.setDefault(True)
        self.login_button.clicked.connect(self._login)
        self.login_button.setStyleSheet(StyleManager.get_button_style("primary"))
        button_layout.addWidget(self.login_button)
        
        # Connect enter key to login
        self.username_edit.returnPressed.connect(self._focus_password)
        self.password_edit.returnPressed.connect(self._login)
        
        # Security note
        security_note = QLabel("Your files are encrypted with military-grade encryption")
        security_note.setAlignment(Qt.AlignCenter)
        security_note.setStyleSheet("color: #7f8c8d; font-size: 9pt; margin-top: 15px;")
        layout.addWidget(security_note)
    
    def _focus_password(self):
        """Focus the password field."""
        self.password_edit.setFocus()
    
    def _login(self):
        """Attempt to log in with the provided credentials."""
        username = self.username_edit.text().strip()
        password = self.password_edit.text()
        
        if not username or not password:
            QMessageBox.warning(self, "Login Failed", "Please enter both username and password.")
            return
        
        try:
            # The authenticate_user method returns a tuple (success, error_message, session_id)
            success, error_message, session_id = self.user_manager.authenticate_user(username, password)
            
            if success:
                self.username = username
                self.accept()
            else:
                # Display the specific error message from the authentication process
                error_msg = error_message if error_message else "Invalid username or password."
                QMessageBox.warning(self, "Login Failed", error_msg)
                self.password_edit.clear()
                self.password_edit.setFocus()
        except Exception as e:
            QMessageBox.critical(self, "Login Error", f"An error occurred during login: {str(e)}")
            self.password_edit.clear()
    
    def _request_register(self):
        """Request to show the registration dialog."""
        self.register_requested = True
        self.reject()
    
    def get_username(self) -> str:
        """Get the authenticated username.
        
        Returns:
            The authenticated username
        """
        return self.username
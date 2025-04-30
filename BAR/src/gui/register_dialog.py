import sys
from typing import Optional

from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QMessageBox, QFormLayout, QWidget
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

from ..user_manager.user_manager import UserManager


class RegisterDialog(QDialog):
    """Dialog for user registration."""
    
    def __init__(self, user_manager: UserManager, parent=None):
        """Initialize the registration dialog.
        
        Args:
            user_manager: The user account manager
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.user_manager = user_manager
        self.username = ""
        
        self.setWindowTitle("BAR - Register")
        self.setMinimumWidth(400)
        self.setModal(True)
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel("Create New Account")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        layout.addSpacing(20)
        
        # Registration form
        form_layout = QFormLayout()
        layout.addLayout(form_layout)
        
        # Username field
        self.username_label = QLabel("Username:")
        self.username_edit = QLineEdit()
        self.username_edit.setPlaceholderText("Choose a username")
        form_layout.addRow(self.username_label, self.username_edit)
        
        # Display name field
        self.display_name_label = QLabel("Display Name:")
        self.display_name_edit = QLineEdit()
        self.display_name_edit.setPlaceholderText("Your display name (optional)")
        form_layout.addRow(self.display_name_label, self.display_name_edit)
        
        # Password field
        self.password_label = QLabel("Password:")
        self.password_edit = QLineEdit()
        self.password_edit.setPlaceholderText("Choose a strong password")
        self.password_edit.setEchoMode(QLineEdit.Password)
        form_layout.addRow(self.password_label, self.password_edit)
        
        # Confirm password field
        self.confirm_password_label = QLabel("Confirm Password:")
        self.confirm_password_edit = QLineEdit()
        self.confirm_password_edit.setPlaceholderText("Confirm your password")
        self.confirm_password_edit.setEchoMode(QLineEdit.Password)
        form_layout.addRow(self.confirm_password_label, self.confirm_password_edit)
        
        # Password strength indicator
        self.password_strength_label = QLabel("Password Strength: Not Set")
        form_layout.addRow("", self.password_strength_label)
        
        # Connect password field to strength checker
        self.password_edit.textChanged.connect(self._check_password_strength)
        
        layout.addSpacing(10)
        
        # Security note
        security_note = QLabel("Note: Your password is used to encrypt your files. "
                              "If you forget it, your data cannot be recovered.")
        security_note.setWordWrap(True)
        layout.addWidget(security_note)
        
        layout.addSpacing(10)
        
        # Buttons
        button_layout = QHBoxLayout()
        layout.addLayout(button_layout)
        
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        self.register_button = QPushButton("Register")
        self.register_button.setDefault(True)
        self.register_button.clicked.connect(self._register)
        button_layout.addWidget(self.register_button)
    
    def _check_password_strength(self):
        """Check the strength of the entered password."""
        password = self.password_edit.text()
        
        if not password:
            self.password_strength_label.setText("Password Strength: Not Set")
            return
        
        # Simple password strength check
        strength = 0
        feedback = []
        
        # Length check
        if len(password) < 8:
            feedback.append("Too short")
        elif len(password) >= 12:
            strength += 2
        else:
            strength += 1
        
        # Character variety checks
        if any(c.islower() for c in password):
            strength += 1
        else:
            feedback.append("No lowercase letters")
            
        if any(c.isupper() for c in password):
            strength += 1
        else:
            feedback.append("No uppercase letters")
            
        if any(c.isdigit() for c in password):
            strength += 1
        else:
            feedback.append("No numbers")
            
        if any(not c.isalnum() for c in password):
            strength += 1
        else:
            feedback.append("No special characters")
        
        # Set strength text and color
        if strength < 2:
            strength_text = "Very Weak"
            self.password_strength_label.setStyleSheet("color: red;")
        elif strength < 4:
            strength_text = "Weak"
            self.password_strength_label.setStyleSheet("color: orange;")
        elif strength < 6:
            strength_text = "Moderate"
            self.password_strength_label.setStyleSheet("color: yellow;")
        else:
            strength_text = "Strong"
            self.password_strength_label.setStyleSheet("color: green;")
        
        if feedback:
            self.password_strength_label.setText(
                f"Password Strength: {strength_text} ({', '.join(feedback)})")
        else:
            self.password_strength_label.setText(f"Password Strength: {strength_text}")
    
    def _register(self):
        """Attempt to register a new user with the provided information."""
        username = self.username_edit.text().strip()
        display_name = self.display_name_edit.text().strip()
        password = self.password_edit.text()
        confirm_password = self.confirm_password_edit.text()
        
        # Validate input
        if not username:
            QMessageBox.warning(self, "Registration Failed", "Please enter a username.")
            return
        
        if not password:
            QMessageBox.warning(self, "Registration Failed", "Please enter a password.")
            return
        
        if password != confirm_password:
            QMessageBox.warning(self, "Registration Failed", "Passwords do not match.")
            self.confirm_password_edit.clear()
            return
        
        # Check password strength
        if len(password) < 8:
            result = QMessageBox.question(
                self, "Weak Password", 
                "Your password is weak. This may compromise the security of your files. "
                "Do you want to continue anyway?",
                QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            
            if result == QMessageBox.No:
                return
        
        # Use display name if provided, otherwise use username
        if not display_name:
            display_name = username
        
        # Register the user
        if self.user_manager.register_user(username, password, display_name):
            self.username = username
            QMessageBox.information(self, "Registration Successful", 
                                  f"User '{username}' has been registered successfully.")
            self.accept()
        else:
            QMessageBox.warning(self, "Registration Failed", 
                              f"Username '{username}' already exists. Please choose another username.")
    
    def get_username(self) -> str:
        """Get the registered username.
        
        Returns:
            The registered username
        """
        return self.username
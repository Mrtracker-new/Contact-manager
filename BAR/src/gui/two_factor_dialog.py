import os
import sys
from typing import Optional, Tuple

from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QMessageBox, QFormLayout, QWidget, QCheckBox, QTabWidget, QProgressBar,
    QApplication, QGroupBox
)
from PyQt5.QtCore import Qt, pyqtSignal, QTimer
from PyQt5.QtGui import QIcon, QPixmap, QFont, QImage

from ..security.two_factor_auth import TwoFactorAuth
from ..user_manager.user_manager import UserManager


class TwoFactorSetupDialog(QDialog):
    """Dialog for setting up two-factor authentication."""
    
    def __init__(self, user_manager: UserManager, username: str, parent=None):
        """Initialize the two-factor setup dialog.
        
        Args:
            user_manager: The user account manager
            username: The username of the current user
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.user_manager = user_manager
        self.username = username
        self.two_factor_auth = TwoFactorAuth()
        self.secret = self.two_factor_auth.generate_secret()
        
        self.setWindowTitle("Set Up Two-Factor Authentication")
        self.setMinimumWidth(450)
        self.setModal(True)
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel("Set Up Two-Factor Authentication")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        # Instructions
        instructions = QLabel(
            "Two-factor authentication adds an extra layer of security to your account. "
            "After setup, you'll need both your password and a verification code from your "
            "authenticator app to log in."
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)
        
        layout.addSpacing(10)
        
        # Setup steps
        steps_group = QGroupBox("Setup Steps")
        steps_layout = QVBoxLayout(steps_group)
        
        # Step 1: Install authenticator app
        step1_label = QLabel(
            "1. Install an authenticator app on your mobile device (Google Authenticator, "
            "Authy, Microsoft Authenticator, etc.)"
        )
        step1_label.setWordWrap(True)
        steps_layout.addWidget(step1_label)
        
        # Step 2: Scan QR code
        step2_label = QLabel(
            "2. Scan the QR code below with your authenticator app or enter the secret key manually"
        )
        step2_label.setWordWrap(True)
        steps_layout.addWidget(step2_label)
        
        # QR code
        qr_layout = QHBoxLayout()
        steps_layout.addLayout(qr_layout)
        
        # Generate QR code
        qr_data = self.two_factor_auth.generate_qr_code(self.username, "BAR", self.secret)
        qr_image = QImage.fromData(qr_data)
        qr_pixmap = QPixmap.fromImage(qr_image)
        qr_pixmap = qr_pixmap.scaled(200, 200, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        
        qr_label = QLabel()
        qr_label.setPixmap(qr_pixmap)
        qr_label.setAlignment(Qt.AlignCenter)
        qr_layout.addWidget(qr_label)
        
        # Secret key
        secret_layout = QVBoxLayout()
        qr_layout.addLayout(secret_layout)
        
        secret_label = QLabel("Secret Key:")
        secret_layout.addWidget(secret_label)
        
        secret_value = QLineEdit(self.secret)
        secret_value.setReadOnly(True)
        secret_layout.addWidget(secret_value)
        
        copy_button = QPushButton("Copy")
        copy_button.clicked.connect(lambda: QApplication.clipboard().setText(self.secret))
        secret_layout.addWidget(copy_button)
        
        secret_layout.addStretch()
        
        # Step 3: Verify code
        step3_label = QLabel(
            "3. Enter the verification code from your authenticator app to verify setup"
        )
        step3_label.setWordWrap(True)
        steps_layout.addWidget(step3_label)
        
        # Verification code
        verify_layout = QHBoxLayout()
        steps_layout.addLayout(verify_layout)
        
        self.code_edit = QLineEdit()
        self.code_edit.setPlaceholderText("Enter 6-digit code")
        self.code_edit.setMaxLength(6)
        verify_layout.addWidget(self.code_edit)
        
        # Timer display
        self.timer_progress = QProgressBar()
        self.timer_progress.setRange(0, 30)
        self.timer_progress.setValue(30)
        verify_layout.addWidget(self.timer_progress)
        
        # Start timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._update_timer)
        self.timer.start(1000)  # Update every second
        
        layout.addWidget(steps_group)
        
        # Buttons
        button_layout = QHBoxLayout()
        layout.addLayout(button_layout)
        
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        self.verify_button = QPushButton("Verify & Enable")
        self.verify_button.setDefault(True)
        self.verify_button.clicked.connect(self._verify_code)
        button_layout.addWidget(self.verify_button)
    
    def _update_timer(self):
        """Update the timer progress bar."""
        remaining = self.two_factor_auth.get_remaining_seconds()
        self.timer_progress.setValue(remaining)
        
        # If time is almost up, update the progress bar color
        if remaining <= 5:
            self.timer_progress.setStyleSheet("QProgressBar::chunk { background-color: red; }")
        else:
            self.timer_progress.setStyleSheet("")
    
    def _verify_code(self):
        """Verify the entered code and enable 2FA if valid."""
        code = self.code_edit.text().strip()
        
        if not code or len(code) != 6:
            QMessageBox.warning(self, "Verification Failed", "Please enter a valid 6-digit code.")
            return
        
        if self.two_factor_auth.verify_totp(code, self.secret):
            # Enable 2FA for the user
            if self.user_manager.enable_two_factor(self.username, self.secret):
                QMessageBox.information(
                    self, "Setup Complete", 
                    "Two-factor authentication has been enabled for your account. "
                    "You will need to enter a verification code each time you log in."
                )
                self.accept()
            else:
                QMessageBox.critical(
                    self, "Setup Failed", 
                    "Failed to enable two-factor authentication. Please try again."
                )
        else:
            QMessageBox.warning(
                self, "Verification Failed", 
                "The verification code is incorrect. Please try again."
            )
            self.code_edit.clear()
            self.code_edit.setFocus()


class TwoFactorVerifyDialog(QDialog):
    """Dialog for verifying two-factor authentication during login."""
    
    def __init__(self, two_factor_auth: TwoFactorAuth, secret: str, parent=None):
        """Initialize the two-factor verification dialog.
        
        Args:
            two_factor_auth: The two-factor authentication manager
            secret: The user's 2FA secret key
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.two_factor_auth = two_factor_auth
        self.secret = secret
        self.verified = False
        
        self.setWindowTitle("Two-Factor Authentication")
        self.setMinimumWidth(350)
        self.setModal(True)
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel("Two-Factor Authentication")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        # Instructions
        instructions = QLabel(
            "Please enter the verification code from your authenticator app."
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)
        
        layout.addSpacing(10)
        
        # Code entry
        form_layout = QFormLayout()
        layout.addLayout(form_layout)
        
        self.code_edit = QLineEdit()
        self.code_edit.setPlaceholderText("Enter 6-digit code")
        self.code_edit.setMaxLength(6)
        form_layout.addRow("Verification Code:", self.code_edit)
        
        # Timer display
        timer_layout = QHBoxLayout()
        layout.addLayout(timer_layout)
        
        timer_label = QLabel("Code expires in:")
        timer_layout.addWidget(timer_label)
        
        self.timer_progress = QProgressBar()
        self.timer_progress.setRange(0, 30)
        self.timer_progress.setValue(30)
        timer_layout.addWidget(self.timer_progress)
        
        # Start timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._update_timer)
        self.timer.start(1000)  # Update every second
        
        layout.addSpacing(10)
        
        # Buttons
        button_layout = QHBoxLayout()
        layout.addLayout(button_layout)
        
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        self.verify_button = QPushButton("Verify")
        self.verify_button.setDefault(True)
        self.verify_button.clicked.connect(self._verify_code)
        button_layout.addWidget(self.verify_button)
        
        # Connect enter key to verify
        self.code_edit.returnPressed.connect(self._verify_code)
    
    def _update_timer(self):
        """Update the timer progress bar."""
        remaining = self.two_factor_auth.get_remaining_seconds()
        self.timer_progress.setValue(remaining)
        
        # If time is almost up, update the progress bar color
        if remaining <= 5:
            self.timer_progress.setStyleSheet("QProgressBar::chunk { background-color: red; }")
        else:
            self.timer_progress.setStyleSheet("")
    
    def _verify_code(self):
        """Verify the entered code."""
        code = self.code_edit.text().strip()
        
        if not code or len(code) != 6:
            QMessageBox.warning(self, "Verification Failed", "Please enter a valid 6-digit code.")
            return
        
        if self.two_factor_auth.verify_totp(code, self.secret):
            self.verified = True
            self.accept()
        else:
            QMessageBox.warning(
                self, "Verification Failed", 
                "The verification code is incorrect. Please try again."
            )
            self.code_edit.clear()
            self.code_edit.setFocus()
    
    def is_verified(self) -> bool:
        """Check if verification was successful.
        
        Returns:
            True if verification was successful, False otherwise
        """
        return self.verified
import sys
from typing import Dict, Any, Optional

from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QMessageBox, QFormLayout, QWidget, QCheckBox, QSpinBox, QDateTimeEdit,
    QComboBox, QGroupBox, QTabWidget
)
from PyQt5.QtCore import Qt, QDateTime
from PyQt5.QtGui import QFont

from ..config.config_manager import ConfigManager
from ..user_manager.user_manager import UserManager


class SettingsDialog(QDialog):
    """Dialog for application settings."""
    
    def __init__(self, config_manager: ConfigManager, user_manager: UserManager, 
                 username: str, parent=None):
        """Initialize the settings dialog.
        
        Args:
            config_manager: The application configuration manager
            user_manager: The user account manager
            username: The current username
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.config_manager = config_manager
        self.user_manager = user_manager
        self.username = username
        
        self.setWindowTitle("Settings")
        self.setMinimumWidth(500)
        self.setMinimumHeight(400)
        self.setModal(True)
        
        self._setup_ui()
        self._load_settings()
    
    def _setup_ui(self):
        """Set up the user interface."""
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel("Application Settings")
        title_label.setAlignment(Qt.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        # Create tab widget
        self.tab_widget = QTabWidget()
        layout.addWidget(self.tab_widget)
        
        # General settings tab
        self.general_tab = QWidget()
        self.general_layout = QVBoxLayout(self.general_tab)
        self.tab_widget.addTab(self.general_tab, "General")
        
        # General settings form
        self.general_form = QFormLayout()
        self.general_layout.addLayout(self.general_form)
        
        # Theme selection
        self.theme_label = QLabel("Theme:")
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Dark", "Light", "System"])
        self.general_form.addRow(self.theme_label, self.theme_combo)
        
        # Auto-lock timeout
        self.lock_label = QLabel("Auto-lock after (minutes):")
        self.lock_spin = QSpinBox()
        self.lock_spin.setRange(1, 60)
        self.general_form.addRow(self.lock_label, self.lock_spin)
        
        # Security settings tab
        self.security_tab = QWidget()
        self.security_layout = QVBoxLayout(self.security_tab)
        self.tab_widget.addTab(self.security_tab, "Security")
        
        # Default security settings group
        self.security_group = QGroupBox("Default Security Settings")
        self.security_form = QFormLayout(self.security_group)
        self.security_layout.addWidget(self.security_group)
        
        # Expiration time
        self.expiration_check = QCheckBox("Enable")
        self.expiration_datetime = QDateTimeEdit()
        self.expiration_datetime.setDateTime(QDateTime.currentDateTime().addDays(7))
        self.expiration_datetime.setCalendarPopup(True)
        self.expiration_datetime.setEnabled(False)
        self.expiration_check.toggled.connect(self.expiration_datetime.setEnabled)
        
        expiration_layout = QHBoxLayout()
        expiration_layout.addWidget(self.expiration_check)
        expiration_layout.addWidget(self.expiration_datetime)
        self.security_form.addRow("Default expiration time:", expiration_layout)
        
        # Max access count
        self.access_check = QCheckBox("Enable")
        self.access_spin = QSpinBox()
        self.access_spin.setRange(1, 100)
        self.access_spin.setValue(3)
        self.access_spin.setEnabled(False)
        self.access_check.toggled.connect(self.access_spin.setEnabled)
        
        access_layout = QHBoxLayout()
        access_layout.addWidget(self.access_check)
        access_layout.addWidget(self.access_spin)
        self.security_form.addRow("Default max access count:", access_layout)
        
        # Deadman switch
        self.deadman_check = QCheckBox("Enable")
        self.deadman_spin = QSpinBox()
        self.deadman_spin.setRange(1, 365)
        self.deadman_spin.setValue(30)
        self.deadman_spin.setEnabled(False)
        self.deadman_check.toggled.connect(self.deadman_spin.setEnabled)
        
        deadman_layout = QHBoxLayout()
        deadman_layout.addWidget(self.deadman_check)
        deadman_layout.addWidget(self.deadman_spin)
        self.security_form.addRow("Default deadman switch (days):", deadman_layout)
        
        # User settings tab
        self.user_tab = QWidget()
        self.user_layout = QVBoxLayout(self.user_tab)
        self.tab_widget.addTab(self.user_tab, "User")
        
        # User settings form
        self.user_form = QFormLayout()
        self.user_layout.addLayout(self.user_form)
        
        # Display name
        self.display_name_label = QLabel("Display Name:")
        self.display_name_edit = QLineEdit()
        self.user_form.addRow(self.display_name_label, self.display_name_edit)
        
        # Password change group
        self.password_group = QGroupBox("Change Password")
        self.password_layout = QFormLayout(self.password_group)
        self.user_layout.addWidget(self.password_group)
        
        # Current password
        self.current_password_label = QLabel("Current Password:")
        self.current_password_edit = QLineEdit()
        self.current_password_edit.setEchoMode(QLineEdit.Password)
        self.password_layout.addRow(self.current_password_label, self.current_password_edit)
        
        # New password
        self.new_password_label = QLabel("New Password:")
        self.new_password_edit = QLineEdit()
        self.new_password_edit.setEchoMode(QLineEdit.Password)
        self.password_layout.addRow(self.new_password_label, self.new_password_edit)
        
        # Confirm new password
        self.confirm_password_label = QLabel("Confirm New Password:")
        self.confirm_password_edit = QLineEdit()
        self.confirm_password_edit.setEchoMode(QLineEdit.Password)
        self.password_layout.addRow(self.confirm_password_label, self.confirm_password_edit)
        
        # Change password button
        self.change_password_button = QPushButton("Change Password")
        self.change_password_button.clicked.connect(self._change_password)
        self.password_layout.addRow("", self.change_password_button)
        
        # Buttons
        button_layout = QHBoxLayout()
        layout.addLayout(button_layout)
        
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        self.save_button = QPushButton("Save Settings")
        self.save_button.setDefault(True)
        self.save_button.clicked.connect(self._save_settings)
        button_layout.addWidget(self.save_button)
    
    def _load_settings(self):
        """Load current settings into the UI."""
        # Load application settings
        config = self.config_manager.get_config()
        
        # Theme
        theme = config.get("theme", "dark").capitalize()
        index = self.theme_combo.findText(theme, Qt.MatchFixedString)
        if index >= 0:
            self.theme_combo.setCurrentIndex(index)
        
        # Auto-lock timeout
        self.lock_spin.setValue(config.get("auto_lock_timeout", 5))
        
        # Default security settings
        security = config.get("default_security", {})
        
        # Expiration time
        if security.get("expiration_time"):
            self.expiration_check.setChecked(True)
            self.expiration_datetime.setDateTime(
                QDateTime.fromString(security["expiration_time"], Qt.ISODate))
        
        # Max access count
        if security.get("max_access_count"):
            self.access_check.setChecked(True)
            self.access_spin.setValue(security["max_access_count"])
        
        # Deadman switch
        if security.get("deadman_switch"):
            self.deadman_check.setChecked(True)
            self.deadman_spin.setValue(security["deadman_switch"])
        
        # Load user settings
        user_profile = self.user_manager.get_user_profile(self.username)
        if user_profile:
            self.display_name_edit.setText(user_profile.get("display_name", self.username))
    
    def _save_settings(self):
        """Save settings and close the dialog."""
        # Collect general settings
        general_settings = {
            "theme": self.theme_combo.currentText().lower(),
            "auto_lock_timeout": self.lock_spin.value()
        }
        
        # Collect security settings
        security_settings = {}
        
        if self.expiration_check.isChecked():
            security_settings["expiration_time"] = self.expiration_datetime.dateTime().toString(Qt.ISODate)
        else:
            security_settings["expiration_time"] = None
        
        if self.access_check.isChecked():
            security_settings["max_access_count"] = self.access_spin.value()
        else:
            security_settings["max_access_count"] = None
        
        if self.deadman_check.isChecked():
            security_settings["deadman_switch"] = self.deadman_spin.value()
        else:
            security_settings["deadman_switch"] = None
        
        # Update application settings
        self.config_manager.update_config({
            **general_settings,
            "default_security": security_settings
        })
        
        # Update user settings
        display_name = self.display_name_edit.text().strip()
        if display_name:
            self.user_manager.update_user_profile(self.username, {"display_name": display_name})
        
        QMessageBox.information(self, "Settings Saved", "Your settings have been saved.")
        self.accept()
    
    def _change_password(self):
        """Change the user's password."""
        current_password = self.current_password_edit.text()
        new_password = self.new_password_edit.text()
        confirm_password = self.confirm_password_edit.text()
        
        # Validate input
        if not current_password:
            QMessageBox.warning(self, "Missing Information", "Please enter your current password.")
            return
        
        if not new_password:
            QMessageBox.warning(self, "Missing Information", "Please enter a new password.")
            return
        
        if new_password != confirm_password:
            QMessageBox.warning(self, "Password Mismatch", "New passwords do not match.")
            self.confirm_password_edit.clear()
            return
        
        # Check password strength
        if len(new_password) < 8:
            result = QMessageBox.question(
                self, "Weak Password", 
                "Your password is weak. This may compromise the security of your files. "
                "Do you want to continue anyway?",
                QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            
            if result == QMessageBox.No:
                return
        
        # Change the password
        if self.user_manager.change_password(self.username, current_password, new_password):
            QMessageBox.information(self, "Password Changed", "Your password has been changed successfully.")
            
            # Clear password fields
            self.current_password_edit.clear()
            self.new_password_edit.clear()
            self.confirm_password_edit.clear()
        else:
            QMessageBox.warning(self, "Password Change Failed", "Incorrect current password.")
            self.current_password_edit.clear()
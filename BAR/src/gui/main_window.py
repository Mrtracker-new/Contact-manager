import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QFileDialog, QMessageBox, QTabWidget, QTableWidget, QTableWidgetItem,
    QHeaderView, QComboBox, QSpinBox, QDateTimeEdit, QCheckBox, QDialog,
    QFormLayout, QGroupBox, QStackedWidget, QSplitter, QFrame, QAction, QMenu,
    QToolBar, QStatusBar, QSystemTrayIcon, QApplication, QStyle, QInputDialog, QTextEdit,
    QScrollArea
)
from PyQt5.QtCore import Qt, QTimer, QDateTime, pyqtSignal, QSize, QEvent
from PyQt5.QtGui import QIcon, QPixmap, QFont, QPalette, QColor

from ..config.config_manager import ConfigManager
from ..crypto.encryption import EncryptionManager
from ..file_manager.file_manager import FileManager
from ..user_manager.user_manager import UserManager
from .login_dialog import LoginDialog
from .register_dialog import RegisterDialog
from .file_dialog import FileDialog
from .settings_dialog import SettingsDialog
from .styles import StyleManager


class MainWindow(QMainWindow):
    """Main window for the BAR application."""
    
    def __init__(self, config_manager: ConfigManager, file_manager: FileManager, 
                 user_manager: UserManager, parent=None):
        """Initialize the main window.
        
        Args:
            config_manager: The application configuration manager
            file_manager: The secure file manager
            user_manager: The user account manager
            parent: The parent widget
        """
        super().__init__(parent)
        
        # Store managers
        self.config_manager = config_manager
        self.file_manager = file_manager
        self.user_manager = user_manager
        
        # Set up window properties
        self.setWindowTitle("BAR - Burn After Reading")
        self.setMinimumSize(900, 600)
        
        # Initialize UI components
        self.current_user = None
        self.auto_lock_timer = QTimer(self)
        self.auto_lock_timer.timeout.connect(self.lock_application)
        
        # Set up the UI
        self._setup_ui()
        self._apply_theme()
        
        # Show login dialog
        self._show_login_dialog()
    
    def _setup_ui(self):
        """Set up the user interface."""
        # Create central widget and main layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QVBoxLayout(self.central_widget)
        
        # Create stacked widget for different screens
        self.stacked_widget = QStackedWidget()
        self.main_layout.addWidget(self.stacked_widget)
        
        # Create login screen
        self.login_screen = QWidget()
        self.stacked_widget.addWidget(self.login_screen)
        
        # Create main application screen
        self.app_screen = QWidget()
        self.app_layout = QVBoxLayout(self.app_screen)
        self.stacked_widget.addWidget(self.app_screen)
        
        # Create tab widget for different sections
        self.tab_widget = QTabWidget()
        self.app_layout.addWidget(self.tab_widget)
        
        # Create file management tab
        self.files_tab = QWidget()
        self.files_layout = QVBoxLayout(self.files_tab)
        self.tab_widget.addTab(self.files_tab, "Files")
        
        # Create file table
        self.file_table = QTableWidget()
        self.file_table.setColumnCount(7)
        self.file_table.setHorizontalHeaderLabels(["Filename", "Created", "Last Accessed", 
                                                 "Access Count", "Expiration", "Restrictions", "Actions"])
        self.file_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.files_layout.addWidget(self.file_table)
        
        # Create file action buttons
        self.file_buttons_layout = QHBoxLayout()
        self.files_layout.addLayout(self.file_buttons_layout)
        
        self.add_file_button = QPushButton("Add File")
        self.add_file_button.clicked.connect(self._add_file)
        self.add_file_button.setStyleSheet(StyleManager.get_action_button_style("primary"))
        self.file_buttons_layout.addWidget(self.add_file_button)
        
        self.refresh_files_button = QPushButton("Refresh")
        self.refresh_files_button.clicked.connect(self._refresh_files)
        self.refresh_files_button.setStyleSheet(StyleManager.get_action_button_style())
        self.file_buttons_layout.addWidget(self.refresh_files_button)
        
        # Create settings tab
        self.settings_tab = QWidget()
        self.settings_layout = QVBoxLayout(self.settings_tab)
        self.tab_widget.addTab(self.settings_tab, "Settings")
        
        # Create settings form
        self.settings_form = QFormLayout()
        self.settings_layout.addLayout(self.settings_form)
        
        # Theme selection
        self.theme_label = QLabel("Theme:")
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Dark", "Light", "System"])
        self.theme_combo.currentTextChanged.connect(self._change_theme)
        self.settings_form.addRow(self.theme_label, self.theme_combo)
        
        # Auto-lock timeout
        self.lock_label = QLabel("Auto-lock after (minutes):")
        self.lock_spin = QSpinBox()
        self.lock_spin.setRange(1, 60)
        self.lock_spin.setValue(self.config_manager.get_value("auto_lock_timeout", 5))
        self.lock_spin.valueChanged.connect(self._change_lock_timeout)
        self.settings_form.addRow(self.lock_label, self.lock_spin)
        
        # Default security settings group
        self.security_group = QGroupBox("Default Security Settings")
        self.security_layout = QFormLayout(self.security_group)
        self.settings_layout.addWidget(self.security_group)
        
        # Expiration time
        self.expiration_label = QLabel("Default expiration time:")
        self.expiration_check = QCheckBox("Enable")
        self.expiration_datetime = QDateTimeEdit()
        self.expiration_datetime.setDateTime(QDateTime.currentDateTime().addDays(7))
        self.expiration_datetime.setCalendarPopup(True)
        self.expiration_layout = QHBoxLayout()
        self.expiration_layout.addWidget(self.expiration_check)
        self.expiration_layout.addWidget(self.expiration_datetime)
        self.security_layout.addRow(self.expiration_label, self.expiration_layout)
        
        # Max access count
        self.access_label = QLabel("Default max access count:")
        self.access_check = QCheckBox("Enable")
        self.access_spin = QSpinBox()
        self.access_spin.setRange(1, 100)
        self.access_spin.setValue(3)
        self.access_layout = QHBoxLayout()
        self.access_layout.addWidget(self.access_check)
        self.access_layout.addWidget(self.access_spin)
        self.security_layout.addRow(self.access_label, self.access_layout)
        
        # Deadman switch
        self.deadman_label = QLabel("Default deadman switch (days):")
        self.deadman_check = QCheckBox("Enable")
        self.deadman_spin = QSpinBox()
        self.deadman_spin.setRange(1, 365)
        self.deadman_spin.setValue(30)
        self.deadman_layout = QHBoxLayout()
        self.deadman_layout.addWidget(self.deadman_check)
        self.deadman_layout.addWidget(self.deadman_spin)
        self.security_layout.addRow(self.deadman_label, self.deadman_layout)
        
        # Save settings button
        self.save_settings_button = QPushButton("Save Settings")
        self.save_settings_button.clicked.connect(self._save_settings)
        self.save_settings_button.setStyleSheet(StyleManager.get_button_style("success"))
        self.settings_layout.addWidget(self.save_settings_button)
        
        # Create status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        # Create menu bar
        self.menu_bar = self.menuBar()
        
        # File menu
        self.file_menu = self.menu_bar.addMenu("&File")
        
        self.new_file_action = QAction("&New File", self)
        self.new_file_action.triggered.connect(self._add_file)
        self.file_menu.addAction(self.new_file_action)
        
        # Import submenu
        self.import_menu = QMenu("&Import", self)
        
        self.import_regular_action = QAction("Import &Regular File", self)
        self.import_regular_action.triggered.connect(self._import_regular_file)
        self.import_menu.addAction(self.import_regular_action)
        
        self.import_portable_action = QAction("Import &Portable Encrypted File", self)
        self.import_portable_action.triggered.connect(self._import_portable_file)
        self.import_menu.addAction(self.import_portable_action)
        
        self.file_menu.addMenu(self.import_menu)
        
        self.file_menu.addSeparator()
        
        self.lock_action = QAction("&Lock Application", self)
        self.lock_action.triggered.connect(self.lock_application)
        self.file_menu.addAction(self.lock_action)
        
        self.exit_action = QAction("E&xit", self)
        self.exit_action.triggered.connect(self.close)
        self.file_menu.addAction(self.exit_action)
        
        # User menu
        self.user_menu = self.menu_bar.addMenu("&User")
        
        self.change_password_action = QAction("Change &Password", self)
        self.change_password_action.triggered.connect(self._change_password)
        self.user_menu.addAction(self.change_password_action)
        
        self.logout_action = QAction("&Logout", self)
        self.logout_action.triggered.connect(self._logout)
        self.user_menu.addAction(self.logout_action)
        
        # Help menu
        self.help_menu = self.menu_bar.addMenu("&Help")
        
        self.about_action = QAction("&About", self)
        self.about_action.triggered.connect(self._show_about)
        self.help_menu.addAction(self.about_action)
    
    def _apply_theme(self):
        """Apply the selected theme to the application."""
        theme = self.config_manager.get_value("theme", "dark").lower()
        StyleManager.apply_theme(theme)
    
    def _show_login_dialog(self):
        """Show the login dialog."""
        login_dialog = LoginDialog(self.user_manager, self)
        result = login_dialog.exec_()
        
        if result == QDialog.Accepted:
            self.current_user = login_dialog.get_username()
            self._refresh_files()
            self.stacked_widget.setCurrentWidget(self.app_screen)
            self.status_bar.showMessage(f"Logged in as {self.current_user}")
            self._start_auto_lock_timer()
        else:
            # Check if we need to show registration dialog
            if login_dialog.register_requested:
                self._show_register_dialog()
            else:
                # Exit if login was cancelled
                QApplication.quit()
                sys.exit(0)  # Ensure application exits completely
    
    def _show_register_dialog(self):
        """Show the registration dialog."""
        register_dialog = RegisterDialog(self.user_manager, self)
        result = register_dialog.exec_()
        
        if result == QDialog.Accepted:
            self.current_user = register_dialog.get_username()
            self.stacked_widget.setCurrentWidget(self.app_screen)
            self.status_bar.showMessage(f"Registered and logged in as {self.current_user}")
            self._start_auto_lock_timer()
        else:
            # Show login dialog again
            self._show_login_dialog()
    
    def _start_auto_lock_timer(self):
        """Start the auto-lock timer."""
        timeout = self.config_manager.get_value("auto_lock_timeout", 5)
        self.auto_lock_timer.start(timeout * 60 * 1000)  # Convert minutes to milliseconds
    
    def _reset_auto_lock_timer(self):
        """Reset the auto-lock timer."""
        if self.auto_lock_timer.isActive():
            self.auto_lock_timer.stop()
            self._start_auto_lock_timer()
    
    def lock_application(self):
        """Lock the application and show the login dialog."""
        if self.current_user:
            self.auto_lock_timer.stop()
            self.current_user = None
            self.stacked_widget.setCurrentWidget(self.login_screen)
            self._show_login_dialog()
    
    def _logout(self):
        """Log out the current user."""
        self.lock_application()
    
    def _refresh_files(self):
        """Refresh the file list."""
        if not self.current_user:
            return
        
        try:
            # Clear the table
            self.file_table.setRowCount(0)
            
            # Update column count and headers to include export restriction status
            if self.file_table.columnCount() < 7:
                self.file_table.setColumnCount(7)
                self.file_table.setHorizontalHeaderLabels(["Filename", "Created", "Last Accessed", 
                                                         "Access Count", "Expiration", "Restrictions", "Actions"])
            
            # Apply table styling
            self.file_table.setStyleSheet(StyleManager.get_table_style())
            self.file_table.setAlternatingRowColors(True)
            
            # Get the list of files
            files = self.file_manager.list_files()
            
            # Populate the table
            for i, file_data in enumerate(files):
                self.file_table.insertRow(i)
                
                # Filename
                filename_item = QTableWidgetItem(file_data["filename"])
                filename_item.setToolTip(file_data["filename"])
                self.file_table.setItem(i, 0, filename_item)
                
                # Creation time
                creation_time = datetime.fromisoformat(file_data["creation_time"])
                creation_item = QTableWidgetItem(creation_time.strftime("%Y-%m-%d %H:%M"))
                creation_item.setToolTip(f"Created on {creation_time.strftime('%Y-%m-%d at %H:%M')}")
                self.file_table.setItem(i, 1, creation_item)
                
                # Last accessed
                last_accessed = datetime.fromisoformat(file_data["last_accessed"])
                accessed_item = QTableWidgetItem(last_accessed.strftime("%Y-%m-%d %H:%M"))
                accessed_item.setToolTip(f"Last accessed on {last_accessed.strftime('%Y-%m-%d at %H:%M')}")
                self.file_table.setItem(i, 2, accessed_item)
                
                # Access count
                access_count_item = QTableWidgetItem(str(file_data["access_count"]))
                max_access = file_data["security"]["max_access_count"]
                if max_access:
                    access_count_item.setToolTip(f"{file_data['access_count']} of {max_access} allowed accesses")
                else:
                    access_count_item.setToolTip("Unlimited accesses allowed")
                self.file_table.setItem(i, 3, access_count_item)
                
                # Expiration
                expiration = file_data["security"]["expiration_time"]
                if expiration:
                    expiration_time = datetime.fromisoformat(expiration)
                    expiration_text = expiration_time.strftime("%Y-%m-%d %H:%M")
                    expiration_item = QTableWidgetItem(expiration_text)
                    
                    # Highlight if close to expiration (within 24 hours)
                    time_to_expiration = expiration_time - datetime.now()
                    if time_to_expiration.total_seconds() < 86400:  # 24 hours in seconds
                        expiration_item.setForeground(QColor(255, 0, 0))  # Red text
                        expiration_item.setToolTip("Expires soon!")
                    else:
                        expiration_item.setToolTip(f"Expires on {expiration_time.strftime('%Y-%m-%d at %H:%M')}")
                else:
                    expiration_text = "Never"
                    expiration_item = QTableWidgetItem(expiration_text)
                    expiration_item.setToolTip("This file never expires")
                
                self.file_table.setItem(i, 4, expiration_item)
                
                # Restrictions
                restrictions = []
                if file_data["security"].get("disable_export", False):
                    restrictions.append("View-only")
                
                restrictions_text = ", ".join(restrictions) if restrictions else "None"
                restrictions_item = QTableWidgetItem(restrictions_text)
                
                if "View-only" in restrictions_text:
                    restrictions_item.setForeground(QColor(255, 140, 0))  # Orange text
                    restrictions_item.setToolTip("This file cannot be exported")
                else:
                    restrictions_item.setToolTip("This file has no restrictions")
                
                self.file_table.setItem(i, 5, restrictions_item)
                
                # Actions
                actions_widget = QWidget()
                actions_layout = QHBoxLayout(actions_widget)
                actions_layout.setContentsMargins(4, 2, 4, 2)
                actions_layout.setSpacing(6)
                
                open_button = QPushButton("Open")
                open_button.setProperty("file_id", file_data["file_id"])
                open_button.clicked.connect(self._open_file)
                open_button.setStyleSheet(StyleManager.get_action_button_style("primary"))
                open_button.setProperty("text", "Open")
                open_button.setProperty("displayText", True)
                actions_layout.addWidget(open_button)
                
                # Only show export button if not view-only
                if not file_data["security"].get("disable_export", False):
                    export_button = QPushButton("Export")
                    export_button.setProperty("file_id", file_data["file_id"])
                    export_button.clicked.connect(self._export_file)
                    export_button.setStyleSheet(StyleManager.get_action_button_style())
                    export_button.setProperty("text", "Export")
                    export_button.setProperty("displayText", True)
                    actions_layout.addWidget(export_button)
                else:
                    # Add a disabled export button with tooltip
                    export_button = QPushButton("Export")
                    export_button.setEnabled(False)
                    export_button.setToolTip("This file is view-only and cannot be exported")
                    export_button.setStyleSheet(StyleManager.get_action_button_style())
                    export_button.setProperty("text", "Export")
                    export_button.setProperty("displayText", True)
                    actions_layout.addWidget(export_button)
                
                delete_button = QPushButton("Delete")
                delete_button.setProperty("file_id", file_data["file_id"])
                delete_button.clicked.connect(self._delete_file)
                delete_button.setStyleSheet(StyleManager.get_action_button_style("danger"))
                delete_button.setProperty("text", "Delete")
                delete_button.setProperty("displayText", True)
                actions_layout.addWidget(delete_button)
                
                self.file_table.setCellWidget(i, 6, actions_widget)
            
            # Update status bar with file count
            self.status_bar.showMessage(f"Logged in as {self.current_user} | {len(files)} file(s) found")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to refresh file list: {str(e)}")
            self.status_bar.showMessage(f"Error refreshing files: {str(e)}")
    
    def _add_file(self):
        """Add a new secure file."""
        if not self.current_user:
            return
        
        # Get default security settings
        default_security = {}
        
        if self.expiration_check.isChecked():
            default_security["expiration_time"] = self.expiration_datetime.dateTime().toString(Qt.ISODate)
        
        if self.access_check.isChecked():
            default_security["max_access_count"] = self.access_spin.value()
        
        if self.deadman_check.isChecked():
            default_security["deadman_switch"] = self.deadman_spin.value()
        
        # Show file dialog
        file_dialog = FileDialog(default_security, self)
        if file_dialog.exec_() == QDialog.Accepted:
            file_data = file_dialog.get_file_data()
            security_settings = file_dialog.get_security_settings()
            password = file_dialog.get_password()
            
            try:
                file_id = self.file_manager.create_secure_file(
                    file_data, file_dialog.get_filename(), password, security_settings)
                
                QMessageBox.information(self, "File Added", 
                                      f"File '{file_dialog.get_filename()}' has been securely stored.")
                
                self._refresh_files()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to add file: {str(e)}")
    
    def _open_file(self):
        """Open a secure file."""
        if not self.current_user:
            return
        
        # Get the file ID from the sender button
        sender = self.sender()
        file_id = sender.property("file_id")
        
        # Ask for password
        password, ok = QInputDialog.getText(
            self, "Enter Password", "Enter the file password:", QLineEdit.Password)
        
        if ok and password:
            try:
                # Access the file
                file_content, metadata = self.file_manager.access_file(file_id, password)
                
                # Show file content
                self._show_file_content(file_content, metadata)
                
                # Refresh the file list to update access count
                self._refresh_files()
            except ValueError as e:
                QMessageBox.critical(self, "Error", str(e))
            except FileNotFoundError:
                QMessageBox.critical(self, "Error", "File not found. It may have been deleted.")
                self._refresh_files()
    
    def _show_file_content(self, content: bytes, metadata: Dict[str, Any]):
        """Show the content of a file."""
        # Import screen protection module
        from ..security.screen_protection import ScreenProtectionManager
        from .file_viewer import FileViewer
        
        # Create a dialog to display the file content
        dialog = QDialog(self)
        dialog.setWindowTitle(f"File: {metadata['filename']}")
        dialog.setMinimumSize(800, 600)  # Larger minimum size for better media viewing
        
        # Set a reasonable starting size that works well for images
        if metadata.get("file_type") == "media":
            dialog.resize(900, 700)
            
        # Apply current theme to dialog
        theme = self.config_manager.get_value("theme", "dark").lower()
        if theme == "dark":
            dialog.setStyleSheet("""
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
        
        layout = QVBoxLayout(dialog)
        
        # File info
        info_group = QGroupBox("File Information")
        info_layout = QFormLayout(info_group)
        layout.addWidget(info_group)
        
        filename_label = QLabel(metadata["filename"])
        filename_label.setStyleSheet("font-weight: bold;")
        info_layout.addRow("Filename:", filename_label)
        
        creation_time = datetime.fromisoformat(metadata["creation_time"])
        info_layout.addRow("Created:", QLabel(creation_time.strftime("%Y-%m-%d %H:%M")))
        
        last_accessed = datetime.fromisoformat(metadata["last_accessed"])
        info_layout.addRow("Last Accessed:", QLabel(last_accessed.strftime("%Y-%m-%d %H:%M")))
        
        info_layout.addRow("Access Count:", QLabel(str(metadata["access_count"])))
        
        # Security info
        security_group = QGroupBox("Security Settings")
        security_layout = QFormLayout(security_group)
        layout.addWidget(security_group)
        
        expiration = metadata["security"]["expiration_time"]
        if expiration:
            expiration_time = datetime.fromisoformat(expiration)
            expiration_text = expiration_time.strftime("%Y-%m-%d %H:%M")
        else:
            expiration_text = "Never"
        security_layout.addRow("Expiration:", QLabel(expiration_text))
        
        max_access = metadata["security"]["max_access_count"]
        if max_access:
            max_access_text = f"{metadata['access_count']} of {max_access}"
        else:
            max_access_text = "Unlimited"
        security_layout.addRow("Access Count:", QLabel(max_access_text))
        
        deadman = metadata["security"]["deadman_switch"]
        if deadman:
            deadman_text = f"{deadman} days of inactivity"
        else:
            deadman_text = "Disabled"
        security_layout.addRow("Deadman Switch:", QLabel(deadman_text))
        
        # Export restriction
        disable_export = metadata["security"].get("disable_export", False)
        export_text = "View-only (cannot be exported)" if disable_export else "Exportable"
        export_label = QLabel(export_text)
        if disable_export:
            font = export_label.font()
            font.setBold(True)
            export_label.setFont(font)
            export_label.setStyleSheet("color: #e74c3c;")
        else:
            export_label.setStyleSheet("color: #2ecc71;")
        security_layout.addRow("Export Status:", export_label)
        
        # Initialize screen protection if view-only is enabled
        screen_protection = None
        if disable_export:
            screen_protection = ScreenProtectionManager(self.current_user, dialog)
            screen_protection.set_screenshot_callback(lambda: self._on_screenshot_detected(metadata["filename"]))
            screen_protection.start_monitoring()
        
        # Content group
        content_group = QGroupBox("File Content")
        content_layout = QVBoxLayout(content_group)
        layout.addWidget(content_group)
        
        # Use the FileViewer component for displaying content
        file_viewer = FileViewer()
        file_viewer.display_content(content, metadata, self.current_user)
        
        # Set up export handler if not view-only
        if not disable_export:
            def handle_export():
                self._export_original_file_content(content, metadata)
            file_viewer.set_export_handler(handle_export)
        
        # Connect close signal
        file_viewer.close_requested.connect(lambda: self._close_content_dialog(dialog, screen_protection))
        
        content_layout.addWidget(file_viewer)
        
        dialog.exec_()
    
    def _close_content_dialog(self, dialog, screen_protection):
        """Close the content dialog and clean up resources.
        
        Args:
            dialog: The dialog to close
            screen_protection: The screen protection manager, if any
        """
        # Stop screenshot monitoring if active
        if screen_protection:
            screen_protection.stop_monitoring()
        
        # Close the dialog
        dialog.accept()
        
    def _export_original_file_content(self, content: bytes, metadata: Dict[str, Any]):
        """Export the original file content directly from the viewer.
        
        Args:
            content: The file content as bytes
            metadata: The file metadata
        """
        try:
            # Ask for export location
            export_path, _ = QFileDialog.getSaveFileName(
                self, "Export File", metadata["filename"], "All Files (*)")
            
            if export_path:
                # Write the file content
                with open(export_path, "wb") as f:
                    f.write(content)
                
                QMessageBox.information(self, "File Exported", 
                                      f"File '{metadata['filename']}' has been exported.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to export file: {str(e)}")
    
    def _on_screenshot_detected(self, filename):
        """Handle screenshot detection.
        
        Args:
            filename: The name of the file being viewed
        """
        QMessageBox.warning(
            self,
            "Screenshot Detected",
            f"A screenshot attempt was detected while viewing '{filename}'\n\n"
            f"This file is marked as view-only and should not be captured.\n"
            f"The screenshot contains watermarks identifying you as the viewer."
        )
    
    def _export_file(self):
        """Export a secure file."""
        if not self.current_user:
            return
        
        # Get the file ID from the sender button
        sender = self.sender()
        file_id = sender.property("file_id")
        
        # Ask for export type
        export_options = ["Export Original File", "Export Portable Encrypted File"]
        export_type, ok = QInputDialog.getItem(
            self, "Export Type", "Select export type:", export_options, 0, False)
        
        if not ok:
            return
        
        # Ask for password
        password, ok = QInputDialog.getText(
            self, "Enter Password", "Enter the file password:", QLineEdit.Password)
        
        if ok and password:
            try:
                if export_type == "Export Original File":
                    self._export_original_file(file_id, password)
                else:  # Export Portable Encrypted File
                    self._export_portable_file(file_id, password)
                
                # Refresh the file list to update access count
                self._refresh_files()
            except ValueError as e:
                QMessageBox.critical(self, "Error", str(e))
            except FileNotFoundError:
                QMessageBox.critical(self, "Error", "File not found. It may have been deleted.")
                self._refresh_files()
    
    def _export_original_file(self, file_id: str, password: str):
        """Export the original decrypted file."""
        try:
            # Access the file
            file_content, metadata = self.file_manager.access_file(file_id, password)
            
            # Check if export is disabled for this file
            if metadata.get("security", {}).get("disable_export", False):
                is_media = metadata.get("file_type") == "media"
                
                if is_media:
                    msg_box = QMessageBox(self)
                    msg_box.setWindowTitle("Export Restricted")
                    msg_box.setIcon(QMessageBox.Warning)
                    msg_box.setText(f"The media file '{metadata['filename']}' is view-only and cannot be exported.")
                    msg_box.setInformativeText("Media files are protected by default to prevent unauthorized distribution.")
                    msg_box.setStandardButtons(QMessageBox.Ok)
                    msg_box.exec_()
                else:
                    QMessageBox.warning(self, "Export Restricted", 
                                      f"The file '{metadata['filename']}' has been marked as view-only and cannot be exported.")
                return
            
            # Ask for export location
            export_path, _ = QFileDialog.getSaveFileName(
                self, "Export File", metadata["filename"], "All Files (*)")
            
            if export_path:
                # Write the file content
                with open(export_path, "wb") as f:
                    f.write(file_content)
                
                QMessageBox.information(self, "File Exported", 
                                      f"File '{metadata['filename']}' has been exported.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to export file: {str(e)}")
    
    def _export_portable_file(self, file_id: str, password: str):
        """Export a portable encrypted file that can be imported on another device."""
        try:
            # Get file metadata for the filename
            metadata_list = self.file_manager.list_files()
            filename = ""
            security_settings = {}
            for metadata in metadata_list:
                if metadata["file_id"] == file_id:
                    filename = metadata["filename"]
                    security_settings = metadata.get("security", {})
                    break
            
            # Check if export is disabled for this file
            if security_settings.get("disable_export", False):
                # Find if this is a media file
                is_media = False
                for meta in metadata_list:
                    if meta["file_id"] == file_id and meta.get("file_type") == "media":
                        is_media = True
                        break
                
                if is_media:
                    msg_box = QMessageBox(self)
                    msg_box.setWindowTitle("Export Restricted")
                    msg_box.setIcon(QMessageBox.Warning)
                    msg_box.setText(f"The media file '{filename}' is view-only and cannot be exported.")
                    msg_box.setInformativeText("Media files are protected by default to prevent unauthorized distribution.")
                    msg_box.setStandardButtons(QMessageBox.Ok)
                    msg_box.exec_()
                else:
                    QMessageBox.warning(self, "Export Restricted", 
                                      f"The file '{filename}' has been marked as view-only and cannot be exported.")
                return
            
            # Ask for export location
            export_path, _ = QFileDialog.getSaveFileName(
                self, "Export Portable File", 
                f"{filename}.bar" if filename else "secure_file.bar", 
                "BAR Files (*.bar);;All Files (*)")
            
            if export_path:
                # Export the portable file
                self.file_manager.export_portable_file(file_id, password, export_path)
                
                QMessageBox.information(
                    self, 
                    "Portable File Exported", 
                    f"Portable encrypted file has been exported to '{export_path}'."
                    "\n\nYou can now transfer this file to another device and import it using the BAR application."
                )
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to export portable file: {str(e)}")
    
    def _import_file(self):
        """Import a file."""
        if not self.current_user:
            return
        
        # Ask for import type
        import_options = ["Import Regular File", "Import Portable Encrypted File"]
        import_type, ok = QInputDialog.getItem(
            self, "Import Type", "Select import type:", import_options, 0, False)
        
        if not ok:
            return
        
        if import_type == "Import Regular File":
            self._import_regular_file()
        else:  # Import Portable Encrypted File
            self._import_portable_file()
    
    def _import_regular_file(self):
        """Import a regular file and encrypt it."""
        # Ask for file to import
        import_path, _ = QFileDialog.getOpenFileName(
            self, "Import File", "", "All Files (*)")
        
        if import_path:
            # Get the file content
            with open(import_path, "rb") as f:
                file_content = f.read()
            
            # Get the filename
            filename = os.path.basename(import_path)
            
            # Show file dialog for security settings
            file_dialog = FileDialog({}, self, filename=filename, file_content=file_content)
            if file_dialog.exec_() == QDialog.Accepted:
                security_settings = file_dialog.get_security_settings()
                password = file_dialog.get_password()
                
                try:
                    file_id = self.file_manager.create_secure_file(
                        file_content, file_dialog.get_filename(), password, security_settings)
                    
                    QMessageBox.information(self, "File Imported", 
                                          f"File '{file_dialog.get_filename()}' has been securely imported.")
                    
                    self._refresh_files()
                except Exception as e:
                    QMessageBox.critical(self, "Error", f"Failed to import file: {str(e)}")
    
    def _import_portable_file(self):
        """Import a portable encrypted file from another device."""
        # Ask for file to import
        import_path, _ = QFileDialog.getOpenFileName(
            self, "Import Portable File", "", "BAR Files (*.bar);;All Files (*)")
        
        if import_path:
            # Ask for password
            password, ok = QInputDialog.getText(
                self, "Enter Password", "Enter the file password:", QLineEdit.Password)
            
            if ok and password:
                try:
                    # Import the portable file
                    file_id = self.file_manager.import_portable_file(import_path, password)
                    
                    QMessageBox.information(
                        self, 
                        "Portable File Imported", 
                        "The portable encrypted file has been successfully imported."
                    )
                    
                    self._refresh_files()
                except Exception as e:
                    QMessageBox.critical(self, "Error", f"Failed to import portable file: {str(e)}")
    
    def _import_shared_file(self):
        """Import an encrypted file shared from another device.
        
        This method specifically handles files created on different hardware,
        ensuring proper decryption regardless of hardware binding differences.
        """
        # Ask for file to import
        import_path, _ = QFileDialog.getOpenFileName(
            self, "Import Shared File", "", "BAR Files (*.bar);;All Files (*)")
        
        if import_path:
            # Ask for password
            password, ok = QInputDialog.getText(
                self, "Enter Password", "Enter the file password:", QLineEdit.Password)
            
            if ok and password:
                try:
                    # Import the shared file
                    file_id = self.file_manager.import_portable_file(import_path, password)
                    
                    QMessageBox.information(
                        self, 
                        "Shared File Imported", 
                        "The encrypted file shared from another device has been successfully imported."
                    )
                    
                    self._refresh_files()
                except ValueError as e:
                    if "hardware binding" in str(e).lower():
                        QMessageBox.critical(
                            self, 
                            "Hardware Binding Error", 
                            "This file appears to be bound to different hardware. "
                            "Please ensure you're using the correct password and that the file "
                            "was properly exported for sharing between devices."
                        )
                    else:
                        QMessageBox.critical(self, "Error", f"Failed to import shared file: {str(e)}")
                except Exception as e:
                    QMessageBox.critical(self, "Error", f"Failed to import shared file: {str(e)}")
    
    def _delete_file(self):
        """Delete a secure file."""
        if not self.current_user:
            return
        
        # Get the file ID from the sender button
        sender = self.sender()
        file_id = sender.property("file_id")
        
        # Confirm deletion
        reply = QMessageBox.question(
            self, "Confirm Deletion", 
            "Are you sure you want to delete this file? This action cannot be undone.",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            try:
                self.file_manager.delete_file(file_id)
                QMessageBox.information(self, "File Deleted", "File has been permanently deleted.")
                self._refresh_files()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to delete file: {str(e)}")
    
    def _change_theme(self, theme_name):
        """Change the application theme."""
        theme = theme_name.lower()
        self.config_manager.set_value("theme", theme)
        self._apply_theme()
    
    def _change_lock_timeout(self, value):
        """Change the auto-lock timeout."""
        self.config_manager.set_value("auto_lock_timeout", value)
        if self.auto_lock_timer.isActive():
            self._reset_auto_lock_timer()
    
    def _save_settings(self):
        """Save the application settings."""
        # Get security settings
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
        
        # Update config
        self.config_manager.update_config({
            "default_security": security_settings
        })
        
        # Update user settings
        if self.current_user:
            self.user_manager.update_user_settings(self.current_user, {
                "default_security": security_settings
            })
        
        QMessageBox.information(self, "Settings Saved", "Your settings have been saved.")
    
    def _change_password(self):
        """Change the current user's password."""
        if not self.current_user:
            return
        
        # Ask for current password
        current_password, ok = QInputDialog.getText(
            self, "Current Password", "Enter your current password:", QLineEdit.Password)

    def _show_about(self):
        """Show the about dialog."""
        QMessageBox.about(
            self,
            "About BAR - Burn After Reading",
            "BAR - Burn After Reading v1.0.0\n\n"
            "A secure file management application with self-destructing files.\n\n"
            "Created by Rolan\n\n"
            "© 2025 BAR BY RNR"
        )
#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the src directory to the path so we can import our modules
src_dir = Path(__file__).resolve().parent / 'src'
sys.path.insert(0, str(src_dir))

# Import required modules
from src.config.config_manager import ConfigManager
from src.crypto.encryption import EncryptionManager
from src.file_manager.file_manager import FileManager
from src.user_manager.user_manager import UserManager
from src.security.hardware_id_bridge import HardwareIdentifier
from src.gui.main_window import MainWindow

# Import PyQt5 modules
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt


def setup_application_directory():
    """Set up the application directory structure."""
    app_dir = Path.home() / '.bar'
    app_dir.mkdir(exist_ok=True)
    
    # Create subdirectories
    (app_dir / 'logs').mkdir(exist_ok=True)
    (app_dir / 'data').mkdir(exist_ok=True)
    
    return app_dir


def main():
    """Main entry point for the BAR application."""
    # Set up application directory
    app_dir = setup_application_directory()
    
    # Initialize application components
    config_manager = ConfigManager(str(app_dir))
    file_manager = FileManager(str(app_dir / 'data'))
    user_manager = UserManager(str(app_dir))
    
    # Create Qt application
    app = QApplication(sys.argv)
    app.setApplicationName("BAR - Burn After Reading")
    app.setApplicationVersion("1.0.0")
    
    # Set application style based on config
    theme = config_manager.get_value('theme', 'dark')
    if theme == 'dark':
        app.setStyle('Fusion')
        # Apply dark palette (will be defined in the MainWindow class)
    
    # Create and show main window
    main_window = MainWindow(config_manager, file_manager, user_manager)
    main_window.show()
    
    # Start the application event loop
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path


class ConfigManager:
    """Manages application configuration for the BAR application."""
    
    # Default configuration
    DEFAULT_CONFIG = {
        "theme": "dark",  # dark, light, system
        "default_security": {
            "expiration_time": None,  # ISO format datetime string
            "max_access_count": None,  # Integer
            "deadman_switch": 30,  # Days
        },
        "file_storage_path": None,  # Will be set during initialization
        "auto_lock_timeout": 5,  # Minutes
        "check_updates": False,  # Disabled for offline app
        "logging_level": "INFO",
    }
    
    def __init__(self, base_directory: str):
        """Initialize the configuration manager.
        
        Args:
            base_directory: The base directory for storing configuration
        """
        self.base_directory = Path(base_directory)
        self.config_file = self.base_directory / "config.json"
        
        # Create base directory if it doesn't exist
        self.base_directory.mkdir(parents=True, exist_ok=True)
        
        # Load or create configuration
        self.config = self._load_config()
        
        # Setup logging
        self._setup_logging()
    
    def _setup_logging(self):
        """Set up logging for the configuration manager."""
        log_dir = self.base_directory / "logs"
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / "config.log"
        
        logging.basicConfig(
            level=getattr(logging, self.config.get("logging_level", "INFO")),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger("ConfigManager")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or create default.
        
        Returns:
            Dictionary containing configuration
        """
        if self.config_file.exists():
            try:
                with open(self.config_file, "r") as f:
                    config = json.load(f)
                
                # Update with any missing default values
                updated = False
                for key, value in self.DEFAULT_CONFIG.items():
                    if key not in config:
                        config[key] = value
                        updated = True
                
                # Set file storage path if not already set
                if not config["file_storage_path"]:
                    config["file_storage_path"] = str(self.base_directory / "data")
                    updated = True
                
                if updated:
                    self._save_config(config)
                
                return config
            except Exception as e:
                print(f"Error loading configuration: {str(e)}")
                return self._create_default_config()
        else:
            return self._create_default_config()
    
    def _create_default_config(self) -> Dict[str, Any]:
        """Create and save default configuration.
        
        Returns:
            Dictionary containing default configuration
        """
        config = self.DEFAULT_CONFIG.copy()
        config["file_storage_path"] = str(self.base_directory / "data")
        
        self._save_config(config)
        return config
    
    def _save_config(self, config: Dict[str, Any]) -> bool:
        """Save configuration to file.
        
        Args:
            config: The configuration to save
            
        Returns:
            True if configuration was saved successfully, False otherwise
        """
        try:
            with open(self.config_file, "w") as f:
                json.dump(config, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving configuration: {str(e)}")
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """Get the current configuration.
        
        Returns:
            Dictionary containing configuration
        """
        return self.config.copy()
    
    def get_value(self, key: str, default: Any = None) -> Any:
        """Get a configuration value.
        
        Args:
            key: The configuration key to get
            default: The default value to return if key doesn't exist
            
        Returns:
            The configuration value, or default if key doesn't exist
        """
        return self.config.get(key, default)
    
    def set_value(self, key: str, value: Any) -> bool:
        """Set a configuration value.
        
        Args:
            key: The configuration key to set
            value: The value to set
            
        Returns:
            True if value was set and saved successfully, False otherwise
        """
        self.config[key] = value
        result = self._save_config(self.config)
        
        if result:
            self.logger.info(f"Configuration updated: {key}")
        
        return result
    
    def update_config(self, config_updates: Dict[str, Any]) -> bool:
        """Update multiple configuration values.
        
        Args:
            config_updates: Dictionary containing configuration updates
            
        Returns:
            True if configuration was updated and saved successfully, False otherwise
        """
        for key, value in config_updates.items():
            if isinstance(value, dict) and isinstance(self.config.get(key), dict):
                # Merge nested dictionaries
                self.config[key].update(value)
            else:
                self.config[key] = value
        
        result = self._save_config(self.config)
        
        if result:
            self.logger.info(f"Configuration updated with multiple values")
        
        return result
    
    def reset_to_defaults(self) -> bool:
        """Reset configuration to defaults.
        
        Returns:
            True if configuration was reset and saved successfully, False otherwise
        """
        self.config = self._create_default_config()
        self.logger.info("Configuration reset to defaults")
        return True
    
    def get_themes(self) -> Dict[str, Dict[str, Any]]:
        """Get available themes.
        
        Returns:
            Dictionary containing theme configurations
        """
        return {
            "dark": {
                "name": "Dark",
                "primary_color": "#2c3e50",
                "secondary_color": "#34495e",
                "accent_color": "#3498db",
                "text_color": "#ecf0f1",
                "background_color": "#1a1a1a",
                "danger_color": "#e74c3c",
                "success_color": "#2ecc71",
                "warning_color": "#f39c12",
            },
            "light": {
                "name": "Light",
                "primary_color": "#3498db",
                "secondary_color": "#2980b9",
                "accent_color": "#9b59b6",
                "text_color": "#2c3e50",
                "background_color": "#ecf0f1",
                "danger_color": "#e74c3c",
                "success_color": "#2ecc71",
                "warning_color": "#f39c12",
            },
            "system": {
                "name": "System",
                "description": "Follows system theme (dark/light)"
            }
        }
    
    def get_current_theme(self) -> Dict[str, Any]:
        """Get the current theme configuration.
        
        Returns:
            Dictionary containing theme configuration
        """
        theme_name = self.config.get("theme", "dark")
        themes = self.get_themes()
        
        if theme_name == "system":
            # For system theme, default to dark for now
            # In a real implementation, this would check the system theme
            theme_name = "dark"
        
        return themes.get(theme_name, themes["dark"])
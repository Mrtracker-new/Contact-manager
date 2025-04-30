from PyQt5.QtGui import QColor, QPalette, QFont
from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QApplication


class StyleManager:
    """Manages application styles and themes."""
    
    # Color schemes
    DARK_THEME = {
        "background": QColor(40, 44, 52),
        "surface": QColor(33, 37, 43),
        "primary": QColor(61, 174, 233),
        "secondary": QColor(142, 68, 173),
        "accent": QColor(26, 188, 156),
        "error": QColor(231, 76, 60),
        "warning": QColor(241, 196, 15),
        "success": QColor(46, 204, 113),
        "text": QColor(255, 255, 255),
        "text_secondary": QColor(189, 195, 199),
        "disabled": QColor(127, 140, 141)
    }
    
    LIGHT_THEME = {
        "background": QColor(240, 240, 240),
        "surface": QColor(255, 255, 255),
        "primary": QColor(41, 128, 185),
        "secondary": QColor(142, 68, 173),
        "accent": QColor(26, 188, 156),
        "error": QColor(231, 76, 60),
        "warning": QColor(243, 156, 18),
        "success": QColor(39, 174, 96),
        "text": QColor(44, 62, 80),
        "text_secondary": QColor(127, 140, 141),
        "disabled": QColor(189, 195, 199)
    }
    
    @staticmethod
    def apply_theme(theme_name: str):
        """Apply the selected theme to the application.
        
        Args:
            theme_name: The name of the theme to apply ("dark", "light", or "system")
        """
        theme_name = theme_name.lower()
        
        if theme_name == "dark":
            StyleManager._apply_dark_theme()
        elif theme_name == "light":
            StyleManager._apply_light_theme()
        else:
            # System theme
            app = QApplication.instance()
            app.setPalette(app.style().standardPalette())
    
    @staticmethod
    def _apply_dark_theme():
        """Apply the dark theme to the application."""
        colors = StyleManager.DARK_THEME
        
        # Create dark palette
        palette = QPalette()
        palette.setColor(QPalette.Window, colors["background"])
        palette.setColor(QPalette.WindowText, colors["text"])
        palette.setColor(QPalette.Base, colors["surface"])
        palette.setColor(QPalette.AlternateBase, colors["background"])
        palette.setColor(QPalette.ToolTipBase, colors["surface"])
        palette.setColor(QPalette.ToolTipText, colors["text"])
        palette.setColor(QPalette.Text, colors["text"])
        palette.setColor(QPalette.Button, colors["background"])
        palette.setColor(QPalette.ButtonText, colors["text"])
        palette.setColor(QPalette.BrightText, colors["accent"])
        palette.setColor(QPalette.Link, colors["primary"])
        palette.setColor(QPalette.Highlight, colors["primary"])
        palette.setColor(QPalette.HighlightedText, colors["text"])
        
        # Disabled colors
        palette.setColor(QPalette.Disabled, QPalette.WindowText, colors["disabled"])
        palette.setColor(QPalette.Disabled, QPalette.Text, colors["disabled"])
        palette.setColor(QPalette.Disabled, QPalette.ButtonText, colors["disabled"])
        
        # Ensure action buttons have visible text
        palette.setColor(QPalette.ButtonText, QColor(255, 255, 255))
        
        app = QApplication.instance()
        app.setPalette(palette)
        
        # Apply stylesheet for additional customization
        app = QApplication.instance()
        app.setStyleSheet("""
            QToolTip { 
                color: #ffffff; 
                background-color: #2a2a2a; 
                border: 1px solid #767676; 
                border-radius: 4px; 
                padding: 4px;
                opacity: 200; 
            }
            
            QWidget {
                background-color: #2c2c2c;
                color: #ffffff;
            }
            
            QTabWidget::pane {
                border: 1px solid #444;
                border-radius: 4px;
                padding: 2px;
            }
            
            QTabBar::tab {
                background-color: #3a3a3a;
                color: #b1b1b1;
                border: 1px solid #444;
                border-bottom-color: #444;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 6px 12px;
                margin-right: 2px;
            }
            
            QTabBar::tab:selected, QTabBar::tab:hover {
                background-color: #3daee9;
                color: #ffffff;
            }
            
            QTabBar::tab:selected {
                border-bottom-color: #3daee9;
            }
            
            QPushButton {
                background-color: #3a3a3a;
                color: #ffffff;
                border: 1px solid #555;
                border-radius: 4px;
                padding: 5px 15px;
                min-width: 80px;
            }
            
            QPushButton:hover {
                background-color: #4a4a4a;
                border: 1px solid #666;
            }
            
            QPushButton:pressed {
                background-color: #2a2a2a;
            }
            
            QPushButton:disabled {
                background-color: #2a2a2a;
                color: #656565;
                border: 1px solid #3a3a3a;
            }
            
            QLineEdit, QTextEdit, QSpinBox, QDateTimeEdit, QComboBox {
                background-color: #232629;
                color: #eff0f1;
                border: 1px solid #555;
                border-radius: 4px;
                padding: 4px;
            }
            
            QLineEdit:focus, QTextEdit:focus, QSpinBox:focus, QDateTimeEdit:focus, QComboBox:focus {
                border: 1px solid #3daee9;
            }
            
            QTableWidget {
                background-color: #232629;
                alternate-background-color: #2a2a2a;
                color: #eff0f1;
                gridline-color: #444;
                border: 1px solid #444;
                border-radius: 4px;
            }
            
            QTableWidget::item:selected {
                background-color: #3daee9;
                color: #ffffff;
            }
            
            QHeaderView::section {
                background-color: #3a3a3a;
                color: #eff0f1;
                padding: 5px;
                border: 1px solid #444;
            }
            
            QScrollBar:vertical {
                background-color: #232629;
                width: 14px;
                margin: 15px 0 15px 0;
                border: 1px solid #444;
                border-radius: 4px;
            }
            
            QScrollBar::handle:vertical {
                background-color: #3a3a3a;
                min-height: 30px;
                border-radius: 3px;
            }
            
            QScrollBar::handle:vertical:hover {
                background-color: #3daee9;
            }
            
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                border: none;
                background: none;
            }
            
            QScrollBar:horizontal {
                background-color: #232629;
                height: 14px;
                margin: 0 15px 0 15px;
                border: 1px solid #444;
                border-radius: 4px;
            }
            
            QScrollBar::handle:horizontal {
                background-color: #3a3a3a;
                min-width: 30px;
                border-radius: 3px;
            }
            
            QScrollBar::handle:horizontal:hover {
                background-color: #3daee9;
            }
            
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
                border: none;
                background: none;
            }
            
            QGroupBox {
                border: 1px solid #444;
                border-radius: 4px;
                margin-top: 20px;
                padding-top: 24px;
            }
            
            QGroupBox::title {
                subcontrol-origin: margin;
                subcontrol-position: top center;
                padding: 0 5px;
                color: #eff0f1;
            }
            
            QMenuBar {
                background-color: #2c2c2c;
                color: #eff0f1;
            }
            
            QMenuBar::item {
                background: transparent;
                padding: 4px 10px;
            }
            
            QMenuBar::item:selected {
                background-color: #3daee9;
                color: #ffffff;
            }
            
            QMenu {
                background-color: #2c2c2c;
                color: #eff0f1;
                border: 1px solid #444;
            }
            
            QMenu::item {
                padding: 5px 30px 5px 20px;
            }
            
            QMenu::item:selected {
                background-color: #3daee9;
                color: #ffffff;
            }
            
            QMenu::separator {
                height: 1px;
                background-color: #444;
                margin: 4px 0;
            }
            
            QStatusBar {
                background-color: #2c2c2c;
                color: #eff0f1;
                border-top: 1px solid #444;
            }
        """)
    
    @staticmethod
    def _apply_light_theme():
        """Apply the light theme to the application."""
        colors = StyleManager.LIGHT_THEME
        
        # Create light palette
        palette = QPalette()
        palette.setColor(QPalette.Window, colors["background"])
        palette.setColor(QPalette.WindowText, colors["text"])
        palette.setColor(QPalette.Base, colors["surface"])
        palette.setColor(QPalette.AlternateBase, colors["background"])
        palette.setColor(QPalette.ToolTipBase, colors["surface"])
        palette.setColor(QPalette.ToolTipText, colors["text"])
        palette.setColor(QPalette.Text, colors["text"])
        palette.setColor(QPalette.Button, colors["background"])
        palette.setColor(QPalette.ButtonText, colors["text"])
        palette.setColor(QPalette.BrightText, colors["accent"])
        palette.setColor(QPalette.Link, colors["primary"])
        palette.setColor(QPalette.Highlight, colors["primary"])
        palette.setColor(QPalette.HighlightedText, colors["surface"])
        
        # Disabled colors
        palette.setColor(QPalette.Disabled, QPalette.WindowText, colors["disabled"])
        palette.setColor(QPalette.Disabled, QPalette.Text, colors["disabled"])
        palette.setColor(QPalette.Disabled, QPalette.ButtonText, colors["disabled"])
        
        # Ensure action buttons have visible text
        palette.setColor(QPalette.ButtonText, QColor(44, 62, 80))
        
        app = QApplication.instance()
        app.setPalette(palette)
        
        # Apply stylesheet for additional customization
        app = QApplication.instance()
        app.setStyleSheet("""
            QToolTip { 
                color: #31363b; 
                background-color: #f7f7f7; 
                border: 1px solid #c0c0c0; 
                border-radius: 4px; 
                padding: 4px;
                opacity: 200; 
            }
            
            QTabWidget::pane {
                border: 1px solid #c0c0c0;
                border-radius: 4px;
                padding: 2px;
            }
            
            QTabBar::tab {
                background-color: #e0e0e0;
                color: #31363b;
                border: 1px solid #c0c0c0;
                border-bottom-color: #c0c0c0;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 6px 12px;
                margin-right: 2px;
            }
            
            QTabBar::tab:selected, QTabBar::tab:hover {
                background-color: #2980b9;
                color: #ffffff;
            }
            
            QTabBar::tab:selected {
                border-bottom-color: #2980b9;
            }
            
            QPushButton {
                background-color: #e0e0e0;
                color: #31363b;
                border: 1px solid #c0c0c0;
                border-radius: 4px;
                padding: 5px 15px;
                min-width: 80px;
            }
            
            QPushButton:hover {
                background-color: #f0f0f0;
                border: 1px solid #a0a0a0;
            }
            
            QPushButton:pressed {
                background-color: #d0d0d0;
            }
            
            QPushButton:disabled {
                background-color: #f0f0f0;
                color: #a0a0a0;
                border: 1px solid #e0e0e0;
            }
            
            QLineEdit, QTextEdit, QSpinBox, QDateTimeEdit, QComboBox {
                background-color: #ffffff;
                color: #31363b;
                border: 1px solid #c0c0c0;
                border-radius: 4px;
                padding: 4px;
            }
            
            QLineEdit:focus, QTextEdit:focus, QSpinBox:focus, QDateTimeEdit:focus, QComboBox:focus {
                border: 1px solid #2980b9;
            }
            
            QTableWidget {
                background-color: #ffffff;
                alternate-background-color: #f7f7f7;
                color: #31363b;
                gridline-color: #c0c0c0;
                border: 1px solid #c0c0c0;
                border-radius: 4px;
            }
            
            QTableWidget::item:selected {
                background-color: #2980b9;
                color: #ffffff;
            }
            
            QHeaderView::section {
                background-color: #e0e0e0;
                color: #31363b;
                padding: 5px;
                border: 1px solid #c0c0c0;
            }
            
            QScrollBar:vertical {
                background-color: #f0f0f0;
                width: 14px;
                margin: 15px 0 15px 0;
                border: 1px solid #c0c0c0;
                border-radius: 4px;
            }
            
            QScrollBar::handle:vertical {
                background-color: #c0c0c0;
                min-height: 30px;
                border-radius: 3px;
            }
            
            QScrollBar::handle:vertical:hover {
                background-color: #2980b9;
            }
            
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                border: none;
                background: none;
            }
            
            QScrollBar:horizontal {
                background-color: #f0f0f0;
                height: 14px;
                margin: 0 15px 0 15px;
                border: 1px solid #c0c0c0;
                border-radius: 4px;
            }
            
            QScrollBar::handle:horizontal {
                background-color: #c0c0c0;
                min-width: 30px;
                border-radius: 3px;
            }
            
            QScrollBar::handle:horizontal:hover {
                background-color: #2980b9;
            }
            
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
                border: none;
                background: none;
            }
            
            QGroupBox {
                border: 1px solid #c0c0c0;
                border-radius: 4px;
                margin-top: 20px;
                padding-top: 24px;
            }
            
            QGroupBox::title {
                subcontrol-origin: margin;
                subcontrol-position: top center;
                padding: 0 5px;
                color: #31363b;
            }
            
            QMenuBar {
                background-color: #f0f0f0;
                color: #31363b;
            }
            
            QMenuBar::item {
                background: transparent;
                padding: 4px 10px;
            }
            
            QMenuBar::item:selected {
                background-color: #2980b9;
                color: #ffffff;
            }
            
            QMenu {
                background-color: #f0f0f0;
                color: #31363b;
                border: 1px solid #c0c0c0;
            }
            
            QMenu::item {
                padding: 5px 30px 5px 20px;
            }
            
            QMenu::item:selected {
                background-color: #2980b9;
                color: #ffffff;
            }
            
            QMenu::separator {
                height: 1px;
                background-color: #c0c0c0;
                margin: 4px 0;
            }
            
            QStatusBar {
                background-color: #f0f0f0;
                color: #31363b;
                border-top: 1px solid #c0c0c0;
            }
        """)
    
    # Base button style used across all button types
    base_style = """
        QPushButton {
            font-family: 'Segoe UI', Arial, sans-serif;
            outline: none;
        }
    """
    
    @staticmethod
    def get_button_style(button_type="default"):
        """Get style for a specific button type.
        
        Args:
            button_type: The type of button ("default", "primary", "danger", "success")
            
        Returns:
            The stylesheet for the button
        """
        if button_type == "primary":
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #2196F3; /* Modern blue */
                    color: white;
                    border: 2px solid #1976D2; /* Border for depth instead of shadow */
                    border-radius: 6px; /* Slightly more rounded */
                    padding: 12px 24px; /* More padding for better touch targets */
                    font-weight: 600; /* Semibold for better readability */
                    text-align: center;
                    min-width: 110px; /* Wider for better proportions */
                    min-height: 44px; /* Taller for better touch targets */
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }
                QPushButton:hover {
                    background-color: #42A5F5; /* Lighter blue on hover */
                    border: 2px solid #2196F3; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #1976D2; /* Darker blue when pressed */
                    border: 2px solid #0D47A1; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #BBDEFB; /* Lighter, desaturated blue */
                    color: #E3F2FD; /* Lighter text */
                    border: 2px solid #BBDEFB; /* Same color as background */
                }
            """
        elif button_type == "danger":
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #F44336; /* Modern red */
                    color: white;
                    border: 2px solid #D32F2F; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 12px 24px;
                    font-weight: 600;
                    text-align: center;
                    min-width: 110px;
                    min-height: 44px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }
                QPushButton:hover {
                    background-color: #EF5350; /* Lighter red on hover */
                    border: 2px solid #F44336; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #D32F2F; /* Darker red when pressed */
                    border: 2px solid #B71C1C; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #FFCDD2; /* Lighter, desaturated red */
                    color: #FFEBEE;
                    border: 2px solid #FFCDD2; /* Same color as background */
                }
            """
        elif button_type == "success":
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #4CAF50; /* Modern green */
                    color: white;
                    border: 2px solid #388E3C; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 12px 24px;
                    font-weight: 600;
                    text-align: center;
                    min-width: 110px;
                    min-height: 44px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }
                QPushButton:hover {
                    background-color: #66BB6A; /* Lighter green on hover */
                    border: 2px solid #4CAF50; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #388E3C; /* Darker green when pressed */
                    border: 2px solid #1B5E20; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #C8E6C9; /* Lighter, desaturated green */
                    color: #E8F5E9;
                    border: 2px solid #C8E6C9; /* Same color as background */
                }
            """
        else:  # default
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #78909C; /* Modern blue-grey */
                    color: white; /* White text for better contrast */
                    border: 2px solid #546E7A; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 12px 24px;
                    font-weight: 600;
                    text-align: center;
                    min-width: 110px;
                    min-height: 44px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }
                QPushButton:hover {
                    background-color: #90A4AE; /* Lighter blue-grey on hover */
                    border: 2px solid #78909C; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #546E7A; /* Darker blue-grey when pressed */
                    border: 2px solid #37474F; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #CFD8DC; /* Lighter, desaturated blue-grey */
                    color: #ECEFF1; /* Lighter text */
                    border: 2px solid #CFD8DC; /* Same color as background */
                }
            """
    
    @staticmethod
    def get_file_icon_style():
        """Get stylesheet for file icons in the file table."""
        return """
            QLabel {
                padding: 2px;
                border-radius: 4px;
            }
        """
        
    @staticmethod
    def create_action_button(text, icon=None, button_type="default"):
        """Create an action button with text and optional icon.
        
        Args:
            text: The text to display on the button
            icon: Optional icon to display on the button
            button_type: The type of button ("default", "primary", "danger", "success")
            
        Returns:
            A configured QPushButton with proper styling
        """
        from PyQt5.QtWidgets import QPushButton
        from PyQt5.QtGui import QIcon
        
        button = QPushButton(text)
        if icon:
            button.setIcon(QIcon(icon))
        
        # Ensure text is visible
        button.setText(text)  # Explicitly set text again
        
        # Apply the appropriate style
        button.setStyleSheet(StyleManager.get_action_button_style(button_type))
        
        # Make sure text is not empty and visible
        button.setProperty("text", text)
        button.setProperty("displayText", True)
        
        # Set explicit font with good contrast
        font = QFont("Segoe UI", 10)
        button.setFont(font)
        
        # Force update to ensure text is displayed
        button.update()
        
        return button
        
    @staticmethod
    def get_action_button_style(button_type="default"):
        """Get style for action buttons in the file table.
        
        Args:
            button_type: The type of button ("default", "primary", "danger", "success", "warning")
            
        Returns:
            The stylesheet for the action button
        """
        # Common style to ensure text visibility for all action buttons
        base_style = """
            QPushButton {
                color: #ffffff !important; /* Force white text for all action buttons */
                font-weight: bold !important; /* Make text bold for better visibility */
                text-align: center !important;
            }
        """
        
        if button_type == "primary":
            return base_style + """
                QPushButton {
                    background-color: #2196F3; /* Modern blue */
                    border: 2px solid #1976D2; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 8px 16px;
                    min-width: 90px;
                    min-height: 38px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    qproperty-iconSize: 18px 18px;
                    margin: 4px;
                    font-family: "Segoe UI", Arial, sans-serif; /* Use a standard font */
                }
                QPushButton:hover {
                    background-color: #42A5F5; /* Lighter blue on hover */
                    border: 2px solid #2196F3; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #1976D2; /* Darker blue when pressed */
                    border: 2px solid #0D47A1; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #BBDEFB; /* Lighter, desaturated blue */
                    color: #E3F2FD; /* Lighter text */
                    border: 2px solid #BBDEFB; /* Same color as background */
                }
            """
        elif button_type == "danger":
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #F44336; /* Modern red */
                    border: 2px solid #D32F2F; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 8px 16px;
                    min-width: 90px;
                    min-height: 38px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    qproperty-iconSize: 18px 18px;
                    margin: 4px;
                    font-family: "Segoe UI", Arial, sans-serif; /* Use a standard font */
                }
                QPushButton:hover {
                    background-color: #EF5350; /* Lighter red on hover */
                    border: 2px solid #F44336; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #D32F2F; /* Darker red when pressed */
                    border: 2px solid #B71C1C; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #FFCDD2; /* Lighter, desaturated red */
                    color: #FFEBEE;
                    border: 2px solid #FFCDD2; /* Same color as background */
                }
            """
        elif button_type == "success":
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #4CAF50; /* Modern green */
                    border: 2px solid #388E3C; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 8px 16px;
                    min-width: 90px;
                    min-height: 38px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    qproperty-iconSize: 18px 18px;
                    margin: 4px;
                    font-family: "Segoe UI", Arial, sans-serif; /* Use a standard font */
                }
                QPushButton:hover {
                    background-color: #66BB6A; /* Lighter green on hover */
                    border: 2px solid #4CAF50; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #388E3C; /* Darker green when pressed */
                    border: 2px solid #1B5E20; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #C8E6C9; /* Lighter, desaturated green */
                    color: #E8F5E9;
                    border: 2px solid #C8E6C9; /* Same color as background */
                }
            """
        else:  # default
            return StyleManager.base_style + """
                QPushButton {
                    background-color: #78909C; /* Modern blue-grey */
                    border: 2px solid #546E7A; /* Border for depth instead of shadow */
                    border-radius: 6px;
                    padding: 8px 16px;
                    min-width: 90px;
                    min-height: 38px;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    qproperty-iconSize: 18px 18px;
                    margin: 4px;
                    font-family: "Segoe UI", Arial, sans-serif; /* Use a standard font */
                }
                QPushButton:hover {
                    background-color: #90A4AE; /* Lighter blue-grey on hover */
                    border: 2px solid #78909C; /* Lighter border on hover */
                }
                QPushButton:pressed {
                    background-color: #546E7A; /* Darker blue-grey when pressed */
                    border: 2px solid #37474F; /* Darker border when pressed */
                }
                QPushButton:disabled {
                    background-color: #CFD8DC; /* Lighter, desaturated blue-grey */
                    color: #ECEFF1; /* Lighter text */
                    border: 2px solid #CFD8DC; /* Same color as background */
                }
            """
    
    @staticmethod
    def get_dialog_style():
        """Get stylesheet for dialog windows."""
        return """
            QDialog {
                background-color: palette(window);
                border-radius: 8px;
            }
            QGroupBox {
                border: 1px solid palette(mid);
                border-radius: 6px;
                margin-top: 12px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                subcontrol-position: top center;
                padding: 0 5px;
                background-color: palette(window);
            }
        """
    
    @staticmethod
    def get_form_style():
        """Get stylesheet for form elements."""
        return """
            QLineEdit, QTextEdit, QComboBox, QSpinBox, QDateTimeEdit {
                border: 1px solid palette(mid);
                border-radius: 4px;
                padding: 5px;
                background-color: palette(base);
                selection-background-color: palette(highlight);
                selection-color: palette(highlighted-text);
            }
            QLineEdit:focus, QTextEdit:focus, QComboBox:focus, QSpinBox:focus, QDateTimeEdit:focus {
                border: 1px solid palette(highlight);
            }
            QComboBox::drop-down {
                border: none;
                width: 20px;
            }
        """
    
    @staticmethod
    def get_header_style():
        """Get stylesheet for header labels."""
        return """
            QLabel {
                font-size: 16pt;
                font-weight: bold;
                color: #3daee9;
                padding: 10px 0;
            }
        """
    
    @staticmethod
    def get_form_container_style():
        """Get stylesheet for form containers."""
        return """
            QWidget {
                background-color: transparent;
                border-radius: 8px;
                padding: 10px;
            }
        """
    
    @staticmethod
    def get_table_style():
        """Get stylesheet for table widgets."""
        return """
            QTableWidget {
                border: 1px solid palette(mid);
                border-radius: 4px;
                gridline-color: palette(mid);
                selection-background-color: palette(highlight);
                selection-color: palette(highlighted-text);
            }
            QTableWidget::item {
                padding: 4px;
                border-bottom: 1px solid palette(mid);
            }
            QHeaderView::section {
                background-color: palette(button);
                padding: 4px;
                border: 1px solid palette(mid);
                font-weight: bold;
            }
        """
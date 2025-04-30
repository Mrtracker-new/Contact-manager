import os
import sys
from typing import Optional, Dict, Any, Callable

from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, QScrollArea,
    QPushButton, QFileDialog, QMessageBox, QSizePolicy, QFrame
)
from PyQt5.QtCore import Qt, QSize, pyqtSignal
from PyQt5.QtGui import QPixmap, QImage, QFont, QPalette, QColor

from ..security.screen_protection import Watermarker
from .styles import StyleManager


class FileViewer(QWidget):
    """Custom widget for displaying file content with enhanced UI."""
    
    # Signal emitted when the user requests to close the viewer
    close_requested = pyqtSignal()
    
    def __init__(self, parent=None):
        """Initialize the file viewer.
        
        Args:
            parent: The parent widget
        """
        super().__init__(parent)
        
        self.content_type = "unknown"  # text, image, binary
        self.is_view_only = False
        self.username = ""
        self.watermarker = None
        
        # Set up exception handling
        sys.excepthook = self._handle_uncaught_exception
        
        self._setup_ui()
        
    def _handle_uncaught_exception(self, exc_type, exc_value, exc_traceback):
        """Handle uncaught exceptions to prevent app crashes.
        
        Args:
            exc_type: Exception type
            exc_value: Exception value
            exc_traceback: Exception traceback
        """
        # Log the error
        import traceback
        error_msg = ''.join(traceback.format_exception(exc_type, exc_value, exc_traceback))
        print(f"Uncaught exception in FileViewer: {error_msg}")
        
        # Show error message to user if possible
        try:
            QMessageBox.critical(self, "Error", 
                                "An error occurred while processing the file. \n\n" + 
                                str(exc_value))
        except:
            pass
        
        # Restore default exception handler
        sys.excepthook = sys.__excepthook__
    
    def _setup_ui(self):
        """Set up the user interface."""
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        # Content area
        self.content_area = QScrollArea()
        self.content_area.setWidgetResizable(True)
        self.content_area.setFrameShape(QFrame.NoFrame)
        self.layout.addWidget(self.content_area)
        
        # Text content widget
        self.text_widget = QTextEdit()
        self.text_widget.setReadOnly(True)
        self.text_widget.setVisible(False)
        
        # Image content widget
        self.image_container = QWidget()
        self.image_layout = QVBoxLayout(self.image_container)
        self.image_layout.setAlignment(Qt.AlignCenter)
        
        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.image_layout.addWidget(self.image_label)
        
        # Binary content widget (placeholder for unsupported content)
        self.binary_widget = QWidget()
        self.binary_layout = QVBoxLayout(self.binary_widget)
        self.binary_layout.setAlignment(Qt.AlignCenter)
        
        self.binary_icon = QLabel("🔒")
        font = self.binary_icon.font()
        font.setPointSize(48)
        self.binary_icon.setFont(font)
        self.binary_icon.setAlignment(Qt.AlignCenter)
        self.binary_layout.addWidget(self.binary_icon)
        
        self.binary_message = QLabel("This file cannot be displayed")
        self.binary_message.setAlignment(Qt.AlignCenter)
        font = self.binary_message.font()
        font.setBold(True)
        font.setPointSize(14)
        self.binary_message.setFont(font)
        self.binary_layout.addWidget(self.binary_message)
        
        self.binary_info = QLabel("The file format is not supported for direct viewing")
        self.binary_info.setAlignment(Qt.AlignCenter)
        self.binary_info.setWordWrap(True)
        self.binary_layout.addWidget(self.binary_info)
        
        # Action buttons
        self.button_container = QWidget()
        self.button_layout = QHBoxLayout(self.button_container)
        self.button_layout.setContentsMargins(10, 10, 10, 10)
        
        # Add spacer to push buttons to the right
        self.button_layout.addStretch()
        
        # Export button (only shown for exportable files)
        self.export_button = QPushButton("Export")
        self.export_button.setStyleSheet(StyleManager.get_button_style("primary"))
        self.export_button.setMinimumWidth(120)
        self.export_button.clicked.connect(self._export_requested)
        self.button_layout.addWidget(self.export_button)
        
        # Close button
        self.close_button = QPushButton("Close")
        self.close_button.setStyleSheet(StyleManager.get_button_style())
        self.close_button.setMinimumWidth(120)
        self.close_button.clicked.connect(self._close_requested)
        self.button_layout.addWidget(self.close_button)
        
        self.layout.addWidget(self.button_container)
    
    def display_content(self, content: bytes, metadata: Dict[str, Any], username: str):
        """Display file content based on its type.
        
        Args:
            content: The file content as bytes
            metadata: The file metadata
            username: The current username for watermarking
        """
        try:
            # Clean up any previous content to free memory
            self._cleanup_resources()
            
            self.username = username
            self.watermarker = Watermarker(username)
            self.is_view_only = metadata.get("security", {}).get("disable_export", False)
            
            # Show/hide export button based on export restrictions
            self.export_button.setVisible(not self.is_view_only)
            
            # Try to display as text
            try:
                text_content = content.decode('utf-8')
                self._display_text(text_content)
                return
            except UnicodeDecodeError:
                # Not text, try as image
                pass
            
            # Try to display as image
            try:
                # Check if content is too large (>10MB) to prevent memory issues
                if len(content) > 10 * 1024 * 1024:  # 10MB limit
                    print(f"Image too large ({len(content) / (1024*1024):.2f} MB), may cause memory issues")
                    # Still try to load but with a warning
                
                pixmap = QPixmap()
                load_success = False
                
                # Try to load the image data
                try:
                    load_success = pixmap.loadFromData(content)
                except Exception as e:
                    print(f"Primary image loading failed: {str(e)}")
                    # Try alternative loading method
                    try:
                        image = QImage()
                        if image.loadFromData(content):
                            pixmap = QPixmap.fromImage(image)
                            load_success = not pixmap.isNull()
                    except Exception as alt_e:
                        print(f"Alternative image loading also failed: {str(alt_e)}")
                
                if load_success:
                    # Clear content from memory before displaying the image
                    content = None
                    
                    # Force garbage collection before processing large images
                    import gc
                    gc.collect()
                    
                    self._display_image(pixmap)
                    return
                else:
                    print("Failed to load image data: Image format may be unsupported")
            except Exception as e:
                # Not an image or couldn't display it
                print(f"Error loading image: {str(e)}")
                # Ensure pixmap is released
                try:
                    pixmap = None
                    import gc
                    gc.collect()
                except:
                    pass
            
            # Check if this is a PDF file
            filename = metadata.get("filename", "").lower()
            if filename.endswith(".pdf"):
                # Handle PDF as a special file type
                metadata["file_type"] = "pdf"
                
            # Default to binary/unsupported format
            self._display_binary(metadata)
        except Exception as e:
            print(f"Unexpected error in display_content: {str(e)}")
            # Show a basic error message if everything fails
            self._display_binary({"file_type": "unknown", "error": str(e)})
    
    def _display_text(self, text: str):
        """Display text content.
        
        Args:
            text: The text content to display
        """
        self.content_type = "text"
        
        # Set up text display
        self.text_widget.setPlainText(text)
        self.content_area.setWidget(self.text_widget)
        self.text_widget.setVisible(True)
        
        # Apply watermark if view-only
        if self.is_view_only and self.watermarker:
            self.watermarker.apply_text_watermark(self.text_widget)
    
    def _display_image(self, pixmap: QPixmap):
        """Display image content.
        
        Args:
            pixmap: The image pixmap to display
        """
        try:
            # Verify the pixmap is valid
            if pixmap.isNull():
                self._display_binary({"file_type": "media"})
                return
                
            # Check if image dimensions are too large
            if pixmap.width() > 8000 or pixmap.height() > 8000:
                print(f"Image dimensions too large: {pixmap.width()}x{pixmap.height()}")
                # Pre-scale very large images to prevent memory issues
                try:
                    max_dimension = 4000
                    if pixmap.width() > pixmap.height():
                        pixmap = pixmap.scaled(max_dimension, 
                                              int(max_dimension * pixmap.height() / pixmap.width()), 
                                              Qt.KeepAspectRatio, 
                                              Qt.FastTransformation)
                    else:
                        pixmap = pixmap.scaled(int(max_dimension * pixmap.width() / pixmap.height()),
                                              max_dimension, 
                                              Qt.KeepAspectRatio, 
                                              Qt.FastTransformation)
                except Exception as e:
                    print(f"Error pre-scaling large image: {str(e)}")
                    # Continue with original if pre-scaling fails
            
            self.content_type = "image"
            
            # Clear any previous notices from the layout
            for i in reversed(range(self.image_layout.count())):
                item = self.image_layout.itemAt(i)
                if item.widget() != self.image_label:
                    item.widget().deleteLater()
            
            # Scale the image to fit the view while maintaining aspect ratio
            try:
                # Get the current size of the viewport for better scaling
                viewport_width = self.content_area.viewport().width() or 800
                viewport_height = self.content_area.viewport().height() or 600
                
                # Scale to fit viewport with some margin
                target_width = max(100, min(viewport_width - 20, 1200))
                target_height = max(100, min(viewport_height - 20, 800))
                
                scaled_pixmap = pixmap.scaled(
                    target_width, target_height, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                
                # Force garbage collection of the original pixmap if it's very large
                if pixmap.width() * pixmap.height() > 4000000:  # More than 4 million pixels
                    pixmap = None  # Help garbage collection
                    import gc
                    gc.collect()  # Force garbage collection
                    
            except Exception as e:
                print(f"Error scaling image: {str(e)}")
                # If scaling fails, use original
                scaled_pixmap = pixmap
            
            # Apply watermark if view-only
            try:
                final_pixmap = None
                if self.is_view_only and self.watermarker:
                    try:
                        watermarked_pixmap = self.watermarker.apply_image_watermark(
                            self.image_label, scaled_pixmap)
                        final_pixmap = watermarked_pixmap
                    except Exception as e:
                        print(f"Error applying watermark: {str(e)}")
                        # If watermarking fails, use the scaled pixmap
                        final_pixmap = scaled_pixmap
                else:
                    final_pixmap = scaled_pixmap
                
                # Verify the final pixmap is valid before setting it
                if final_pixmap and not final_pixmap.isNull():
                    # Set the pixmap in a safe way
                    try:
                        self.image_label.setPixmap(final_pixmap)
                    except Exception as set_error:
                        print(f"Error setting pixmap to label: {str(set_error)}")
                        # Last resort - create a new small pixmap
                        fallback_pixmap = QPixmap(400, 300)
                        fallback_pixmap.fill(QColor(240, 240, 240))
                        self.image_label.setPixmap(fallback_pixmap)
                else:
                    print("Final pixmap is null or invalid")
                    self._display_binary({"file_type": "media", "error": "Invalid image data"})
                    return
            except Exception as e:
                print(f"Unexpected error in pixmap handling: {str(e)}")
                self._display_binary({"file_type": "media", "error": str(e)})
                return
            
            # Add view-only notice if applicable
            if self.is_view_only:
                notice = QLabel("This media file is view-only and cannot be exported")
                notice.setAlignment(Qt.AlignCenter)
                font = notice.font()
                font.setBold(True)
                notice.setFont(font)
                notice.setStyleSheet("color: #e74c3c;")
                self.image_layout.addWidget(notice)
            
            self.content_area.setWidget(self.image_container)
        except Exception as e:
            print(f"Error displaying image: {str(e)}")
            # Fall back to binary display if image display fails
            self._display_binary({"file_type": "media", "error": str(e)})
    
    def _display_binary(self, metadata: Dict[str, Any]):
        """Display placeholder for binary/unsupported content.
        
        Args:
            metadata: The file metadata
        """
        self.content_type = "binary"
        
        # Reset icon and styles to default first
        self.binary_icon.setText("🔒")
        self.binary_icon.setStyleSheet("")
        self.binary_message.setStyleSheet("")
        
        # Update messages based on file type
        is_media = metadata.get("file_type") == "media"
        is_pdf = metadata.get("file_type") == "pdf" or (metadata.get("filename", "").lower().endswith(".pdf"))
        error_message = metadata.get("error", "")
        
        if (is_media or is_pdf) and self.is_view_only:
            file_type_text = "media" if is_media else "PDF"
            self.binary_message.setText(f"This {file_type_text} file is view-only and cannot be exported")
            self.binary_info.setText(
                f"{file_type_text.capitalize()} files are protected by default to prevent unauthorized distribution. "
                "Currently, only image formats (JPG, PNG, GIF, etc.) can be viewed directly.")
        elif is_media:
            self.binary_message.setText("Unable to display this image")
            if error_message:
                self.binary_info.setText(
                    f"There was an error processing this image: {error_message}\n"
                    "Try exporting the file to view it in an external application.")
            else:
                self.binary_info.setText(
                    "The image format may be unsupported or the file might be corrupted. "
                    "Try exporting the file to view it in an external application.")
        elif is_pdf and self.is_view_only:
            # Special message for PDF files that are view-only
            self.binary_message.setText("PDF file is view-only and cannot be exported")
            self.binary_info.setText(
                "PDF files are protected by default to prevent unauthorized distribution. "
                "Currently, PDF files cannot be displayed directly in the app when export is denied. "
                "You can request support for PDF viewing through your administrator.")
            
            # Change icon to indicate this is informational rather than an error
            self.binary_icon.setText("ℹ️")
            self.binary_icon.setStyleSheet("color: #3498db;") # Blue color for info
            self.binary_message.setStyleSheet("color: #3498db; margin-bottom: 10px;") # Match the icon color with spacing
            
            # Apply special styling to the info text to highlight supported formats
            self.binary_info.setStyleSheet("line-height: 150%; background-color: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 5px;")
        elif self.is_view_only:
            # Special message for other non-media files that are view-only
            self.binary_message.setText("File type not supported for in-app viewing")
            self.binary_info.setText(
                "When export is denied for security reasons, only certain file types can be displayed directly in the app:\n\n"
                "• Images (JPG, PNG, GIF, BMP, etc.) - Currently supported\n"
                "• Text files (TXT, MD, etc.) - Currently supported\n\n"
                "Other file types (DOC, XLS, etc.) cannot currently be displayed in the app when export is denied. "
                "You can request support for additional file types through your administrator.")
            
            # Change icon to indicate this is informational rather than an error
            self.binary_icon.setText("ℹ️")
            self.binary_icon.setStyleSheet("color: #3498db;") # Blue color for info
            self.binary_message.setStyleSheet("color: #3498db; margin-bottom: 10px;") # Match the icon color with spacing
            
            # Apply special styling to the info text to highlight supported formats
            self.binary_info.setStyleSheet("line-height: 150%; background-color: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 5px;")
        else:
            self.binary_message.setText("This file cannot be displayed in-app")
            if error_message:
                self.binary_info.setText(
                    f"Error: {error_message}\n\n"
                    "The file format is not supported for direct viewing in the application. "
                    "You can use the Export button below to save and open this file in an appropriate external application.")
            else:
                self.binary_info.setText(
                    "Currently, only these file types can be viewed directly in the app:\n\n"
                    "• Images (JPG, PNG, GIF, BMP, etc.)\n"
                    "• Text files (TXT, MD, etc.)\n\n"
                    "Please use the Export button below to save and open this file in an appropriate external application.")
                
            # Apply consistent styling
            self.binary_message.setStyleSheet("color: #e74c3c; margin-bottom: 10px;") # Red color for warning
            self.binary_info.setStyleSheet("line-height: 150%; background-color: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 5px;")
        
        self.content_area.setWidget(self.binary_widget)
    
    def _export_requested(self):
        """Handle export button click."""
        # This will be connected to an external handler
        pass
    
    def _close_requested(self):
        """Handle close button click."""
        self._cleanup_resources()
        self.close_requested.emit()
        
    def _cleanup_resources(self):
        """Clean up resources to prevent memory leaks."""
        # Clear image resources
        if self.content_type == "image":
            # Clear pixmap from label
            self.image_label.setPixmap(QPixmap())
            
            # Clear any notices
            for i in reversed(range(self.image_layout.count())):
                item = self.image_layout.itemAt(i)
                if item.widget() != self.image_label:
                    widget = item.widget()
                    if widget:
                        widget.setParent(None)
                        widget.deleteLater()
        
        # Force garbage collection
        import gc
        gc.collect()
    
    def set_export_handler(self, handler: Callable):
        """Set the handler for export button clicks.
        
        Args:
            handler: The callback function to handle export requests
        """
        self.export_button.clicked.disconnect(self._export_requested)
        self.export_button.clicked.connect(handler)
import os
import sys
import time
import threading
import platform
import random
from typing import Callable, Optional

from PyQt5.QtWidgets import QWidget, QTextEdit, QLabel, QApplication
from PyQt5.QtGui import QPixmap, QPainter, QColor, QFont, QPen, QBrush, QImage
from PyQt5.QtCore import Qt, QTimer, QSize, QPoint, QRect, QObject, pyqtSignal, QPointF

# Import platform-specific modules
if platform.system().lower() == 'windows':
    from .win_screenshot_prevention import KeyboardHook, ScreenCaptureBlocker


class ScreenshotDetector(QObject):
    """Detects screenshot attempts on different platforms."""
    
    # Signal emitted when a screenshot is detected
    screenshot_detected = pyqtSignal()
    # Signal emitted when a screenshot hotkey is detected
    screenshot_hotkey_detected = pyqtSignal()
    
    def __init__(self, parent=None):
        """Initialize the screenshot detector.
        
        Args:
            parent: The parent QObject
        """
        super().__init__(parent)
        self.last_clipboard_image = None
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._check_clipboard)
        
        # Platform-specific setup
        self.os_type = platform.system().lower()
        
        # Windows-specific keyboard hook for hotkey detection
        self.keyboard_hook = None
        if self.os_type == 'windows':
            try:
                self.keyboard_hook = KeyboardHook(self)
                self.keyboard_hook.screenshot_hotkey_detected.connect(self.screenshot_hotkey_detected)
            except Exception as e:
                print(f"Failed to initialize keyboard hook: {e}")
                self.keyboard_hook = None
        
        # Start monitoring - but don't crash if it fails
        try:
            self.start_monitoring()
        except Exception as e:
            print(f"Failed to start screenshot monitoring: {e}")
            # Continue without monitoring if it fails
    
    def start_monitoring(self):
        """Start monitoring for screenshots."""
        try:
            # Check clipboard every 500ms
            self.timer.start(500)
            
            # Store initial clipboard state
            self._update_clipboard_state()
        except Exception as e:
            print(f"Failed to start clipboard monitoring: {e}")
        
        # Start platform-specific monitoring
        if self.os_type == 'windows' and self.keyboard_hook:
            try:
                self.keyboard_hook.start()
            except Exception as e:
                print(f"Failed to start keyboard hook: {e}")
                self.keyboard_hook = None
                # Continue without keyboard hook if it fails
    
    def stop_monitoring(self):
        """Stop monitoring for screenshots."""
        self.timer.stop()
        
        # Stop platform-specific monitoring
        if self.os_type == 'windows' and self.keyboard_hook:
            try:
                self.keyboard_hook.stop()
            except Exception as e:
                print(f"Failed to stop keyboard hook: {e}")
                # Don't set to None here as we might want to restart it later
    
    def _check_clipboard(self):
        """Check if clipboard contains a new image (potential screenshot)."""
        clipboard = QApplication.clipboard()
        mime_data = clipboard.mimeData()
        
        if mime_data.hasImage():
            current_image = clipboard.image()
            
            # If we have a previous image to compare with
            if self.last_clipboard_image is not None:
                # Check if this is a new image
                if not self._images_match(current_image, self.last_clipboard_image):
                    # New image detected in clipboard, likely a screenshot
                    self.screenshot_detected.emit()
            
            # Update stored image
            self.last_clipboard_image = current_image
    
    def _update_clipboard_state(self):
        """Update the stored clipboard state."""
        clipboard = QApplication.clipboard()
        if clipboard.mimeData().hasImage():
            self.last_clipboard_image = clipboard.image()
        else:
            self.last_clipboard_image = None
    
    def _images_match(self, img1: QImage, img2: QImage) -> bool:
        """Compare two QImages to see if they match.
        
        Args:
            img1: First image
            img2: Second image
            
        Returns:
            True if images match, False otherwise
        """
        if img1.size() != img2.size():
            return False
        
        # Compare a few random pixels for performance
        width, height = img1.width(), img1.height()
        sample_size = min(20, width * height)  # Sample up to 20 pixels
        
        for _ in range(sample_size):
            x = random.randint(0, width - 1)
            y = random.randint(0, height - 1)
            
            if img1.pixel(x, y) != img2.pixel(x, y):
                return False
        
        return True


class Watermarker:
    """Applies watermarks to content for view-only files."""
    
    def __init__(self, username: str):
        """Initialize the watermarker.
        
        Args:
            username: The current username for watermarking
        """
        self.username = username
    
    def apply_text_watermark(self, text_edit: QTextEdit) -> None:
        """Apply watermark to text content.
        
        Args:
            text_edit: The text edit widget to watermark
        """
        # Add watermark to text
        current_text = text_edit.toPlainText()
        watermarked_text = self._create_text_watermark(current_text)
        text_edit.setPlainText(watermarked_text)
        
        # Disable copy/paste
        text_edit.setTextInteractionFlags(Qt.TextSelectableByKeyboard | Qt.TextSelectableByMouse)
        
        # Add diagonal watermark as background
        text_edit.setStyleSheet(
            "background: repeating-linear-gradient(45deg, transparent, "
            "transparent 100px, rgba(200, 200, 200, 0.1) 100px, "
            "rgba(200, 200, 200, 0.1) 200px);"
        )
    
    def apply_image_watermark(self, image_label: QLabel, pixmap: QPixmap) -> QPixmap:
        """Apply watermark to image content.
        
        Args:
            image_label: The label displaying the image
            pixmap: The original image pixmap
            
        Returns:
            The watermarked pixmap or original pixmap if watermarking fails
        """
        try:
            # Verify the pixmap is valid
            if pixmap.isNull() or pixmap.width() <= 0 or pixmap.height() <= 0:
                print("Cannot apply watermark to invalid pixmap")
                return pixmap
                
            # Check if image is too large for watermarking
            if pixmap.width() * pixmap.height() > 25000000:  # 25 million pixels
                print(f"Image too large for watermarking: {pixmap.width()}x{pixmap.height()}")
                # For very large images, return a simple copy without watermark
                # to avoid memory issues during the painting process
                return pixmap
                
            # Create a copy of the pixmap to avoid modifying the original
            try:
                watermarked_pixmap = pixmap.copy()
            except Exception as copy_error:
                print(f"Failed to copy pixmap: {str(copy_error)}")
                return pixmap
            
            # Add watermark
            painter = QPainter()
            if not painter.begin(watermarked_pixmap):
                print("Failed to initialize painter on pixmap")
                return pixmap
            
            try:
                # Set up semi-transparent text with much higher visibility
                painter.setOpacity(0.8)  # Significantly increased opacity for better visibility
                painter.setPen(QPen(QColor(255, 0, 0, 255)))  # Fully opaque bright red color
                
                # Use a larger font size based on image dimensions
                font_size = max(14, min(24, watermarked_pixmap.width() // 30))
                font = QFont("Arial", font_size)
                font.setBold(True)  # Make text bold for better visibility
                painter.setFont(font)
                
                # Add diagonal watermark with username and timestamp
                timestamp = time.strftime("%Y-%m-%d %H:%M")
                watermark_text = f"Viewed by {self.username} at {timestamp}"
                
                # Calculate diagonal position and rotate text
                painter.save()
                try:
                    painter.translate(watermarked_pixmap.width() / 2, watermarked_pixmap.height() / 2)
                    painter.rotate(-45)
                    text_width = painter.fontMetrics().width(watermark_text)
                    painter.drawText(QPointF(-text_width / 2, 0), watermark_text)
                except Exception as text_error:
                    print(f"Error drawing watermark text: {str(text_error)}")
                painter.restore()
                
                # Add a border watermark with higher visibility
                try:
                    # Reset opacity for border to ensure it's visible
                    painter.setOpacity(0.9)
                    painter.setPen(QPen(QColor(255, 0, 0, 255), 5))  # Thicker, fully opaque border
                    painter.drawRect(QRect(5, 5, watermarked_pixmap.width() - 10, watermarked_pixmap.height() - 10))
                    
                    # Add repeating diagonal watermarks for better coverage
                    painter.setOpacity(0.7)  # Higher opacity for diagonal watermarks
                    painter.setPen(QPen(QColor(255, 0, 0, 255)))  # Fully opaque red color
                    # Font is already set to bold from earlier
                    
                    # Draw more watermarks across the image for better coverage
                    for i in range(-3, 4):  # Increased range for more watermarks
                        y_offset = i * (watermarked_pixmap.height() / 5)  # Closer spacing
                        painter.save()
                        painter.translate(watermarked_pixmap.width() / 2, 
                                        watermarked_pixmap.height() / 2 + y_offset)
                        painter.rotate(-45)
                        text_width = painter.fontMetrics().width(watermark_text)
                        painter.drawText(QPointF(-text_width / 2, 0), watermark_text)
                        painter.restore()
                        
                    # Add horizontal watermarks for even more coverage
                    for i in range(-2, 3):
                        x_offset = i * (watermarked_pixmap.width() / 4)
                        painter.save()
                        painter.translate(watermarked_pixmap.width() / 2 + x_offset,
                                        watermarked_pixmap.height() / 2)
                        painter.rotate(-45)
                        text_width = painter.fontMetrics().width(watermark_text)
                        painter.drawText(QPointF(-text_width / 2, 0), watermark_text)
                        painter.restore()
                except Exception as border_error:
                    print(f"Error drawing watermark border: {str(border_error)}")
            finally:
                # Ensure painter is always ended properly
                try:
                    painter.end()
                except Exception as end_error:
                    print(f"Error ending painter: {str(end_error)}")
                
            return watermarked_pixmap
            
        except Exception as e:
            print(f"Error applying image watermark: {str(e)}")
            # Return the original pixmap if watermarking fails
            return pixmap
    
    def _create_text_watermark(self, text: str) -> str:
        """Create a watermarked version of text content.
        
        Args:
            text: The original text
            
        Returns:
            The watermarked text
        """
        # Add a header watermark
        timestamp = time.strftime("%Y-%m-%d %H:%M")
        watermark_header = f"--- Viewed by {self.username} at {timestamp} ---\n\n"
        
        # Add a footer watermark
        watermark_footer = f"\n\n--- Protected content - Do not distribute ---"
        
        # Combine with original text
        watermarked_text = watermark_header + text + watermark_footer
        
        return watermarked_text


class ScreenProtectionManager:
    """Manages watermarking and screenshot detection for secure content."""
    
    def __init__(self, username: str, parent_widget: QWidget = None):
        """Initialize the screen protection manager.
        
        Args:
            username: The current username
            parent_widget: The parent widget for the detector
        """
        self.username = username
        self.watermarker = Watermarker(username)
        self.screenshot_detector = ScreenshotDetector(parent_widget)
        
        # Connect screenshot detection to handler
        self.screenshot_detector.screenshot_detected.connect(self._on_screenshot_detected)
        # Connect screenshot hotkey detection signal
        self.screenshot_detector.screenshot_hotkey_detected.connect(self._on_screenshot_hotkey_detected)
        self.screenshot_callback = None
        
        # Screen capture blocker (Windows-specific)
        self.capture_blocker = None
        if platform.system().lower() == 'windows':
            try:
                from .win_screenshot_prevention import ScreenCaptureBlocker
                self.capture_blocker = ScreenCaptureBlocker()
            except Exception as e:
                print(f"Failed to initialize screen capture blocker: {e}")
                self.capture_blocker = None
            
        # Store parent widget for window handle
        self.parent_widget = parent_widget
    
    def set_screenshot_callback(self, callback: Callable):
        """Set a callback function to be called when a screenshot is detected.
        
        Args:
            callback: The function to call when a screenshot is detected
        """
        self.screenshot_callback = callback
    
    def _on_screenshot_detected(self):
        """Handle screenshot detection."""
        if self.screenshot_callback:
            self.screenshot_callback()
            
    def _on_screenshot_hotkey_detected(self):
        """Internal handler for screenshot hotkey detection."""
        # This method is called when a screenshot hotkey combination is detected
        # It can be used for internal handling before any external callbacks are invoked
        print("Screenshot hotkey detected and blocked")
        
        # The signal will also trigger any connected external callbacks
    
    def protect_text_content(self, text_widget: QWidget):
        """Apply protection to text content.
        
        Args:
            text_widget: The text widget to protect
        """
        self.watermarker.apply_text_watermark(text_widget)
    
    def protect_image_content(self, image_label: QLabel, original_pixmap: QPixmap) -> QPixmap:
        """Apply protection to image content.
        
        Args:
            image_label: The label displaying the image
            original_pixmap: The original image pixmap
            
        Returns:
            The protected pixmap
        """
        return self.watermarker.apply_image_watermark(image_label, original_pixmap)
    
    def start_monitoring(self):
        """Start monitoring for screenshots."""
        try:
            self.screenshot_detector.start_monitoring()
        except Exception as e:
            print(f"Failed to start screenshot monitoring: {str(e)}")
            # Continue even if screenshot monitoring fails
        
        # Start screen capture blocking if available
        if self.capture_blocker and self.parent_widget:
            try:
                # Get window handle from parent widget
                hwnd = None
                if hasattr(self.parent_widget, 'winId'):
                    try:
                        hwnd = int(self.parent_widget.winId())
                        # Store the window handle but don't crash if it fails
                        try:
                            self.capture_blocker.target_hwnd = hwnd
                        except Exception as e:
                            print(f"Failed to set target window handle: {str(e)}")
                            # Continue without setting the handle
                    except Exception as e:
                        print(f"Failed to get window handle: {str(e)}")
                        # Continue with hwnd = None
                
                # Start the blocker, but don't crash if it fails
                try:
                    success = self.capture_blocker.start(hwnd)
                    if not success:
                        print("Screen capture blocker failed to start properly")
                        # Don't crash the application, just continue without the blocker
                        self.capture_blocker = None
                except Exception as e:
                    print(f"Failed to start screen capture blocker: {str(e)}")
                    # Disable the blocker to prevent further attempts
                    self.capture_blocker = None
            except Exception as e:
                print(f"Failed to start screen capture blocker: {str(e)}")
                # Continue even if screen capture blocking fails
                self.capture_blocker = None
    
    def stop_monitoring(self):
        """Stop monitoring for screenshots."""
        try:
            self.screenshot_detector.stop_monitoring()
        except Exception as e:
            print(f"Failed to stop screenshot monitoring: {str(e)}")
            # Continue even if stopping monitoring fails
        
        # Stop screen capture blocking if active
        if self.capture_blocker:
            try:
                success = self.capture_blocker.stop()
                if not success:
                    print("Screen capture blocker did not stop cleanly")
            except Exception as e:
                print(f"Failed to stop screen capture blocker: {str(e)}")
                # Continue even if stopping the blocker fails
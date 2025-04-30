import ctypes
import threading
from ctypes import wintypes
import win32con
import win32gui
import win32api
from PyQt5.QtCore import QObject, pyqtSignal, QTimer

# Windows API constants
WH_KEYBOARD_LL = 13
WM_KEYDOWN = 0x0100
WM_KEYUP = 0x0101
WM_SYSKEYDOWN = 0x0104

# Key codes
VK_SNAPSHOT = 0x2C  # Print Screen key
VK_LWIN = 0x5B      # Left Windows key
VK_RWIN = 0x5C      # Right Windows key
VK_SHIFT = 0x10     # Shift key
VK_S = 0x53         # S key

class KeyboardHook(QObject):
    """Windows keyboard hook to detect screenshot hotkeys."""
    
    # Signal emitted when a screenshot hotkey is detected
    screenshot_hotkey_detected = pyqtSignal()
    
    def __init__(self, parent=None):
        """Initialize the keyboard hook.
        
        Args:
            parent: The parent QObject
        """
        super().__init__(parent)
        self.hooked = False
        self.hook_thread = None
        self.hook_id = None
        self.key_state = {}
        self.timer = None
        try:
            self.user32 = ctypes.WinDLL('user32', use_last_error=True)
        except Exception as e:
            print(f"Failed to load user32.dll: {e}")
            self.user32 = None
        
        # Track key states
        self.win_pressed = False
        self.shift_pressed = False
        self.s_pressed = False
        
        # Define callback function type
        self.LowLevelKeyboardProc = ctypes.CFUNCTYPE(
            wintypes.LPARAM, 
            ctypes.c_int, 
            wintypes.WPARAM, 
            wintypes.LPARAM
        )
        
        # Create callback function
        # Use ctypes.CFUNCTYPE to ensure correct function pointer type
        self._keyboard_proc_callback = self._keyboard_proc  # Store reference to prevent garbage collection
        self.keyboard_callback = self.LowLevelKeyboardProc(self._keyboard_proc_callback)
    
    def start(self):
        """Start the keyboard hook in a separate thread."""
        if not self.hooked:
            self.hooked = True
            self.hook_thread = threading.Thread(target=self._hook_thread_func)
            self.hook_thread.daemon = True
            self.hook_thread.start()
            
            # Start a timer to periodically check for screenshot apps
            self.timer = QTimer()
            self.timer.timeout.connect(self._check_screenshot_apps)
            self.timer.start(1000)  # Check every second
    
    def stop(self):
        """Stop the keyboard hook."""
        if self.timer:
            self.timer.stop()
            self.timer = None
            
        if self.hooked:
            self.hooked = False
            if self.hook_id:
                self.user32.UnhookWindowsHookEx(self.hook_id)
                self.hook_id = None
    
    def _hook_thread_func(self):
        """Thread function for the keyboard hook."""
        if not self.user32:
            print("Cannot set keyboard hook: user32.dll not loaded")
            return
            
        try:
            # Make sure we have the correct function prototype and handle
            # Error 126 typically means "The specified module could not be found"
            # Ensure module handle is valid
            module_handle = ctypes.windll.kernel32.GetModuleHandleW(None)
            if not module_handle:
                print("Failed to get module handle")
                return
                
            # Set the hook with proper error handling
            self.hook_id = self.user32.SetWindowsHookExA(
                WH_KEYBOARD_LL,
                self.keyboard_callback,
                module_handle,
                0
            )
        except Exception as e:
            print(f"Failed to set keyboard hook: {e}")
            return
        
        if not self.hook_id:
            error_code = ctypes.get_last_error()
            print(f"Failed to set keyboard hook: {error_code}")
            # Continue without the hook - don't crash the application
            return
        
        # Message loop - with error handling
        try:
            msg = wintypes.MSG()
            while self.hooked and self.user32.GetMessageA(ctypes.byref(msg), 0, 0, 0) != 0:
                self.user32.TranslateMessage(ctypes.byref(msg))
                self.user32.DispatchMessageA(ctypes.byref(msg))
        except Exception as e:
            print(f"Error in keyboard hook message loop: {e}")
            # Don't crash the application, just exit the thread
    
    def _keyboard_proc(self, n_code, w_param, l_param):
        """Keyboard hook callback function.
        
        Args:
            n_code: The hook code
            w_param: The key state (pressed/released)
            l_param: Pointer to a KBDLLHOOKSTRUCT structure
            
        Returns:
            The result of CallNextHookEx
        """
        try:
            if n_code >= 0:
                try:
                    kb = ctypes.cast(l_param, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
                    key_code = kb.vkCode
                    
                    # Track key state for complex combinations
                    key_down = (w_param == WM_KEYDOWN or w_param == WM_SYSKEYDOWN)
                    key_up = (w_param == WM_KEYUP or w_param == 0x0105)  # WM_KEYUP or WM_SYSKEYUP
                    
                    if key_down:
                        self.key_state[key_code] = True
                    elif key_up:
                        self.key_state[key_code] = False
                    
                    # Key down events
                    if w_param in (WM_KEYDOWN, WM_SYSKEYDOWN):
                        # Track PrintScreen key directly
                        if key_code == VK_SNAPSHOT:
                            print("PrintScreen detected and blocked")
                            try:
                                self.screenshot_hotkey_detected.emit()
                            except Exception as e:
                                print(f"Error emitting screenshot signal: {e}")
                            return 1  # Block the key
                        
                        # Track Win+Shift+S combination
                        if key_code == VK_LWIN or key_code == VK_RWIN:
                            self.win_pressed = True
                        elif key_code == VK_SHIFT:
                            self.shift_pressed = True
                        elif key_code == VK_S:
                            self.s_pressed = True
                        
                        # Check for Win+Shift+S combination
                        if self.win_pressed and self.shift_pressed and self.s_pressed:
                            print("Win+Shift+S detected and blocked")
                            try:
                                self.screenshot_hotkey_detected.emit()
                            except Exception as e:
                                print(f"Error emitting screenshot signal: {e}")
                            return 1  # Block the key
                        
                        # Check for Alt+PrintScreen (window screenshot)
                        try:
                            if key_code == VK_S and win32api.GetAsyncKeyState(0x12) & 0x8000:  # Alt key
                                if self.win_pressed and self.shift_pressed:
                                    print("Alt+Win+Shift+S detected and blocked")
                                    try:
                                        self.screenshot_hotkey_detected.emit()
                                    except Exception as e:
                                        print(f"Error emitting screenshot signal: {e}")
                                    return 1  # Block the key
                        except Exception as e:
                            print(f"Error checking Alt key state: {e}")
                    
                    # Key up events
                    elif w_param in (WM_KEYUP, 0x0105):  # WM_KEYUP or WM_SYSKEYUP
                        if key_code == VK_LWIN or key_code == VK_RWIN:
                            self.win_pressed = False
                        elif key_code == VK_SHIFT:
                            self.shift_pressed = False
                        elif key_code == VK_S:
                            self.s_pressed = False
                except Exception as e:
                    print(f"Error processing keyboard event: {e}")
            
            # Call the next hook with robust error handling
            try:
                if self.user32 and self.hook_id:
                    return self.user32.CallNextHookEx(self.hook_id, n_code, w_param, l_param)
                return 0
            except Exception as e:
                print(f"Error calling next hook: {e}")
                return 0
        except Exception as e:
            print(f"Critical error in keyboard hook: {e}")
            # Don't crash the application, just pass the event through
            return 0
    
    def _check_screenshot_apps(self):
        """Check if any known screenshot applications are running and block them."""
        try:
            # List of known screenshot application window titles (partial matches)
            screenshot_apps = [
                "Snipping Tool", 
                "Snip & Sketch",
                "Screenshot",
                "Greenshot",
                "Lightshot",
                "Screenpresso",
                "Snagit"
            ]
            
            # Function to be called for each window
            def enum_window_callback(hwnd, _):
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                
                window_text = win32gui.GetWindowText(hwnd)
                for app in screenshot_apps:
                    if app.lower() in window_text.lower():
                        print(f"Screenshot app detected: {window_text}")
                        # Try to close or minimize the window
                        try:
                            win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
                        except:
                            pass
                        self.screenshot_hotkey_detected.emit()
                return True
            
            # Enumerate all windows
            win32gui.EnumWindows(enum_window_callback, None)
        except Exception as e:
            print(f"Error checking screenshot apps: {e}")

# KBDLLHOOKSTRUCT structure for keyboard hook
class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", wintypes.DWORD),
        ("scanCode", wintypes.DWORD),
        ("flags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_void_p),
    ]

# Window overlay to prevent screen capture
class ScreenCaptureBlocker:
    """Windows-specific screen capture blocker.
    
    Creates multiple transparent overlay windows that prevent screen capture.
    """
    
    def __init__(self):
        self.overlay_hwnds = []
        self.timer = None
        self.gdi32 = None
        
        # Try to load user32.dll and gdi32.dll
        try:
            self.user32 = ctypes.WinDLL('user32', use_last_error=True)
            self.gdi32 = ctypes.WinDLL('gdi32', use_last_error=True)
        except Exception as e:
            print(f"Failed to load required DLLs: {e}")
            self.user32 = None
    
    def start(self, parent_hwnd=None):
        """Start the screen capture blocker.
        
        Args:
            parent_hwnd: Handle to the parent window
            
        Returns:
            True if at least one overlay was created, False otherwise
        """
        if not self.user32:
            print("Cannot start screen capture blocker: required DLLs not loaded")
            return False
            
        try:
            # Clear any existing overlays
            self.stop()
            
            # Get screen dimensions
            try:
                screen_width = self.user32.GetSystemMetrics(0)  # SM_CXSCREEN
                screen_height = self.user32.GetSystemMetrics(1)  # SM_CYSCREEN
            except Exception as e:
                print(f"Error getting screen dimensions: {e}")
                # Use fallback dimensions
                screen_width = 1920
                screen_height = 1080
            
            # Create main full-screen overlay
            try:
                main_overlay = self._create_overlay(0, 0, screen_width, screen_height)
                if main_overlay:
                    self.overlay_hwnds.append(main_overlay)
            except Exception as e:
                print(f"Error creating main overlay: {e}")
            
            # Try to create additional overlays for multi-monitor setups
            # but don't fail if this doesn't work
            try:
                # Get information about all monitors
                def monitor_enum_proc(hMonitor, hdcMonitor, lprcMonitor, dwData):
                    try:
                        # lprcMonitor points to a RECT structure with monitor coordinates
                        rect = ctypes.cast(lprcMonitor, ctypes.POINTER(wintypes.RECT)).contents
                        # Create an overlay for this monitor
                        monitor_overlay = self._create_overlay(
                            rect.left, rect.top, 
                            rect.right - rect.left, 
                            rect.bottom - rect.top
                        )
                        if monitor_overlay:
                            self.overlay_hwnds.append(monitor_overlay)
                    except Exception as e:
                        print(f"Error creating overlay for monitor: {e}")
                    return True
                
                # Define callback function type
                MonitorEnumProc = ctypes.WINFUNCTYPE(
                    ctypes.c_bool,
                    ctypes.c_void_p,
                    ctypes.c_void_p,
                    ctypes.POINTER(wintypes.RECT),
                    ctypes.c_void_p
                )
                
                # Enumerate all monitors
                callback = MonitorEnumProc(monitor_enum_proc)
                self.user32.EnumDisplayMonitors(None, None, callback, 0)
            except Exception as e:
                print(f"Error creating multi-monitor overlays: {e}")
            
            # Create a timer to periodically refresh the overlays
            try:
                if self.timer is None:
                    self.timer = QTimer()
                    self.timer.timeout.connect(self._refresh_overlays)
                self.timer.start(500)  # Refresh every 500ms
            except Exception as e:
                print(f"Error starting overlay refresh timer: {e}")
            
            # Check if we created at least one overlay
            if not self.overlay_hwnds:
                print("Failed to create any overlay windows")
                return False
                
            return True
        except Exception as e:
            print(f"Error starting screen capture blocker: {e}")
            # Make sure to clean up any resources
            self.stop()
            return False
    
    def _refresh_overlays(self):
        """Periodically refresh the overlays to ensure they stay on top."""
        if not self.user32:
            return
            
        if not self.overlay_hwnds:
            return
            
        try:
            # Define constants if not available in win32con
            HWND_TOPMOST = getattr(win32con, 'HWND_TOPMOST', -1)
            SWP_NOMOVE = getattr(win32con, 'SWP_NOMOVE', 0x0002)
            SWP_NOSIZE = getattr(win32con, 'SWP_NOSIZE', 0x0001)
            SWP_NOACTIVATE = getattr(win32con, 'SWP_NOACTIVATE', 0x0010)
            
            # Refresh each overlay
            invalid_hwnds = []
            for hwnd in self.overlay_hwnds:
                if not hwnd:
                    invalid_hwnds.append(hwnd)
                    continue
                    
                try:
                    # Check if window still exists
                    if not self.user32.IsWindow(hwnd):
                        invalid_hwnds.append(hwnd)
                        continue
                        
                    # Ensure window is still on top
                    result = self.user32.SetWindowPos(
                        hwnd, HWND_TOPMOST,
                        0, 0, 0, 0,
                        SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
                    )
                    
                    if not result:
                        # Window might be invalid
                        invalid_hwnds.append(hwnd)
                except Exception as e:
                    print(f"Error refreshing overlay {hwnd}: {e}")
                    invalid_hwnds.append(hwnd)
            
            # Remove invalid window handles
            if invalid_hwnds:
                for hwnd in invalid_hwnds:
                    if hwnd in self.overlay_hwnds:
                        self.overlay_hwnds.remove(hwnd)
                
                # If all overlays are gone, try to recreate them
                if not self.overlay_hwnds:
                    print("All overlay windows are invalid, attempting to recreate")
                    self.start()
        except Exception as e:
            print(f"Error refreshing overlays: {e}")
    
    def stop(self):
        """Stop the screen capture blocker.
        
        Returns:
            True if successfully stopped, False if errors occurred
        """
        success = True
        
        # Stop the refresh timer
        if self.timer:
            try:
                self.timer.stop()
                self.timer = None
            except Exception as e:
                print(f"Error stopping timer: {e}")
                success = False
        
        # Destroy all overlay windows
        if self.overlay_hwnds and self.user32:
            for hwnd in list(self.overlay_hwnds):  # Create a copy of the list to safely modify during iteration
                try:
                    if hwnd and self.user32.IsWindow(hwnd):
                        self.user32.DestroyWindow(hwnd)
                except Exception as e:
                    print(f"Error destroying window {hwnd}: {e}")
                    success = False
            
            # Clear the list regardless of errors
            self.overlay_hwnds = []
        
        return success
    
    def _create_overlay(self, x, y, width, height):
        """Create a transparent overlay window.
        
        Args:
            x: X position
            y: Y position
            width: Window width
            height: Window height
            
        Returns:
            Window handle or None if creation fails
        """
        if not self.user32:
            print("Cannot create overlay: user32.dll not loaded")
            return None
            
        try:
            # Window class name
            class_name = "ScreenCaptureBlockerClass"
            
            # Define WNDCLASS structure
            class WNDCLASS(ctypes.Structure):
                _fields_ = [
                    ("style", ctypes.c_uint),
                    ("lpfnWndProc", ctypes.c_void_p),
                    ("cbClsExtra", ctypes.c_int),
                    ("cbWndExtra", ctypes.c_int),
                    ("hInstance", ctypes.c_void_p),
                    ("hIcon", ctypes.c_void_p),
                    ("hCursor", ctypes.c_void_p),
                    ("hbrBackground", ctypes.c_void_p),
                    ("lpszMenuName", ctypes.c_char_p),
                    ("lpszClassName", ctypes.c_char_p)
                ]
            
            # Define constants if not available in win32con
            WS_EX_LAYERED = getattr(win32con, 'WS_EX_LAYERED', 0x00080000)
            WS_EX_TRANSPARENT = getattr(win32con, 'WS_EX_TRANSPARENT', 0x00000020)
            WS_EX_TOPMOST = getattr(win32con, 'WS_EX_TOPMOST', 0x00000008)
            WS_POPUP = getattr(win32con, 'WS_POPUP', 0x80000000)
            LWA_ALPHA = getattr(win32con, 'LWA_ALPHA', 0x00000002)
            LWA_COLORKEY = getattr(win32con, 'LWA_COLORKEY', 0x00000001)
            SW_SHOW = getattr(win32con, 'SW_SHOW', 5)
            HWND_TOPMOST = getattr(win32con, 'HWND_TOPMOST', -1)
            SWP_NOMOVE = getattr(win32con, 'SWP_NOMOVE', 0x0002)
            SWP_NOSIZE = getattr(win32con, 'SWP_NOSIZE', 0x0001)
            
            # Register window class
            wnd_class = WNDCLASS()
            # Convert DefWindowProcA to the correct function pointer type
            try:
                # Correct function signature for WNDPROC
                WNDPROC = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p, ctypes.c_uint, ctypes.c_void_p, ctypes.c_void_p)
                wnd_proc_func = WNDPROC(self.user32.DefWindowProcA)
                wnd_class.lpfnWndProc = ctypes.cast(wnd_proc_func, ctypes.c_void_p)
                wnd_class.hInstance = ctypes.windll.kernel32.GetModuleHandleW(None)
                wnd_class.lpszClassName = class_name.encode('utf-8')
                # Initialize other fields to prevent memory issues
                wnd_class.style = 0
                wnd_class.cbClsExtra = 0
                wnd_class.cbWndExtra = 0
                wnd_class.hIcon = 0
                wnd_class.hCursor = 0
                wnd_class.hbrBackground = 0
                wnd_class.lpszMenuName = None
            except Exception as e:
                print(f"Error setting up window class: {e}")
                return None
            
            # Register the window class - don't fail if already registered
            result = self.user32.RegisterClassA(ctypes.byref(wnd_class))
            if not result:
                error_code = ctypes.get_last_error()
                # Error 1410 means class already registered, which is fine
                if error_code != 1410:  # ERROR_CLASS_ALREADY_EXISTS
                    print(f"Failed to register window class: {error_code}")
                    return None
            
            # Create the window with more aggressive anti-screenshot properties
            try:
                # Ensure all parameters have the correct types to prevent overflow errors
                overlay_hwnd = self.user32.CreateWindowExA(
                    ctypes.c_int(WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST),
                    class_name.encode('utf-8'),
                    b"Screen Capture Blocker",
                    ctypes.c_int(WS_POPUP),
                    ctypes.c_int(x), ctypes.c_int(y), 
                    ctypes.c_int(width), ctypes.c_int(height),
                    None, None, wnd_class.hInstance, None
                )
                
                if not overlay_hwnd:
                    error_code = ctypes.get_last_error()
                    print(f"Failed to create overlay window: {error_code}")
                    return None
            except Exception as e:
                print(f"Exception creating overlay window: {e}")
                return None
            
            # Create a solid black background that will appear in screenshots
            # but be transparent to the user
            try:
                # Import GDI32 for advanced drawing
                if self.gdi32 is None:
                    self.gdi32 = ctypes.WinDLL('gdi32', use_last_error=True)
                
                # Create a device context
                hdc = self.user32.GetDC(overlay_hwnd)
                if hdc:
                    # Create a compatible DC for drawing
                    memDC = self.gdi32.CreateCompatibleDC(hdc)
                    if memDC:
                        # Create a bitmap
                        bitmap = self.gdi32.CreateCompatibleBitmap(hdc, width, height)
                        if bitmap:
                            # Select bitmap into DC
                            self.gdi32.SelectObject(memDC, bitmap)
                            
                            # Fill with black
                            brush = self.gdi32.CreateSolidBrush(0x00000000)  # Black
                            rect = wintypes.RECT(0, 0, width, height)
                            self.user32.FillRect(memDC, ctypes.byref(rect), brush)
                            self.gdi32.DeleteObject(brush)
                            
                            # Apply to window
                            SRCCOPY = 0x00CC0020
                            self.user32.BitBlt(hdc, 0, 0, width, height, memDC, 0, 0, SRCCOPY)
                            
                            # Clean up
                            self.gdi32.DeleteObject(bitmap)
                        self.gdi32.DeleteDC(memDC)
                    self.user32.ReleaseDC(overlay_hwnd, hdc)
            except Exception as e:
                print(f"Failed to create black background: {e}")
                # Continue even if background creation fails
            
            try:
                # Make the window semi-transparent to the user but opaque to screenshots
                self.user32.SetLayeredWindowAttributes(
                    overlay_hwnd, 0, 10, LWA_ALPHA  # Very low alpha (10) makes it nearly invisible to user
                )
                
                # Show the window
                self.user32.ShowWindow(overlay_hwnd, SW_SHOW)
                self.user32.UpdateWindow(overlay_hwnd)
                
                # Set window to always be on top with highest priority
                self.user32.SetWindowPos(
                    overlay_hwnd, HWND_TOPMOST,
                    0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE
                )
                
                # Ensure window stays on top by setting a timer to periodically bring it to front
                try:
                    # Create a timer to keep window on top
                    WM_TIMER = 0x0113
                    TIMER_ID = 1
                    self.user32.SetTimer(overlay_hwnd, TIMER_ID, 100, None)  # 100ms interval
                except Exception as e:
                    print(f"Failed to set timer: {e}")
                    # Continue even if timer creation fails
            except Exception as e:
                print(f"Error configuring overlay window: {e}")
                # Try to destroy the window if configuration fails
                try:
                    self.user32.DestroyWindow(overlay_hwnd)
                except:
                    pass
                return None
                
            # Return the successfully created window handle
            return overlay_hwnd
        except Exception as e:
            print(f"Error creating overlay window: {e}")
            return None
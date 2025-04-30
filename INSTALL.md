# BAR - Burn After Reading: Installation Guide

This document provides instructions for installing and running the BAR secure file management application.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

### Option 1: Running from Source

1. Clone or download this repository

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python main.py
   ```

### Option 2: Building a Standalone Executable

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the build script:
   ```
   python build.py
   ```

3. The executable will be created in the `dist` directory

4. Run the executable by double-clicking `BAR.exe`

## First-Time Setup

1. When you first run the application, you'll need to create a user account
2. Click the "Register" button on the login screen
3. Enter a username and strong password
4. Your password is used for encryption, so make sure to remember it!

## Security Considerations

- All data is stored locally in the `~/.bar` directory
- Files are encrypted with AES-256 using your password
- If you forget your password, your data cannot be recovered
- Self-destructing files will be permanently deleted when their conditions are met

## Troubleshooting

- If the application fails to start, check that all dependencies are installed
- Log files are stored in the `~/.bar/logs` directory
- For issues with file encryption, ensure you're using the correct password
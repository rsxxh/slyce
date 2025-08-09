# Slyce

A cross-platform Electron app for taking screenshots and extracting text using OCR (Tesseract.js).

## Features

- **Simple Selection**: Drag to select any area of your screen
- **Instant Copy**: Text is automatically copied to your clipboard
- **Privacy First**: Everything stays local on your machine
- **Lightning Fast**: Powered by Tesseract.js for accurate OCR
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Installation

### macOS

1. Download the `.dmg` file from [GitHub Releases](https://github.com/rsxxh/slyce/releases)
2. Open the `.dmg` file and drag `Slyce.app` to your Applications folder
3. **Important**: If you see "Slyce.app is damaged" error:
   - Right-click on `Slyce.app` in Applications
   - Select "Open" from the context menu
   - Click "Open" in the security dialog that appears
   - The app will now work normally

### Alternative macOS Fix

If the above doesn't work, run this command in Terminal:

```bash
sudo xattr -rd com.apple.quarantine /Applications/Slyce.app
```


## Usage

1. **Start the app**: Launch Slyce from your Applications/Start Menu
2. **Trigger selection**: Press `⌘+Shift+O` (macOS) or `Ctrl+Shift+O` (Windows/Linux)
3. **Select area**: Drag your mouse to select the text area
4. **Get text**: The extracted text is automatically copied to your clipboard
5. **Paste anywhere**: Use `⌘+V` (macOS) or `Ctrl+V` (Windows/Linux) to paste

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
git clone https://github.com/rsxxh/slyce.git
cd slyce

npm install

npm start
```

### Building

```bash
npm run build

npm run build:mac
npm run build:win
npm run build:linux


```

## Troubleshooting

### macOS "App is Damaged" Error

This is a common issue with unsigned apps on macOS. Here's how to fix it:

1. **Method 1 (Recommended)**:
   - Right-click on `Slyce.app` in Applications
   - Select "Open" from the context menu
   - Click "Open" in the security dialog

2. **Method 2 (Terminal)**:
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/Slyce.app
   ```

3. **Method 3 (System Preferences)**:
   - Go to System Preferences → Security & Privacy
   - Click "Allow Anyway" next to Slyce

### App Not Starting

- Check if you have the required permissions
- Try running from Terminal to see error messages
- Ensure you have the latest version

### OCR Not Working

- The app includes Tesseract.js data files
- First run might take longer as it loads the OCR engine
- Ensure you have sufficient RAM (2GB+ recommended)

## Technical Details

- **Framework**: Electron
- **OCR Engine**: Tesseract.js
- **Screenshot**: screenshot-desktop
- **Image Processing**: Sharp
- **UI**: Custom HTML/CSS/JS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request


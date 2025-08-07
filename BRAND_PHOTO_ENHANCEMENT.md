# Brand Photo Upload Enhancement

## Features Added

### 📋 Paste from Clipboard

- **Keyboard Shortcut**: `Ctrl+V` to paste images directly from clipboard
- **Automatic Detection**: Detects image content in clipboard and pastes automatically
- **Visual Feedback**: Shows spinning loader when pasting
- **Success Toast**: Confirms successful paste operation

### 🖱️ Drag & Drop Support

- **Drag Over**: Visual feedback when dragging files over the component
- **Drop Zone**: The photo area accepts dropped image files
- **Visual Indicators**: Border changes color and shows upload icon during drag
- **File Validation**: Only accepts image files

### 📁 File Upload (Original)

- **Click to Upload**: Traditional file picker via upload button
- **File Validation**: Accepts only image files (image/\*)

## How to Use

### Method 1: Paste from Clipboard

1. Copy an image to your clipboard (Ctrl+C from any image)
2. Open the Brand creation/editing dialog
3. Press `Ctrl+V` or right-click and paste
4. Image will be automatically uploaded

### Method 2: Drag & Drop

1. Open the Brand creation/editing dialog
2. Drag an image file from your computer
3. Drop it on the photo area (border will highlight)
4. Image will be automatically uploaded

### Method 3: Traditional Upload

1. Click the "Upload Photo" button
2. Select image from file picker
3. Image will be uploaded

## Visual Feedback

- **Normal State**: Dashed border with image icon
- **Dragging State**: Blue border with upload icon and scale effect
- **Pasting State**: Blue border with spinning loader
- **Success State**: Toast notification and image preview

## Technical Implementation

- **Event Listeners**: Global paste, dragover, dragleave, and drop events
- **File Validation**: Checks for image MIME types
- **Error Handling**: Shows error toasts for invalid files or failed operations
- **Memory Management**: Proper cleanup of event listeners on component unmount
- **FileReader API**: Converts files to base64 data URLs for preview

## Supported Image Formats

All common image formats are supported:

- JPEG/JPG
- PNG
- GIF
- WebP
- SVG
- BMP

The enhanced brand photo upload now provides a modern, user-friendly experience with multiple upload methods!

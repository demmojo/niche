# Image and Screenshot Import

Extending the Raw Data Import feature to support visual competitive intelligence via drag-and-drop and clipboard pasting.

## Features

### 1. Multi-modal Dropzone

- **Requirement:** The dropzone in `UploadDataModal` must accept `.png`, `.jpg`, `.jpeg`, and `.webp` files in addition to the existing text formats. It must support selecting/dropping multiple images at once.

### 2. Clipboard Paste Support

- **Requirement:** When the `UploadDataModal` is open, pasting an image from the clipboard should instantly add it to the upload queue.

### 3. File Queue Management

- **Requirement:** The UI must display thumbnails or file names for the queued images. Users must be able to remove individual images from the queue before analyzing.
- **Requirement:** If a user adds a text file, it should clear the queue of any images (and vice versa) to keep the analysis context unambiguous.

### 4. Image Compression and API Formatting

- **Requirement:** Before calling the Gemini API, all queued images must be resized (if larger than 1600px) and converted to base64 `inlineData` objects with their respective MIME types.

## Scenarios

- **WHEN** a user opens the modal and presses Cmd+V with a screenshot in their clipboard, **THEN** the image is added to the upload queue and displayed in the UI.
- **WHEN** a user drags 3 screenshots into the modal, **THEN** all 3 are queued.
- **WHEN** the user clicks "Analyze Data" with 3 images, **THEN** they are compressed and sent to Gemini alongside the extraction prompt, returning parsed sources and insights.

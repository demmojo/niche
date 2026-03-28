## 1. Utilities

- [x] 1.1 Create a utility function in `src/utils/imageUtils.ts` to read a `File`, draw it to an HTML Canvas (downscaling if necessary, e.g., max 1600x1600), and output a base64 data URL.

## 2. Modal State and UI

- [x] 2.1 Update `UploadDataModal.tsx` state to handle an array of files: `const [files, setFiles] = useState<File[]>([]);`.
- [x] 2.2 Update `handleDrop` and `handleFileChange` to accept multiple image files but restrict text files to single-file replacements. Add a max-files limit (e.g., 5).
- [x] 2.3 Add a `useEffect` to attach a global or container-level `paste` event listener to intercept clipboard images and add them to the state.
- [x] 2.4 Update the UI to render a grid or list of the selected files (showing thumbnails for images using `URL.createObjectURL()`), with a "remove" button for each. Ensure object URLs are revoked to prevent memory leaks.

## 3. API Integration

- [x] 3.1 Update the `handleAnalyze` function. If the files are images, map over them, apply the compression utility, and construct the `inlineData` payload format required by `@google/genai`.
- [x] 3.2 Ensure the prompt correctly instructs Gemini to analyze the provided images (and/or text) and return the JSON structure for `newSources` and `newInsights`.

## 4. Testing

- [x] 4.1 Manually verify drag-and-drop, file selection, and copy-paste for images.
- [x] 4.2 Manually verify that text files (CSV, JSON, MD) still work correctly.
- [x] 4.3 Monitor the network request payload to ensure client-side compression is effective.

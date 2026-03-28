## 1. Core Supabase Storage Setup

- [ ] 1.1 Verify `@supabase/supabase-js` is installed.
- [ ] 1.2 In `src/utils/hashing.ts`, ensure the `supabase` client is exported and correctly initialized with the Firebase JWT.
- [ ] 1.3 Manually configure a `raw-data-images` bucket in the Supabase dashboard with RLS policies allowing `team_id` access.

## 2. Image Upload Logic

- [ ] 2.1 In `src/components/UploadDataModal.tsx`, import the `supabase` client from `../utils/hashing` and `auth` from `../firebase`.
- [ ] 2.2 Update `handleAnalyze` to iterate over `imageFiles`. For each image:
  - Wait for the existing `compressImage` promise.
  - Convert the `base64Data` back to a Blob or use the original file if compression isn't needed for storage (or convert base64 to Blob).
  - Upload to Supabase Storage: `supabase.storage.from('raw-data-images').upload(\`${auth.currentUser?.uid}/${Date.now()}\_${img.name}\`, imageBlob)`.
  - Retrieve the public URL using `supabase.storage.from('raw-data-images').getPublicUrl(path)`.
  - Pass the public URL to the AI context as the filename context (`\nFilename: ${publicUrl}`) instead of the local `img.name`.
- [ ] 2.3 Modify the `newSources` object schema in the Gemini prompt so it uses the persistent public URL for the `sourceUrl` property instead of the inferred local filename. (e.g. inject a map of filename -> URL so the AI knows the URLs). _Alternatively, do a post-processing pass after the AI responds: if the AI returns a local filename, map it back to the uploaded URL in the `sources` array before calling `onDataAnalyzed`._

## 3. UI Updates: Display and Download

- [ ] 3.1 In `src/components/DataSourceCard.tsx`, add a `Download` icon import from `lucide-react`.
- [ ] 3.2 Add a new download function inside or above the `DataSourceCard` component that uses a programmatic `fetch` to retrieve the blob from `sourceUrl` and triggers an anchor tag download. (Include a `try/catch` block for CORS issues).
- [ ] 3.3 In the image section of the `DataSourceCard` (`source.type === "screenshot"`), add the new `Download` button alongside the `Maximize2` button in the absolute positioned overlay (`div.absolute.inset-0`). Implement an `onClick` handler that calls the new download function.

## 4. Final Review

- [ ] 4.1 Verify that Supabase Storage bucket and RLS policies are configured correctly (requires manual intervention, add a note in `docs/deployment/SUPABASE_FIREBASE_GUIDE.md`).
- [ ] 4.2 Verify the `compressImage` utility still works correctly with the AI.
- [ ] 4.3 Test uploading an image, ensure the card renders, and ensure the download button works locally.

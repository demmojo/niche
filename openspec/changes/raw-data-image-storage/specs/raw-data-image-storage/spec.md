# Raw Data Image Storage & Download

This spec details the implementation of persistent cloud storage for user-uploaded images in the Raw Data Library, utilizing Supabase Storage.

## Features

### 1. Supabase Storage Initialization

- **Requirement:** Ensure a Supabase Storage bucket named `raw-data-images` is created and configured with RLS policies allowing access based on `team_id` (via the Firebase JWT custom claims).

### 2. Client-Side Image Upload

- **Requirement:** Modify `src/components/UploadDataModal.tsx`. When a user clicks "Analyze Data", before sending the image to the Gemini AI:
  1. Compress the image using the existing `compressImage` utility.
  2. Upload the compressed image Blob to the `raw-data-images` Supabase Storage bucket using the authenticated Supabase client (`src/utils/hashing.ts` exports it). The path should ideally be scoped by team ID, e.g., `{teamId}/{timestamp}_{filename}`.
  3. Retrieve the public download URL from Supabase Storage.
  4. Use this persistent URL as the `sourceUrl` in the `newSources` array instead of the local filename.

### 3. Displaying and Downloading the Image

- **Requirement:** Update `src/components/DataSourceCard.tsx`.
  1. The `DataSourceCard` already displays the image if the type is a screenshot. The `src` attribute is set to `sourceUrl`. Since `sourceUrl` will now be a valid public URL, the image should render correctly across sessions.
  2. Add a **Download** button (e.g., using a `Download` icon from `lucide-react`) next to the existing `Maximize2` icon in the hover state of the image.
  3. Implement a programmatic download function. When the download button is clicked:
     - Fetch the image blob from the `sourceUrl`.
     - Create a local object URL (`URL.createObjectURL(blob)`).
     - Create a temporary anchor tag (`<a>`) with the `download` attribute set to a reasonable filename.
     - Trigger a click on the anchor tag to initiate the download.
     - Clean up the object URL.

## Scenarios

- **WHEN** a user uploads a screenshot via the Raw Data Library modal and clicks "Analyze Data"
- **THEN** the image is compressed, uploaded to Supabase Storage, analyzed by AI, and the resulting data source uses the persistent Supabase Storage URL.

- **WHEN** a user views a previously uploaded screenshot in the `DataSourceCard`
- **THEN** the image renders successfully because it uses a persistent cloud URL.

- **WHEN** a user hovers over the image in the `DataSourceCard` and clicks the new download icon
- **THEN** the image is downloaded to their local machine using a programmatic fetch to bypass CORS tab-opening issues.

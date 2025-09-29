// src/utils/fileUploadTest.ts
// Minimal client-side file validation helper for image uploads

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Defaults: 5 MB max, common image mime types
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

export function validateFileForUpload(
  file: File,
  options?: {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  }
): FileValidationResult {
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const allowed = options?.allowedMimeTypes ?? DEFAULT_ALLOWED_TYPES;

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Size check
  if (file.size > maxSize) {
    const mb = (maxSize / (1024 * 1024)).toFixed(1);
    return { isValid: false, error: `File is too large. Max size is ${mb} MB.` };
  }

  // Type check (fallback to extension if mime missing)
  if (file.type) {
    if (!allowed.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type. Please upload an image.' };
    }
  } else {
    const name = file.name?.toLowerCase() || '';
    const extOk = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].some(ext => name.endsWith(ext));
    if (!extOk) {
      return { isValid: false, error: 'Unsupported file type based on extension.' };
    }
  }

  return { isValid: true };
}

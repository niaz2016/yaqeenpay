// Centralized image URL normalization utility
// Handles relative paths from backend, enforces /uploads prefix, encodes segments, and tolerates malformed inputs.

const getBackendOrigin = (): string => {
  // If an explicit uploads base is set, use it directly (must include correct port)
  const override = (import.meta.env.VITE_UPLOADS_BASE_URL as string) || '';
  if (override) {
    try { return new URL(override).origin; } catch {/* ignore invalid */}
  }
  const apiBase = (import.meta.env.VITE_API_URL as string) || '';
  if (!apiBase) return window.location.origin;
  try {
    const parsed = new URL(apiBase, window.location.origin);
    // Strip trailing /api from pathname if present but KEEP the same origin+port
    return `${parsed.protocol}//${parsed.host}`; // parsed.host already includes port 7137
  } catch {
    return window.location.origin;
  }
};

export const normalizeImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  let working = url.trim();

  // If already absolute HTTP(S)
  if (/^https?:\/\//i.test(working)) return working;

  // Handle data URLs
  if (/^data:/i.test(working)) return working;

  // Replace backslashes from Windows paths
  working = working.replace(/\\+/g, '/');

  // Remove any leading ./ or ../ for safety (basic sanitization)
  working = working.replace(/^\.\/?/, '').replace(/^(\.\.\/)+/, '');

  // Strip leading public/ or wwwroot/
  working = working.replace(/^(public|wwwroot)\//i, '');

  // Handle absolute paths
  if (working.startsWith('/')) {
    working = working.slice(1);
  }

  // Build absolute URL using configured backend origin or API base
  // Prefer an explicit uploads base if provided, otherwise derive origin from VITE_API_URL
  const origin = getBackendOrigin();

  // Ensure the path starts with uploads/
  if (!working.toLowerCase().startsWith('uploads/')) {
    working = `uploads/${working.replace(/^\/+/, '')}`;
  }

  // Encode each path segment (preserve slashes)
  working = working.split('/').map(seg => encodeURIComponent(seg)).join('/');

  let finalUrl = `${origin}/${working}`;

  // Optional force downgrade to http if self-signed https causing failures
  if ((import.meta.env.VITE_FORCE_IMAGE_HTTP as string) === 'true' && finalUrl.startsWith('https://')) {
    finalUrl = finalUrl.replace('https://', 'http://');
  }

  if (import.meta.env.DEV) {
    (window as any).__imgSeen = (window as any).__imgSeen || new Set();
    const key = url + ' -> ' + finalUrl;
    if (!(window as any).__imgSeen.has(key)) {
      console.debug('[normalizeImageUrl]', key);
      (window as any).__imgSeen.add(key);
    }
  }

  return finalUrl;
};

// Optional helper to generate a placeholder data URI (simple gray box)
export const placeholderDataUri = (size = 64, color = '#e0e0e0'): string => {
  const hex = color.replace('#', '%23');
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' fill='${hex}'/></svg>`;
};

/**
 * Format bytes into human readable string
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Image resizing utilities for client-side image optimization
 */

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

/**
 * Resize an image file to specified dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const { maxWidth, maxHeight } = options;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // Create new File object with the resized image
          const resizedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now()
          });
          
          resolve(resizedFile);
        },
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality || 0.85
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resize avatar image (400x400 max)
 */
export async function resizeAvatar(file: File): Promise<File> {
  const format = file.type === 'image/png' ? 'png' : 'jpeg';
  return resizeImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format
  });
}

/**
 * Resize header image (1500x500 max)
 */
export async function resizeHeader(file: File): Promise<File> {
  const format = file.type === 'image/png' ? 'png' : 'jpeg';
  return resizeImage(file, {
    maxWidth: 1500,
    maxHeight: 500,
    quality: 0.85,
    format
  });
}

/**
 * Check if an image needs resizing based on file size
 */
export function needsResize(file: File, maxSizeMB: number = 10): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  return mb.toFixed(1) + ' MB';
}
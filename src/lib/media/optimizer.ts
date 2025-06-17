/**
 * Media optimization utilities for serverless/edge deployment
 * Designed to work efficiently with Lesser's S3-based media storage
 */

export interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface OptimizedImage {
  src: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

/**
 * Generate optimized image URLs using Cloudflare Image Resizing
 * or fallback to S3 URLs for Lesser instances
 */
export class MediaOptimizer {
  private static readonly BREAKPOINTS = [320, 640, 768, 1024, 1280, 1536];
  private static readonly DEFAULT_QUALITY = 85;
  
  /**
   * Check if URL is from a CDN that supports on-the-fly optimization
   */
  static isOptimizableUrl(url: string): boolean {
    // Cloudflare Images, Imagekit, Cloudinary, etc.
    const optimizableDomains = [
      'imagedelivery.net',
      'cloudinary.com',
      'imagekit.io',
      'imgix.net'
    ];
    
    try {
      const urlObj = new URL(url);
      return optimizableDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
  
  /**
   * Generate Cloudflare Image Resizing URL
   */
  static getCloudflareUrl(originalUrl: string, transform: ImageTransform): string {
    const params = new URLSearchParams();
    
    if (transform.width) params.append('width', transform.width.toString());
    if (transform.height) params.append('height', transform.height.toString());
    if (transform.quality) params.append('quality', transform.quality.toString());
    if (transform.format) params.append('format', transform.format);
    if (transform.fit) params.append('fit', transform.fit);
    
    // For Cloudflare Pages/Workers, use the /cdn-cgi/image/ endpoint
    if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
      return `/cdn-cgi/image/${params.toString()}/${originalUrl}`;
    }
    
    return originalUrl;
  }
  
  /**
   * Generate responsive image attributes
   */
  static getResponsiveImage(
    url: string,
    alt: string = '',
    options: {
      sizes?: string;
      loading?: 'lazy' | 'eager';
      aspectRatio?: number;
      objectFit?: 'cover' | 'contain' | 'fill';
    } = {}
  ): OptimizedImage {
    const {
      sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      loading = 'lazy',
      aspectRatio,
      objectFit = 'cover'
    } = options;
    
    // If URL supports optimization, generate srcset
    if (this.isOptimizableUrl(url)) {
      const srcsetEntries = this.BREAKPOINTS.map(width => {
        const optimizedUrl = this.getCloudflareUrl(url, {
          width,
          quality: this.DEFAULT_QUALITY,
          format: 'webp'
        });
        return `${optimizedUrl} ${width}w`;
      });
      
      return {
        src: url,
        srcset: srcsetEntries.join(', '),
        sizes
      };
    }
    
    // For S3 URLs from Lesser, return original
    return { src: url };
  }
  
  /**
   * Preload critical images
   */
  static preloadImage(url: string, options: ImageTransform = {}): void {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    
    if (this.isOptimizableUrl(url)) {
      link.href = this.getCloudflareUrl(url, {
        ...options,
        format: 'webp'
      });
    } else {
      link.href = url;
    }
    
    document.head.appendChild(link);
  }
  
  /**
   * Generate blurhash placeholder
   * Note: This would require server-side processing in Lesser
   */
  static getBlurhashPlaceholder(blurhash?: string): string {
    if (!blurhash) {
      // Return a default gradient placeholder
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBzdG9wLWNvbG9yPSIjMzMzIiBvZmZzZXQ9IjIwJSIgLz48c3RvcCBzdG9wLWNvbG9yPSIjMjIyIiBvZmZzZXQ9IjUwJSIgLz48c3RvcCBzdG9wLWNvbG9yPSIjMzMzIiBvZmZzZXQ9IjcwJSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzMzMiIC8+PHJlY3QgaWQ9InIiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idXJsKCNnKSIgLz48L3N2Zz4=';
    }
    
    // In production, this would decode the blurhash
    // For now, return the gradient placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBzdG9wLWNvbG9yPSIjMzMzIiBvZmZzZXQ9IjIwJSIgLz48c3RvcCBzdG9wLWNvbG9yPSIjMjIyIiBvZmZzZXQ9IjUwJSIgLz48c3RvcCBzdG9wLWNvbG9yPSIjMzMzIiBvZmZzZXQ9IjcwJSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzMzMiIC8+PHJlY3QgaWQ9InIiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idXJsKCNnKSIgLz48L3N2Zz4=';
  }
  
  /**
   * Calculate optimal dimensions for container
   */
  static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if needed
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }
  
  /**
   * Get video thumbnail at specific time
   */
  static async getVideoThumbnail(
    videoUrl: string,
    time: number = 0
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.currentTime = time;
      
      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          }, 'image/jpeg', 0.85);
        }
      });
      
      video.addEventListener('error', () => {
        reject(new Error('Failed to load video'));
      });
      
      video.src = videoUrl;
    });
  }
  
  /**
   * Check if media is within acceptable size for upload
   */
  static validateMediaSize(file: File, maxSizeMB: number = 40): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }
  
  /**
   * Get media duration (for video/audio)
   */
  static async getMediaDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const media = document.createElement(url.includes('audio') ? 'audio' : 'video');
      
      media.addEventListener('loadedmetadata', () => {
        resolve(media.duration);
      });
      
      media.addEventListener('error', () => {
        reject(new Error('Failed to load media'));
      });
      
      media.src = url;
    });
  }
}
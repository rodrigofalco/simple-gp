/**
 * Image Loader Module
 * Handles loading and caching of track background images
 */

class ImageLoader {
  constructor() {
    this.cache = {};
    this.loading = {};
  }

  /**
   * Map track types to their background image files
   */
  getImagePath(trackType) {
    const base = import.meta.env.BASE_URL || '/';
    const imageMap = {
      'track1': `${base}tracks/Track1.png`,
      'general-roca': `${base}tracks/GeneralRoca.png`
    };

    return imageMap[trackType] || null;
  }

  /**
   * Load an image asynchronously
   * Returns a promise that resolves to the Image object or null if load fails
   */
  async loadImage(trackType) {
    // Return cached image if available
    if (this.cache[trackType]) {
      return this.cache[trackType];
    }

    // Return pending promise if already loading
    if (this.loading[trackType]) {
      return this.loading[trackType];
    }

    // Start loading
    this.loading[trackType] = (async () => {
      const imagePath = this.getImagePath(trackType);

      if (!imagePath) {
        console.warn(`No image mapping found for track type: ${trackType}`);
        delete this.loading[trackType];
        return null;
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.src = imagePath;

        img.onload = () => {
          this.cache[trackType] = img;
          delete this.loading[trackType];
          console.log(`✓ Background image loaded: ${trackType}`);
          resolve(img);
        };

        img.onerror = () => {
          console.warn(`✗ Failed to load background image: ${imagePath}`);
          delete this.loading[trackType];
          resolve(null);  // Graceful fallback
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.loading[trackType]) {
            console.warn(`✗ Image load timeout: ${imagePath}`);
            delete this.loading[trackType];
            resolve(null);
          }
        }, 5000);
      });
    })();

    return this.loading[trackType];
  }

  /**
   * Get a cached image synchronously (returns null if not loaded yet)
   */
  getImage(trackType) {
    return this.cache[trackType] || null;
  }

  /**
   * Clear a specific track's cache
   */
  clearCache(trackType) {
    delete this.cache[trackType];
  }

  /**
   * Clear all cached images
   */
  clearAllCache() {
    this.cache = {};
  }
}

// Export singleton instance
export const imageLoader = new ImageLoader();

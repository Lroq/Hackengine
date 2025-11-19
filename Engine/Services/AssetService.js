import {Logger} from './Logger.js';

/**
 * Manages asset loading, caching, and fallback behavior.
 * @class AssetService
 */
class AssetService {
    static #imageCache = new Map();
    static #loadingPromises = new Map();
    static #fallbackImage = null;

    static FALLBACK_PATH = '/Engine/Assets/texture_not_found.png';

    /**
     * Initializes the asset service and preloads fallback image.
     * @returns {Promise}
     */
    static async initialize() {
        try {
            AssetService.#fallbackImage = await AssetService.loadImage(AssetService.FALLBACK_PATH);
            Logger.info('AssetService initialized');
        } catch (error) {
            Logger.error('Failed to load fallback image', error);
            AssetService.#fallbackImage = AssetService.#createEmergencyFallback();
        }
    }

    /**
     * Creates an emergency fallback image using canvas.
     * @private
     * @returns {HTMLImageElement}
     */
    static #createEmergencyFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillRect(16, 16, 16, 16);

        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * Loads an image with caching and fallback support.
     * @param {string} src - Image source path
     * @returns {Promise} Loaded image
     */
    static async loadImage(src) {
        if (!src || typeof src !== 'string') {
            throw new TypeError('Image source must be a non-empty string');
        }

        // Return cached image if available
        if (AssetService.#imageCache.has(src)) {
            return AssetService.#imageCache.get(src);
        }

        // Return existing loading promise if already loading
        if (AssetService.#loadingPromises.has(src)) {
            return AssetService.#loadingPromises.get(src);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                AssetService.#imageCache.set(src, img);
                AssetService.#loadingPromises.delete(src);
                Logger.debug(`Loaded image: ${src}`);
                resolve(img);
            };

            img.onerror = () => {
                AssetService.#loadingPromises.delete(src);
                Logger.warn(`Failed to load image: ${src}, using fallback`);

                if (src !== AssetService.FALLBACK_PATH) {
                    resolve(AssetService.#fallbackImage || AssetService.#createEmergencyFallback());
                } else {
                    reject(new Error(`Cannot load fallback image: ${src}`));
                }
            };

            img.src = src;
        });

        AssetService.#loadingPromises.set(src, loadPromise);
        return loadPromise;
    }

    /**
     * Synchronously creates an image that will load asynchronously.
     * Uses fallback immediately if loading fails.
     * @param {string} src - Image source path
     * @returns {HTMLImageElement} Image element
     */
    static createImage(src) {
        const img = new Image();

        AssetService.loadImage(src)
            .then(loadedImg => {
                if (img !== loadedImg) {
                    img.src = loadedImg.src;
                }
            })
            .catch(error => {
                Logger.error('Failed to create image', error);
                img.src = AssetService.#fallbackImage.src;
            });

        img.src = AssetService.#fallbackImage?.src || AssetService.FALLBACK_PATH;
        return img;
    }

    /**
     * Preloads multiple images.
     * @param {string[]} sources - Array of image paths
     * @returns {Promise} Array of loaded images
     */
    static async preloadImages(sources) {
        if (!Array.isArray(sources)) {
            throw new TypeError('Sources must be an array');
        }

        Logger.info(`Preloading ${sources.length} images...`);
        const promises = sources.map(src => AssetService.loadImage(src));
        return Promise.all(promises);
    }

    /**
     * Clears the image cache.
     */
    static clearCache() {
        AssetService.#imageCache.clear();
        Logger.info('Asset cache cleared');
    }

    /**
     * Gets cache statistics.
     * @returns {{size: number, images: string[]}} Cache info
     */
    static getCacheInfo() {
        return {
            size: AssetService.#imageCache.size,
            images: Array.from(AssetService.#imageCache.keys())
        };
    }
}

export {AssetService};
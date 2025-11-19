import {WGComponent} from './WGComponent.js';
import {Coordinates2D} from '../Utils/Coordinates2D.js';
import {Size2D} from '../Utils/Size2D.js';
import {AssetService} from '../Services/AssetService.js';

/**
 * Component that handles visual sprite rendering.
 * Manages sprite image, size, offset, and horizontal flip.
 * @class SpriteModel
 * @extends WGComponent
 */
class SpriteModel extends WGComponent {
    #sprite = null;
    #spriteOffset = new Coordinates2D(0, 0);
    #flipHorizontal = false;
    #size = new Size2D(0, 0);

    constructor() {
        super();
        this.#sprite = AssetService.createImage(AssetService.FALLBACK_PATH);
    }

    /**
     * @returns {boolean} Whether sprite is horizontally flipped
     */
    get flipHorizontal() {
        return this.#flipHorizontal;
    }

    /**
     * @param {boolean} value - True to flip horizontally
     * @throws {TypeError} If value is not a boolean
     */
    set flipHorizontal(value) {
        if (typeof value !== 'boolean') {
            throw new TypeError(`SpriteModel.flipHorizontal must be a boolean, got ${typeof value}`);
        }
        this.#flipHorizontal = value;
    }

    /**
     * @deprecated Use flipHorizontal instead
     * @returns {number} 1 for normal, -1 for flipped
     */
    get rotation() {
        return this.#flipHorizontal ? -1 : 1;
    }

    /**
     * @deprecated Use flipHorizontal instead
     * @param {number} value - 1 for normal, -1 for flipped
     */
    set rotation(value) {
        if (typeof value !== 'number') {
            throw new TypeError(`SpriteModel.rotation must be a number, got ${typeof value}`);
        }
        this.#flipHorizontal = value < 0;
    }

    /**
     * @returns {HTMLImageElement} The sprite image to render
     */
    get sprite() {
        return this.#sprite;
    }

    /**
     * @param {HTMLImageElement|string} value - Image element or path to load
     * @throws {TypeError} If value is neither Image nor string
     */
    set sprite(value) {
        if (value instanceof Image) {
            this.#sprite = value;
        } else if (typeof value === 'string') {
            this.#sprite = AssetService.createImage(value);
        } else {
            throw new TypeError('SpriteModel.sprite must be an Image or string path');
        }
    }

    /**
     * @returns {Coordinates2D} Visual offset from entity position
     */
    get spriteOffset() {
        return this.#spriteOffset;
    }

    /**
     * @returns {Size2D} Render dimensions of the sprite
     */
    get size() {
        return this.#size;
    }
}

export {SpriteModel};
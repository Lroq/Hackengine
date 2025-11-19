import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {Size_2D} from "../MicroClasses/Size_2D.js";
import {Utils} from "../Services/Utilities/Utils.js";

/**
 * Component that handles visual sprite rendering.
 * Manages sprite image, size, offset, and rotation.
 */
class SpriteModel extends WGComponent {
    #sprite = new Image();
    #spriteOffset = new Coordinates_2D(0, 0);
    #rotation = 1;
    #size = new Size_2D(0, 0);

    constructor() {
        super();
        this.sprite = Utils.createSprite("/Engine/Assets/texture_not_found.png");
    }

    /**
     * Gets the horizontal flip multiplier (1 for normal, -1 for flipped).
     * @returns {number} The rotation value
     */
    get rotation() {
        return this.#rotation;
    }

    /**
     * Sets the horizontal flip multiplier.
     * @param {number} value - 1 for normal, -1 for horizontal flip
     * @throws {TypeError} If value is not a number
     */
    set rotation(value) {
        if (typeof value !== 'number') {
            throw new TypeError("rotation must be a number");
        }
        this.#rotation = value;
    }

    /**
     * Gets the sprite image to render.
     * @returns {Image} The sprite image
     */
    get sprite() {
        return this.#sprite;
    }

    /**
     * Sets the sprite image to render.
     * @param {Image} value - HTML Image object
     * @throws {TypeError} If value is not an Image object
     */
    set sprite(value) {
        if (!(value instanceof Image)) {
            throw new TypeError("sprite must be an Image object");
        }
        this.#sprite = value;
    }

    /**
     * Gets the visual offset from object position.
     * @returns {Coordinates_2D} The sprite offset
     */
    get spriteOffset() {
        return this.#spriteOffset;
    }

    /**
     * Gets the render dimensions of the sprite.
     * @returns {Size_2D} The sprite size
     */
    get size() {
        return this.#size;
    }
}

export {SpriteModel}

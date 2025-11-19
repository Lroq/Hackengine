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
     * @returns {number} Horizontal flip multiplier (1 or -1)
     */
    get rotation() {
        return this.#rotation;
    }

    /**
     * @param {number} value - 1 for normal, -1 for horizontal flip
     */
    set rotation(value) {
        if (typeof value !== 'number') {
            throw new TypeError("Rotation must be a number (1 or -1)");
        }
        this.#rotation = value;
    }

    /**
     * @returns {Image} The sprite image to render
     */
    get sprite() {
        return this.#sprite;
    }

    /**
     * @param {Image} value - HTML Image object
     */
    set sprite(value) {
        if (!(value instanceof Image)) {
            throw new TypeError("Sprite must be an Image object");
        }
        this.#sprite = value;
    }

    /**
     * @returns {Coordinates_2D} Visual offset from object position
     */
    get spriteOffset() {
        return this.#spriteOffset;
    }

    /**
     * @returns {Size_2D} Render dimensions of the sprite
     */
    get size() {
        return this.#size;
    }
}

export {SpriteModel}
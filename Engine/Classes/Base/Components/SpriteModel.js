import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {Size_2D} from "../MicroClasses/Size_2D.js";
import {Utils} from "../Services/Utilities/Utils.js";

class SpriteModel extends WGComponent {
    #sprite = new Image();
    #spriteOffset = new Coordinates_2D(0, 0);
    #rotation = 1;
    #size = new Size_2D(0, 0);

    constructor() {
        super();
        this.sprite = Utils.createSprite("/Engine/Assets/texture_not_found.png");
    }

    get rotation() {
        return this.#rotation;
    }

    set rotation(value) {
        if (typeof value !== 'number') {
            throw new TypeError("Rotation must be a number (1 or -1)");
        }
        this.#rotation = value;
    }

    get sprite() {
        return this.#sprite;
    }

    set sprite(value) {
        if (!(value instanceof Image)) {
            throw new TypeError("Sprite must be an Image object");
        }
        this.#sprite = value;
    }

    get spriteOffset() {
        return this.#spriteOffset;
    }

    get size() {
        return this.#size;
    }
}

export {SpriteModel}
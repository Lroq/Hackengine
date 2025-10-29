import {Size_2D} from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";

class BoxCollider extends WGComponent {
    #hitbox = new Size_2D();
    #offset = new Coordinates_2D();
    #collisionGroup = "Base";

    get collisionGroup() {
        return this.#collisionGroup;
    }

    set collisionGroup(value) {
        if (typeof value !== 'string') {
            throw new TypeError("Collision group must be a string");
        }
        this.#collisionGroup = value;
    }

    get hitbox() {
        return this.#hitbox;
    }

    get offset() {
        return this.#offset;
    }
}

export {BoxCollider}
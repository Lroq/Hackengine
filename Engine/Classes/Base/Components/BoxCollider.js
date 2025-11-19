import {Size_2D} from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";

/**
 * Component that defines a rectangular collision box for an object.
 * Used by PhysicService to detect and resolve collisions.
 */
class BoxCollider extends WGComponent {
    #hitbox = new Size_2D();
    #offset = new Coordinates_2D();
    #collisionGroup = "Base";

    /**
     * Gets the collision group name (used for collision filtering).
     * @returns {string} The collision group name
     */
    get collisionGroup() {
        return this.#collisionGroup;
    }

    /**
     * Sets the collision group name.
     * @param {string} value - The collision group name
     * @throws {TypeError} If value is not a string
     */
    set collisionGroup(value) {
        if (typeof value !== 'string') {
            throw new TypeError("collisionGroup must be a string");
        }
        this.#collisionGroup = value;
    }

    /**
     * Gets the dimensions of the collision box.
     * @returns {Size_2D} The hitbox dimensions
     */
    get hitbox() {
        return this.#hitbox;
    }

    /**
     * Gets the position offset of the hitbox relative to the object.
     * @returns {Coordinates_2D} The offset coordinates
     */
    get offset() {
        return this.#offset;
    }
}

export {BoxCollider}

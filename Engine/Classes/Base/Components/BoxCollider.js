import {Size2D} from "/Engine/Classes/Base/MicroClasses/Size2D.js";
import {Coordinates2D} from "/Engine/Classes/Base/MicroClasses/Coordinates2D.js";
import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";

/**
 * Component that defines a rectangular collision box for an object.
 * Used by PhysicService to detect and resolve collisions.
 */
class BoxCollider extends WGComponent {
    #hitbox = new Size2D();
    #offset = new Coordinates2D();
    #collisionGroup = "Base";

    /**
     * @returns {string} The collision group name (used for collision filtering)
     */
    get collisionGroup() {
        return this.#collisionGroup;
    }

    /**
     * @param {string} value - The collision group name
     */
    set collisionGroup(value) {
        if (typeof value !== 'string') {
            throw new TypeError("Collision group must be a string");
        }
        this.#collisionGroup = value;
    }

    /**
     * @returns {Size2D} The dimensions of the collision box
     */
    get hitbox() {
        return this.#hitbox;
    }

    /**
     * @returns {Coordinates2D} Position offset of the hitbox relative to the object
     */
    get offset() {
        return this.#offset;
    }
}

export {BoxCollider}
import {Size2D} from '../Utils/Size2D.js';
import {Coordinates2D} from '../Utils/Coordinates2D.js';
import {WGComponent} from './WGComponent.js';

/**
 * Component that defines a rectangular collision box for an entity.
 * Used by PhysicSystem to detect and resolve collisions.
 * @class BoxCollider
 * @extends WGComponent
 */
class BoxCollider extends WGComponent {
    #hitbox = new Size2D();
    #offset = new Coordinates2D();
    #collisionGroup = 'default';

    /**
     * @returns {string} The collision group name (for collision filtering)
     */
    get collisionGroup() {
        return this.#collisionGroup;
    }

    /**
     * @param {string} value - The collision group name
     * @throws {TypeError} If value is not a string
     */
    set collisionGroup(value) {
        if (typeof value !== 'string') {
            throw new TypeError(`BoxCollider.collisionGroup must be a string, got ${typeof value}`);
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
     * @returns {Coordinates2D} Position offset relative to the entity
     */
    get offset() {
        return this.#offset;
    }

    /**
     * Gets the bounds of the collision box in world space.
     * @param {Coordinates2D} entityPosition - The entity's world position
     * @returns {{left: number, right: number, top: number, bottom: number}}
     */
    getBounds(entityPosition) {
        return {
            left: entityPosition.x + this.#offset.x,
            right: entityPosition.x + this.#offset.x + this.#hitbox.width,
            top: entityPosition.y + this.#offset.y,
            bottom: entityPosition.y + this.#offset.y + this.#hitbox.height
        };
    }
}

export {BoxCollider};
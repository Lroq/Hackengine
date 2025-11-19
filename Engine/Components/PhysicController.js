import {WGComponent} from './WGComponent.js';
import {Coordinates2D} from '../Utils/Coordinates2D.js';

/**
 * Component that handles physics simulation for an entity.
 * Controls velocity and gravity behavior.
 * @class PhysicController
 * @extends WGComponent
 */
class PhysicController extends WGComponent {
    #velocity = new Coordinates2D();
    #gravityEnabled = true;

    /**
     * @returns {Coordinates2D} Current velocity vector (units per tick)
     */
    get velocity() {
        return this.#velocity;
    }

    /**
     * @returns {boolean} Whether gravity affects this entity
     */
    get gravityEnabled() {
        return this.#gravityEnabled;
    }

    /**
     * @param {boolean} value - Enable or disable gravity
     * @throws {TypeError} If value is not a boolean
     */
    set gravityEnabled(value) {
        if (typeof value !== 'boolean') {
            throw new TypeError(`PhysicController.gravityEnabled must be a boolean, got ${typeof value}`);
        }
        this.#gravityEnabled = value;
    }

    /**
     * Sets velocity directly.
     * @param {number} x - X velocity
     * @param {number} y - Y velocity
     */
    setVelocity(x, y) {
        this.#velocity.set(x, y);
    }

    /**
     * Adds to current velocity.
     * @param {number} x - X velocity to add
     * @param {number} y - Y velocity to add
     */
    addVelocity(x, y) {
        this.#velocity.x += x;
        this.#velocity.y += y;
    }

    /**
     * Stops all movement.
     */
    stop() {
        this.#velocity.set(0, 0);
    }
}

export {PhysicController};
import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";

/**
 * Component that handles physics simulation for an object.
 * Controls velocity and gravity behavior.
 */
class PhysicController extends WGComponent {
    #velocity = new Coordinates_2D();
    #gravityEnabled = true;

    /**
     * Gets the current velocity vector (pixels per tick).
     * @returns {Coordinates_2D} The velocity vector
     */
    get velocity() {
        return this.#velocity;
    }

    /**
     * Gets whether gravity affects this object.
     * @returns {boolean} True if gravity is enabled
     */
    get gravityEnabled() {
        return this.#gravityEnabled;
    }

    /**
     * Sets whether gravity affects this object.
     * @param {boolean} value - Enable or disable gravity
     * @throws {TypeError} If value is not a boolean
     */
    set gravityEnabled(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("gravityEnabled must be a boolean");
        }
        this.#gravityEnabled = value;
    }
}

export {PhysicController}

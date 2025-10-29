import {WGComponent}    from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";

/**
 * Component that handles physics simulation for an object.
 * Controls velocity and gravity behavior.
 */
class PhysicController extends WGComponent {
    #velocity = new Coordinates_2D();
    #gravityEnabled = true;

    /**
     * @returns {Coordinates_2D} Current velocity vector (pixels per tick)
     */
    get velocity() {
        return this.#velocity;
    }

    /**
     * @returns {boolean} Whether gravity affects this object
     */
    get gravityEnabled() {
        return this.#gravityEnabled;
    }

    /**
     * @param {boolean} value - Enable or disable gravity
     */
    set gravityEnabled(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("gravityEnabled must be a boolean");
        }
        this.#gravityEnabled = value;
    }
}

export {PhysicController}
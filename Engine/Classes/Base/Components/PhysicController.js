import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";

class PhysicController extends WGComponent {
    #velocity = new Coordinates_2D();
    #gravityEnabled = true;

    get velocity() {
        return this.#velocity;
    }

    get gravityEnabled() {
        return this.#gravityEnabled;
    }

    set gravityEnabled(value) {
        if (typeof value !== 'boolean') {
            throw new TypeError("Gravity enabled must be a boolean value");
        }
        this.#gravityEnabled = value;
    }
}

export {PhysicController}
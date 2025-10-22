import {WGComponent}    from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";

class PhysicController extends WGComponent{
    #Velocity = new Coordinates_2D();
    #GravityEnabled = true;

    get velocity(){
        return this.#Velocity;
    }

    get gravityEnabled(){
        return this.#GravityEnabled
    }

    set gravityEnabled(Bool){
        if (typeof Bool === "boolean") {
            this.#GravityEnabled = Bool;
        }else{
            throw new TypeError("Non boolean value indicated.")
        }
    }
}

export {PhysicController}
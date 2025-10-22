import {Size_2D}        from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {WGComponent}    from "/Engine/Classes/Base/Components/WGComponent.js";

class BoxCollider extends WGComponent{
    #Hitbox = new Size_2D();
    #Offset = new Coordinates_2D();
    #CollisionGroup = "Base";

    get collisionGroup(){
        return this.#CollisionGroup;
    }

    set collisionGroup(value){
        this.#CollisionGroup = value;
        return this;
    }

    get hitbox(){
        return this.#Hitbox;
    }

    get offset(){
        return this.#Offset;
    }
}

export {BoxCollider}
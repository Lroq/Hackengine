import {WGComponent} from "/Engine/Classes/Base/Components/WGComponent.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {Size_2D} from "../MicroClasses/Size_2D.js";
import {Utils} from "../Services/Utilities/Utils.js";

class SpriteModel extends WGComponent{
    #Sprite = new Image();
    #SpriteOffset = new Coordinates_2D(0,0);
    #Rotation = 1;
    #Size = new Size_2D(0,0);

    constructor() {
        super();
        this.sprite = Utils.createSprite("/Engine/Assets/texture_not_found.png");
    }

    get rotation(){
        return this.#Rotation;
    }

    set rotation(Rot){
        this.#Rotation = Rot;
    }

    get sprite(){
        return this.#Sprite;
    }

    set sprite(sprite_img){
        if (sprite_img instanceof Image){
            this.#Sprite = sprite_img
        }
    }

    get spriteOffset(){
        return this.#SpriteOffset;
    }

    get size(){
        return this.#Size;
    }
}

export {SpriteModel}
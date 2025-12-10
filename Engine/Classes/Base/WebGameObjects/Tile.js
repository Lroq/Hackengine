import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../Components/SpriteModel.js";
import {BoxCollider} from "../Components/BoxCollider.js";

class Tile extends WGObject{
    constructor() {
        super();

        const Sprite = new SpriteModel();
        const Collider = new BoxCollider()

        Collider.enabled = true;
        Collider.hitbox.Width = 27;
        Collider.hitbox.Height = 27;

        Sprite.enabled = true;
        Sprite.size.Height = 27;
        Sprite.size.Width = 27;

        super.addComponent(Collider)
        super.addComponent(Sprite)
    }
}

export {Tile}
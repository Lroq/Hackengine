import {WGObject} from "../../Base/WebGameObjects/WGObject.js";
import {Inventory} from "./Objects/Inventory.js";
import {PhysicController} from "../../Base/Components/PhysicController.js";
import {BoxCollider} from "../../Base/Components/BoxCollider.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {SPRITES} from "./PlayerUtils.js";
import {Instance} from "../../Base/WebGameObjects/Instance.js";

export class Character extends Instance{
    constructor() {
        super();
        this.Inventory = new Inventory();
        this.Equipe = [];
        const Sprite = new SpriteModel();
        const Physic = new PhysicController();
        const Collider = new BoxCollider();
        this.Type = false;

        Sprite.sprite = SPRITES.IDLE;
        Sprite.enabled = true;
        Sprite.size.Height = 54;
        Sprite.size.Width = 27;
        Sprite.spriteOffset.Y = -50;
        Sprite.spriteOffset.X = -4;

        Physic.gravityEnabled = false;
        Collider.enabled = true;

        Collider.hitbox.Width = 20
        Collider.hitbox.Height = 4

        super.addComponent(Sprite);
        super.addComponent(Physic);
        super.addComponent(Collider);
    }


}

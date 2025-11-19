import {SpriteModel} from "../../../Components/SpriteModel.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {WGObject} from "../../../Entities/WGObject.js";

const ____CLASSDATA____ = {
    ____DATAMODEL____ : `
        @@AUTO_REPLICATE
        
        #Children /Game/Components/component.SpriteModel((
            @@name   [[Shadow]];;
            @width   [[Max:20,Min:20]];;
            @height  [[Max:27,Min:27]];;
            @enabled [[Validate:true,false]];;
        ))
    `
}

class Shadow extends WGObject{
    constructor() {
        super();
        const Sprite = new SpriteModel();

        Sprite.enabled = true;
        Sprite.sprite = Utils.createSprite("/Public/Assets/Game/shadow.png")

        Sprite.size.Height = 20;
        Sprite.size.Width = 27;

        super.addComponent(Sprite)
    }
}

export { Shadow }
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {WGObject} from "../../Base/WebGameObjects/WGObject.js";
import {TextLabel} from "../../Base/WebGameObjects/TextLabel.js";

class NameTag extends WGObject {
    constructor(Text) {
        super();

        const Sprite = new SpriteModel();
        Sprite.enabled = true;
        Sprite.sprite = Utils.createSprite("/Public/Assets/Game/TextBox.png")
        Sprite.size.Height = 13;
        Sprite.size.Width = 30;
        super.addComponent(Sprite)

        const Label = new TextLabel();
        Label.font = "Pixel Font"
        Label.text = Text;
        super.addChild(Label)
        Label.relativeScale()
    }
}


export {NameTag}
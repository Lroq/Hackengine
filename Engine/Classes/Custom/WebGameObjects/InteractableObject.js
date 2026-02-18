import {WGObject} from "../../Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {BoxCollider} from "../../Base/Components/BoxCollider.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";

class InteractableObject extends WGObject {
    #dialogueBox = null;
    #interactionText = "";

    constructor(spritePath, width, height, interactionText, dialogueBox) {
        super();

        this.#dialogueBox = dialogueBox;
        this.#interactionText = interactionText;

        const sprite = new SpriteModel();
        sprite.enabled = true;
        sprite.sprite = Utils.createSprite(spritePath);
        sprite.size.Width = width;
        sprite.size.Height = height;

        const collider = new BoxCollider();
        collider.enabled = true;
        collider.hitbox.Width = width;
        collider.hitbox.Height = height;

        super.addComponent(sprite);
        super.addComponent(collider);
    }

    onInteract() {
        if (this.#dialogueBox) {
            this.#dialogueBox.show(this.#interactionText);
        }
    }
}

export {InteractableObject};
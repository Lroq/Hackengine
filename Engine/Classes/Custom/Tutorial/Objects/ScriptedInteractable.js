import { Instance } from "../../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../../Base/Components/BoxCollider.js";
import { Utils } from "../../../Base/Services/Utilities/Utils.js";
import { InteractionUtils } from "../../../Base/Services/Interactions/InteractionUtils.js";

class ScriptedInteractable extends Instance {
    #dialogueBox;
    #lines;
    #onInteract;
    #interactionRange;

    constructor(config, dialogueBox, onInteract = null) {
        super();
        this.#dialogueBox = dialogueBox;
        this.#lines = InteractionUtils.normalizeDialogueLines(config.lines || "");
        this.#onInteract = onInteract;
        this.#interactionRange = config.interactionRange ?? 34;

        const sprite = new SpriteModel();
        sprite.enabled = true;
        sprite.sprite = Utils.createSprite(config.spritePath);
        sprite.size.Width = config.width;
        sprite.size.Height = config.height;

        const collider = new BoxCollider();
        collider.enabled = false;
        collider.hitbox.Width = config.width;
        collider.hitbox.Height = config.height;

        super.addComponent(sprite);
        super.addComponent(collider);

        this.metadata = {
            id: config.id || null,
            label: config.label || null
        };
    }

    get interactionRange() {
        return this.#interactionRange;
    }

    getInteractionAnchor() {
        const sprite = this.components.SpriteModel;
        const width = sprite?.size?.Width ?? 0;
        const height = sprite?.size?.Height ?? 0;

        return {
            x: this.coordinates.X + width / 2,
            y: this.coordinates.Y + height / 2
        };
    }

    onInteract(context = {}) {
        if (this.#dialogueBox) {
            this.#dialogueBox.show(this.#lines);
        }

        if (typeof this.#onInteract === 'function') {
            this.#onInteract({
                ...context,
                interactable: this
            });
        }
    }

    run() {}
}

export { ScriptedInteractable };


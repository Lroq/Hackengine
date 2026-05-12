import { Instance } from "../../../Base/WebGameObjects/Instance.js";
import { BoxCollider } from "../../../Base/Components/BoxCollider.js";
import { InteractionUtils } from "../../../Base/Services/Interactions/InteractionUtils.js";

class ProximityTrigger extends Instance {
    #player = null;
    #config;
    #onEnter;
    #hasTriggered = false;

    constructor(config, onEnter) {
        super();
        this.#config = config;
        this.#onEnter = onEnter;

        const collider = new BoxCollider();
        collider.enabled = false;
        collider.hitbox.Width = config.width;
        collider.hitbox.Height = config.height;
        super.addComponent(collider);
    }

    setPlayer(player) {
        this.#player = player;
    }

    #buildRect() {
        return InteractionUtils.getObjectRect(this, this.#config.width, this.#config.height);
    }

    #buildPlayerRect() {
        if (!this.#player?.components?.BoxCollider) return null;

        const playerWidth = this.#player.components.BoxCollider.hitbox.Width;
        const playerHeight = this.#player.components.BoxCollider.hitbox.Height;
        return InteractionUtils.getObjectRect(this.#player, playerWidth, playerHeight);
    }

    run(Services) {
        if (this.#hasTriggered && this.#config.once !== false) return;
        if (!this.#player) return;
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play') return;

        const triggerRect = this.#buildRect();
        const playerRect = this.#buildPlayerRect();
        if (!playerRect) return;

        if (InteractionUtils.rectsOverlap(triggerRect, playerRect)) {
            this.#hasTriggered = true;
            if (typeof this.#onEnter === 'function') {
                this.#onEnter({ Services, trigger: this });
            }
        }
    }
}

export { ProximityTrigger };


import { Instance } from "../../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../../Base/Components/BoxCollider.js";
import { Utils } from "../../../Base/Services/Utilities/Utils.js";
import { InteractionUtils } from "../../../Base/Services/Interactions/InteractionUtils.js";

const MOTHER_STATE = {
    WatchingTV: "WatchingTV",
    Alert: "Alert"
};

class MotherNPC extends Instance {
    #player = null;
    #state = MOTHER_STATE.WatchingTV;
    #config;
    #sprite = null;
    #onStateChange = null;

    constructor(config) {
        super();
        this.#config = config;

        this.#sprite = new SpriteModel();
        this.#sprite.enabled = true;
        this.#sprite.sprite = Utils.createSprite(config.spriteIdle);
        this.#sprite.size.Width = config.width;
        this.#sprite.size.Height = config.height;

        const triggerHitbox = new BoxCollider();
        triggerHitbox.enabled = false;
        triggerHitbox.hitbox.Width = config.width;
        triggerHitbox.hitbox.Height = config.height;

        super.addComponent(this.#sprite);
        super.addComponent(triggerHitbox);
    }

    setPlayer(player) {
        this.#player = player;
    }

    get state() {
        return this.#state;
    }

    #setState(nextState) {
        const previousState = this.#state;
        this.#state = nextState;

        if (this.#state === MOTHER_STATE.Alert) {
            this.#sprite.sprite = Utils.createSprite(this.#config.spriteAlert);
            if (previousState !== this.#state && typeof this.#onStateChange === 'function') {
                this.#onStateChange(this.#state, previousState);
            }
            return;
        }

        this.#sprite.sprite = Utils.createSprite(this.#config.spriteIdle);
        if (previousState !== this.#state && typeof this.#onStateChange === 'function') {
            this.#onStateChange(this.#state, previousState);
        }
    }

    onStateChange(callback) {
        if (typeof callback === 'function') {
            this.#onStateChange = callback;
        }
    }

    #playerRect() {
        if (!this.#player?.components?.BoxCollider) return null;
        const width = this.#player.components.BoxCollider.hitbox.Width;
        const height = this.#player.components.BoxCollider.hitbox.Height;
        return InteractionUtils.getObjectRect(this.#player, width, height);
    }

    #sensorRect() {
        const base = InteractionUtils.getObjectRect(this, this.#config.width, this.#config.height);
        return {
            left: base.left - this.#config.sensingRange,
            right: base.right + this.#config.sensingRange,
            top: base.top - 16,
            bottom: base.bottom + 10
        };
    }

    run() {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play') return;

        const playerRect = this.#playerRect();
        if (!playerRect) return;

        const sensed = InteractionUtils.rectsOverlap(this.#sensorRect(), playerRect);

        if (this.#state === MOTHER_STATE.WatchingTV && sensed) {
            this.#setState(MOTHER_STATE.Alert);
        }


        if (this.#state !== MOTHER_STATE.WatchingTV && !sensed) {
            this.#setState(MOTHER_STATE.WatchingTV);
        }
    }
}

export { MotherNPC, MOTHER_STATE };



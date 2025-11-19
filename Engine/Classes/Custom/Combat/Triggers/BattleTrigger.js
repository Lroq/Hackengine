import { Instance } from "../../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../../Base/Components/BoxCollider.js";
import { Utils } from "../../../Base/Services/Utilities/Utils.js";

/**
 * Object that triggers a battle when player touches it
 */
class BattleTrigger extends Instance {
    #hasTriggered = false;
    #onTriggerCallback;

    constructor(onTriggerCallback) {
        super();

        this.#onTriggerCallback = onTriggerCallback;

        const Sprite = new SpriteModel();
        Sprite.enabled = true;
        Sprite.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_floor_house_1.png");
        Sprite.size.Height = 30;
        Sprite.size.Width = 30;

        const Collider = new BoxCollider();
        Collider.enabled = false;
        Collider.hitbox.Width = 30;
        Collider.hitbox.Height = 30;
        Collider.collisionGroup = "BattleTrigger";

        super.addComponent(Sprite);
        super.addComponent(Collider);
    }

    /**
     * Check if player is touching this trigger
     */
    run(Services, DeltaTime) {
        if (this.#hasTriggered) return;

        const scene = Services.SceneService.activeScene;
        const objects = scene.wgObjects;

        for (let obj of objects) {
            if (obj.constructor.name === "Player") {
                if (this.#checkOverlap(obj)) {
                    this.#triggerBattle(Services);
                }
            }
        }
    }

    /**
     * Manual collision detection (doesn't block movement)
     */
    #checkOverlap(player) {
        const playerCollider = player.components.BoxCollider;
        if (!playerCollider) return false;

        const thisLeft = this.coordinates.X;
        const thisRight = this.coordinates.X + 30;
        const thisTop = this.coordinates.Y;
        const thisBottom = this.coordinates.Y + 30;

        const playerLeft = player.coordinates.X;
        const playerRight = player.coordinates.X + playerCollider.hitbox.Width;
        const playerTop = player.coordinates.Y;
        const playerBottom = player.coordinates.Y + playerCollider.hitbox.Height;

        return (
            thisRight >= playerLeft &&
            thisLeft <= playerRight &&
            thisBottom >= playerTop &&
            thisTop <= playerBottom
        );
    }

    /**
     * Trigger the battle
     */
    #triggerBattle(Services) {
        this.#hasTriggered = true;
        console.log("🔥 Battle triggered!");

        if (this.#onTriggerCallback) {
            this.#onTriggerCallback(Services);
        }
    }

    /**
     * Reset the trigger (in case you want to reuse it)
     */
    reset() {
        this.#hasTriggered = false;
    }
}

export { BattleTrigger };
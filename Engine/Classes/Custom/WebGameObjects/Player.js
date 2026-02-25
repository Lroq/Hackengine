import {Character}        from "./Character.js";
import {NameTag}           from "./NameTag.js";
import {FACING, PLAYER_STATE, SPRITES} from "./PlayerUtils.js";
import {SpriteModel}       from "../../Base/Components/SpriteModel.js";
import {PhysicController}  from "../../Base/Components/PhysicController.js";


class Player extends Character {
    #globalState    = PLAYER_STATE.Idling;
    #animationFrame = 0;
    #face           = FACING.Right;
    #isTeleporting  = false;

    constructor(username) {
        super();
        const tag = new NameTag(username);
        tag.coordinates.Y = -65;
        tag.coordinates.X = -5;
        super.addChild(tag);

        this.hp = 3;
    }

    #run_Idling(Services) {
        const sprite = this.getComponent(SpriteModel);
        sprite.sprite = SPRITES.MOVING[this.#face][0];

        if (Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#globalState = PLAYER_STATE.Moving;
        }
    }

    #run_Moving(Services) {
        const physic = this.getComponent(PhysicController);
        const sprite = this.getComponent(SpriteModel);

        const isStopped = physic.velocity.X === 0 && physic.velocity.Y === 0;

        physic.velocity.Y = 0;
        physic.velocity.X = 0;

        if (Services.InputService.IsKeyDown("z")) {
            this.#face = FACING.Up;
            physic.velocity.Y = -0.8;
        } else if (Services.InputService.IsKeyDown("s")) {
            this.#face = FACING.Down;
            physic.velocity.Y = 0.8;
        }

        if (Services.InputService.IsKeyDown("q")) {
            physic.velocity.X = -0.8;
            sprite.rotation   = -1;
            this.#face        = FACING.Right;
        } else if (Services.InputService.IsKeyDown("d")) {
            physic.velocity.X = 0.8;
            sprite.rotation   = 1;
            this.#face        = FACING.Right;
        }

        if (!Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#globalState = PLAYER_STATE.Idling;
        }

        this.#animationFrame = isStopped
            ? 0
            : (this.#animationFrame + 0.06) % 3;

        sprite.sprite = SPRITES.MOVING[this.#face][Math.round(this.#animationFrame)];
    }

    #checkTeleportTile(Services) {
        const scene = Services.SceneService.activeScene;
        if (!scene) return;

        const playerX = this.coordinates.X;
        const playerY = this.coordinates.Y;

        const tiles = scene.wgObjects.filter(obj => obj.constructor.name === 'Tile');

        const teleporterTile = tiles.find(tile => {
            if (!tile.isTeleporter) return false;

            const tileX = tile.coordinates.X;
            const tileY = tile.coordinates.Y;

            return (
                playerX >= tileX - 13 &&
                playerX <= tileX + 40  &&
                playerY >= tileY - 13 &&
                playerY <= tileY + 40
            );
        });

        if (teleporterTile) {
            if (teleporterTile.teleportData?.map?.trim() && !this.#isTeleporting) {
                this.#isTeleporting = true;
                this.#handleTeleport(Services, teleporterTile.teleportData);
            } else if (!this.#isTeleporting) {
                if (!teleporterTile.teleportData?.map?.trim()) {
                    console.warn('⚠️ Téléporteur sans destination configurée');
                }
            }
        } else {
            this.#isTeleporting = false;
        }
    }

    #handleTeleport(Services, teleportData) {
        console.log(`🚀 Téléportation vers "${teleportData.map}"...`);

        Services.SceneService.LoadSceneFromJson(teleportData.map).then(() => {
            this.coordinates.X = teleportData.x;
            this.coordinates.Y = teleportData.y;

            const activeCamera = Services.SceneService.activeScene?.activeCamera;
            if (activeCamera && this.components.BoxCollider) {
                const canvas      = document.getElementById('game-canvas');
                const canvasWidth  = canvas.width;
                const canvasHeight = canvas.height;
                const scale        = canvasHeight * 0.004;

                const modelX = this.components.BoxCollider.hitbox.Width  / 2;
                const modelY = this.components.BoxCollider.hitbox.Height / 2;

                activeCamera.coordinates.X = -this.coordinates.X + (canvasWidth  / 2) / scale - modelX;
                activeCamera.coordinates.Y = -this.coordinates.Y + (canvasHeight / 2) / scale - modelY;
            }

            console.log(`✅ Téléporté à (${teleportData.x}, ${teleportData.y}) dans "${teleportData.map}"`);

            setTimeout(() => {
                this.#isTeleporting = false;
            }, 500);

        }).catch(err => {
            console.error(`❌ Erreur téléportation vers ${teleportData.map}:`, err);
            this.#isTeleporting = false;
        });
    }

    run(Services, DeltaTime) {
        switch (this.#globalState) {
            case PLAYER_STATE.Idling: this.#run_Idling(Services, DeltaTime);  break;
            case PLAYER_STATE.Moving: this.#run_Moving(Services, DeltaTime);  break;
            case PLAYER_STATE.Freeze: break;
        }
        this.#checkTeleportTile(Services);
    }
}

export {Player}
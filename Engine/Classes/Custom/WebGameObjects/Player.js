import {Character} from "./Character.js";
import {NameTag} from "./NameTag.js";
import {FACING, PLAYER_STATE , SPRITES} from "./PlayerUtils.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {PhysicController} from "../../Base/Components/PhysicController.js";


class Player extends Character {
    #GlobalState = PLAYER_STATE.Idling;
    #AnimationFrame = 0;
    #Face = FACING.Right;
    #isTeleporting = false; // Pour éviter les téléportations multiples

    constructor(username) {
        super();
        const Tag = new NameTag(username)

        Tag.coordinates.Y = -65;
        Tag.coordinates.X = -5;

        super.addChild(Tag)

        this.hp = 3;
    }


    #run_Idling(Services) {
        const sprite = this.getComponent(SpriteModel)       ;
        sprite.sprite = SPRITES.MOVING[this.#Face][0];

        if (Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Moving;
        }
    }

    #run_Moving(Services) {
        const physic = this.getComponent(PhysicController);
        const sprite = this.getComponent(SpriteModel);

        const IsStopped = super.components.PhysicController.velocity.X === 0 && super.components.PhysicController.velocity.Y == 0

        physic.velocity.Y = 0;
        physic.velocity.X = 0;

        if (Services.InputService.IsKeyDown("z")) {
            this.#Face = FACING.Up
            physic.velocity.Y = -0.8;
        } else if (Services.InputService.IsKeyDown("s")) {
            this.#Face = FACING.Down
            physic.velocity.Y = 0.8;
        }

        if (Services.InputService.IsKeyDown("q")) {
            physic.velocity.X = -0.8;
            sprite.rotation = -1
            this.#Face = FACING.Right
        } else if (Services.InputService.IsKeyDown("d")) {
            sprite.rotation = 1
            this.#Face = FACING.Right
            physic.velocity.X = 0.8;
        }

        if (!Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Idling;
        }

        if (!IsStopped) {
            this.#AnimationFrame = (this.#AnimationFrame + 0.06) % 3
        }else{
            this.#AnimationFrame = 0
        }

        sprite.sprite = SPRITES.MOVING[this.#Face][Math.round(this.#AnimationFrame)];
    }

    #checkTeleportTile(Services) {
        // Récupérer la scène active
        const scene = Services.SceneService.activeScene;
        if (!scene) return;

        // Position actuelle du joueur
        const playerX = this.coordinates.X;
        const playerY = this.coordinates.Y;

        // Chercher une tuile téléporteur à cette position
        const tiles = scene.wgObjects.filter(obj => obj.constructor.name === 'Tile');

        const teleporterTile = tiles.find(tile => {
            if (!tile.isTeleporter) return false;

            const tileX = tile.coordinates.X;
            const tileY = tile.coordinates.Y;

            // Vérifier si le joueur est sur la tuile (avec une tolérance)
            // Le joueur doit être dans un carré de 27x27 (taille de la tuile)
            const isOverlapping = (
                playerX >= tileX - 13 &&
                playerX <= tileX + 27 + 13 &&
                playerY >= tileY - 13 &&
                playerY <= tileY + 27 + 13
            );

            return isOverlapping;
        });

        if (teleporterTile) {
            if (!this.#isTeleporting) {
                console.log(`🎯 Téléporteur détecté à (${teleporterTile.coordinates.X}, ${teleporterTile.coordinates.Y})`);
            }

            if (teleporterTile.teleportData) {
                const data = teleporterTile.teleportData;

                if (data.map && data.map.trim() !== '' && !this.#isTeleporting) {
                    console.log(`🌀 Téléportation vers "${data.map}" à (${data.x}, ${data.y})`);
                    this.#isTeleporting = true;
                    this.#handleTeleport(Services, data);
                } else if (!this.#isTeleporting) {
                    if (!data.map || data.map.trim() === '') {
                        console.warn(`⚠️ Téléporteur sans destination configurée`);
                    }
                }
            } else if (!this.#isTeleporting) {
                console.warn(`⚠️ Téléporteur sans données de téléportation`);
            }
        } else {
            // Réinitialiser le flag quand le joueur n'est plus sur un téléporteur
            this.#isTeleporting = false;
        }
    }

    /**
     * Gère la téléportation du joueur
     */
    #handleTeleport(Services, teleportData) {
        console.log(`🚀 Début de la téléportation vers "${teleportData.map}"...`);

        // Charger la nouvelle map
        Services.SceneService.LoadSceneFromJson(teleportData.map).then(() => {
            // Téléporter le joueur aux nouvelles coordonnées
            this.coordinates.X = teleportData.x;
            this.coordinates.Y = teleportData.y;

            // Repositionner la caméra sur le joueur
            if (window.activeCamera && this.components.BoxCollider) {
                const canvas = document.getElementById('game-canvas');
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const scale = 3; // Échelle du jeu

                const modelX = this.components.BoxCollider.hitbox.Width / 2;
                const modelY = this.components.BoxCollider.hitbox.Height / 2;

                window.activeCamera.coordinates.X = -this.coordinates.X + (canvasWidth / 2) / scale - modelX;
                window.activeCamera.coordinates.Y = -this.coordinates.Y + (canvasHeight / 2) / scale - modelY;
            }

            console.log(`✅ Joueur téléporté à (${teleportData.x}, ${teleportData.y}) dans "${teleportData.map}"`);

            // Réinitialiser le flag après un court délai pour éviter la retéléportation immédiate
            setTimeout(() => {
                this.#isTeleporting = false;
                console.log(`🔓 Téléportation réactivée`);
            }, 500);

        }).catch(err => {
            console.error(`❌ Erreur lors de la téléportation vers ${teleportData.map}:`, err);
            this.#isTeleporting = false;
        });
    }

    run(Services, DeltaTime) {
        switch (this.#GlobalState) {
            case PLAYER_STATE.Idling: {
                this.#run_Idling(Services, DeltaTime)
                break;
            }
            case PLAYER_STATE.Moving: {
                this.#run_Moving(Services, DeltaTime)
                break;
            }
            case PLAYER_STATE.Freeze: {
                break
            }
        }
        // Vérifier la téléportation à chaque frame
        this.#checkTeleportTile(Services);
    }

}

export {Player }




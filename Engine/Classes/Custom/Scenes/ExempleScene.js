import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Tile} from "../../Base/WebGameObjects/Tile.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {Player} from "../WebGameObjects/Player.js";
import {BattleTrigger} from "../Combat/Triggers/BattleTrigger.js";
import {BattleScene} from "../Combat/Scenes/BattleScene.js";

class ExempleScene extends Scene {
    async buildScene() {
        // === SOL === //
        for (let i = 2; i < 11; i++) {
            for (let a = 0; a < 11; a++) {
                const TileInstance = new Tile();
                TileInstance.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_floor_house_1.png");

                TileInstance.coordinates.X = i * TileInstance.components.BoxCollider.hitbox.Width;
                TileInstance.coordinates.Y = a * TileInstance.components.BoxCollider.hitbox.Width;

                TileInstance.components.BoxCollider.enabled = false;

                super.addWGObject(TileInstance);
            }
        }

        // === MURS === //
        for (let i = 2; i < 11; i++) {
            for (let a = -2; a < 2; a++) {
                const TileInstance = new Tile();
                TileInstance.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_wall_house_1.png");

                TileInstance.coordinates.X = i * TileInstance.components.BoxCollider.hitbox.Width;
                TileInstance.coordinates.Y = a * TileInstance.components.BoxCollider.hitbox.Width;

                super.addWGObject(TileInstance);
            }
        }

        // === JOUEUR === //
        const PlayerInstance = new Player("Ewoukouskous");
        super.addWGObject(PlayerInstance);

        // === CAMÉRA === //
        super.activeCamera.cameraSubject = PlayerInstance;
        window.activeCamera = super.activeCamera;

        // === TRIGGER DE COMBAT === //
        const battleTrigger = new BattleTrigger((Services) => {
            this.#startBattle(Services);
        });

        battleTrigger.coordinates.X = 6 * 30;
        battleTrigger.coordinates.Y = 5 * 30;

        battleTrigger.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/grass_sprite.png");

        super.addWGObject(battleTrigger);
    }

    /**
     * Start a battle when trigger is activated
     */
    #startBattle(Services) {
        console.log("🎮 Starting battle transition...");

        const battleScene = new BattleScene();

        Services.SceneService.addScene("Battle", battleScene);

        Services.SceneService.activeScene = battleScene;

        // TODO: Passer les données des Hackemons
        // battleScene.startBattle(playerHackemon, wildHackemon);

        console.log("✅ Battle scene loaded!");
    }

    constructor() {
        super();
        this.buildScene();
    }
}

export {ExempleScene};
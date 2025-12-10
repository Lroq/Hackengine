import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Tile} from "../../Base/WebGameObjects/Tile.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {Player} from "../WebGameObjects/Player.js";
import {BattleTrigger} from "../Combat/Triggers/BattleTrigger.js";
import {BattleScene} from "../Combat/Scenes/BattleScene.js";
import {HackemonService} from "../../Base/Services/Hackemon/HackemonService.js";

class ExempleScene extends Scene {
    #initialized = false;

    async buildScene() {
        if (!this.#initialized) {
            await HackemonService.initialize();
            this.#initialized = true;
        }

        // === JOUEUR === //
        const PlayerInstance = new Player("Ewoukouskous");
        super.addWGObject(PlayerInstance);

        // === CAMÉRA === //
        super.activeCamera.cameraSubject = PlayerInstance;
        window.activeCamera = super.activeCamera;
        window.playerInstance = PlayerInstance;

        // === TRIGGER DE COMBAT === //
        // Temporairement désactivé car grass_sprite.png est manquant
        /*
        const battleTrigger = new BattleTrigger((Services) => {
            this.#startBattle(Services);
        });

        battleTrigger.coordinates.X = 6 * 30;
        battleTrigger.coordinates.Y = 5 * 30;

        battleTrigger.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/grass_sprite.png");

        super.addWGObject(battleTrigger);
        */
    }

    /**
     * Start a battle when trigger is activated
     */
    #startBattle(Services) {
        console.log("🎮 Starting battle transition...");

        const battleScene = new BattleScene();

        Services.SceneService.addScene("Battle", battleScene);
        Services.SceneService.activeScene = battleScene;

        const playerHackemon = HackemonService.createHackemon("cle_USB", 10);
        const enemyHackemon = HackemonService.createHackemon("cle_USB", 8);

        battleScene.startBattle(playerHackemon, enemyHackemon);

        console.log("✅ Battle scene loaded!");
    }


    constructor() {
        super();
        this.buildScene();
    }
}

export {ExempleScene};
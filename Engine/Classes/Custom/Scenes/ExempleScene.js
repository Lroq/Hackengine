import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Tile} from "../../Base/WebGameObjects/Tile.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {Player} from "../WebGameObjects/Player.js";
import {BattleTrigger} from "../Combat/Triggers/BattleTrigger.js";
import {BattleScene} from "../Combat/Scenes/BattleScene.js";
import {HackemonService} from "../../Base/Services/Hackemon/HackemonService.js";
import {WGObject} from "../../Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {DialogueBox} from "../../Base/Services/Ui/DialogueBox.js";
import {TileInteractionManager} from "../../Base/Services/Interactions/TileInteractionManager.js";

class ExempleScene extends Scene {
    #initialized = false;
    #dialogueBox = new DialogueBox();
    #tileInteractionManager = null;

    constructor() {
        super();
        this.ready = this.buildScene();
    }

    async buildScene() {
        if (!this.#initialized) {
            await HackemonService.initialize();
            this.#initialized = true;
        }

        // === FOND === //
        const background = new WGObject();
        const bgSprite = new SpriteModel();
        bgSprite.enabled = true;

        // Dimensions du canvas (800x600 standard)
        const canvasWidth = 800;
        const canvasHeight = 600;

        // === JOUEUR === //
        const PlayerInstance = new Player("Ewoukouskous");

        // Placer le joueur en position 0,0 (origine de la map)
        PlayerInstance.coordinates.X = 0;
        PlayerInstance.coordinates.Y = 0;

        super.addWGObject(PlayerInstance);

        // === CAMÉRA === //
        super.activeCamera.cameraSubject = PlayerInstance;

        // Centrer immédiatement la caméra sur le joueur (calcul similaire à Camera.run())
        const scale = 600 * 0.004; // CanvasHeight * 0.004
        let modelX = 0;
        let modelY = 0;

        if (PlayerInstance.components.BoxCollider) {
            modelX = PlayerInstance.components.BoxCollider.hitbox.Width / 2;
            modelY = PlayerInstance.components.BoxCollider.hitbox.Height / 2;
        }

        super.activeCamera.coordinates.X = -PlayerInstance.coordinates.X + (canvasWidth / 2) / scale - modelX;
        super.activeCamera.coordinates.Y = -PlayerInstance.coordinates.Y + (canvasHeight / 2) / scale - modelY;

        window.activeCamera = super.activeCamera;
        window.playerInstance = PlayerInstance;

        // === TILE INTERACTION MANAGER === //
        // Initialiser le gestionnaire d'interactions avec les tuiles
        const canvas = document.getElementById('game-canvas');
        this.#tileInteractionManager = new TileInteractionManager(canvas, this.#dialogueBox);
        this.#tileInteractionManager.setPlayer(PlayerInstance);

        // Exposer globalement pour le Renderer
        window.tileInteractionManager = this.#tileInteractionManager;

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

    /**
     * Appelée à chaque tick pour mettre à jour les interactions
     */
    update(Services) {
        if (this.#tileInteractionManager) {
            this.#tileInteractionManager.update(Services.InputService);
        }
    }
}

export {ExempleScene};
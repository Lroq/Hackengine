import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
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
        this.ready = this.#buildScene();
    }

    async #buildScene() {
        if (!this.#initialized) {
            await HackemonService.initialize();
            this.#initialized = true;
        }

        // === JOUEUR === //
        const player = new Player("Ewoukouskous");
        player.coordinates.X = 0;
        player.coordinates.Y = 0;

        super.addWGObject(player);

        // === CAMÉRA === //
        super.activeCamera.cameraSubject = player;

        const canvasWidth  = 800;
        const canvasHeight = 600;
        const scale        = canvasHeight * 0.004;

        let modelX = 0;
        let modelY = 0;

        if (player.components.BoxCollider) {
            modelX = player.components.BoxCollider.hitbox.Width  / 2;
            modelY = player.components.BoxCollider.hitbox.Height / 2;
        }

        super.activeCamera.coordinates.X = -player.coordinates.X + (canvasWidth  / 2) / scale - modelX;
        super.activeCamera.coordinates.Y = -player.coordinates.Y + (canvasHeight / 2) / scale - modelY;
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

    constructor() {
        super();
        this.buildScene();
    }
}

export {ExempleScene};
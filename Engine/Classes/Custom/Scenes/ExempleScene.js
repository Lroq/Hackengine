import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {HackemonService} from "../../Base/Services/Hackemon/HackemonService.js";

class ExempleScene extends Scene {
    #initialized = false;

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

        const canvasWidth = 800;
        const canvasHeight = 600;
        const scale = canvasHeight * 0.004;

        let modelX = 0;
        let modelY = 0;

        if (player.components.BoxCollider) {
            modelX = player.components.BoxCollider.hitbox.Width / 2;
            modelY = player.components.BoxCollider.hitbox.Height / 2;
        }

        super.activeCamera.coordinates.X = -player.coordinates.X + (canvasWidth / 2) / scale - modelX;
        super.activeCamera.coordinates.Y = -player.coordinates.Y + (canvasHeight / 2) / scale - modelY;

        window.activeCamera = super.activeCamera;
        window.playerInstance = player;
    }
}

export {ExempleScene};
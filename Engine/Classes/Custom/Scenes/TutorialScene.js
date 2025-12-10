import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";

class TutorialScene extends Scene {
    #player = null;

    async buildScene() {
        this.#player = new Player("Enox");
        this.#player.coordinates.X = 100;
        this.#player.coordinates.Y = 100;

        super.addWGObject(this.#player);

        super.activeCamera.cameraSubject = this.#player;

        console.log("✅ TutorialScene chargée");
    }

    constructor() {
        super();
        this.buildScene();
    }
}

export {TutorialScene};
import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";

class EditorScene extends Scene {
    #player = null;

    buildScene() {
        this.#player = new Player("Joueur");
        this.#player.coordinates.X = 200;
        this.#player.coordinates.Y = 150;

        super.addWGObject(this.#player);

        super.activeCamera.cameraSubject = this.#player;
    }

    constructor() {
        super();
        this.buildScene();
    }
}

export {EditorScene};

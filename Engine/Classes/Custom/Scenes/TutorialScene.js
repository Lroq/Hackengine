import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {InteractionManager} from "../../Base/Services/Interactions/InteractionManager.js";
import {DialogueBox} from "../../Base/Services/UI/DialogueBox.js";

class TutorialScene extends Scene {
    #player = null;
    #interactionManager = new InteractionManager();
    #dialogueBox = new DialogueBox();

    async buildScene() {
        this.#player = new Player("Joueur");
        this.#player.coordinates.X = 200;
        this.#player.coordinates.Y = 150;

        super.addWGObject(this.#player);

        this.#interactionManager.setPlayer(this.#player);
        this.#interactionManager.setDialogueBox(this.#dialogueBox);

        super.activeCamera.cameraSubject = this.#player;

        console.log("✅ TutorialScene chargée");
    }

    update(Services) {
        this.#interactionManager.checkInteractions(Services.InputService);
    }

    getDialogueBox() {
        return this.#dialogueBox;
    }

    getInteractionManager() {
        return this.#interactionManager;
    }

    constructor() {
        super();
        this.buildScene();
    }
}

export {TutorialScene};
import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {InteractionManager} from "../../Base/Services/Interactions/InteractionManager.js";
import {DialogueBox} from "../../Base/Services/UI/DialogueBox.js";
import {InteractableObject} from "../WebGameObjects/InteractableObject.js";

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

        this.#createBedroomObjects();

        console.log("✅ TutorialScene chargée");
    }

    #createBedroomObjects() {
        const tv = new InteractableObject(
            "/Public/Assets/Game/Objects/tele.png",
            35,
            21,
            "Impossible d'utiliser la console ! Le pare-feu bloque tout !",
            this.#dialogueBox
        );
        tv.coordinates.X = 200;
        tv.coordinates.Y = 80;
        tv.layer = 1;

        super.addWGObject(tv);
        this.#interactionManager.registerInteractable(tv);
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
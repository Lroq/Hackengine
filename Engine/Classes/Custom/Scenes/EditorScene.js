import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {InteractableObject} from "../WebGameObjects/InteractableObject.js";

class EditorScene extends Scene {
    #player = null;
    #tv = null;

    buildScene() {
        this.#player = new Player("Joueur");
        this.#player.coordinates.X = 200;
        this.#player.coordinates.Y = 150;

        super.addWGObject(this.#player);

        this.#tv = new InteractableObject(
            "/Public/Assets/Game/Objects/tele.png",
            35,
            27,
            "📺 C'est une télévision. Elle diffuse des émissions de Hackemon !",
            null
        );
        this.#tv.coordinates.X = 300;
        this.#tv.coordinates.Y = 150;
        this.#tv.layer = 1;

        super.addWGObject(this.#tv);

        super.activeCamera.cameraSubject = this.#player;
    }

    constructor() {
        super();
        this.buildScene();
    }

    setDialogueBox(dialogueBox) {
        if (this.#tv) {
            this.#tv.onInteract = () => {
                dialogueBox.show("📺 C'est une télévision. Elle diffuse des émissions de Hackemon !");
            };
        }
    }
}

export {EditorScene};

import { Scene } from "../../../Base/Services/Scenes/Scene.js";
import { TextLabel } from "../../../Base/WebGameObjects/TextLabel.js";

/**
 * Scene dedicated to Hackemon battles
 * Triggered when player encounters a wild Hackemon or trainer
 */
class BattleScene extends Scene {
    #battleManager;
    #uiElements = {};

    constructor() {
        super();
        this.#setupCamera();
        this.#initializeUI();
    }

    /**
     * Setup camera for battle scene (static, centered)
     */
    #setupCamera() {
        // Mettre la caméra en mode scriptable (pas de follow)
        super.activeCamera.cameraType = "CAM_SCRIPTABLE";

        // Centrer la caméra pour la bataille
        super.activeCamera.coordinates.X = 0;
        super.activeCamera.coordinates.Y = 0;

        // Empêcher le pan de la caméra pendant le combat
        window.getCameraPan = () => ({ x: 0, y: 0 });
    }

    /**
     * Initialize basic battle UI elements
     */
    #initializeUI() {
        // Titre temporaire pour test
        const battleTitle = new TextLabel();
        battleTitle.text = "COMBAT HACKEMON";
        battleTitle.font = "Pixel Font";
        battleTitle.size = 20;
        battleTitle.color = "white";
        battleTitle.coordinates.X = 150;
        battleTitle.coordinates.Y = 50;

        super.addWGObject(battleTitle);
        this.#uiElements.title = battleTitle;

        // Instruction temporaire
        const instruction = new TextLabel();
        instruction.text = "Appuyez sur ECHAP pour retourner";
        instruction.font = "Pixel Font";
        instruction.size = 12;
        instruction.color = "gray";
        instruction.coordinates.X = 150;
        instruction.coordinates.Y = 100;

        super.addWGObject(instruction);
        this.#uiElements.instruction = instruction;
    }

    /**
     * Start a battle with given Hackemons
     * @param {Hackemon} playerHackemon - Player's active Hackemon
     * @param {Hackemon} opponentHackemon - Opponent's Hackemon
     */
    startBattle(playerHackemon, opponentHackemon) {
        console.log("Battle started!");
        console.log("Player:", playerHackemon);
        console.log("Opponent:", opponentHackemon);

        // TODO: Initialize BattleManager here
        // this.#battleManager = new BattleManager(playerHackemon, opponentHackemon);
    }

    /**
     * End battle and return to previous scene
     */
    endBattle() {
        console.log("Battle ended!");
        // TODO: Transition back to exploration scene
    }
}

export { BattleScene };
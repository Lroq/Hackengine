import { Scene } from "../../../Base/Services/Scenes/Scene.js";
import { TextLabel } from "../../../Base/WebGameObjects/TextLabel.js";
import {Instance} from "../../../Base/WebGameObjects/Instance.js";
import {WGObject} from "../../../Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../../../Base/Components/SpriteModel.js";
import {Utils} from "../../../Base/Services/Utilities/Utils.js";

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
        super.activeCamera.cameraType = "CAM_SCRIPTABLE";

        super.activeCamera.coordinates.X = 0;
        super.activeCamera.coordinates.Y = 0;

        window.getCameraPan = () => ({ x: 0, y: 0 });
    }

    /**
     * Initialize basic battle UI elements
     */
    #initializeUI() {
        const battleTitle = new TextLabel();
        battleTitle.text = "COMBAT HACKEMON";
        battleTitle.font = "Pixel Font";
        battleTitle.size = 20;
        battleTitle.color = "white";
        battleTitle.coordinates.X = 150;
        battleTitle.coordinates.Y = 50;

        super.addWGObject(battleTitle);
        this.#uiElements.title = battleTitle;

        const instruction = new TextLabel();
        instruction.text = "Appuyez sur ECHAP pour retourner";
        instruction.font = "Pixel Font";
        instruction.size = 12;
        instruction.color = "gray";
        instruction.coordinates.X = 150;
        instruction.coordinates.Y = 100;

        super.addWGObject(instruction);
        this.#uiElements.instruction = instruction;

        const hackemonSprite = new WGObject();
        const hackemonSpriteModel = new SpriteModel();
        hackemonSpriteModel.enabled = true;
        hackemonSpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Hackemons/hackemon1.png");
        hackemonSpriteModel.size.Height = 96;
        hackemonSpriteModel.size.Width = 96;
        hackemonSprite.addComponent(hackemonSpriteModel);
        hackemonSprite.coordinates.X = 200;
        hackemonSprite.coordinates.Y = 150;

        super.addWGObject(hackemonSprite);
        this.#uiElements.hackemonSprite = hackemonSprite;
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
import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {InteractionManager} from "../../Base/Services/Interactions/InteractionManager.js";
import {DialogueBox} from "../../Base/Services/Ui/DialogueBox.js";
import {TileInteractionManager} from "../../Base/Services/Interactions/TileInteractionManager.js";
import {TutorialStep1Data} from "../Tutorial/Data/TutorialStep1Data.js";
import {TutorialHudService} from "../Tutorial/TutorialHudService.js";
import {TutorialProgressService} from "../Tutorial/TutorialProgressService.js";
import {ScriptedInteractable} from "../Tutorial/Objects/ScriptedInteractable.js";
import {ProximityTrigger} from "../Tutorial/Objects/ProximityTrigger.js";
import {MotherNPC} from "../Tutorial/Objects/MotherNPC.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";

class TutorialScene extends Scene {
    #player = null;
    #interactionManager = new InteractionManager();
    #dialogueBox = new DialogueBox();
    #tileInteractionManager = null;
    #tutorialHud = new TutorialHudService();
    #progress = new TutorialProgressService();
    #isInitialized = false;

    async buildScene() {
        if (this.#isInitialized) return;
        this.#isInitialized = true;

        this.#tutorialHud.mount();
        this.#progress.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.setObjective(TutorialStep1Data.objective);

        this.#player = new Player("Joueur");
        this.#player.coordinates.X = TutorialStep1Data.spawn.x;
        this.#player.coordinates.Y = TutorialStep1Data.spawn.y;
        this.#player.layer = 2;

        super.addWGObject(this.#player);

        this.#interactionManager.setPlayer(this.#player);
        this.#interactionManager.setDialogueBox(this.#dialogueBox);

        super.activeCamera.cameraSubject = this.#player;

        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            this.#tileInteractionManager = new TileInteractionManager(canvas, this.#dialogueBox);
            this.#tileInteractionManager.setPlayer(this.#player);
            window.tileInteractionManager = this.#tileInteractionManager;
        }

        await this.#playIntroCinematic();

        this.#createBedroomObjects();
        this.#createLivingRoomClues();
        this.#createMotherNpc();
        this.#createStepTransitionTrigger();

        console.log("✅ TutorialScene chargée");
    }

    async #playIntroCinematic() {
        this.#player.freeze();
        this.#player.setEmote("😡");

        this.#dialogueBox.show([
            "Connexion perdue...",
            "Le controle parental active un pare-feu global !"
        ]);

        await Utils.wait(1.2);
        if (this.#dialogueBox.isVisible()) {
            this.#dialogueBox.hide();
        }

        this.#tutorialHud.blinkScreen();
        this.#tutorialHud.pushNotification(TutorialStep1Data.introNotification, 'warning');

        await Utils.wait(0.35);
        this.#player.clearEmote();
        this.#player.unfreeze();
    }

    #registerInteractable(config, onInteract = null) {
        const interactable = new ScriptedInteractable(config, this.#dialogueBox, onInteract);
        interactable.coordinates.X = config.x;
        interactable.coordinates.Y = config.y;
        interactable.layer = 1;
        super.addWGObject(interactable);
        this.#interactionManager.registerInteractable(interactable);
        return interactable;
    }

    #createBedroomObjects() {
        TutorialStep1Data.bedroomInteractions.forEach(config => {
            this.#registerInteractable(config);
        });
    }

    #createLivingRoomClues() {
        TutorialStep1Data.livingRoomClues.forEach(clue => {
            this.#registerInteractable(clue, () => {
                const newlyCollected = this.#progress.collectClue(clue.id);
                if (newlyCollected) {
                    this.#tutorialHud.pushNotification(`Indice recupere: ${clue.label}`, 'info');
                }
            });
        });
    }

    #createMotherNpc() {
        const mother = new MotherNPC(TutorialStep1Data.mother);
        mother.coordinates.X = TutorialStep1Data.mother.x;
        mother.coordinates.Y = TutorialStep1Data.mother.y;
        mother.layer = 2;
        mother.setPlayer(this.#player);
        mother.onStateChange((nextState) => {
            if (nextState === 'Alert' || nextState === 'Repositioned') {
                this.#tutorialHud.pushNotification("Maman: 'Hein ?! Tu fais quoi derriere moi ?'", 'warning');
            }
        });

        super.addWGObject(mother);
    }

    #createStepTransitionTrigger() {
        const trigger = new ProximityTrigger(TutorialStep1Data.bedroomExitTrigger, () => {
            this.#progress.goToStep("step2");
            this.#progress.markRoomExited();
            this.#tutorialHud.pushNotification("Etape 2 debloquee: direction le salon", 'success');
        });

        trigger.coordinates.X = TutorialStep1Data.bedroomExitTrigger.x;
        trigger.coordinates.Y = TutorialStep1Data.bedroomExitTrigger.y;
        trigger.setPlayer(this.#player);
        super.addWGObject(trigger);
    }

    update(Services) {
        if (window.getMode && window.getMode() !== 'play') {
            return;
        }

        this.#interactionManager.checkInteractions(Services.InputService);

        if (this.#tileInteractionManager) {
            this.#tileInteractionManager.update(Services.InputService);
        }
    }

    constructor() {
        super();
        this.ready = this.buildScene();
    }
}

export {TutorialScene};
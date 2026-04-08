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
import {InteractionUtils} from "../../Base/Services/Interactions/InteractionUtils.js";

class TutorialScene extends Scene {
    #player = null;
    #interactionManager = new InteractionManager();
    #dialogueBox = new DialogueBox();
    #tileInteractionManager = null;
    #tutorialHud = new TutorialHudService();
    #progress = new TutorialProgressService();
    #isInitialized = false;
    #isResolvingFailure = false;
    #activeStep = "step1";

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

    #registerInteractable(config, hooks = {}) {
        const interactable = new ScriptedInteractable(config, this.#dialogueBox, hooks);
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
        const byId = Object.fromEntries(TutorialStep1Data.livingRoomClues.map(clue => [clue.id, clue]));

        this.#registerInteractable(byId.kennel, {
            onDialogueClosed: async () => {
                const petDog = await this.#confirmChoice("Le caresser ?", "Niche");
                if (petDog) {
                    this.#triggerFailFlow("Wouf ! Wouf !");
                    return;
                }

                const newlyCollected = this.#progress.collectClue(byId.kennel.id);
                if (newlyCollected) {
                    this.#tutorialHud.pushNotification(TutorialStep1Data.clueCompletionText.kennel, 'info');
                }
            }
        });

        this.#registerInteractable(byId.dresser_frame, {
            onDialogueClosed: async () => {
                const turnFrame = await this.#confirmChoice("Retourner le cadre ?", "Cadre de famille");
                if (!turnFrame) return;

                this.#dialogueBox.show([
                    "Date de naissance 1995",
                    TutorialStep1Data.clueCompletionText.frame
                ]);

                const newlyCollected = this.#progress.collectClue(byId.dresser_frame.id);
                if (newlyCollected) {
                    this.#tutorialHud.pushNotification("Indice recupere: 95", 'info');
                }
            }
        });

        this.#registerInteractable(byId.fridge, {
            onDialogueClosed: async () => {
                this.#tutorialHud.showCalendarPopup();
                this.#dialogueBox.show([
                    "15 fevrier: ANNIVERSAIRE MAMAN",
                    TutorialStep1Data.clueCompletionText.fridge
                ]);

                const newlyCollected = this.#progress.collectClue(byId.fridge.id);
                if (newlyCollected) {
                    this.#tutorialHud.pushNotification("Indice recupere: 1502", 'info');
                }
            }
        });
    }

    #createMotherNpc() {
        const mother = new MotherNPC(TutorialStep1Data.mother);
        mother.coordinates.X = TutorialStep1Data.mother.x;
        mother.coordinates.Y = TutorialStep1Data.mother.y;
        mother.layer = 2;
        mother.setPlayer(this.#player);
        mother.onStateChange((nextState) => {
            if (nextState === 'Alert') {
                this.#triggerFailFlow(TutorialStep1Data.failText);
            }
        });

        super.addWGObject(mother);
    }

    #createStepTransitionTrigger() {
        const trigger = new ProximityTrigger(TutorialStep1Data.bedroomExitTrigger, () => {
            this.#activeStep = "step2";
            this.#progress.goToStep("step2");
            this.#progress.markRoomExited();
            this.#progress.startInfiltration();
            this.#progress.setObjective(TutorialStep1Data.step2Objective);
            this.#tutorialHud.setObjective(TutorialStep1Data.step2Objective);
            this.#tutorialHud.pushNotification("Etape 2: infiltration activee", 'success');
        });

        trigger.coordinates.X = TutorialStep1Data.bedroomExitTrigger.x;
        trigger.coordinates.Y = TutorialStep1Data.bedroomExitTrigger.y;
        trigger.setPlayer(this.#player);
        super.addWGObject(trigger);
    }

    #getPlayerRect() {
        const collider = this.#player?.components?.BoxCollider;
        if (!collider) return null;

        return InteractionUtils.getObjectRect(this.#player, collider.hitbox.Width, collider.hitbox.Height);
    }

    #updateStep2Infiltration() {
        if (this.#activeStep !== "step2") return;
        if (this.#isResolvingFailure) return;

        const path = TutorialStep1Data.infiltrationPath;
        const playerRect = this.#getPlayerRect();
        if (!playerRect || path.length === 0) return;

        let validIndex = -1;
        for (let i = 0; i < path.length; i++) {
            const zone = path[i];
            const zoneRect = {
                left: zone.x,
                top: zone.y,
                right: zone.x + zone.width,
                bottom: zone.y + zone.height
            };
            if (InteractionUtils.rectsOverlap(zoneRect, playerRect)) {
                validIndex = i;
                break;
            }
        }

        const currentIndex = this.#progress.snapshot().infiltrationPathIndex;

        if (validIndex === -1) {
            this.#triggerFailFlow(TutorialStep1Data.failText);
            return;
        }

        if (validIndex > currentIndex) {
            this.#progress.setInfiltrationPathIndex(validIndex);
        }
    }

    async #confirmChoice(message, title) {
        try {
            const module = await import('/Public/Js/CustomDialog.js');
            if (module?.CustomDialog?.confirm) {
                return await module.CustomDialog.confirm(message, title);
            }
        } catch (err) {
            console.warn('CustomDialog indisponible, fallback window.confirm', err);
        }

        return window.confirm(`${title}\n\n${message}`);
    }

    async #triggerFailFlow(message) {
        if (this.#isResolvingFailure) return;
        this.#isResolvingFailure = true;

        this.#progress.setMissionFailed(true);
        this.#tutorialHud.showMissionFailed(message);
        this.#dialogueBox.show([TutorialStep1Data.failText]);

        this.#player.freeze();
        await Utils.wait(1.3);

        if (this.#dialogueBox.isVisible()) {
            this.#dialogueBox.hide();
        }

        this.#player.coordinates.X = TutorialStep1Data.spawn.x;
        this.#player.coordinates.Y = TutorialStep1Data.spawn.y;

        this.#activeStep = "step1";
        this.#progress.resetStepTwoProgress();
        this.#progress.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.pushNotification("Progression reset: repars de ta chambre", 'warning');

        this.#player.unfreeze();
        this.#isResolvingFailure = false;
    }

    update(Services) {
        if (window.getMode && window.getMode() !== 'play') {
            return;
        }

        this.#updateStep2Infiltration();

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
import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Player} from "../WebGameObjects/Player.js";
import {InteractionManager} from "../../Base/Services/Interactions/InteractionManager.js";
import {DialogueBox} from "../../Base/Services/Ui/DialogueBox.js";
import {TileInteractionManager} from "../../Base/Services/Interactions/TileInteractionManager.js";
import {TutorialStep1Data} from "../Tutorial/Data/TutorialStep1Data.js";
import {TutorialStep3Data} from "../Tutorial/Data/TutorialStep3Data.js";
import {TutorialHudService} from "../Tutorial/TutorialHudService.js";
import {TutorialProgressService} from "../Tutorial/TutorialProgressService.js";
import {ScriptedInteractable} from "../Tutorial/Objects/ScriptedInteractable.js";
import {ProximityTrigger} from "../Tutorial/Objects/ProximityTrigger.js";
import {MotherNPC} from "../Tutorial/Objects/MotherNPC.js";
import {ComputerInteractable} from "../Tutorial/Objects/ComputerInteractable.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {InteractionUtils} from "../../Base/Services/Interactions/InteractionUtils.js";
import {WindowsSimulatorService} from "../Tutorial/Services/WindowsSimulatorService.js";
import {MotherAlertService} from "../Tutorial/Services/MotherAlertService.js";
import {WGObject} from "../../Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {BoxCollider} from "../../Base/Components/BoxCollider.js";

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
    #motherNpc = null;
    #computerInteractable = null;
    #windowsSimulator = null;
    #motherAlertService = null;
    #isPlayingStep3 = false;
    #consoleInteractable = null;

    async buildScene() {
        if (this.#isInitialized) return;
        this.#isInitialized = true;

        this.#tutorialHud.mount();
        this.#progress.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.setObjective(TutorialStep1Data.objective);

        this.#player = new Player("Pochi");
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
        this.#createSofa();
        this.#createTV();
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
            const interactable = this.#registerInteractable(config);
            if (config.id === "tv_console") {
                this.#consoleInteractable = interactable;
            }
        });

        // Créer l'ordinateur du salon (utilisé pour étapes 1, 2 et 3)
        this.#computerInteractable = new ComputerInteractable(TutorialStep3Data.computerInteractable, this.#dialogueBox, {
            onInteract: async () => {
                if (this.#hasAllStep2Clues() && !this.#progress.isStep3Completed()) {
                    this.#tryUnlockStep3();
                    await this.#startStep3();
                    return false;
                }

                if (this.#activeStep === "step2") {
                    this.#tutorialHud.pushNotification(`Indices mot de passe: ${this.#getStep2CluesCount()}/3`, 'info');
                }

                return true;
            }
        });
        this.#computerInteractable.coordinates.X = TutorialStep3Data.computerInteractable.x;
        this.#computerInteractable.coordinates.Y = TutorialStep3Data.computerInteractable.y;
        this.#computerInteractable.layer = 1;
        super.addWGObject(this.#computerInteractable);
        this.#interactionManager.registerInteractable(this.#computerInteractable);
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
                this.#updateStep2HudProgress();
                this.#tryUnlockStep3();
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
                this.#updateStep2HudProgress();
                this.#tryUnlockStep3();
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
                this.#updateStep2HudProgress();
                this.#tryUnlockStep3();
            }
        });
    }

    #hasAllStep2Clues() {
        const found = this.#progress.snapshot().foundClues;
        return found.includes("kennel") && found.includes("dresser_frame") && found.includes("fridge");
    }

    #getStep2CluesCount() {
        const found = this.#progress.snapshot().foundClues;
        const required = ["kennel", "dresser_frame", "fridge"];
        return required.filter(id => found.includes(id)).length;
    }

    #updateStep2HudProgress() {
        if (this.#activeStep !== "step2") return;
        const count = this.#getStep2CluesCount();
        this.#tutorialHud.setObjective(`${TutorialStep1Data.step2Objective} (${count}/3 indices)`);
    }

    #tryUnlockStep3() {
        if (!this.#hasAllStep2Clues()) return;
        if (this.#progress.isStep3Completed()) return;

        this.#activeStep = "step3";
        this.#computerInteractable?.setStep("step3");
        this.#progress.goToStep("step3");
        this.#progress.setObjective(TutorialStep3Data.objective);
        this.#tutorialHud.setObjective(TutorialStep3Data.objective);
        this.#tutorialHud.pushNotification("Indices complets: ordinateur pret pour le login", 'success');
    }

    #buildStep3StickyNote() {
        const found = this.#progress.snapshot().foundClues;
        const lines = [];

        if (found.includes("kennel")) {
            lines.push("Nom du chien: clipper");
        }
        if (found.includes("fridge")) {
            lines.push("Date: 1502");
        }
        if (found.includes("dresser_frame")) {
            lines.push("Annee: 95");
        }

        if (!lines.length) {
            lines.push("Aucun indice collecte");
        }

        return {
            title: "Post-it indices",
            lines
        };
    }

    #createMotherNpc() {
        this.#motherNpc = new MotherNPC(TutorialStep1Data.mother);
        this.#motherNpc.coordinates.X = TutorialStep1Data.mother.x;
        this.#motherNpc.coordinates.Y = TutorialStep1Data.mother.y;
        this.#motherNpc.layer = 2;
        this.#motherNpc.setPlayer(this.#player);
        this.#motherNpc.onStateChange((nextState) => {
            if (nextState === 'Alert') {
                this.#triggerFailFlow(TutorialStep1Data.failText);
            }
        });

        super.addWGObject(this.#motherNpc);

        this.#motherAlertService = new MotherAlertService(this.#motherNpc, () => {
            this.#triggerFailFlow(TutorialStep3Data.failText);
        });
    }

    #createSofa() {
        const sofa = new WGObject();
        const sprite = new SpriteModel();
        sprite.sprite = Utils.createSprite("/Public/Assets/Game/Objects/Sofa.png");
        sprite.size.Width = 70;
        sprite.size.Height = 30;
        sofa.addComponent(sprite);

        const collider = new BoxCollider();
        collider.enabled = true;
        collider.hitbox.Width = 70;
        collider.hitbox.Height = 30;
        sofa.addComponent(collider);

        sofa.coordinates.X = 450;
        sofa.coordinates.Y = 115;
        sofa.layer = 1;
        super.addWGObject(sofa);
    }

    #createTV() {
        const tv = new WGObject();
        const tvSprite = new SpriteModel();
        tvSprite.sprite = Utils.createSprite("Public/Assets/Game/Objects/tvmaman.png");
        tvSprite.size.Width = 70;
        tvSprite.size.Height = 50;
        tv.addComponent(tvSprite);

        const tvCollider = new BoxCollider();
        tvCollider.enabled = true;
        tvCollider.hitbox.Width = 70;
        tvCollider.hitbox.Height = 50;
        tv.addComponent(tvCollider);

        tv.coordinates.X = 450;
        tv.coordinates.Y = 170;
        tv.layer = 1;
        super.addWGObject(tv);
    }

    #createStepTransitionTrigger() {
        const trigger = new ProximityTrigger(TutorialStep1Data.bedroomExitTrigger, () => {
            this.#activeStep = "step2";
            this.#computerInteractable.setStep("step2");
            this.#progress.goToStep("step2");
            this.#progress.markRoomExited();
            this.#progress.startInfiltration();
            this.#progress.setObjective(TutorialStep1Data.step2Objective);
            this.#updateStep2HudProgress();
            this.#tutorialHud.pushNotification("Etape 2: infiltration activee", 'success');
        });

        trigger.coordinates.X = TutorialStep1Data.bedroomExitTrigger.x;
        trigger.coordinates.Y = TutorialStep1Data.bedroomExitTrigger.y;
        trigger.setPlayer(this.#player);
        super.addWGObject(trigger);
    }

    async #startStep3() {
        if (this.#isPlayingStep3) return;
        if (this.#progress.isStep3Completed()) {
            this.#tutorialHud.pushNotification("Étape 3 déjà complétée!", 'info');
            return;
        }
        this.#isPlayingStep3 = true;
        this.#activeStep = "step3";

        // Geler le joueur pendant le mini-jeu
        this.#player.freeze();

        // Désactiver l'interaction avec l'ordinateur pendant le jeu
        this.#computerInteractable.disableInteraction();

        // Afficher une notification
        this.#tutorialHud.pushNotification(TutorialStep3Data.introMessage, 'warning');

        // Initialiser le simulateur Windows
        this.#windowsSimulator = new WindowsSimulatorService(
            TutorialStep3Data.windowsUI.correctPassword,
            TutorialStep3Data.windowsUI.maxLoginAttempts,
            this.#buildStep3StickyNote()
        );

        // Phase 1 : Login
        let result = await this.#windowsSimulator.launch(TutorialStep3Data.timer.maxDurationSeconds);

        if (!result.success) {
            // Échec du login - raison : timeout ou max_attempts
            if (result.reason === 'max_attempts') {
                this.#motherAlertService.recordFailedAttempt();
            }
            this.#triggerFailFlow(TutorialStep3Data.failText);
            this.#player.unfreeze();
            this.#computerInteractable.enableInteraction();
            this.#isPlayingStep3 = false;
            return;
        }

        // Phase 2 : Afficher le panneau de contrôle parental
         result = await this.#windowsSimulator.showParentalControlPanel(
             TutorialStep3Data.timer.panelDurationSeconds || 40
         );

         if (result && result.success) {
             // ✓ Succès ! Étape 3 complétée
             await this.#completeStep3();
         } else {
             // ✗ Timeout sur panel - compter comme une tentative échouée
             if (result && result.reason === 'timeout') {
                 this.#motherAlertService.recordFailedAttempt();
             }
             this.#triggerFailFlow(TutorialStep3Data.failText);
         }

        this.#player.unfreeze();
        this.#computerInteractable.enableInteraction();
        this.#isPlayingStep3 = false;
    }

    async #completeStep3() {
        // Marquer l'étape 3 comme complétée
        this.#progress.markStep3Completed();
        this.#computerInteractable?.setLines(TutorialStep3Data.computerInteractable.linesAfterFirewall);

        const consoleConfig = TutorialStep1Data.bedroomInteractions.find(item => item.id === "tv_console");
        if (consoleConfig?.linesAfterFirewall && this.#consoleInteractable) {
            this.#consoleInteractable.setLines(consoleConfig.linesAfterFirewall);
        }

        this.#tutorialHud.pushNotification("Étape 3 complétée ! Contrôle parental désactivé", 'success');
        this.#tutorialHud.setObjective("Accès Internet rétabli ✓");
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
        this.#computerInteractable?.setStep("step1");
        this.#progress.resetStepTwoProgress();
        this.#progress.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.setObjective(TutorialStep1Data.objective);
        this.#tutorialHud.pushNotification("Progression reset: repars de ta chambre", 'warning');

        // Réinitialiser le service d'alerte de la mère pour l'étape 3
        if (this.#motherAlertService) {
            this.#motherAlertService.reset();
        }

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
import { Instance } from "../../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../../Base/Components/BoxCollider.js";
import { Utils } from "../../../Base/Services/Utilities/Utils.js";
import { InteractionUtils } from "../../../Base/Services/Interactions/InteractionUtils.js";

class ComputerInteractable extends Instance {
    #dialogueBox;
    #lines;
    #linesStep1;
    #linesStep3;
    #interactionRange;
    #onInteract;
    #isActive = true;
    #currentStep = "step1";

    constructor(config, dialogueBox, hooks = {}) {
        super();
        this.#dialogueBox = dialogueBox;
        // Support pour deux ensembles de dialogues
        this.#linesStep1 = InteractionUtils.normalizeDialogueLines(config.linesStep1 || config.lines || "");
        this.#linesStep3 = InteractionUtils.normalizeDialogueLines(config.linesStep3 || config.lines || "");
        this.#lines = this.#linesStep1; // Par défaut étape 1
        this.#onInteract = hooks?.onInteract ?? null;
        this.#interactionRange = config.interactionRange ?? 34;

        const sprite = new SpriteModel();
        sprite.enabled = true;
        sprite.sprite = Utils.createSprite(config.spritePath);
        sprite.size.Width = config.width;
        sprite.size.Height = config.height;

        const collider = new BoxCollider();
        collider.enabled = false;
        collider.hitbox.Width = config.width;
        collider.hitbox.Height = config.height;

        super.addComponent(sprite);
        super.addComponent(collider);

        this.metadata = {
            id: config.id || null,
            label: config.label || null,
            isStep3Computer: true
        };
    }

    get interactionRange() {
        return this.#interactionRange;
    }

    getInteractionAnchor() {
        const sprite = this.components.SpriteModel;
        const width = sprite?.size?.Width ?? 0;
        const height = sprite?.size?.Height ?? 0;

        return {
            x: this.coordinates.X + width / 2,
            y: this.coordinates.Y + height / 2
        };
    }

    /**
     * Appelé quand le joueur interagit avec l'ordinateur
     */
    async onInteract(context = {}) {
        if (!this.#isActive) return;

        let shouldShowDialogue = true;

        if (typeof this.#onInteract === 'function') {
            const result = await this.#onInteract({
                ...context,
                interactable: this
            });
            if (result === false) {
                shouldShowDialogue = false;
            }
        }

        if (shouldShowDialogue && this.#dialogueBox) {
            this.#dialogueBox.show(this.#lines, () => {
                // Dialogue fermé
            });
        }
    }

    /**
     * Désactive temporairement l'interaction pendant le mini-jeu
     */
    disableInteraction() {
        this.#isActive = false;
    }

    /**
     * Réactive l'interaction
     */
    enableInteraction() {
        this.#isActive = true;
    }

    /**
     * Change l'étape et met à jour les dialogues
     */
    setStep(step) {
        this.#currentStep = step;
        if (step === "step1" || step === "step2") {
            this.#lines = this.#linesStep1;
        } else if (step === "step3") {
            this.#lines = this.#linesStep3;
        }
    }

    setLines(lines) {
        this.#lines = InteractionUtils.normalizeDialogueLines(lines || "");
    }

    run() {}
}

export { ComputerInteractable };




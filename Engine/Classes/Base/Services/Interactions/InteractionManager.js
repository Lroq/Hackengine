import { InteractionUtils } from "./InteractionUtils.js";

class InteractionManager {
    #interactables = [];
    #player = null;
    #interactionRange = 30;
    #dialogueBox = null;

    setDialogueBox(dialogueBox) {
        this.#dialogueBox = dialogueBox;
    }

    setPlayer(player) {
        this.#player = player;
    }

    registerInteractable(interactable) {
        this.#interactables.push(interactable);
    }

    unregisterInteractable(interactable) {
        const index = this.#interactables.indexOf(interactable);
        if (index > -1) {
            this.#interactables.splice(index, 1);
        }
    }

    #getAnchor(interactable) {
        if (interactable && typeof interactable.getInteractionAnchor === 'function') {
            const anchor = interactable.getInteractionAnchor();
            if (anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number') {
                return anchor;
            }
        }

        return {
            x: interactable?.coordinates?.X ?? 0,
            y: interactable?.coordinates?.Y ?? 0
        };
    }

    checkInteractions(inputService) {
        if (!this.#player || !inputService.IsKeyPressed('e')) return;

        if (this.#dialogueBox && this.#dialogueBox.isVisible()) {
            this.#dialogueBox.hide();
            return;
        }

        const playerX = this.#player.coordinates.X;
        const playerY = this.#player.coordinates.Y;

        let nearestInteractable = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (const interactable of this.#interactables) {
            if (!interactable || interactable.isInteractionEnabled === false) continue;

            const anchor = this.#getAnchor(interactable);

            const distance = InteractionUtils.distance2D(playerX, playerY, anchor.x, anchor.y);
            const interactionRange = interactable.interactionRange ?? this.#interactionRange;

            if (distance <= interactionRange && distance < nearestDistance) {
                nearestDistance = distance;
                nearestInteractable = interactable;
            }
        }

        if (nearestInteractable && nearestInteractable.onInteract) {
            nearestInteractable.onInteract({
                player: this.#player,
                dialogueBox: this.#dialogueBox,
                inputService
            });
        }
    }
}

export {InteractionManager};
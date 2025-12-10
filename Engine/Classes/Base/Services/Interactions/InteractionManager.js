class InteractionManager {
    #interactables = [];
    #player = null;
    #interactionRange = 30;

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

    checkInteractions(inputService) {
        if (!this.#player || !inputService.IsKeyDown('e')) return;

        const playerX = this.#player.coordinates.X;
        const playerY = this.#player.coordinates.Y;

        for (const interactable of this.#interactables) {
            const objX = interactable.coordinates.X;
            const objY = interactable.coordinates.Y;

            const distance = Math.sqrt(
                Math.pow(playerX - objX, 2) +
                Math.pow(playerY - objY, 2)
            );

            if (distance <= this.#interactionRange) {
                if (interactable.onInteract) {
                    interactable.onInteract();
                }
                return;
            }
        }
    }
}

export {InteractionManager};
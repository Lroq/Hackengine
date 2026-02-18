class InputService {
    #inputs = {};
    #previousInputs = {};

    constructor() {
        document.addEventListener("keydown", (event) => {
            this.#inputs[event.key.toLowerCase()] = true;
        });
        document.addEventListener("keyup", (event) => {
            this.#inputs[event.key.toLowerCase()] = false;
        });
    }

    IsKeyDown(key) {
        const mode = window.getMode ? window.getMode() : "play";
        if (mode !== "play") return false;
        return this.#inputs[key.toLowerCase()] || false;
    }

    IsKeyPressed(key) {
        const mode = window.getMode ? window.getMode() : "play";
        if (mode !== "play") return false;

        const currentState = this.#inputs[key.toLowerCase()] || false;
        const previousState = this.#previousInputs[key.toLowerCase()] || false;

        return currentState && !previousState;
    }

    IsEitherKeyDown(keys) {
        const mode = window.getMode ? window.getMode() : "play";
        if (mode !== "play") return false;

        for (const key of keys) {
            if (this.#inputs[key.toLowerCase()]) {
                return true;
            }
        }
        return false;
    }

    updatePreviousInputs() {
        this.#previousInputs = { ...this.#inputs };
    }
}

export { InputService };
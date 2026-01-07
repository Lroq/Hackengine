class InputService {
    #inputs = {};

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
        if (mode !== "play") return false; // ❌ Désactive les inputs en mode construction
        return this.#inputs[key.toLowerCase()] || false;
    }

    IsEitherKeyDown(keys) {
        const mode = window.getMode ? window.getMode() : "play";
        if (mode !== "play") return false; // ❌ Bloque aussi les groupes de touches

        for (const key of keys) {
            if (this.#inputs[key.toLowerCase()]) {
                return true;
            }
        }
        return false;
    }
}

export { InputService };

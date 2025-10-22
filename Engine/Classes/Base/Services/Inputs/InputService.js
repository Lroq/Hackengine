class InputService {
    #inputs = {};

    constructor() {
        document.addEventListener("keydown", (event) => {
            this.#inputs[event.key] = true;
        });
        document.addEventListener("keyup", (event) => {
            this.#inputs[event.key] = false;
        });
    }

    IsKeyDown(key) {
        return this.#inputs[key] !== undefined ? this.#inputs[key] : false;
    }

    IsEitherKeyDown(keys) {
        for (const key of keys) {
            if (this.#inputs[key]) {
                return true;
            }
        }
        return false;
    }
}

export { InputService };

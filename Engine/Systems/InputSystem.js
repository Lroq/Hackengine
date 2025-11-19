/**
 * System that manages keyboard input state.
 * Provides methods to check if keys are pressed.
 * @class InputSystem
 */
class InputSystem {
    #inputState = {};
    #mode = 'play'; // 'play' or 'editor'

    constructor() {
        this.#initializeListeners();
    }

    /**
     * Initializes keyboard event listeners.
     * @private
     */
    #initializeListeners() {
        document.addEventListener('keydown', (event) => {
            this.#inputState[event.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.#inputState[event.key.toLowerCase()] = false;
        });
    }

    /**
     * Checks if a specific key is currently pressed.
     * Returns false in editor mode to prevent input during editing.
     * @param {string} key - Key to check (case-insensitive)
     * @returns {boolean} True if key is pressed in play mode
     */
    isKeyDown(key) {
        if (typeof key !== 'string') {
            throw new TypeError('Key must be a string');
        }

        // Check mode from window if available
        const currentMode = window.getMode ? window.getMode() : this.#mode;
        if (currentMode !== 'play') {
            return false;
        }

        return this.#inputState[key.toLowerCase()] || false;
    }

    /**
     * Checks if any of the specified keys is pressed.
     * @param {string[]} keys - Array of keys to check
     * @returns {boolean} True if any key is pressed in play mode
     * @throws {TypeError} If keys is not an array
     */
    isAnyKeyDown(keys) {
        if (!Array.isArray(keys)) {
            throw new TypeError('Keys must be an array of strings');
        }

        const currentMode = window.getMode ? window.getMode() : this.#mode;
        if (currentMode !== 'play') {
            return false;
        }

        return keys.some(key => this.#inputState[key.toLowerCase()]);
    }

    /**
     * Checks if all specified keys are pressed.
     * @param {string[]} keys - Array of keys to check
     * @returns {boolean} True if all keys are pressed in play mode
     * @throws {TypeError} If keys is not an array
     */
    areAllKeysDown(keys) {
        if (!Array.isArray(keys)) {
            throw new TypeError('Keys must be an array of strings');
        }

        const currentMode = window.getMode ? window.getMode() : this.#mode;
        if (currentMode !== 'play') {
            return false;
        }

        return keys.every(key => this.#inputState[key.toLowerCase()]);
    }

    /**
     * Sets the current mode (play/editor).
     * @param {string} mode - 'play' or 'editor'
     * @throws {TypeError} If mode is invalid
     */
    setMode(mode) {
        if (mode !== 'play' && mode !== 'editor') {
            throw new TypeError("Mode must be 'play' or 'editor'");
        }
        this.#mode = mode;
    }

    /**
     * Gets the current mode.
     * @returns {string} Current mode
     */
    getMode() {
        return this.#mode;
    }

    /**
     * Clears all input state.
     */
    clearInput() {
        this.#inputState = {};
    }

    /**
     * @deprecated Use isAnyKeyDown instead
     */
    IsEitherKeyDown(keys) {
        return this.isAnyKeyDown(keys);
    }

    /**
     * @deprecated Use isKeyDown instead
     */
    IsKeyDown(key) {
        return this.isKeyDown(key);
    }
}

export {InputSystem};
/**
 * Base class for all components in the WG Engine.
 * Provides common functionality like enable/disable state.
 */
class WGComponent {
    #enabled = true;

    /**
     * @returns {boolean} Whether the component is active
     */
    get enabled() {
        return this.#enabled;
    }

    /**
     * @param {boolean} value - Enable or disable the component
     */
    set enabled(value) {
        if (typeof value !== 'boolean') {
            throw new TypeError("enabled must be a boolean");
        }
        this.#enabled = value;
    }
}

export {WGComponent}

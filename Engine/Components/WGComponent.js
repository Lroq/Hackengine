/**
 * Base class for all components.
 * Components are pure data containers attached to entities.
 * @class WGComponent
 */
class WGComponent {
    #enabled = true;

    /**
     * @returns {boolean} Whether this component is enabled
     */
    get enabled() {
        return this.#enabled;
    }

    /**
     * @param {boolean} value - Enable or disable this component
     * @throws {TypeError} If value is not a boolean
     */
    set enabled(value) {
        if (typeof value !== 'boolean') {
            throw new TypeError(`Component.enabled must be a boolean, got ${typeof value}`);
        }
        this.#enabled = value;
    }
}

export {WGComponent};
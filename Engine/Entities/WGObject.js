import {Coordinates2D} from '../Utils/Coordinates2D.js';
import {WGComponent} from '../Components/WGComponent.js';
import {Logger} from '../Services/Logger.js';

/**
 * Base class for all game objects in the world.
 * Manages position, components, and parent-child hierarchy.
 * @class WGObject
 */
class WGObject {
    #coordinates = new Coordinates2D();
    #components = {};
    #children = [];
    #parent = null;

    /**
     * Adds a child object to this object's hierarchy.
     * @param {WGObject} child - Child object to add
     * @throws {TypeError} If child is not a WGObject
     */
    addChild(child) {
        if (!(child instanceof WGObject)) {
            throw new TypeError('Child must be a WGObject instance');
        }

        if (this.#children.includes(child)) {
            Logger.warn('Child already added to this object');
            return;
        }

        child.#parent = this;
        this.#children.push(child);
    }

    /**
     * Removes a child object from this object's hierarchy.
     * @param {WGObject} child - Child object to remove
     * @returns {boolean} True if child was removed
     */
    removeChild(child) {
        const index = this.#children.indexOf(child);
        if (index > -1) {
            this.#children[index].#parent = null;
            this.#children.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * @returns {WGObject[]} Array of child objects
     */
    get children() {
        return [...this.#children]; // Return copy to prevent external modification
    }

    /**
     * Adds a component to this object.
     * @param {WGComponent} component - Component to add
     * @throws {TypeError} If component is not a WGComponent
     */
    addComponent(component) {
        if (!(component instanceof WGComponent)) {
            throw new TypeError('Component must be a WGComponent instance');
        }

        const componentName = component.constructor.name;

        if (this.#components[componentName]) {
            Logger.warn(`Component ${componentName} already exists on this object, replacing`);
        }

        this.#components[componentName] = component;
    }

    /**
     * Removes a component by name or instance.
     * @param {string|WGComponent} componentOrName - Component name or instance
     * @returns {boolean} True if component was removed
     */
    removeComponent(componentOrName) {
        const name = typeof componentOrName === 'string'
            ? componentOrName
            : componentOrName.constructor.name;

        if (this.#components[name]) {
            delete this.#components[name];
            return true;
        }
        return false;
    }

    /**
     * @returns {Object.} Object containing all components
     */
    get components() {
        return this.#components;
    }

    /**
     * Checks if this object has a component.
     * @param {string} componentName - Name of component class
     * @returns {boolean} True if component exists
     */
    hasComponent(componentName) {
        return this.#components[componentName] != null;
    }

    /**
     * Gets a component by name.
     * @param {string} componentName - Name of component class
     * @returns {WGComponent|null} The component or null if not found
     */
    getComponent(componentName) {
        return this.#components[componentName] || null;
    }

    /**
     * @deprecated Use hasComponent instead
     */
    containsComponent(componentName) {
        return this.hasComponent(componentName);
    }

    /**
     * @returns {Coordinates2D} The object's position in world space
     */
    get coordinates() {
        return this.#coordinates;
    }

    /**
     * @returns {WGObject|null} The parent object, or null if none
     */
    get parent() {
        return this.#parent;
    }

    /**
     * Sets the parent object.
     * @param {WGObject|null} wgObject - New parent object
     * @throws {TypeError} If wgObject is not a WGObject or null
     */
    set parent(wgObject) {
        if (wgObject !== null && !(wgObject instanceof WGObject)) {
            throw new TypeError('Parent must be a WGObject or null');
        }

        // Remove from old parent
        if (this.#parent) {
            this.#parent.removeChild(this);
        }

        this.#parent = wgObject;

        // Add to new parent
        if (wgObject && !wgObject.children.includes(this)) {
            wgObject.addChild(this);
        }
    }

    /**
     * Gets the absolute world position (including all parent transforms).
     * @returns {Coordinates2D} Absolute world position
     */
    getWorldPosition() {
        const worldPos = new Coordinates2D();
        let current = this;

        while (current) {
            worldPos.x += current.#coordinates.x;
            worldPos.y += current.#coordinates.y;
            current = current.#parent;
        }

        return worldPos;
    }
}

export {WGObject};
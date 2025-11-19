import { Logger } from './Logger.js';

/**
 * Service that manages scenes and scene transitions.
 * @class SceneService
 */
class SceneService {
    #scenes = new Map();
    #activeScene = null;

    /**
     * @returns {Map} Map of all registered scenes
     */
    get scenes() {
        return this.#scenes;
    }

    /**
     * @returns {Scene|null} Currently active scene
     */
    get activeScene() {
        return this.#activeScene;
    }

    /**
     * Sets the active scene.
     * @param {Scene|string} sceneOrName - Scene instance or registered scene name
     * @throws {TypeError} If scene is invalid
     * @throws {Error} If scene name not found
     */
    set activeScene(sceneOrName) {
        let scene;

        if (typeof sceneOrName === 'string') {
            scene = this.#scenes.get(sceneOrName);
            if (!scene) {
                throw new Error(`Scene '${sceneOrName}' not found. Available: ${Array.from(this.#scenes.keys()).join(', ')}`);
            }
        } else {
            scene = sceneOrName;
        }

        // Validate scene has required methods/properties
        if (!scene || typeof scene !== 'object') {
            throw new TypeError('Scene must be a valid scene object');
        }

        Logger.info(`Switching to scene: ${sceneOrName}`);
        this.#activeScene = scene;
    }

    /**
     * Registers a new scene.
     * @param {string} name - Unique name for the scene
     * @param {Scene} scene - Scene instance
     * @throws {TypeError} If name is not a string or scene is invalid
     * @throws {Error} If scene name already exists
     */
    addScene(name, scene) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new TypeError('Scene name must be a non-empty string');
        }

        if (!scene || typeof scene !== 'object') {
            throw new TypeError('Scene must be a valid object');
        }

        if (this.#scenes.has(name)) {
            Logger.warn(`Scene '${name}' already exists, replacing`);
        }

        this.#scenes.set(name, scene);
        Logger.info(`Scene '${name}' registered`);

        // Set as active if it's the first scene
        if (this.#scenes.size === 1 && !this.#activeScene) {
            this.activeScene = scene;
        }
    }

    /**
     * Removes a scene from the registry.
     * @param {string} name - Name of scene to remove
     * @returns {boolean} True if scene was removed
     */
    removeScene(name) {
        if (this.#activeScene === this.#scenes.get(name)) {
            Logger.warn(`Removing active scene '${name}'`);
            this.#activeScene = null;
        }

        const removed = this.#scenes.delete(name);
        if (removed) {
            Logger.info(`Scene '${name}' removed`);
        }
        return removed;
    }

    /**
     * Gets a scene by name.
     * @param {string} name - Scene name
     * @returns {Scene|undefined} Scene if found
     */
    getScene(name) {
        return this.#scenes.get(name);
    }

    /**
     * Checks if a scene exists.
     * @param {string} name - Scene name
     * @returns {boolean} True if scene exists
     */
    hasScene(name) {
        return this.#scenes.has(name);
    }
}

export { SceneService };
import {Logger} from '../Services/Logger.js';
import {Size2D} from '../Utils/Size2D.js';

/**
 * Handles all rendering operations for the engine.
 * @class Renderer
 */
class Renderer {
    #context = null;
    #canvasSize = new Size2D(0, 0);
    #engine = null;
    #scale = 0.004; // Default scale factor

    /**
     * Creates a new renderer.
     * @param {Engine} engine - Reference to the main engine
     */
    constructor(engine) {
        this.#engine = engine;
    }

    /**
     * Clears the entire screen.
     */
    clearScreen() {
        if (!this.#context) {
            return;
        }
        this.#context.clearRect(0, 0, this.#canvasSize.width, this.#canvasSize.height);
    }

    /**
     * Renders a single entity.
     * @private
     * @param {WGObject} entity - Entity to render
     * @param {Scene} scene - Active scene
     */
    #renderEntity(entity, scene) {
        const worldPos = entity.getWorldPosition();

        // Handle TextLabel rendering
        if (entity.constructor.name === 'TextLabel') {
            this.#renderTextLabel(entity, worldPos, scene);
            return;
        }

        // Handle sprite rendering
        const spriteModel = entity.getComponent('SpriteModel');
        if (!spriteModel || !spriteModel.enabled) {
            return;
        }

        this.#renderSprite(entity, spriteModel, worldPos, scene);
    }

    /**
     * Renders a text label.
     * @private
     */
    #renderTextLabel(label, worldPos, scene) {
        this.#context.save();

        this.#context.font = `${label.size}px ${label.font}`;
        this.#context.fillStyle = label.color;
        this.#context.textAlign = label.textAlign;
        this.#context.textBaseline = 'middle';

        const screenX = scene.activeCamera.coordinates.x + worldPos.x;
        const screenY = scene.activeCamera.coordinates.y + worldPos.y;

        this.#context.fillText(label.text, screenX, screenY);
        this.#context.restore();
    }

    /**
     * Renders a sprite.
     * @private
     */
    #renderSprite(entity, spriteModel, worldPos, scene) {
        this.#context.save();

        const flipMultiplier = spriteModel.flipHorizontal ? -1 : 1;
        this.#context.scale(flipMultiplier, 1);

        const screenX = (scene.activeCamera.coordinates.x + worldPos.x + spriteModel.spriteOffset.x) * flipMultiplier;
        const screenY = scene.activeCamera.coordinates.y + worldPos.y + spriteModel.spriteOffset.y;

        this.#context.drawImage(
            spriteModel.sprite,
            screenX,
            screenY,
            spriteModel.size.width * flipMultiplier,
            spriteModel.size.height
        );

        this.#context.restore();
    }

    /**
     * Recursively renders children of an entity.
     * @private
     * @param {WGObject} entity - Parent entity
     * @param {Scene} scene - Active scene
     */
    #renderChildren(entity, scene) {
        for (const child of entity.children) {
            this.#renderEntity(child, scene);
            this.#renderChildren(child, scene);
        }
    }

    /**
     * Main render method - draws the entire scene.
     */
    render() {
        this.clearScreen();

        const sceneService = this.#engine.services.SceneService || this.#engine.services.sceneService;
        if (!sceneService || !sceneService.activeScene) {
            Logger.warn('No active scene to render');
            return;
        }

        const scene = sceneService.activeScene;

        // Update camera
        if (scene.activeCamera && scene.activeCamera.run) {
            scene.activeCamera.run(scene, this.#canvasSize);
        }

        const entities = scene.entities || scene.wgObjects || [];

        // Render all root entities and their children
        for (const entity of entities) {
            this.#renderEntity(entity, scene);
            this.#renderChildren(entity, scene);
        }
    }

    /**
     * Sets the rendering context.
     * @param {CanvasRenderingContext2D} context - 2D canvas context
     * @throws {TypeError} If context is invalid
     */
    setContext(context) {
        if (!context || typeof context.drawImage !== 'function') {
            throw new TypeError('Invalid canvas context');
        }
        this.#context = context;
        this.#context.imageSmoothingEnabled = false;
    }

    /**
     * Sets the canvas size and applies scaling.
     * @param {Size2D} size - Canvas dimensions
     */
    setCanvasSize(size) {
        if (!this.#context) {
            Logger.warn('Cannot set canvas size: no context');
            return;
        }

        this.#canvasSize = size;
        const scale = size.height * this.#scale;
        this.#context.scale(scale, scale);
    }

    /**
     * Sets the scale factor.
     * @param {number} scale - New scale factor
     */
    setScale(scale) {
        if (typeof scale !== 'number' || scale <= 0) {
            throw new TypeError('Scale must be a positive number');
        }
        this.#scale = scale;
    }
}

export {Renderer};
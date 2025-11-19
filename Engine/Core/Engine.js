import {Logger} from '../Services/Logger.js';
import {AssetService} from '../Services/AssetService.js';

/**
 * Main engine class that orchestrates the game loop, rendering, and systems.
 * @class Engine
 */
class Engine {
    #services = {};
    #canvas = null;
    #renderer = null;
    #lastTickTime = null;
    #tickRate = 16; // ~60 FPS
    #refreshRate = 16;
    #tickInterval = null;
    #refreshInterval = null;
    #isRunning = false;

    /**
     * Creates a new engine instance.
     * @param {Object} services - Service instances (SceneService, PhysicSystem, InputSystem, etc.)
     * @param {Object} config - Engine configuration
     * @param {number} [config.tickRate=16] - Milliseconds per game tick
     * @param {number} [config.refreshRate=16] - Milliseconds per render frame
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     * @throws {TypeError} If canvas is not a valid HTMLCanvasElement
     */
    constructor(services, config, canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new TypeError('Canvas must be an HTMLCanvasElement');
        }

        this.#services = services || {};
        this.#canvas = canvas;
        this.#tickRate = config.tickRate ?? 16;
        this.#refreshRate = config.refreshRate ?? 16;

        this.#initializeEngine();
    }

    /**
     * Initializes the engine systems.
     * @private
     * @async
     */
    async #initializeEngine() {
        try {
            // Initialize asset service
            await AssetService.initialize();

            // Import and create renderer
            const {Renderer} = await import('./Renderer.js');
            this.#renderer = new Renderer(this);

            const context = this.#canvas.getContext('2d');
            if (!context) {
                throw new Error('Failed to get 2D rendering context');
            }

            this.#renderer.setContext(context);
            Logger.info('Engine initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize engine', error);
            throw error;
        }
    }

    /**
     * @returns {Object} All registered services
     */
    get services() {
        return this.#services;
    }

    /**
     * @returns {boolean} Whether the engine is currently running
     */
    get isRunning() {
        return this.#isRunning;
    }

    /**
     * Starts the game loop.
     */
    start() {
        if (this.#isRunning) {
            Logger.warn('Engine is already running');
            return;
        }

        this.#isRunning = true;
        this.#lastTickTime = performance.now();

        this.#tickInterval = setInterval(() => this.#tick(), this.#tickRate);
        this.#refreshInterval = setInterval(() => this.#render(), this.#refreshRate);

        Logger.info('Engine started');
    }

    /**
     * Stops the game loop.
     */
    stop() {
        if (!this.#isRunning) {
            return;
        }

        clearInterval(this.#tickInterval);
        clearInterval(this.#refreshInterval);
        this.#isRunning = false;

        Logger.info('Engine stopped');
    }

    /**
     * Resizes the canvas.
     * @param {Size2D} size - New canvas size
     * @param {Object} [options={}] - Resize options
     * @param {boolean} [options.fullScreen=false] - Whether to use full screen
     */
    resize(size, options = {}) {
        if (options.fullScreen) {
            this.#canvas.width = document.documentElement.clientWidth;
            this.#canvas.height = document.documentElement.clientHeight;
        } else {
            this.#canvas.width = size.width;
            this.#canvas.height = size.height;
        }

        const {Size2D} = require('../Utils/Size2D.js');
        const canvasSize = new Size2D(this.#canvas.width, this.#canvas.height);
        this.#renderer.setCanvasSize(canvasSize);

        Logger.info(`Canvas resized to ${this.#canvas.width}x${this.#canvas.height}`);
    }

    /**
     * Main game tick - updates all game logic.
     * @private
     * @async
     */
    async #tick() {
        const sceneService = this.#services.SceneService || this.#services.sceneService;

        if (!sceneService || !sceneService.activeScene) {
            Logger.warn('No active scene, skipping tick');
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.#lastTickTime) / this.#tickRate;

        try {
            const activeScene = sceneService.activeScene;
            const entities = activeScene.entities || activeScene.wgObjects || [];

            for (const entity of entities) {
                await this.#processEntity(entity, deltaTime);
            }

            this.#lastTickTime = currentTime;

            // Update global tick counter if available
            if (this.#services.MegaTicks) {
                this.#services.MegaTicks.updateTicks(deltaTime);
            }
        } catch (error) {
            Logger.error('Error during tick', error);
        }
    }

    /**
     * Processes a single entity.
     * @private
     * @param {WGObject} entity - Entity to process
     * @param {number} deltaTime - Frame time delta
     */
    async #processEntity(entity, deltaTime) {
        // Run entity logic if it's an Instance
        if (entity.run && typeof entity.run === 'function') {
            try {
                await entity.run(this.#services, deltaTime);
            } catch (error) {
                Logger.error(`Error running entity logic: ${error.message}`, error);
            }
        }

        // Apply physics if entity has PhysicController
        if (entity.hasComponent('PhysicController')) {
            const physicSystem = this.#services.PhysicSystem || this.#services.physicSystem;
            if (physicSystem) {
                physicSystem.calculate(entity, this.#services.SceneService.activeScene, deltaTime);
            }
        }
    }

    /**
     * Renders the current frame.
     * @private
     */
    #render() {
        if (!this.#renderer) {
            return;
        }

        try {
            this.#renderer.render();
        } catch (error) {
            Logger.error('Error during render', error);
        }
    }

    /**
     * Gets a specific service.
     * @param {string} serviceName - Name of the service
     * @returns {*} Service instance or undefined
     */
    getService(serviceName) {
        return this.#services[serviceName];
    }

    /**
     * Registers a new service.
     * @param {string} name - Service name
     * @param {*} service - Service instance
     */
    registerService(name, service) {
        if (this.#services[name]) {
            Logger.warn(`Service '${name}' already registered, replacing`);
        }
        this.#services[name] = service;
        Logger.info(`Service '${name}' registered`);
    }
}

export {Engine};
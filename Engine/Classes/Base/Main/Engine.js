// -- :: Dependencies :: -- \\
import {SceneService} from "/Engine/Classes/Base/Services/Scenes/SceneService.js"
import {Renderer} from "/Engine/Classes/Base/Main/Renderer.js"
import {MegaTicks} from "/Engine/Classes/Base/Services/TicksHandler/MegaTicks.js";
import {Instance} from "/Engine/Classes/Base/WebGameObjects/Instance.js";
import {Size_2D} from "../MicroClasses/Size_2D.js";

// -- :: -- :: --:: -- :: -- \\

class Engine {
    #Services = {};
    #Canvas;

    #Renderer = new Renderer(this);

    #LastTick;
    #TickRate;
    #TickLoop;
    #renderLoopId;

    constructor(Services, Configuration, Canvas) {
        this.#Services = Services;
        this.#Canvas = Canvas;
        this.#TickRate = Configuration.TickRate;

        this.#Renderer.setContext(this.#Canvas.getContext("2d"));

        if (this.#Services.GameModeService) {
            this.#Services.GameModeService.initialize(this);
        }

        this.#startLoop();
    }

    get services() {
        return this.#Services;
    }

    setGridSize(tileSize) {
        this.#Renderer.setGridSize(tileSize);
    }

    stop() {
        clearInterval(this.#TickLoop);
        cancelAnimationFrame(this.#renderLoopId);
    }

    #startLoop() {
        this.#TickLoop = setInterval(() => this.tick(), this.#TickRate);

        const renderLoop = () => {
            this.#Renderer.render();
            this.#renderLoopId = requestAnimationFrame(renderLoop);
        };
        this.#renderLoopId = requestAnimationFrame(renderLoop);
    }

    resize(Size, Options = {FullScreen: false}) {
        this.#Canvas.width = Size.Width;
        this.#Canvas.height = Size.Height;

        if (Options.FullScreen === true) {
            this.#Canvas.width = document.documentElement.clientWidth;
            this.#Canvas.height = document.documentElement.clientHeight;
        }

        this.#Renderer.setCanvasSize(new Size_2D(this.#Canvas.height, this.#Canvas.width));
    }

    async #runWGObject(WGObject, DeltaTime) {
        if (WGObject instanceof Instance) {
            WGObject.run(this.#Services, DeltaTime);
        }

        if (WGObject.containsComponent("PhysicController")) {
            this.#Services.PhysicService.calculate(
                WGObject,
                this.#Services.SceneService.activeScene,
                DeltaTime
            );
        }
    }

    async tick() {
        const isServiceListed = this.#Services.SceneService != null;
        const isServiceValid = this.#Services.SceneService instanceof SceneService;

        if (isServiceListed && isServiceValid) {
            const activeScene = this.services.SceneService.activeScene;
            if (!activeScene) return;

            if (this.#LastTick == null) this.#LastTick = performance.now();

            const currentTick = performance.now();
            const deltaTime = (currentTick - this.#LastTick) / this.#TickRate;

            for (let i = 0; i < activeScene.wgObjects.length; i++) {
                await this.#runWGObject(activeScene.wgObjects[i], deltaTime);
            }

            if (activeScene.update) activeScene.update(this.#Services);

            this.#LastTick = currentTick;
            MegaTicks.updateTicks(deltaTime);
            this.#Services.InputService.updatePreviousInputs();

        } else {
            console.warn("No 'SceneService' Detected.");
        }
    }

    /**
     * Définit le TileInteractionManager et le passe au Renderer
     */
    setTileInteractionManager(manager) {
        this.#Renderer.setTileInteractionManager(manager);
    }
}

export {Engine}
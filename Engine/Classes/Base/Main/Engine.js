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
    #RefreshRate;
    #RefreshLoop;

    constructor(Services, Configuration, Canvas) {
        this.#Services = Services;
        this.#Canvas = Canvas;

        this.#TickRate = Configuration.TickRate;
        this.refreshRate = Configuration.RefreshRate;

        this.#Renderer.setContext(this.#Canvas.getContext("2d"));
        this.#startLoop();
    }

    get services() {
        return this.#Services
    }

    #startLoop() {
        this.#TickLoop = setInterval(() => this.tick(), this.#TickRate)
        this.#RefreshLoop = setInterval(() => this.#Renderer.render(), this.#RefreshRate)
    }

    resize(Size, Options = {FullScreen: false}) {
        this.#Canvas.width = Size.Width;
        this.#Canvas.height = Size.Height;

        if (Options.FullScreen === true) {
            this.#Canvas.width = document.documentElement.clientWidth;
            this.#Canvas.height = document.documentElement.clientHeight;
        }

        this.#Renderer.setCanvasSize(new Size_2D(this.#Canvas.height, this.#Canvas.width))
    }

    async #runWGObject(WGObject, DeltaTime) {
        if (WGObject instanceof Instance) {
            WGObject.run(this.#Services, DeltaTime)
        }

        if (WGObject.containsComponent("PhysicController")) {
            this.#Services.PhysicService.calculate(WGObject, this.#Services.SceneService.activeScene, DeltaTime);
        }
    }

    async tick() {
        const isServiceListed = this.#Services.SceneService != null;
        const isServiceValid = this.#Services.SceneService instanceof SceneService;

        if (isServiceListed && isServiceValid) {
            const ActiveScene = this.services.SceneService.activeScene;

            if (this.#LastTick == null) {
                this.#LastTick = performance.now();
            }

            const CurrentTick = performance.now();
            const DeltaTime = (CurrentTick - this.#LastTick) / this.#TickRate;

            for (let i = 0; i < ActiveScene.wgObjects.length; i++) {
                await this.#runWGObject(ActiveScene.wgObjects[i], DeltaTime);
            }

            this.#LastTick = CurrentTick;
            MegaTicks.updateTicks(DeltaTime);
        } else {
            console.warn("No 'SceneService' Detected.");
            debugger;
        }
    }
}

export {Engine}
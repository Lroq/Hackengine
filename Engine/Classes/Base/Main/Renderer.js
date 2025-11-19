import {Size2D} from "../MicroClasses/Size2D.js";
import {TextLabel} from "../WebGameObjects/TextLabel.js";

class Renderer {
    #Context;
    #CanvasSize = new Size2D(0, 0);
    #Engine;

    constructor(Engine) {
        this.#Engine = Engine;
    }

    clearScreen() {
        this.#Context.clearRect(0, 0, this.#CanvasSize.Width, this.#CanvasSize.Height)
    }

    #renderInstance(Instance) {
        const SceneToRender = this.#Engine.services.SceneService.activeScene;
        const SpriteModel = Instance.components["SpriteModel"];

        let FinalX = 0, FinalY = 0;

        const recursive_get_parent = (CurrentInstance) => {
            const Parent = CurrentInstance.parent;

            if (Parent !== undefined) {
                FinalX += CurrentInstance.coordinates.X;
                FinalY += CurrentInstance.coordinates.Y;
                recursive_get_parent(Parent);
            } else {
                FinalX += CurrentInstance.coordinates.X;
                FinalY += CurrentInstance.coordinates.Y;
            }
        }

        recursive_get_parent(Instance)

        if (Instance instanceof TextLabel) {
            this.#Context.save();

            this.#Context.font = `${Instance.size}px ${Instance.font}`;
            this.#Context.fillStyle = Instance.color;

            this.#Context.textAlign = Instance.textAlign;
            this.#Context.textBaseline = "middle";

            const textX = SceneToRender.activeCamera.coordinates.X + FinalX;
            const textY = SceneToRender.activeCamera.coordinates.Y + FinalY;

            this.#Context.fillText(Instance.text, textX, textY);

            this.#Context.restore();
        } else {
            if (SpriteModel != null) {

                if (!SpriteModel.enabled) {
                    return;
                }

                this.#Context.save();
                this.#Context.scale(SpriteModel.rotation, 1);
                this.#Context.drawImage(SpriteModel.sprite, (SceneToRender.activeCamera.coordinates.X + FinalX + SpriteModel.spriteOffset.X) * SpriteModel.rotation, (SceneToRender.activeCamera.coordinates.Y + FinalY + SpriteModel.spriteOffset.Y), SpriteModel.size.Width * SpriteModel.rotation, SpriteModel.size.Height);
                this.#Context.restore();
            }
        }
    }

    render() {
        this.clearScreen()

        const SceneToRender = this.#Engine.services.SceneService.activeScene;
        SceneToRender.activeCamera.run(SceneToRender, this.#CanvasSize)

        if (SceneToRender == null) {
            console.warn("SceneService contains no ActiveScene, Aborting.")
            return
        }
        for (let i = 0; i < SceneToRender.wgObjects.length; i++) {
            this.#renderInstance(SceneToRender.wgObjects[i]);

            const recursive_render_children = (obj) => {
                for (let b = 0; b < obj.children.length; b++) {
                    this.#renderInstance(obj.children[b]);
                    recursive_render_children(obj.children[b])
                }
            }

            recursive_render_children(SceneToRender.wgObjects[i])
        }
    }

    setContext(Context) {
        this.#Context = Context;
    }

    setCanvasSize(Size_2D) {
        this.#Context.scale(Size_2D.Height * 0.004, Size_2D.Height * 0.004)
        this.#Context.imageSmoothingEnabled = false;
        this.#CanvasSize = Size_2D;
    }
}

export {Renderer}
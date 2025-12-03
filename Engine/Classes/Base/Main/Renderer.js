import {Size_2D} from "../MicroClasses/Size_2D.js";
import {TextLabel} from "../WebGameObjects/TextLabel.js";
import {ConstructionGrid} from "../Services/Grid/ConstructionGrid.js";

class Renderer {
    #Context;
    #CanvasSize = new Size_2D(0, 0);
    #Engine;
    #ConstructionGrid = new ConstructionGrid();

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

                // Vérifier que l'image est bien chargée avant de dessiner
                if (!SpriteModel.sprite || !SpriteModel.sprite.complete || SpriteModel.sprite.naturalWidth === 0) {
                    return; // Ignorer les images cassées ou non chargées
                }

                try {
                    this.#Context.save();

                    // Appliquer l'opacité pour les tuiles fantômes
                    if (Instance.isGhost) {
                        this.#Context.globalAlpha = 0.5;
                    }

                    this.#Context.scale(SpriteModel.rotation, 1);
                    this.#Context.drawImage(SpriteModel.sprite, (SceneToRender.activeCamera.coordinates.X + FinalX + SpriteModel.spriteOffset.X) * SpriteModel.rotation, (SceneToRender.activeCamera.coordinates.Y + FinalY + SpriteModel.spriteOffset.Y), SpriteModel.size.Width * SpriteModel.rotation, SpriteModel.size.Height);
                    this.#Context.restore();
                } catch (error) {
                    // Ignorer silencieusement les erreurs de rendu d'images
                    this.#Context.restore();
                }
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

        // Trier les objets par layer (0 = sol derrière, 1 = murs/déco milieu, 2 = sprites devant)
        const sortedObjects = [...SceneToRender.wgObjects].sort((a, b) => {
            const layerA = a.layer !== undefined ? a.layer : 2; // Par défaut layer 2 pour sprites/joueurs
            const layerB = b.layer !== undefined ? b.layer : 2;
            return layerA - layerB; // Ordre croissant : 0 puis 1 puis 2
        });

        for (let i = 0; i < sortedObjects.length; i++) {
            this.#renderInstance(sortedObjects[i]);

            const recursive_render_children = (obj) => {
                for (let b = 0; b < obj.children.length; b++) {
                    this.#renderInstance(obj.children[b]);
                    recursive_render_children(obj.children[b])
                }
            }

            recursive_render_children(sortedObjects[i])
        }

        // Rendu de la grille de construction (uniquement en mode construction)
        this.#ConstructionGrid.render(this.#Context, SceneToRender.activeCamera);
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
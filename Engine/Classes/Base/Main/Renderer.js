import {Size_2D} from "../MicroClasses/Size_2D.js";
import {TextLabel} from "../WebGameObjects/TextLabel.js";
import {ConstructionGrid} from "../Services/Grid/ConstructionGrid.js";
import {Tile} from "../WebGameObjects/Tile.js";
import {TileInteractionManager} from "../Services/Interactions/TileInteractionManager.js";

class Renderer {
    #Context;
    #CanvasSize = new Size_2D(0, 0);
    #Engine;
    #ConstructionGrid = new ConstructionGrid();
    #TileInteractionManager = null;

    constructor(Engine) {
        this.#Engine = Engine;

        // Exposer ConstructionGrid globalement pour permettre la mise à jour de la taille
        window.constructionGrid = this.#ConstructionGrid;
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

                // Vérifier si c'est un tile invisible.png en mode jeu
                const mode = window.getMode ? window.getMode() : 'play';
                const isInvisibleTile = Instance instanceof Tile &&
                                       SpriteModel.sprite.src &&
                                       SpriteModel.sprite.src.includes('invisible.png');

                // Si c'est invisible.png en mode jeu, ne pas le rendre (mais garder ses propriétés de collision)
                if (isInvisibleTile && mode === 'play') {
                    return;
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

                    // En mode construction, afficher des indicateurs sur les tiles
                    if (mode === 'construction' && Instance instanceof Tile) {
                        this.#drawTileIndicators(Instance, SceneToRender.activeCamera, FinalX, FinalY, SpriteModel);
                    }
                } catch (error) {
                    // Ignorer silencieusement les erreurs de rendu d'images
                    this.#Context.restore();
                }
            }
        }
    }

    /**
     * Dessine des indicateurs visuels sur les tiles en mode construction
     * @param {Tile} tile - La tile à annoter
     * @param {Camera} camera - La caméra active
     * @param {number} finalX - Position X finale après calcul du parent
     * @param {number} finalY - Position Y finale après calcul du parent
     * @param {SpriteModel} spriteModel - Le modèle de sprite
     */
    #drawTileIndicators(tile, camera, finalX, finalY, spriteModel) {
        this.#Context.save();

        const screenX = camera.coordinates.X + finalX;
        const screenY = camera.coordinates.Y + finalY;
        const tileWidth = spriteModel.size.Width;
        const tileHeight = spriteModel.size.Height;

        // Fond semi-transparent pour les icônes
        const iconSize = 8;
        const padding = 2;
        let iconX = screenX + tileWidth - iconSize - padding;
        const iconY = screenY + padding;

        // Indicateur de téléporteur (🌀 en haut à droite)
        if (tile.isTeleporter) {
            // Fond bleu pour téléporteur
            this.#Context.fillStyle = 'rgba(59, 130, 246, 0.8)';
            this.#Context.fillRect(iconX, iconY, iconSize, iconSize);

            // Icône téléporteur
            this.#Context.fillStyle = '#ffffff';
            this.#Context.font = '7px Arial';
            this.#Context.textAlign = 'center';
            this.#Context.textBaseline = 'middle';
            this.#Context.fillText('🌀', iconX + iconSize / 2, iconY + iconSize / 2);

            iconX -= iconSize + padding; // Décaler pour le prochain indicateur
        }

        // Indicateur de solidité (🧱 à côté du téléporteur si présent)
        if (tile.isSolid) {
            // Fond rouge pour solide
            this.#Context.fillStyle = 'rgba(239, 68, 68, 0.8)';
            this.#Context.fillRect(iconX, iconY, iconSize, iconSize);

            // Icône mur
            this.#Context.fillStyle = '#ffffff';
            this.#Context.font = '7px Arial';
            this.#Context.textAlign = 'center';
            this.#Context.textBaseline = 'middle';
            this.#Context.fillText('🧱', iconX + iconSize / 2, iconY + iconSize / 2);

            iconX -= iconSize + padding; // Décaler pour le prochain indicateur
        }

        // Indicateur d'interaction (💬 à côté des autres indicateurs)
        if (tile.hasInteraction && tile.interactionText) {
            // Fond vert pour interaction
            this.#Context.fillStyle = 'rgba(34, 197, 94, 0.8)';
            this.#Context.fillRect(iconX, iconY, iconSize, iconSize);

            // Icône interaction
            this.#Context.fillStyle = '#ffffff';
            this.#Context.font = '7px Arial';
            this.#Context.textAlign = 'center';
            this.#Context.textBaseline = 'middle';
            this.#Context.fillText('💬', iconX + iconSize / 2, iconY + iconSize / 2);
        }

        this.#Context.restore();
    }

    render() {
        const SceneToRender = this.#Engine.services.SceneService?.activeScene;

        // Vérifier que la scène existe
        if (!SceneToRender) {
            return;
        }

        // Sauvegarder l'état du contexte
        this.#Context.save();

        // Réappliquer le scale avec le zoom actuel
        let scale = this.#CanvasSize.Height * 0.004;
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode === 'construction' && window.constructionZoom) {
            scale *= window.constructionZoom;
        }
        this.#Context.scale(scale, scale);
        this.#Context.imageSmoothingEnabled = false;

        this.clearScreen();

        SceneToRender.activeCamera.run(SceneToRender, this.#CanvasSize);

        // Trier les objets par layer (0 = sol derrière, 1 = murs/déco milieu, 2 = sprites devant)
        const sortedObjects = [...SceneToRender.wgObjects].sort((a, b) => {
            const layerA = a.layer !== undefined ? a.layer : 2;
            const layerB = b.layer !== undefined ? b.layer : 2;
            return layerA - layerB;
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

        // Restaurer l'état du contexte
        this.#Context.restore();

        // Rendu de l'icône E d'interaction (en mode play, SANS scale car on dessine en coordonnées écran)
        if (mode === 'play' && this.#TileInteractionManager) {
            // Sauvegarder le contexte
            this.#Context.save();

            // Appliquer le scale pour convertir les coordonnées monde en coordonnées écran
            let scale = this.#CanvasSize.Height * 0.004;
            if (mode === 'construction' && window.constructionZoom) {
                scale *= window.constructionZoom;
            }
            this.#Context.scale(scale, scale);
            this.#Context.imageSmoothingEnabled = false;

            // Rendre l'icône E
            this.#TileInteractionManager.render(SceneToRender.activeCamera);

            // Restaurer le contexte
            this.#Context.restore();
        }
    }


    setContext(Context) {
        this.#Context = Context;
    }

    setCanvasSize(Size_2D) {
        // Ne plus appliquer le scale ici, c'est fait dans render()
        this.#Context.imageSmoothingEnabled = false;
        this.#CanvasSize = Size_2D;
    }

    /**
     * Définit le TileInteractionManager
     */
    setTileInteractionManager(manager) {
        this.#TileInteractionManager = manager;
    }
}

export {Renderer}
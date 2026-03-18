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
    }

    // -------------------------------------------------------------------------
    // API publique
    // -------------------------------------------------------------------------

    setContext(context) {
        this.#Context = context;
    }

    setCanvasSize(size) {
        this.#Context.imageSmoothingEnabled = false;
        this.#CanvasSize = size;
    }

    /**
     * Met à jour la taille de la grille visuelle.
     * Appelé par MapService via engine.setGridSize()
     */
    setGridSize(tileSize) {
        this.#ConstructionGrid.setGridSize(tileSize);
    }

    // -------------------------------------------------------------------------
    // Rendu
    // -------------------------------------------------------------------------

    clearScreen() {
        this.#Context.clearRect(0, 0, this.#CanvasSize.Width, this.#CanvasSize.Height);
    }

    render() {
        const sceneToRender = this.#Engine.services.SceneService?.activeScene;
        if (!sceneToRender) return;

        const gameModeService = this.#Engine.services.GameModeService;
        const mode = gameModeService ? gameModeService.getMode() : (window.getMode?.() ?? 'play');
        const zoom = gameModeService ? gameModeService.getZoom() : (window.constructionZoom ?? 1.0);

        this.#Context.save();

        let scale = this.#CanvasSize.Height * 0.004;
        if (mode === 'construction') {
            scale *= zoom;
        }

        this.#Context.scale(scale, scale);
        this.#Context.imageSmoothingEnabled = false;

        this.clearScreen();

        sceneToRender.activeCamera.run(sceneToRender, this.#CanvasSize, this.#Engine.services);

        const sortedObjects = [...sceneToRender.wgObjects].sort((a, b) => {
            const layerA = a.layer ?? 2;
            const layerB = b.layer ?? 2;
            return layerA - layerB;
        });

        for (let i = 0; i < sortedObjects.length; i++) {
            this.#renderInstance(sortedObjects[i], sceneToRender, mode);

            const renderChildren = (obj) => {
                for (const child of obj.children) {
                    this.#renderInstance(child, sceneToRender, mode);
                    renderChildren(child);
                }
            };
            renderChildren(sortedObjects[i]);
        }

        this.#ConstructionGrid.render(this.#Context, sceneToRender.activeCamera);

        this.#Context.restore();
    }

    // -------------------------------------------------------------------------
    // Privé
    // -------------------------------------------------------------------------

    #renderInstance(instance, sceneToRender, mode) {
        const spriteModel = instance.components["SpriteModel"];

        let finalX = 0;
        let finalY = 0;

        const accumulateParent = (current) => {
            finalX += current.coordinates.X;
            finalY += current.coordinates.Y;
            if (current.parent !== undefined) accumulateParent(current.parent);
        };
        accumulateParent(instance);

        if (instance instanceof TextLabel) {
            this.#Context.save();
            this.#Context.font = `${instance.size}px ${instance.font}`;
            this.#Context.fillStyle = instance.color;
            this.#Context.textAlign = instance.textAlign;
            this.#Context.textBaseline = "middle";

            const textX = sceneToRender.activeCamera.coordinates.X + finalX;
            const textY = sceneToRender.activeCamera.coordinates.Y + finalY;
            this.#Context.fillText(instance.text, textX, textY);
            this.#Context.restore();
            return;
        }

        if (!spriteModel?.enabled) return;

        if (!spriteModel.sprite?.complete || spriteModel.sprite.naturalWidth === 0) return;

        const isInvisibleTile = instance instanceof Tile &&
            spriteModel.sprite.src?.includes('invisible.png');
        if (isInvisibleTile && mode === 'play') return;

        try {
            this.#Context.save();

            if (instance.isGhost) {
                this.#Context.globalAlpha = 0.5;
            }

            this.#Context.scale(spriteModel.rotation, 1);
            this.#Context.drawImage(
                spriteModel.sprite,
                (sceneToRender.activeCamera.coordinates.X + finalX + spriteModel.spriteOffset.X) * spriteModel.rotation,
                (sceneToRender.activeCamera.coordinates.Y + finalY + spriteModel.spriteOffset.Y),
                spriteModel.size.Width * spriteModel.rotation,
                spriteModel.size.Height
            );

            this.#Context.restore();

            if (mode === 'construction' && instance instanceof Tile) {
                this.#drawTileIndicators(instance, sceneToRender.activeCamera, finalX, finalY, spriteModel);
            }
        } catch {
            this.#Context.restore();
        }
    }

    #drawTileIndicators(tile, camera, finalX, finalY, spriteModel) {
        this.#Context.save();

        const screenX = camera.coordinates.X + finalX;
        const screenY = camera.coordinates.Y + finalY;
        const tileWidth = spriteModel.size.Width;
        const iconSize = 8;
        const padding = 2;
        let iconX = screenX + tileWidth - iconSize - padding;
        const iconY = screenY + padding;

        const drawIcon = (color, emoji) => {
            this.#Context.fillStyle = color;
            this.#Context.fillRect(iconX, iconY, iconSize, iconSize);
            this.#Context.fillStyle = '#ffffff';
            this.#Context.font = '7px Arial';
            this.#Context.textAlign = 'center';
            this.#Context.textBaseline = 'middle';
            this.#Context.fillText(emoji, iconX + iconSize / 2, iconY + iconSize / 2);
            iconX -= iconSize + padding;
        };
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

        if (tile.isTeleporter) drawIcon('rgba(59, 130, 246, 0.8)', '🌀');
        if (tile.isSolid) drawIcon('rgba(239, 68, 68, 0.8)', '🧱');

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
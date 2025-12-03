import { GridSnapHelper } from './GridSnapHelper.js';
import { Tile } from '../../WebGameObjects/Tile.js';

/**
 * TileDragService - Gère le drag and drop des tuiles sur la grille
 * 
 * Workflow:
 * 1. Détection du clic sur une tuile dans la liste UI
 * 2. Création d'une tuile "fantôme" qui suit la souris avec snapping
 * 3. Placement de la tuile dans la scène au relâchement
 * 4. Mise à jour de la map data
 */
class TileDragService {
    #gridSnapHelper;
    #isDragging = false;
    #currentTileData = null;
    #ghostTile = null;
    #engine = null;
    #canvas = null;
    #placedTiles = new Map(); // Stocke les tuiles placées par coordonnées "x,y"

    constructor() {
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    /**
     * Initialise le service avec l'engine et le canvas
     * @param {Engine} engine - Instance de l'engine
     * @param {HTMLCanvasElement} canvas - Canvas de rendu
     */
    initialize(engine, canvas) {
        this.#engine = engine;
        this.#canvas = canvas;
        this.#setupEventListeners();
    }

    /**
     * Configure les événements de souris pour le drag and drop
     */
    #setupEventListeners() {
        // Événement de déplacement de la souris (pour le drag)
        document.addEventListener('mousemove', (e) => {
            if (this.#isDragging && this.#ghostTile) {
                this.#updateGhostPosition(e.clientX, e.clientY);
            }
        });

        // Événement de relâchement (pour le drop)
        document.addEventListener('mouseup', (e) => {
            if (this.#isDragging && e.button === 0) {
                this.#drop(e.clientX, e.clientY);
            }
        });
    }

    /**
     * Démarre le drag d'une tuile
     * Appelé depuis l'UI quand l'utilisateur clique sur une tuile
     * @param {string} tilePath - Chemin vers l'image de la tuile
     */
    startDrag(tilePath) {
        // Vérifier qu'on est en mode construction
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'construction') {
            console.warn('Le drag and drop est uniquement disponible en mode construction');
            return;
        }

        this.#isDragging = true;
        this.#currentTileData = { path: tilePath };

        // Créer la tuile fantôme
        this.#createGhostTile(tilePath);
    }

    /**
     * Crée une tuile "fantôme" qui suit la souris
     * @param {string} tilePath - Chemin vers l'image
     */
    #createGhostTile(tilePath) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        // Créer une nouvelle instance de Tile
        this.#ghostTile = new Tile();
        
        // Configurer le sprite
        const spriteModel = this.#ghostTile.components.SpriteModel;
        spriteModel.sprite = new Image();
        spriteModel.sprite.src = tilePath;
        spriteModel.size.Width = 27;
        spriteModel.size.Height = 27;
        spriteModel.enabled = true;

        // Rendre la tuile semi-transparente pour indiquer qu'elle est en drag
        this.#ghostTile.isGhost = true;

        // Ajouter à la scène
        scene.wgObjects.push(this.#ghostTile);
    }

    /**
     * Met à jour la position de la tuile fantôme en fonction de la souris
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     */
    #updateGhostPosition(screenX, screenY) {
        if (!this.#ghostTile || !this.#canvas) return;

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        // Convertir et snapper la position
        const snappedPos = this.#gridSnapHelper.screenToGridSnap(
            screenX, 
            screenY, 
            scene.activeCamera, 
            this.#canvas
        );

        // Mettre à jour les coordonnées de la tuile fantôme
        this.#ghostTile.coordinates.X = snappedPos.x;
        this.#ghostTile.coordinates.Y = snappedPos.y;
    }

    /**
     * Place la tuile à la position finale
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     */
    #drop(screenX, screenY) {
        if (!this.#ghostTile || !this.#canvas) {
            this.#cancelDrag();
            return;
        }

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) {
            this.#cancelDrag();
            return;
        }

        // Obtenir la position finale snappée
        const finalPos = this.#gridSnapHelper.screenToGridSnap(
            screenX, 
            screenY, 
            scene.activeCamera, 
            this.#canvas
        );

        // Créer la clé pour identifier cette position
        const posKey = `${finalPos.x},${finalPos.y}`;

        // Vérifier si une tuile existe déjà à cette position
        if (this.#placedTiles.has(posKey)) {
            console.log(`Une tuile existe déjà à la position (${finalPos.x}, ${finalPos.y})`);
            // Supprimer l'ancienne tuile de la scène
            const oldTile = this.#placedTiles.get(posKey);
            const index = scene.wgObjects.indexOf(oldTile);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
        }

        // Convertir la tuile fantôme en tuile réelle
        this.#ghostTile.isGhost = false;
        this.#ghostTile.coordinates.X = finalPos.x;
        this.#ghostTile.coordinates.Y = finalPos.y;

        // Désactiver le collider pour les tuiles placées (optionnel)
        if (this.#ghostTile.components.BoxCollider) {
            this.#ghostTile.components.BoxCollider.enabled = false;
        }

        // Enregistrer la tuile placée
        this.#placedTiles.set(posKey, this.#ghostTile);

        console.log(`Tuile placée à (${finalPos.x}, ${finalPos.y})`);

        // Réinitialiser l'état
        this.#ghostTile = null;
        this.#isDragging = false;
        this.#currentTileData = null;
    }

    /**
     * Annule le drag en cours
     */
    #cancelDrag() {
        if (this.#ghostTile) {
            const scene = this.#engine.services.SceneService.activeScene;
            if (scene) {
                const index = scene.wgObjects.indexOf(this.#ghostTile);
                if (index > -1) {
                    scene.wgObjects.splice(index, 1);
                }
            }
        }

        this.#ghostTile = null;
        this.#isDragging = false;
        this.#currentTileData = null;
    }

    /**
     * Supprime une tuile à une position donnée
     * @param {number} worldX - Position X dans le monde
     * @param {number} worldY - Position Y dans le monde
     * @returns {boolean} - True si une tuile a été supprimée
     */
    removeTileAt(worldX, worldY) {
        const posKey = `${worldX},${worldY}`;
        
        if (this.#placedTiles.has(posKey)) {
            const tile = this.#placedTiles.get(posKey);
            const scene = this.#engine.services.SceneService.activeScene;
            
            if (scene) {
                const index = scene.wgObjects.indexOf(tile);
                if (index > -1) {
                    scene.wgObjects.splice(index, 1);
                }
            }
            
            this.#placedTiles.delete(posKey);
            console.log(`Tuile supprimée à (${worldX}, ${worldY})`);
            return true;
        }
        
        return false;
    }

    /**
     * Exporte les données de la map (toutes les tuiles placées)
     * @returns {Array} - Liste des tuiles avec leurs positions et assets
     */
    exportMapData() {
        const mapData = [];
        
        this.#placedTiles.forEach((tile, posKey) => {
            const [x, y] = posKey.split(',').map(Number);
            const spriteModel = tile.components.SpriteModel;
            
            mapData.push({
                x,
                y,
                sprite: spriteModel.sprite.src
            });
        });
        
        return mapData;
    }

    /**
     * Charge des données de map
     * @param {Array} mapData - Données à charger
     */
    loadMapData(mapData) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        // Nettoyer les tuiles existantes
        this.#placedTiles.forEach((tile) => {
            const index = scene.wgObjects.indexOf(tile);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
        });
        this.#placedTiles.clear();

        // Charger les nouvelles tuiles
        mapData.forEach(data => {
            const tile = new Tile();
            tile.coordinates.X = data.x;
            tile.coordinates.Y = data.y;

            const spriteModel = tile.components.SpriteModel;
            spriteModel.sprite = new Image();
            spriteModel.sprite.src = data.sprite;
            spriteModel.size.Width = 27;
            spriteModel.size.Height = 27;
            spriteModel.enabled = true;

            if (tile.components.BoxCollider) {
                tile.components.BoxCollider.enabled = false;
            }

            scene.wgObjects.push(tile);
            this.#placedTiles.set(`${data.x},${data.y}`, tile);
        });

        console.log(`${mapData.length} tuiles chargées`);
    }

    /**
     * Vérifie si le service est en train de dragger
     * @returns {boolean}
     */
    isDragging() {
        return this.#isDragging;
    }
}

export { TileDragService };


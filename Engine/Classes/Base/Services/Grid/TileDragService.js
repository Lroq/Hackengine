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
    #placedTiles = new Map(); // Stocke les tuiles placées par coordonnées "x,y,layer"

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

        // Récupérer le layer actif depuis l'interface (ou 0 par défaut)
        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        // Initialiser les propriétés par défaut
        this.#ghostTile.isSolid = false;
        this.#ghostTile.layer = activeLayer;

        // Créer la clé pour identifier cette position + layer
        const posKey = `${finalPos.x},${finalPos.y},${this.#ghostTile.layer}`;

        // Vérifier si une tuile existe déjà à cette position sur le même layer
        if (this.#placedTiles.has(posKey)) {
            console.log(`Une tuile existe déjà à la position (${finalPos.x}, ${finalPos.y}) sur le layer ${this.#ghostTile.layer}`);
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

        // Désactiver le collider pour les tuiles placées (par défaut non-solide)
        if (this.#ghostTile.components.BoxCollider) {
            this.#ghostTile.components.BoxCollider.enabled = false;
        }

        // Enregistrer la tuile placée avec le layer dans la clé
        this.#placedTiles.set(posKey, this.#ghostTile);

        console.log(`Tuile placée à (${finalPos.x}, ${finalPos.y}) sur layer ${this.#ghostTile.layer}`);

        // Sauvegarder automatiquement la map
        this.#saveMapToServer();

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
     * @param {number} layer - (Optionnel) Layer spécifique à supprimer, si omis supprime tous les layers
     * @returns {boolean} - True si au moins une tuile a été supprimée
     */
    removeTileAt(worldX, worldY, layer = null) {
        const scene = this.#engine.services.SceneService.activeScene;
        let removed = false;

        if (layer !== null) {
            // Supprimer uniquement le layer spécifié
            const posKey = `${worldX},${worldY},${layer}`;

            if (this.#placedTiles.has(posKey)) {
                const tile = this.#placedTiles.get(posKey);

                if (scene) {
                    const index = scene.wgObjects.indexOf(tile);
                    if (index > -1) {
                        scene.wgObjects.splice(index, 1);
                    }
                }

                this.#placedTiles.delete(posKey);
                console.log(`Tuile supprimée à (${worldX}, ${worldY}) sur layer ${layer}`);
                removed = true;
            }
        } else {
            // Supprimer tous les layers à cette position
            const keysToDelete = [];

            this.#placedTiles.forEach((tile, key) => {
                const [x, y, l] = key.split(',').map(Number);
                if (x === worldX && y === worldY) {
                    keysToDelete.push(key);

                    if (scene) {
                        const index = scene.wgObjects.indexOf(tile);
                        if (index > -1) {
                            scene.wgObjects.splice(index, 1);
                        }
                    }
                }
            });

            keysToDelete.forEach(key => {
                this.#placedTiles.delete(key);
                removed = true;
            });

            if (removed) {
                console.log(`${keysToDelete.length} tuile(s) supprimée(s) à (${worldX}, ${worldY})`);
            }
        }

        if (removed) {
            // Sauvegarder automatiquement la map
            this.#saveMapToServer();
        }
        
        return removed;
    }

    /**
     * Exporte les données de la map (toutes les tuiles placées)
     * @returns {Array} - Liste des tuiles avec leurs positions et assets
     */
    exportMapData() {
        const mapData = [];
        
        this.#placedTiles.forEach((tile, posKey) => {
            const [x, y, layer] = posKey.split(',').map(Number);
            const spriteModel = tile.components.SpriteModel;
            
            const tileData = {
                x,
                y,
                sprite: spriteModel.sprite.src,
                isSolid: tile.isSolid !== undefined ? tile.isSolid : false,
                layer: layer !== undefined ? layer : 0
            };

            // Ajouter les données de téléportation si la tuile est un téléporteur
            if (tile.isTeleporter) {
                tileData.isTeleporter = true;
                tileData.teleportData = tile.teleportData || { map: '', x: 0, y: 0 };
            }

            mapData.push(tileData);
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

            // Restaurer les propriétés
            tile.isSolid = data.isSolid !== undefined ? data.isSolid : false;
            tile.layer = data.layer !== undefined ? data.layer : 0;

            // Restaurer les propriétés de téléportation
            if (data.isTeleporter) {
                tile.isTeleporter = true;
                tile.teleportData = data.teleportData || { map: '', x: 0, y: 0 };
                // IMPORTANT: Les téléporteurs ne doivent JAMAIS être solides
                tile.isSolid = false;
            }

            // Activer le collider si la tuile est solide (layer 1)
            if (tile.components.BoxCollider) {
                tile.components.BoxCollider.enabled = tile.isSolid;
            }

            scene.wgObjects.push(tile);
            // Utiliser x,y,layer comme clé pour supporter plusieurs tiles sur la même position
            this.#placedTiles.set(`${data.x},${data.y},${tile.layer}`, tile);
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

    /**
     * Récupère une tuile à une position donnée
     * @param {number} worldX - Position X dans le monde
     * @param {number} worldY - Position Y dans le monde
     * @param {number} layer - (Optionnel) Layer spécifique, si omis retourne toutes les tiles
     * @returns {Tile|Tile[]|null} - La tuile trouvée, un tableau de tuiles, ou null
     */
    getTileAt(worldX, worldY, layer = null) {
        if (layer !== null) {
            // Retourner la tile d'un layer spécifique
            const posKey = `${worldX},${worldY},${layer}`;
            return this.#placedTiles.get(posKey) || null;
        } else {
            // Retourner toutes les tiles à cette position
            const tiles = [];
            this.#placedTiles.forEach((tile, key) => {
                const [x, y, l] = key.split(',').map(Number);
                if (x === worldX && y === worldY) {
                    tiles.push(tile);
                }
            });
            return tiles.length > 0 ? tiles : null;
        }
    }

    /**
     * Change le layer d'une tuile existante
     * @param {number} worldX - Position X
     * @param {number} worldY - Position Y
     * @param {number} oldLayer - Ancien layer
     * @param {number} newLayer - Nouveau layer
     * @returns {boolean} - True si la mise à jour a réussi
     */
    updateTileLayer(worldX, worldY, oldLayer, newLayer) {
        const oldKey = `${worldX},${worldY},${oldLayer}`;
        const newKey = `${worldX},${worldY},${newLayer}`;

        if (!this.#placedTiles.has(oldKey)) {
            console.warn(`Aucune tuile trouvée à (${worldX}, ${worldY}) sur layer ${oldLayer}`);
            return false;
        }

        // Vérifier si une tuile existe déjà sur le nouveau layer
        if (this.#placedTiles.has(newKey)) {
            console.warn(`Une tuile existe déjà à (${worldX}, ${worldY}) sur layer ${newLayer}`);
            // On pourrait la supprimer ou refuser l'opération
            // Pour l'instant, on va supprimer l'ancienne
            const oldTileOnNewLayer = this.#placedTiles.get(newKey);
            const scene = this.#engine.services.SceneService.activeScene;
            if (scene) {
                const index = scene.wgObjects.indexOf(oldTileOnNewLayer);
                if (index > -1) {
                    scene.wgObjects.splice(index, 1);
                }
            }
        }

        // Déplacer la tuile vers le nouveau layer
        const tile = this.#placedTiles.get(oldKey);
        tile.layer = newLayer;

        this.#placedTiles.delete(oldKey);
        this.#placedTiles.set(newKey, tile);

        console.log(`✅ Tuile déplacée de layer ${oldLayer} à layer ${newLayer} à (${worldX}, ${worldY})`);
        return true;
    }

    /**
     * Sauvegarde la map sur le serveur (méthode privée)
     */
    #saveMapToServer() {
        this.saveMap();
    }

    /**
     * Sauvegarde la map sur le serveur (méthode publique)
     */
    saveMap() {
        const mapData = this.exportMapData();
        const mapName = window.currentMapName || 'default_map';

        fetch('/api/save-map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mapData, mapName })
        })
        .then(res => res.json())
        .then(data => {
            console.log(`✅ ${data.message} (${data.tileCount} tuiles)`);
        })
        .catch(err => {
            console.error('❌ Erreur lors de la sauvegarde de la map:', err);
        });
    }

    /**
     * Charge la map depuis le serveur
     * @param {string} mapName - Nom de la map à charger
     */
    async loadMapFromServer(mapName = 'default_map') {
        try {
            const res = await fetch(`/api/load-map?name=${encodeURIComponent(mapName)}`);
            const mapData = await res.json();

            // Toujours appeler loadMapData, même si la carte est vide
            // Cela nettoiera les tiles de l'ancienne carte
            this.loadMapData(mapData);

            if (mapData.length > 0) {
                console.log(`✅ Map "${mapName}" chargée depuis le serveur : ${mapData.length} tuiles`);
            } else {
                console.log(`✅ Map vierge "${mapName}" chargée (0 tuiles) - anciens tiles nettoyés`);
            }
        } catch (err) {
            console.error('❌ Erreur lors du chargement de la map:', err);
        }
    }
}

export { TileDragService };


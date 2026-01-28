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
    #currentTileData = null;
    #engine = null;
    #canvas = null;
    #placedTiles = new Map(); // Stocke les tuiles placées par coordonnées "x,y,layer"
    #lastBrushPosition = null; // Dernière position où une tile a été placée en mode pinceau
    #history = []; // Historique des actions pour Ctrl+Z
    #maxHistorySize = 50; // Limite de l'historique

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
        this.#setupUndoShortcut();
    }

    /**
     * Configure le raccourci Ctrl+Z pour annuler
     */
    #setupUndoShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z (Windows/Linux) ou Cmd+Z (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
        });
    }

    /**
     * Configure les événements de souris pour le drag and drop
     */
    #setupEventListeners() {
        let isDrawing = false; // Dessin avec clic droit maintenu
        let currentActionTiles = []; // Tiles de l'action en cours

        // Événement de déplacement de la souris
        document.addEventListener('mousemove', (e) => {
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            if (isDrawing && this.#currentTileData) {
                // Mode pinceau : dessiner
                if (editMode === 'brush') {
                    const tileData = this.#drawTileAtPosition(e.clientX, e.clientY);
                    if (tileData) {
                        currentActionTiles.push(tileData);
                    }
                }
                // Mode gomme : effacer en continu
                else if (editMode === 'eraser') {
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) {
                        currentActionTiles.push(erasedTile);
                    }
                }
            }
        });

        // Événement d'appui sur clic droit : commencer à dessiner/effacer/remplir
        document.addEventListener('mousedown', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            if (e.button === 2) {
                e.preventDefault();
                currentActionTiles = []; // Réinitialiser pour la nouvelle action

                if (editMode === 'brush') {
                    // Mode pinceau : dessiner immédiatement sur la case cliquée
                    isDrawing = true;
                    if (this.#currentTileData) {
                        const tileData = this.#drawTileAtPosition(e.clientX, e.clientY);
                        if (tileData) {
                            currentActionTiles.push(tileData);
                        }
                        console.log('🖌️ Dessin au pinceau activé');
                    } else {
                        console.warn('🖌️ Sélectionnez d\'abord une tile dans la liste');
                    }
                } else if (editMode === 'eraser') {
                    // Mode gomme : effacer immédiatement sur la case cliquée
                    isDrawing = true;
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) {
                        currentActionTiles.push(erasedTile);
                    }
                    console.log('🧹 Effacement activé');
                } else if (editMode === 'fill') {
                    // Mode pot de peinture : remplir immédiatement (pas besoin de isDrawing)
                    this.#fillArea(e.clientX, e.clientY);
                }
            }
        });

        // Événement de relâchement : arrêter de dessiner/effacer
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2 && isDrawing) {
                isDrawing = false;
                this.#lastBrushPosition = null;

                const editMode = window.getEditMode ? window.getEditMode() : 'brush';

                // Enregistrer dans l'historique et sauvegarder
                if (currentActionTiles.length > 0) {
                    if (editMode === 'brush') {
                        this.#addToHistory('place', currentActionTiles);
                        this.#saveMapToServer();
                        console.log('🖌️ Dessin terminé, sauvegarde effectuée');
                    } else if (editMode === 'eraser') {
                        this.#addToHistory('erase', currentActionTiles);
                        this.#saveMapToServer();
                        console.log('🧹 Effacement terminé, sauvegarde effectuée');
                    }
                }

                currentActionTiles = [];
            }
        });
    }

    /**
     * Démarre le drag d'une tuile (ou sélectionne une tile pour le pinceau)
     * Appelé depuis l'UI quand l'utilisateur clique sur une tuile
     * @param {string} tilePath - Chemin vers l'image de la tuile
     */
    startDrag(tilePath) {
        // Vérifier qu'on est en mode construction
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'construction') {
            console.warn('Le système de tiles est uniquement disponible en mode construction');
            return;
        }

        // Stocker les données de la tile pour tous les modes
        this.#currentTileData = { path: tilePath };

        const editMode = window.getEditMode ? window.getEditMode() : 'brush';

        // En mode pinceau, on stocke juste la tile (pas de drag and drop)
        if (editMode === 'brush') {
            console.log('🖌️ Tile sélectionnée pour le pinceau. Maintenez clic droit pour dessiner.');
        }

        // En mode fill ou eraser, on stocke juste la tile pour les clics futurs
        // (pas de drag nécessaire)
    }

    /**
     * Enregistre une action dans l'historique pour Ctrl+Z
     * @param {string} type - Type d'action : 'place', 'erase', 'fill'
     * @param {Array} tilesData - Données des tiles affectées
     */
    #addToHistory(type, tilesData) {
        this.#history.push({
            type,
            tiles: tilesData,
            timestamp: Date.now()
        });

        // Limiter la taille de l'historique
        if (this.#history.length > this.#maxHistorySize) {
            this.#history.shift();
        }

        console.log(`📝 Action enregistrée: ${type} (${tilesData.length} tile(s))`);
    }

    /**
     * Annule la dernière action (Ctrl+Z)
     */
    undo() {
        if (this.#history.length === 0) {
            console.log('⚠️ Aucune action à annuler');
            return;
        }

        const action = this.#history.pop();
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        console.log(`↶ Annulation: ${action.type} (${action.tiles.length} tile(s))`);

        switch (action.type) {
            case 'place':
                // Annuler un placement = supprimer les tiles placées
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const tile = this.#placedTiles.get(posKey);
                    if (tile) {
                        const index = scene.wgObjects.indexOf(tile);
                        if (index > -1) {
                            scene.wgObjects.splice(index, 1);
                        }
                        this.#placedTiles.delete(posKey);
                    }
                });
                break;

            case 'erase':
                // Annuler un effacement = replacer les tiles effacées
                action.tiles.forEach(tileData => {
                    const tile = new Tile();
                    tile.coordinates.X = tileData.x;
                    tile.coordinates.Y = tileData.y;

                    const spriteModel = tile.components.SpriteModel;
                    spriteModel.sprite = new Image();
                    spriteModel.sprite.src = tileData.sprite;
                    spriteModel.size.Width = 27;
                    spriteModel.size.Height = 27;
                    spriteModel.enabled = true;

                    tile.isSolid = tileData.isSolid;
                    tile.layer = tileData.layer;

                    if (tileData.isTeleporter) {
                        tile.isTeleporter = true;
                        tile.teleportData = tileData.teleportData;
                    }

                    if (tile.components.BoxCollider) {
                        tile.components.BoxCollider.enabled = tile.isSolid;
                    }

                    scene.wgObjects.push(tile);
                    this.#placedTiles.set(`${tileData.x},${tileData.y},${tileData.layer}`, tile);
                });
                break;

            case 'fill':
                // Annuler un remplissage = restaurer les tiles d'avant
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;

                    // Supprimer la nouvelle tile
                    const currentTile = this.#placedTiles.get(posKey);
                    if (currentTile) {
                        const index = scene.wgObjects.indexOf(currentTile);
                        if (index > -1) {
                            scene.wgObjects.splice(index, 1);
                        }
                    }

                    // Restaurer l'ancienne tile si elle existait
                    if (tileData.oldSprite) {
                        const tile = new Tile();
                        tile.coordinates.X = tileData.x;
                        tile.coordinates.Y = tileData.y;

                        const spriteModel = tile.components.SpriteModel;
                        spriteModel.sprite = new Image();
                        spriteModel.sprite.src = tileData.oldSprite;
                        spriteModel.size.Width = 27;
                        spriteModel.size.Height = 27;
                        spriteModel.enabled = true;

                        tile.isSolid = tileData.isSolid || false;
                        tile.layer = tileData.layer;

                        if (tile.components.BoxCollider) {
                            tile.components.BoxCollider.enabled = tile.isSolid;
                        }

                        scene.wgObjects.push(tile);
                        this.#placedTiles.set(posKey, tile);
                    } else {
                        // Si pas d'ancienne tile, on supprime juste
                        this.#placedTiles.delete(posKey);
                    }
                });
                break;
        }

        // Sauvegarder après l'annulation
        this.#saveMapToServer();
        console.log('✅ Annulation effectuée et sauvegardée');
    }

    /**
     * Dessine une tile à la position de la souris (mode pinceau)
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     * @returns {Object|null} - Données de la tile placée ou null
     */
    #drawTileAtPosition(screenX, screenY) {
        if (!this.#canvas) return null;

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return null;

        // Obtenir la position snappée
        const snappedPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        // Vérifier si on est sur une nouvelle case (éviter de placer plusieurs fois sur la même)
        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) {
            return null; // Déjà placé sur cette case
        }
        this.#lastBrushPosition = posString;

        // Récupérer le layer actif
        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        // Créer la clé pour cette position + layer
        const posKey = `${snappedPos.x},${snappedPos.y},${activeLayer}`;

        // Vérifier si une tuile existe déjà à cette position sur ce layer
        if (this.#placedTiles.has(posKey)) {
            // Supprimer l'ancienne tuile
            const oldTile = this.#placedTiles.get(posKey);
            const index = scene.wgObjects.indexOf(oldTile);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
        }

        // Créer une nouvelle tile
        const newTile = new Tile();
        newTile.coordinates.X = snappedPos.x;
        newTile.coordinates.Y = snappedPos.y;

        // Configurer le sprite (copier depuis currentTileData)
        const spriteModel = newTile.components.SpriteModel;
        spriteModel.sprite = new Image();
        spriteModel.sprite.src = this.#currentTileData.path;
        spriteModel.size.Width = 27;
        spriteModel.size.Height = 27;
        spriteModel.enabled = true;

        // Propriétés par défaut
        newTile.isSolid = false;
        newTile.layer = activeLayer;
        newTile.isGhost = false;

        // Désactiver le collider
        if (newTile.components.BoxCollider) {
            newTile.components.BoxCollider.enabled = false;
        }

        // Ajouter à la scène et enregistrer
        scene.wgObjects.push(newTile);
        this.#placedTiles.set(posKey, newTile);

        // Retourner les données pour l'historique
        return {
            x: snappedPos.x,
            y: snappedPos.y,
            layer: activeLayer,
            sprite: this.#currentTileData.path,
            isSolid: false
        };
    }

    /**
     * Efface une tile à la position cliquée (mode gomme)
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     * @param {boolean} returnData - Si true, retourne les données de la tile effacée
     * @returns {Object|null} - Données de la tile effacée ou null
     */
    #eraseTile(screenX, screenY, returnData = false) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return null;

        // Obtenir la position snappée
        const snappedPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        // Vérifier si on est sur une nouvelle case (éviter d'effacer plusieurs fois la même)
        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) {
            return null; // Déjà effacé sur cette case
        }
        this.#lastBrushPosition = posString;

        // Récupérer le layer actif
        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        // Sauvegarder les données de la tile avant suppression si demandé
        let tileData = null;
        if (returnData) {
            const posKey = `${snappedPos.x},${snappedPos.y},${activeLayer}`;
            const tile = this.#placedTiles.get(posKey);
            if (tile) {
                tileData = {
                    x: snappedPos.x,
                    y: snappedPos.y,
                    layer: activeLayer,
                    sprite: tile.components.SpriteModel.sprite.src,
                    isSolid: tile.isSolid || false,
                    isTeleporter: tile.isTeleporter || false,
                    teleportData: tile.teleportData || null
                };
            }
        }

        // Supprimer la tile sur ce layer
        const deleted = this.removeTileAt(snappedPos.x, snappedPos.y, activeLayer);

        if (deleted) {
            console.log(`🧹 Tile effacée à (${snappedPos.x}, ${snappedPos.y}) sur layer ${activeLayer}`);
        }

        return returnData ? tileData : null;
    }

    /**
     * Remplit une zone avec la tile sélectionnée (mode pot de peinture)
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     */
    #fillArea(screenX, screenY) {
        // Vérifier qu'une tile est sélectionnée pour le remplissage
        if (!this.#currentTileData) {
            console.warn('🪣 Sélectionnez d\'abord une tile à placer');
            return;
        }

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        // Obtenir la position de départ
        const startPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        // Récupérer le layer actif
        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        // Vérifier la tile existante à cette position
        const startKey = `${startPos.x},${startPos.y},${activeLayer}`;
        const existingTile = this.#placedTiles.get(startKey);
        const targetSprite = existingTile ? existingTile.components.SpriteModel.sprite.src : null;

        // Algorithme de remplissage (flood fill)
        const visited = new Set();
        const queue = [{ x: startPos.x, y: startPos.y }];
        let tilesPlaced = 0;
        const fillHistory = []; // Pour l'historique Ctrl+Z

        while (queue.length > 0 && tilesPlaced < 1000) { // Limite de sécurité
            const pos = queue.shift();
            const posKey = `${pos.x},${pos.y},${activeLayer}`;

            if (visited.has(posKey)) continue;
            visited.add(posKey);

            // Vérifier la tile actuelle
            const currentTile = this.#placedTiles.get(posKey);
            const currentSprite = currentTile ? currentTile.components.SpriteModel.sprite.src : null;

            // Si la tile actuelle correspond à la tile cible, la remplacer
            if (currentSprite === targetSprite) {
                // Sauvegarder l'ancienne tile pour l'historique
                fillHistory.push({
                    x: pos.x,
                    y: pos.y,
                    layer: activeLayer,
                    oldSprite: currentSprite,
                    sprite: this.#currentTileData.path,
                    isSolid: currentTile ? currentTile.isSolid : false
                });

                // Supprimer l'ancienne tile si elle existe
                if (currentTile) {
                    const index = scene.wgObjects.indexOf(currentTile);
                    if (index > -1) {
                        scene.wgObjects.splice(index, 1);
                    }
                }

                // Créer une nouvelle tile
                const newTile = new Tile();
                newTile.coordinates.X = pos.x;
                newTile.coordinates.Y = pos.y;

                const spriteModel = newTile.components.SpriteModel;
                spriteModel.sprite = new Image();
                spriteModel.sprite.src = this.#currentTileData.path;
                spriteModel.size.Width = 27;
                spriteModel.size.Height = 27;
                spriteModel.enabled = true;

                newTile.isSolid = false;
                newTile.layer = activeLayer;
                newTile.isGhost = false;

                if (newTile.components.BoxCollider) {
                    newTile.components.BoxCollider.enabled = false;
                }

                scene.wgObjects.push(newTile);
                this.#placedTiles.set(posKey, newTile);
                tilesPlaced++;

                // Ajouter les voisins à la queue
                queue.push({ x: pos.x + 27, y: pos.y });
                queue.push({ x: pos.x - 27, y: pos.y });
                queue.push({ x: pos.x, y: pos.y + 27 });
                queue.push({ x: pos.x, y: pos.y - 27 });
            }
        }

        console.log(`🪣 Zone remplie : ${tilesPlaced} tiles placées sur layer ${activeLayer}`);

        // Enregistrer dans l'historique
        if (fillHistory.length > 0) {
            this.#addToHistory('fill', fillHistory);
        }

        // Sauvegarder la map
        this.#saveMapToServer();
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


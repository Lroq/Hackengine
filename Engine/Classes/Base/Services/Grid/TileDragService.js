import {GridSnapHelper} from './GridSnapHelper.js';
import {Tile} from '../../WebGameObjects/Tile.js';

/**
 * TileDragService - Gère le drag and drop et l'édition des tuiles sur la grille.
 */
class TileDragService {
    #gridSnapHelper;
    #currentTileData = null;
    #engine = null;
    #canvas = null;
    #mapService = null;

    #placedTiles = new Map();

    #lastBrushPosition = null;
    #history = [];
    #redoHistory = [];
    #maxHistorySize = 50;

    #gridBounds = {
        minX: -27 * 25,
        minY: -27 * 25,
        maxX: 27 * 25,
        maxY: 27 * 25,
    };

    constructor() {
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    /**
     * @param {Engine}     engine
     * @param {HTMLCanvasElement} canvas
     * @param {MapService} mapService
     */
    initialize(engine, canvas, mapService) {
        this.#engine = engine;
        this.#canvas = canvas;
        this.#mapService = mapService;

        this.#mapService.initialize(engine, this.#placedTiles);

        this.#setupEventListeners();
        this.#setupUndoShortcut();
    }

    // -------------------------------------------------------------------------
    // API publique — délégation à MapService
    // -------------------------------------------------------------------------

    /**
     * Charge une map depuis le serveur.
     */
    async loadMapFromServer(mapName = 'default_map') {
        await this.#mapService.loadMapFromServer(mapName);
        // Synchroniser les limites de grille après chargement
        if (this.#mapService.gridBounds) {
            this.#gridBounds = this.#mapService.gridBounds;
        }
    }

    /**
     * Sauvegarde la map sur le serveur.
     */
    saveMap() {
        this.#mapService.saveMap();
    }

    /**
     * Exporte les données brutes de la map (utilisé par l'UI d'export).
     */
    exportMapData() {
        return this.#mapService.exportMapData();
    }

    /**
     * Retourne le chemin de la tile actuellement sélectionnée.
     */
    getSelectedTilePath() {
        return this.#currentTileData?.path ?? null;
    }

    /**
     * Démarre le drag d'une tuile (sélection pour le pinceau).
     */
    startDrag(tilePath) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'construction') {
            console.warn('Le système de tiles est uniquement disponible en mode construction');
            return;
        }
        this.#currentTileData = {path: tilePath};
    }

    /**
     * Met à jour la taille de la grille de placement.
     */
    setGridSize(tileSize) {
        const halfSize = Math.floor(tileSize / 2);
        const cellSize = 27;

        this.#gridBounds = {
            minX: -cellSize * halfSize,
            minY: -cellSize * halfSize,
            maxX: cellSize * halfSize,
            maxY: cellSize * halfSize,
        };

        if (window.constructionGrid) {
            window.constructionGrid.setGridSize(tileSize);
        }
    }

    // -------------------------------------------------------------------------
    // Lecture des tuiles placées
    // -------------------------------------------------------------------------

    getTileAt(worldX, worldY, layer = null) {
        if (layer !== null) {
            return this.#placedTiles.get(`${worldX},${worldY},${layer}`) || null;
        }

        const tiles = [];
        this.#placedTiles.forEach((tile, key) => {
            const [x, y] = key.split(',').map(Number);
            if (x === worldX && y === worldY) tiles.push(tile);
        });
        return tiles.length > 0 ? tiles : null;
    }

    removeTileAt(worldX, worldY, layer = null) {
        const scene = this.#engine.services.SceneService.activeScene;
        let removed = false;

        const removeSingle = (posKey) => {
            if (!this.#placedTiles.has(posKey)) return false;
            const tile = this.#placedTiles.get(posKey);
            const index = scene?.wgObjects.indexOf(tile) ?? -1;
            if (index > -1) scene.wgObjects.splice(index, 1);
            this.#placedTiles.delete(posKey);
            return true;
        };

        if (layer !== null) {
            removed = removeSingle(`${worldX},${worldY},${layer}`);
        } else {
            const keysToDelete = [];
            this.#placedTiles.forEach((_, key) => {
                const [x, y] = key.split(',').map(Number);
                if (x === worldX && y === worldY) keysToDelete.push(key);
            });
            keysToDelete.forEach(key => {
                if (removeSingle(key)) removed = true;
            });
        }

        return removed;
    }

    updateTileLayer(worldX, worldY, oldLayer, newLayer) {
        const oldKey = `${worldX},${worldY},${oldLayer}`;
        const newKey = `${worldX},${worldY},${newLayer}`;

        if (!this.#placedTiles.has(oldKey)) {
            console.warn(`Aucune tuile trouvée à (${worldX}, ${worldY}) sur layer ${oldLayer}`);
            return false;
        }

        if (this.#placedTiles.has(newKey)) {
            const scene = this.#engine.services.SceneService.activeScene;
            const oldTile = this.#placedTiles.get(newKey);
            const index = scene?.wgObjects.indexOf(oldTile) ?? -1;
            if (index > -1) scene.wgObjects.splice(index, 1);
        }

        const tile = this.#placedTiles.get(oldKey);
        tile.layer = newLayer;
        this.#placedTiles.delete(oldKey);
        this.#placedTiles.set(newKey, tile);

        return true;
    }

    // -------------------------------------------------------------------------
    // Undo / Redo
    // -------------------------------------------------------------------------

    undo() {
        if (this.#history.length === 0) {
            console.log('⚠️ Aucune action à annuler');
            return;
        }

        const action = this.#history.pop();
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#redoHistory.push(action);
        if (this.#redoHistory.length > this.#maxHistorySize) this.#redoHistory.shift();

        switch (action.type) {
            case 'place':
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const tile = this.#placedTiles.get(posKey);
                    if (tile) {
                        const index = scene.wgObjects.indexOf(tile);
                        if (index > -1) scene.wgObjects.splice(index, 1);
                        this.#placedTiles.delete(posKey);
                    }
                });
                break;

            case 'erase':
                action.tiles.forEach(tileData => {
                    const tile = this.#createTileFromData(tileData);
                    scene.wgObjects.push(tile);
                    this.#placedTiles.set(`${tileData.x},${tileData.y},${tileData.layer}`, tile);
                });
                break;

            case 'fill':
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const currentTile = this.#placedTiles.get(posKey);
                    if (currentTile) {
                        const index = scene.wgObjects.indexOf(currentTile);
                        if (index > -1) scene.wgObjects.splice(index, 1);
                    }
                    if (tileData.oldSprite) {
                        const tile = this.#createTileFromData({...tileData, sprite: tileData.oldSprite});
                        scene.wgObjects.push(tile);
                        this.#placedTiles.set(posKey, tile);
                    } else {
                        this.#placedTiles.delete(posKey);
                    }
                });
                break;
        }

        console.log('✅ Annulation effectuée');
    }

    redo() {
        if (this.#redoHistory.length === 0) {
            console.log('⚠️ Aucune action à refaire');
            return;
        }

        const action = this.#redoHistory.pop();
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#history.push(action);
        if (this.#history.length > this.#maxHistorySize) this.#history.shift();

        switch (action.type) {
            case 'place':
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const existingTile = this.#placedTiles.get(posKey);
                    if (existingTile) {
                        const index = scene.wgObjects.indexOf(existingTile);
                        if (index > -1) scene.wgObjects.splice(index, 1);
                    }
                    const tile = this.#createTileFromData(tileData);
                    scene.wgObjects.push(tile);
                    this.#placedTiles.set(posKey, tile);
                });
                break;

            case 'erase':
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const tile = this.#placedTiles.get(posKey);
                    if (tile) {
                        const index = scene.wgObjects.indexOf(tile);
                        if (index > -1) scene.wgObjects.splice(index, 1);
                        this.#placedTiles.delete(posKey);
                    }
                });
                break;

            case 'fill':
                action.tiles.forEach(tileData => {
                    const posKey = `${tileData.x},${tileData.y},${tileData.layer}`;
                    const currentTile = this.#placedTiles.get(posKey);
                    if (currentTile) {
                        const index = scene.wgObjects.indexOf(currentTile);
                        if (index > -1) scene.wgObjects.splice(index, 1);
                    }
                    const tile = this.#createTileFromData(tileData);
                    scene.wgObjects.push(tile);
                    this.#placedTiles.set(posKey, tile);
                });
                break;
        }

        console.log('✅ Action refaite');
    }

    // -------------------------------------------------------------------------
    // Privé — édition
    // -------------------------------------------------------------------------

    #setupUndoShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    #setupEventListeners() {
        let isDrawing = false;
        let currentActionTiles = [];

        document.addEventListener('mousemove', (e) => {
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';
            const assetsPanel = document.getElementById('assets-panel');
            if (assetsPanel?.contains(e.target)) return;

            if (isDrawing && this.#currentTileData) {
                if (editMode === 'brush') {
                    const tileData = this.#drawTileAtPosition(e.clientX, e.clientY);
                    if (tileData) currentActionTiles.push(tileData);
                } else if (editMode === 'eraser') {
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) currentActionTiles.push(erasedTile);
                }
            }
        });

        document.addEventListener('mousedown', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            if (mode !== 'construction') return;

            if (e.button === 0) {
                const target = e.target;
                const assetsPanel = document.getElementById('assets-panel');

                if (
                    target.tagName === 'SELECT' || target.tagName === 'OPTION' ||
                    target.tagName === 'INPUT' || target.tagName === 'BUTTON' ||
                    target.closest('select') || target.closest('button') ||
                    target.closest('input') || assetsPanel?.contains(target)
                ) return;

                e.preventDefault();
                currentActionTiles = [];

                if (editMode === 'brush') {
                    isDrawing = true;
                    if (this.#currentTileData) {
                        const tileData = this.#drawTileAtPosition(e.clientX, e.clientY);
                        if (tileData) currentActionTiles.push(tileData);
                    } else {
                        console.warn('🖌️ Sélectionnez d\'abord une tile');
                    }
                } else if (editMode === 'eraser') {
                    isDrawing = true;
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) currentActionTiles.push(erasedTile);
                } else if (editMode === 'fill') {
                    this.#fillArea(e.clientX, e.clientY);
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDrawing) {
                isDrawing = false;
                this.#lastBrushPosition = null;

                const editMode = window.getEditMode ? window.getEditMode() : 'brush';

                if (currentActionTiles.length > 0) {
                    if (editMode === 'brush') this.#addToHistory('place', currentActionTiles);
                    if (editMode === 'eraser') this.#addToHistory('erase', currentActionTiles);
                }

                currentActionTiles = [];
            }
        });
    }

    #addToHistory(type, tilesData) {
        this.#history.push({type, tiles: tilesData, timestamp: Date.now()});
        this.#redoHistory = [];
        if (this.#history.length > this.#maxHistorySize) this.#history.shift();
    }

    #isInGridBounds(x, y) {
        return x >= this.#gridBounds.minX && x < this.#gridBounds.maxX &&
            y >= this.#gridBounds.minY && y < this.#gridBounds.maxY;
    }

    #createTileFromData(data) {
        const tile = new Tile();
        tile.coordinates.X = data.x;
        tile.coordinates.Y = data.y;

        const spriteModel = tile.components.SpriteModel;
        spriteModel.sprite = new Image();
        spriteModel.sprite.src = data.sprite;
        spriteModel.size.Width = 27;
        spriteModel.size.Height = 27;
        spriteModel.enabled = true;

        tile.isSolid = data.isSolid ?? false;
        tile.layer = data.layer ?? 0;

        if (data.isTeleporter) {
            tile.isTeleporter = true;
            tile.teleportData = data.teleportData || {map: '', x: 0, y: 0};
        }

        if (tile.components.BoxCollider) {
            tile.components.BoxCollider.enabled = tile.isSolid;
        }

        return tile;
    }

    #drawTileAtPosition(screenX, screenY) {
        if (!this.#canvas) return null;

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene?.activeCamera) return null;

        const snappedPos = this.#gridSnapHelper.screenToGridSnap(screenX, screenY, scene.activeCamera, this.#canvas);

        if (!this.#isInGridBounds(snappedPos.x, snappedPos.y)) return null;

        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) return null;
        this.#lastBrushPosition = posString;

        const activeLayerSelect = document.getElementById('active-layer-select');
        const tileSolidSelect = document.getElementById('tile-solid-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;
        const tileShouldBeSolid = tileSolidSelect ? (tileSolidSelect.value === 'true') : false;

        const posKey = `${snappedPos.x},${snappedPos.y},${activeLayer}`;

        if (this.#placedTiles.has(posKey)) {
            const oldTile = this.#placedTiles.get(posKey);
            const index = scene.wgObjects.indexOf(oldTile);
            if (index > -1) scene.wgObjects.splice(index, 1);
        }

        const newTile = this.#createTileFromData({
            x: snappedPos.x,
            y: snappedPos.y,
            sprite: this.#currentTileData.path,
            isSolid: tileShouldBeSolid,
            layer: activeLayer,
        });
        newTile.isGhost = false;

        scene.wgObjects.push(newTile);
        this.#placedTiles.set(posKey, newTile);

        return {
            x: snappedPos.x,
            y: snappedPos.y,
            layer: activeLayer,
            sprite: this.#currentTileData.path,
            isSolid: tileShouldBeSolid
        };
    }

    #eraseTile(screenX, screenY, returnData = false) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene?.activeCamera) return null;

        const snappedPos = this.#gridSnapHelper.screenToGridSnap(screenX, screenY, scene.activeCamera, this.#canvas);

        if (!this.#isInGridBounds(snappedPos.x, snappedPos.y)) return null;

        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) return null;
        this.#lastBrushPosition = posString;

        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        let tileData = null;
        if (returnData) {
            const tile = this.#placedTiles.get(`${snappedPos.x},${snappedPos.y},${activeLayer}`);
            if (tile) {
                tileData = {
                    x: snappedPos.x,
                    y: snappedPos.y,
                    layer: activeLayer,
                    sprite: tile.components.SpriteModel.sprite.src,
                    isSolid: tile.isSolid ?? false,
                    isTeleporter: tile.isTeleporter ?? false,
                    teleportData: tile.teleportData ?? null,
                };
            }
        }

        this.removeTileAt(snappedPos.x, snappedPos.y, activeLayer);
        return returnData ? tileData : null;
    }

    #fillArea(screenX, screenY) {
        if (!this.#currentTileData) {
            console.warn('🪣 Sélectionnez d\'abord une tile');
            return;
        }

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene?.activeCamera) return;

        const startPos = this.#gridSnapHelper.screenToGridSnap(screenX, screenY, scene.activeCamera, this.#canvas);
        const activeLayerSelect = document.getElementById('active-layer-select');
        const tileSolidSelect = document.getElementById('tile-solid-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;
        const tileShouldBeSolid = tileSolidSelect ? (tileSolidSelect.value === 'true') : false;

        const startKey = `${startPos.x},${startPos.y},${activeLayer}`;
        const existingTile = this.#placedTiles.get(startKey);
        const targetSprite = existingTile?.components.SpriteModel.sprite.src ?? null;

        const visited = new Set();
        const queue = [{x: startPos.x, y: startPos.y}];
        let tilesPlaced = 0;
        const fillHistory = [];

        while (queue.length > 0 && tilesPlaced < 500) {
            const pos = queue.shift();
            const posKey = `${pos.x},${pos.y},${activeLayer}`;

            if (visited.has(posKey)) continue;
            visited.add(posKey);

            if (!this.#isInGridBounds(pos.x, pos.y)) continue;

            const currentTile = this.#placedTiles.get(posKey);
            const currentSprite = currentTile?.components.SpriteModel.sprite.src ?? null;

            if (currentSprite !== targetSprite) continue;

            fillHistory.push({
                x: pos.x, y: pos.y, layer: activeLayer,
                oldSprite: currentSprite,
                sprite: this.#currentTileData.path,
                isSolid: currentTile?.isSolid ?? false,
            });

            if (currentTile) {
                const index = scene.wgObjects.indexOf(currentTile);
                if (index > -1) scene.wgObjects.splice(index, 1);
            }

            const newTile = this.#createTileFromData({
                x: pos.x,
                y: pos.y,
                sprite: this.#currentTileData.path,
                isSolid: tileShouldBeSolid,
                layer: activeLayer,
            });
            newTile.isGhost = false;

            scene.wgObjects.push(newTile);
            this.#placedTiles.set(posKey, newTile);
            tilesPlaced++;

            queue.push(
                {x: pos.x + 27, y: pos.y},
                {x: pos.x - 27, y: pos.y},
                {x: pos.x, y: pos.y + 27},
                {x: pos.x, y: pos.y - 27},
            );
        }

        if (fillHistory.length > 0) this.#addToHistory('fill', fillHistory);
        console.log(`🪣 Remplissage terminé : ${tilesPlaced} tiles`);
    }
}

export {TileDragService};
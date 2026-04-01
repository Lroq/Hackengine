import { GridSnapHelper } from './GridSnapHelper.js';
import { Tile } from '../../WebGameObjects/Tile.js';

/**
 * TileDragService - Gère le drag and drop des tuiles sur la grille
 */
class TileDragService {
    #gridSnapHelper;
    #currentTileData = null;
    #engine = null;
    #canvas = null;
    #lastBrushPosition = null;
    #history = [];
    #redoHistory = [];
    #maxHistorySize = 50;

    #gridBounds = {
        minX: -27 * 25,
        minY: -27 * 25,
        maxX: 27 * 25,
        maxY: 27 * 25
    };

    constructor() {
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    initialize(engine, canvas) {
        this.#engine = engine;
        this.#canvas = canvas;
        this.#setupEventListeners();
        this.#setupUndoShortcut();
    }

    get #mapService() {
        return this.#engine.services.MapService;
    }

    get #gameModeService() {
        return this.#engine.services.GameModeService;
    }

    #setupUndoShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    #setupEventListeners() {
        let isDrawing = false;
        let currentActionTiles = [];

        document.addEventListener('mousemove', (e) => {
            if (window.tileContextMenu && window.tileContextMenu.isVisible()) return;

            const editMode = this.#gameModeService ? this.#gameModeService.getEditMode() : 'brush';
            const assetsPanel = document.getElementById('assets-panel');
            if (assetsPanel && assetsPanel.contains(e.target)) return;

            if (isDrawing && this.#currentTileData) {
                if (editMode === 'brush') {
                    const tileData = this.#drawTileAtPosition(e.clientX, e.clientY);
                    if (tileData) currentActionTiles.push(tileData);
                }
                else if (editMode === 'eraser') {
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) currentActionTiles.push(erasedTile);
                }
            }
        });

        document.addEventListener('mousedown', (e) => {
            const mode = this.#gameModeService ? this.#gameModeService.getMode() : 'play';
            if (mode !== 'construction') return;

            if (window.tileContextMenu && window.tileContextMenu.isVisible()) return;

            const editMode = this.#gameModeService ? this.#gameModeService.getEditMode() : 'brush';

            if (e.button === 0) {
                const target = e.target;
                const assetsPanel = document.getElementById('assets-panel');

                if (target.tagName === 'SELECT' || target.tagName === 'OPTION' ||
                    target.tagName === 'INPUT' || target.tagName === 'BUTTON' ||
                    target.closest('select') || target.closest('button') || target.closest('input') ||
                    (assetsPanel && assetsPanel.contains(target))) {
                    return;
                }

                e.preventDefault();
                currentActionTiles = [];

                if (editMode === 'brush') {
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
                    isDrawing = true;
                    const erasedTile = this.#eraseTile(e.clientX, e.clientY, true);
                    if (erasedTile) {
                        currentActionTiles.push(erasedTile);
                    }
                    console.log('🧹 Effacement activé');
                } else if (editMode === 'fill') {
                    this.#fillArea(e.clientX, e.clientY);
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDrawing) {
                isDrawing = false;
                this.#lastBrushPosition = null;

                const editMode = this.#gameModeService ? this.#gameModeService.getEditMode() : 'brush';

                if (currentActionTiles.length > 0) {
                    if (editMode === 'brush') {
                        this.#addToHistory('place', currentActionTiles);
                        console.log('🖌️ Dessin terminé');
                    } else if (editMode === 'eraser') {
                        this.#addToHistory('erase', currentActionTiles);
                        console.log('🧹 Effacement terminé');
                    }
                }
                currentActionTiles = [];
            }
        });
    }

    startDrag(tilePath) {
        const mode = this.#gameModeService ? this.#gameModeService.getMode() : 'play';
        if (mode !== 'construction') {
            console.warn('Le système de tiles est uniquement disponible en mode construction');
            return;
        }
        this.#currentTileData = { path: tilePath };
        const editMode = this.#gameModeService ? this.#gameModeService.getEditMode() : 'brush';
        if (editMode === 'brush') {
            console.log('🖌️ Tile sélectionnée pour le pinceau');
        }
    }

    #addToHistory(type, tilesData) {
        this.#history.push({
            type,
            tiles: tilesData,
            timestamp: Date.now()
        });
        this.#redoHistory = [];
        if (this.#history.length > this.#maxHistorySize) {
            this.#history.shift();
        }
        console.log(`📝 Action enregistrée: ${type} (${tilesData.length} tile(s))`);
    }

    #isInGridBounds(x, y) {
        return x >= this.#gridBounds.minX &&
               x < this.#gridBounds.maxX &&
               y >= this.#gridBounds.minY &&
               y < this.#gridBounds.maxY;
    }

    undo() {
        if (this.#history.length === 0) {
            console.log('⚠️ Aucune action à annuler');
            return;
        }

        const action = this.#history.pop();
        this.#redoHistory.push(action);
        if (this.#redoHistory.length > this.#maxHistorySize) {
            this.#redoHistory.shift();
        }

        console.log(`↶ Annulation: ${action.type} (${action.tiles.length} tile(s))`);

        switch (action.type) {
            case 'place':
                action.tiles.forEach(tileData => {
                    this.#mapService.removeTile(tileData.x, tileData.y, tileData.layer);
                });
                break;

            case 'erase':
                this.#restoreTiles(action.tiles);
                break;

            case 'fill':
                action.tiles.forEach(tileData => {
                    // Supprimer la nouvelle tile
                    this.#mapService.removeTile(tileData.x, tileData.y, tileData.layer);
                    
                    // Restaurer l'ancienne si elle existait
                    if (tileData.oldSprite) {
                        this.#createAndAddTile({
                            x: tileData.x,
                            y: tileData.y,
                            sprite: tileData.oldSprite,
                            isSolid: tileData.isSolid,
                            layer: tileData.layer
                        });
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
        this.#history.push(action);
        if (this.#history.length > this.#maxHistorySize) {
            this.#history.shift();
        }

        console.log(`↷ Refaire: ${action.type} (${action.tiles.length} tile(s))`);

        switch (action.type) {
            case 'place':
                this.#restoreTiles(action.tiles);
                break;

            case 'erase':
                action.tiles.forEach(tileData => {
                    this.#mapService.removeTile(tileData.x, tileData.y, tileData.layer);
                });
                break;

            case 'fill':
                action.tiles.forEach(tileData => {
                    // Supprimer l'ancienne
                    this.#mapService.removeTile(tileData.x, tileData.y, tileData.layer);
                    // Créer la nouvelle
                    this.#createAndAddTile({
                        x: tileData.x,
                        y: tileData.y,
                        sprite: tileData.sprite,
                        isSolid: tileData.isSolid,
                        layer: tileData.layer
                    });
                });
                break;
        }
        console.log('✅ Action refaite');
    }

    #restoreTiles(tilesData) {
        tilesData.forEach(tileData => {
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
            if (tileData.hasInteraction) {
                tile.hasInteraction = true;
                tile.interactionText = tileData.interactionText;
            }

            if (tile.components.BoxCollider) {
                tile.components.BoxCollider.enabled = tile.isSolid;
            }

            this.#mapService.addTile(tile, tileData.x, tileData.y, tileData.layer);
        });
    }

    #createAndAddTile(data) {
        const tile = new Tile();
        tile.coordinates.X = data.x;
        tile.coordinates.Y = data.y;

        const spriteModel = tile.components.SpriteModel;
        spriteModel.sprite = new Image();
        spriteModel.sprite.src = data.sprite;
        spriteModel.size.Width = 27;
        spriteModel.size.Height = 27;
        spriteModel.enabled = true;

        tile.isSolid = data.isSolid;
        tile.layer = data.layer;

        if (tile.components.BoxCollider) {
            tile.components.BoxCollider.enabled = tile.isSolid;
        }

        this.#mapService.addTile(tile, data.x, data.y, data.layer);
    }

    #drawTileAtPosition(screenX, screenY) {
        if (!this.#canvas) return null;
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return null;

        const snappedPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        if (!this.#isInGridBounds(snappedPos.x, snappedPos.y)) {
            console.warn(`⚠️ Position hors grille: (${snappedPos.x}, ${snappedPos.y})`);
            return null;
        }

        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) {
            return null;
        }
        this.#lastBrushPosition = posString;

        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;
        
        const tileSolidSelect = document.getElementById('tile-solid-select');
        const tileShouldBeSolid = tileSolidSelect ? (tileSolidSelect.value === 'true') : false;

        // Supprimer l'ancienne tuile
        this.#mapService.removeTile(snappedPos.x, snappedPos.y, activeLayer);

        // Créer nouvelle tuile
        this.#createAndAddTile({
            x: snappedPos.x,
            y: snappedPos.y,
            sprite: this.#currentTileData.path,
            isSolid: tileShouldBeSolid,
            layer: activeLayer
        });

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
        if (!scene || !scene.activeCamera) return null;

        const snappedPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        if (!this.#isInGridBounds(snappedPos.x, snappedPos.y)) return null;

        const posString = `${snappedPos.x},${snappedPos.y}`;
        if (this.#lastBrushPosition === posString) return null;
        this.#lastBrushPosition = posString;

        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;

        let tileData = null;
        if (returnData) {
            const tile = this.#mapService.getTileAt(snappedPos.x, snappedPos.y, activeLayer);
            if (tile) {
                // ... extract data
                tileData = {
                    x: snappedPos.x,
                    y: snappedPos.y,
                    layer: activeLayer,
                    sprite: tile.components.SpriteModel.sprite.src,
                    isSolid: tile.isSolid || false,
                    isTeleporter: tile.isTeleporter || false,
                    teleportData: tile.teleportData || null,
                    hasInteraction: tile.hasInteraction || false,
                    interactionText: tile.interactionText || ''
                };
            }
        }

        const deleted = this.removeTileAt(snappedPos.x, snappedPos.y, activeLayer);
        if (deleted) {
            console.log(`🧹 Tile effacée à (${snappedPos.x}, ${snappedPos.y}) sur layer ${activeLayer}`);
        }

        return returnData ? tileData : null;
    }

    #fillArea(screenX, screenY) {
        if (!this.#currentTileData) {
            console.warn('🪣 Sélectionnez d\'abord une tile à placer');
            return;
        }

        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        const startPos = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        const activeLayerSelect = document.getElementById('active-layer-select');
        const activeLayer = activeLayerSelect ? parseInt(activeLayerSelect.value) : 0;
        
        const tileSolidSelect = document.getElementById('tile-solid-select');
        const tileShouldBeSolid = tileSolidSelect ? (tileSolidSelect.value === 'true') : false;

        const existingTile = this.#mapService.getTileAt(startPos.x, startPos.y, activeLayer);
        const targetSprite = existingTile ? existingTile.components.SpriteModel.sprite.src : null;

        const visited = new Set();
        const queue = [{ x: startPos.x, y: startPos.y }];
        let tilesPlaced = 0;
        const fillHistory = [];

        while (queue.length > 0 && tilesPlaced < 500) {
            const pos = queue.shift();
            const posKey = `${pos.x},${pos.y},${activeLayer}`;

            if (visited.has(posKey)) continue;
            visited.add(posKey);

            if (!this.#isInGridBounds(pos.x, pos.y)) continue;

            const currentTile = this.#mapService.getTileAt(pos.x, pos.y, activeLayer);
            const currentSprite = currentTile ? currentTile.components.SpriteModel.sprite.src : null;

            if (currentSprite === targetSprite) {
                fillHistory.push({
                    x: pos.x,
                    y: pos.y,
                    layer: activeLayer,
                    oldSprite: currentSprite,
                    sprite: this.#currentTileData.path,
                    isSolid: currentTile ? currentTile.isSolid : false
                });

                this.#mapService.removeTile(pos.x, pos.y, activeLayer);
                this.#createAndAddTile({
                    x: pos.x,
                    y: pos.y,
                    sprite: this.#currentTileData.path,
                    isSolid: tileShouldBeSolid,
                    layer: activeLayer
                });
                tilesPlaced++;

                queue.push({ x: pos.x + 27, y: pos.y });
                queue.push({ x: pos.x - 27, y: pos.y });
                queue.push({ x: pos.x, y: pos.y + 27 });
                queue.push({ x: pos.x, y: pos.y - 27 });
            }
        }

        console.log(`🪣 Zone remplie : ${tilesPlaced} tiles placées sur layer ${activeLayer}`);
        if (fillHistory.length > 0) {
            this.#addToHistory('fill', fillHistory);
        }
    }

    removeTileAt(worldX, worldY, layer = null) {
        return this.#mapService.removeTile(worldX, worldY, layer);
    }

    exportMapData() {
        return this.#mapService.exportMapData();
    }

    loadMapData(mapData) {
        this.#mapService.loadMapData(mapData);
    }

    getTileAt(worldX, worldY, layer = null) {
        return this.#mapService.getTileAt(worldX, worldY, layer);
    }

    updateTileLayer(worldX, worldY, oldLayer, newLayer) {
        const tile = this.getTileAt(worldX, worldY, oldLayer);
        if (!tile) return false;
        
        this.#mapService.removeTile(worldX, worldY, oldLayer);
        tile.layer = newLayer;
        this.#mapService.addTile(tile, worldX, worldY, newLayer);
        return true;
    }

    saveMap() {
        this.#mapService.saveMap();
    }

    getSelectedTilePath() {
        return this.#currentTileData ? this.#currentTileData.path : null;
    }

    async loadMapFromServer(mapName = 'default_map') {
        await this.#mapService.loadMapFromServer(mapName);
    }

    setGridSize(tileSize) {
        const halfSize = Math.floor(tileSize / 2);
        const cellSize = 27;

        this.#gridBounds = {
            minX: -cellSize * halfSize,
            minY: -cellSize * halfSize,
            maxX: cellSize * halfSize,
            maxY: cellSize * halfSize
        };

        if (this.#engine && this.#engine.services.Renderer) {
            this.#engine.services.Renderer.setGridSize(tileSize);
        }
    }
}

export { TileDragService };




import {GridSnapHelper} from './GridSnapHelper.js';
import {Tile} from '../../WebGameObjects/Tile.js';

/**
 * TileDragService - Drag & drop, pinceau, gomme, pot de peinture, undo/redo.
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
        minX: -27 * 25, minY: -27 * 25,
        maxX: 27 * 25, maxY: 27 * 25,
    };

    constructor() {
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    initialize(engine, canvas, mapService) {
        this.#engine = engine;
        this.#canvas = canvas;
        this.#mapService = mapService;

        this.#mapService.initialize(engine, this.#placedTiles);

        this.#setupEventListeners();
        this.#setupUndoShortcut();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    #getMode() {
        return this.#engine?.services.GameModeService?.getMode() ?? window.getMode?.() ?? 'play';
    }

    #getEditMode() {
        return this.#engine?.services.GameModeService?.getEditMode() ?? window.getEditMode?.() ?? 'brush';
    }

    // -------------------------------------------------------------------------
    // API publique
    // -------------------------------------------------------------------------

    async loadMapFromServer(mapName = 'default_map') {
        await this.#mapService.loadMapFromServer(mapName);
        if (this.#mapService.gridBounds) this.#gridBounds = this.#mapService.gridBounds;
    }

    saveMap() {
        this.#mapService.saveMap();
    }

    exportMapData() {
        return this.#mapService.exportMapData();
    }

    getSelectedTilePath() {
        return this.#currentTileData?.path ?? null;
    }

    startDrag(tilePath) {
        if (this.#getMode() !== 'construction') {
            console.warn('Le système de tiles est uniquement disponible en mode construction');
            return;
        }
        this.#currentTileData = {path: tilePath};
    }

    setGridSize(tileSize) {
        const halfSize = Math.floor(tileSize / 2);
        const cellSize = 27;
        this.#gridBounds = {
            minX: -cellSize * halfSize, minY: -cellSize * halfSize,
            maxX: cellSize * halfSize, maxY: cellSize * halfSize,
        };
        this.#engine?.setGridSize(tileSize);
    }

    getTileAt(worldX, worldY, layer = null) {
        if (layer !== null) return this.#placedTiles.get(`${worldX},${worldY},${layer}`) || null;

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
            const keys = [];
            this.#placedTiles.forEach((_, key) => {
                const [x, y] = key.split(',').map(Number);
                if (x === worldX && y === worldY) keys.push(key);
            });
            keys.forEach(k => {
                if (removeSingle(k)) removed = true;
            });
        }
        return removed;
    }

    updateTileLayer(worldX, worldY, oldLayer, newLayer) {
        const oldKey = `${worldX},${worldY},${oldLayer}`;
        const newKey = `${worldX},${worldY},${newLayer}`;

        if (!this.#placedTiles.has(oldKey)) return false;

        if (this.#placedTiles.has(newKey)) {
            const scene = this.#engine.services.SceneService.activeScene;
            const old = this.#placedTiles.get(newKey);
            const i = scene?.wgObjects.indexOf(old) ?? -1;
            if (i > -1) scene.wgObjects.splice(i, 1);
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
        if (!this.#history.length) {
            console.log('⚠️ Rien à annuler');
            return;
        }
        const action = this.#history.pop();
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#redoHistory.push(action);
        if (this.#redoHistory.length > this.#maxHistorySize) this.#redoHistory.shift();

        this.#applyAction(action, scene, true);
        console.log('✅ Annulation effectuée');
    }

    redo() {
        if (!this.#redoHistory.length) {
            console.log('⚠️ Rien à refaire');
            return;
        }
        const action = this.#redoHistory.pop();
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#history.push(action);
        if (this.#history.length > this.#maxHistorySize) this.#history.shift();

        this.#applyAction(action, scene, false);
        console.log('✅ Action refaite');
    }

    #applyAction(action, scene, isUndo) {
        switch (action.type) {
            case 'place':
                if (isUndo) {
                    action.tiles.forEach(d => {
                        const key = `${d.x},${d.y},${d.layer}`;
                        const tile = this.#placedTiles.get(key);
                        if (tile) {
                            const i = scene.wgObjects.indexOf(tile);
                            if (i > -1) scene.wgObjects.splice(i, 1);
                            this.#placedTiles.delete(key);
                        }
                    });
                } else {
                    action.tiles.forEach(d => this.#restoreTile(d, scene));
                }
                break;

            case 'erase':
                if (isUndo) {
                    action.tiles.forEach(d => this.#restoreTile(d, scene));
                } else {
                    action.tiles.forEach(d => {
                        const key = `${d.x},${d.y},${d.layer}`;
                        const tile = this.#placedTiles.get(key);
                        if (tile) {
                            const i = scene.wgObjects.indexOf(tile);
                            if (i > -1) scene.wgObjects.splice(i, 1);
                            this.#placedTiles.delete(key);
                        }
                    });
                }
                break;

            case 'fill':
                action.tiles.forEach(d => {
                    const key = `${d.x},${d.y},${d.layer}`;
                    const current = this.#placedTiles.get(key);
                    if (current) {
                        const i = scene.wgObjects.indexOf(current);
                        if (i > -1) scene.wgObjects.splice(i, 1);
                    }

                    const sprite = isUndo ? d.oldSprite : d.sprite;
                    if (sprite) this.#restoreTile({...d, sprite}, scene);
                    else this.#placedTiles.delete(key);
                });
                break;
        }
    }

    #restoreTile(data, scene) {
        const tile = this.#createTileFromData(data);
        scene.wgObjects.push(tile);
        this.#placedTiles.set(`${data.x},${data.y},${data.layer}`, tile);
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
            const assetsPanel = document.getElementById('assets-panel');
            if (assetsPanel?.contains(e.target)) return;

            if (isDrawing && this.#currentTileData) {
                const editMode = this.#getEditMode();
                if (editMode === 'brush') {
                    const d = this.#drawTileAtPosition(e.clientX, e.clientY);
                    if (d) currentActionTiles.push(d);
                } else if (editMode === 'eraser') {
                    const d = this.#eraseTile(e.clientX, e.clientY, true);
                    if (d) currentActionTiles.push(d);
                }
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (this.#getMode() !== 'construction') return;
            if (e.button !== 0) return;

            const target = e.target;
            const assetsPanel = document.getElementById('assets-panel');

            if (
                ['SELECT', 'OPTION', 'INPUT', 'BUTTON'].includes(target.tagName) ||
                target.closest('select') || target.closest('button') || target.closest('input') ||
                assetsPanel?.contains(target)
            ) return;

            e.preventDefault();
            currentActionTiles = [];

            const editMode = this.#getEditMode();

            if (editMode === 'brush') {
                isDrawing = true;
                if (this.#currentTileData) {
                    const d = this.#drawTileAtPosition(e.clientX, e.clientY);
                    if (d) currentActionTiles.push(d);
                } else {
                    console.warn('🖌️ Sélectionnez d\'abord une tile');
                }
            } else if (editMode === 'eraser') {
                isDrawing = true;
                const d = this.#eraseTile(e.clientX, e.clientY, true);
                if (d) currentActionTiles.push(d);
            } else if (editMode === 'fill') {
                this.#fillArea(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDrawing) {
                isDrawing = false;
                this.#lastBrushPosition = null;

                const editMode = this.#getEditMode();
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

        const sm = tile.components.SpriteModel;
        sm.sprite = new Image();
        sm.sprite.src = data.sprite;
        sm.size.Width = 27;
        sm.size.Height = 27;
        sm.enabled = true;

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

        const activeLayer = parseInt(document.getElementById('active-layer-select')?.value ?? '0');
        const tileShouldBeSolid = document.getElementById('tile-solid-select')?.value === 'true';
        const posKey = `${snappedPos.x},${snappedPos.y},${activeLayer}`;

        if (this.#placedTiles.has(posKey)) {
            const old = this.#placedTiles.get(posKey);
            const i = scene.wgObjects.indexOf(old);
            if (i > -1) scene.wgObjects.splice(i, 1);
        }

        const newTile = this.#createTileFromData({
            x: snappedPos.x,
            y: snappedPos.y,
            sprite: this.#currentTileData.path,
            isSolid: tileShouldBeSolid,
            layer: activeLayer
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

        const activeLayer = parseInt(document.getElementById('active-layer-select')?.value ?? '0');
        let tileData = null;

        if (returnData) {
            const tile = this.#placedTiles.get(`${snappedPos.x},${snappedPos.y},${activeLayer}`);
            if (tile) tileData = {
                x: snappedPos.x,
                y: snappedPos.y,
                layer: activeLayer,
                sprite: tile.components.SpriteModel.sprite.src,
                isSolid: tile.isSolid ?? false,
                isTeleporter: tile.isTeleporter ?? false,
                teleportData: tile.teleportData ?? null
            };
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
        const activeLayer = parseInt(document.getElementById('active-layer-select')?.value ?? '0');
        const tileShouldBeSolid = document.getElementById('tile-solid-select')?.value === 'true';

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
                x: pos.x,
                y: pos.y,
                layer: activeLayer,
                oldSprite: currentSprite,
                sprite: this.#currentTileData.path,
                isSolid: currentTile?.isSolid ?? false
            });

            if (currentTile) {
                const i = scene.wgObjects.indexOf(currentTile);
                if (i > -1) scene.wgObjects.splice(i, 1);
            }

            const newTile = this.#createTileFromData({
                x: pos.x,
                y: pos.y,
                sprite: this.#currentTileData.path,
                isSolid: tileShouldBeSolid,
                layer: activeLayer
            });
            newTile.isGhost = false;
            scene.wgObjects.push(newTile);
            this.#placedTiles.set(posKey, newTile);
            tilesPlaced++;

            queue.push({x: pos.x + 27, y: pos.y}, {x: pos.x - 27, y: pos.y}, {x: pos.x, y: pos.y + 27}, {
                x: pos.x,
                y: pos.y - 27
            });
        }

        if (fillHistory.length > 0) this.#addToHistory('fill', fillHistory);
        console.log(`🪣 Remplissage : ${tilesPlaced} tiles`);
    }
}

export {TileDragService};
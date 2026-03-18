import { Tile } from '../../WebGameObjects/Tile.js';

class MapService {
    #engine = null;
    #placedTiles = new Map(); // Stocke les tuiles placées par coordonnées "x,y,layer"

    constructor() {
    }

    initialize(engine) {
        this.#engine = engine;
    }

    /**
     * Charge une map depuis le serveur
     */
    async loadMapFromServer(mapName = 'default_map') {
        try {
            // ÉTAPE 1: Charger les métadonnées pour obtenir la taille
            const metaRes = await fetch(`/api/map-metadata?name=${encodeURIComponent(mapName)}`);
            const metadata = await metaRes.json();
            const mapSize = metadata.size || 50;

            // ÉTAPE 2: Appliquer la taille
            if (this.#engine.services.Renderer) {
                this.#engine.services.Renderer.setGridSize(mapSize);
            }

            // ÉTAPE 3: Charger les tiles
            const res = await fetch(`/api/load-map?name=${encodeURIComponent(mapName)}`);
            const mapData = await res.json();

            // ÉTAPE 4: Charger les données
            this.loadMapData(mapData);

            console.log(`✅ Map "${mapName}" chargée: ${mapData.length} tuiles (${mapSize}×${mapSize})`);
        } catch (err) {
            console.error('❌ Erreur lors du chargement de la map:', err);
        }
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

            tile.isSolid = data.isSolid !== undefined ? data.isSolid : false;
            tile.layer = data.layer !== undefined ? data.layer : 0;

            if (data.isTeleporter) {
                tile.isTeleporter = true;
                tile.teleportData = data.teleportData || { map: '', x: 0, y: 0 };
                tile.isSolid = false;
            }

            if (data.hasInteraction) {
                tile.hasInteraction = true;
                tile.interactionText = data.interactionText || '';
            }

            if (tile.components.BoxCollider) {
                tile.components.BoxCollider.enabled = tile.isSolid;
            }

            scene.wgObjects.push(tile);
            this.#placedTiles.set(`${data.x},${data.y},${tile.layer}`, tile);
        });
    }

    /**
     * Exporte les données de la map
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
                layer: layer !== undefined ? layer : 0,
            };

            if (tile.isTeleporter) {
                tileData.isTeleporter = true;
                tileData.teleportData = tile.teleportData || { map: '', x: 0, y: 0 };
            }

            if (tile.hasInteraction) {
                tileData.hasInteraction = true;
                tileData.interactionText = tile.interactionText || '';
            }

            mapData.push(tileData);
        });

        return mapData;
    }

    saveMap(mapName) {
        const title = mapName || window.currentMapName || 'default_map';
        const mapData = this.exportMapData();

        fetch('/api/save-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapData, mapName: title })
        })
        .then(res => res.json())
        .then(data => console.log(`✅ ${data.message}`))
        .catch(err => console.error('❌ Erreur sauvegarde:', err));
    }

    // Méthodes de manipulation de tuiles pour TileDragService

    addTile(tile, x, y, layer = 0) {
        const key = `${x},${y},${layer}`;
        this.#placedTiles.set(key, tile);
        this.#engine.services.SceneService.activeScene.addWGObject(tile);
    }

    removeTile(x, y, layer = 0) {
        const key = `${x},${y},${layer}`;
        const tile = this.#placedTiles.get(key);
        if (tile) {
            const scene = this.#engine.services.SceneService.activeScene;
            const index = scene.wgObjects.indexOf(tile);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
            this.#placedTiles.delete(key);
            return true;
        }
        return false;
    }

    getTileAt(x, y, layer = null) {
        if (layer !== null) {
            return this.#placedTiles.get(`${x},${y},${layer}`);
        }
        // Retourne toutes les tiles à x,y
        const tiles = [];
        this.#placedTiles.forEach((tile, key) => {
            const [qx, qy] = key.split(',').map(Number);
            if (qx === x && qy === y) tiles.push(tile);
        });
        return tiles;
    }

    get placedTiles() {
        return this.#placedTiles;
    }
}

export { MapService };


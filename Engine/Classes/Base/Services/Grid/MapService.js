import {Tile} from '../../WebGameObjects/Tile.js';

/**
 * MapService — chargement, sauvegarde et état des tuiles placées.
 */
class MapService {
    #engine = null;
    #placedTiles = null;
    #currentMapName = 'default_map';

    /**
     * @param {Engine} engine
     * @param {Map<string, Tile>} placedTilesRef - Référence partagée avec TileDragService
     */
    initialize(engine, placedTilesRef) {
        this.#engine = engine;
        this.#placedTiles = placedTilesRef;
    }

    get currentMapName() {
        return this.#currentMapName;
    }

    gridBounds = null;

    // -------------------------------------------------------------------------
    // Chargement
    // -------------------------------------------------------------------------

    async loadMapFromServer(mapName = 'default_map') {
        try {
            this.#currentMapName = mapName;

            const metaRes = await fetch(`/api/map-metadata?name=${encodeURIComponent(mapName)}`);
            const metadata = await metaRes.json();
            const mapSize = metadata.size || 50;

            this.#applyGridSize(mapSize);

            const res = await fetch(`/api/load-map?name=${encodeURIComponent(mapName)}`);
            const mapData = await res.json();

            this.#loadMapData(mapData);

            console.log(`✅ Map "${mapName}" chargée : ${mapData.length} tuiles (${mapSize}×${mapSize})`);
        } catch (err) {
            console.error('❌ Erreur lors du chargement de la map:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Sauvegarde
    // -------------------------------------------------------------------------

    saveMap() {
        const mapData = this.exportMapData();

        fetch('/api/save-map', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({mapData, mapName: this.#currentMapName}),
        })
            .then(res => res.json())
            .then(data => console.log(`✅ ${data.message} (${data.tileCount} tuiles)`))
            .catch(err => console.error('❌ Erreur sauvegarde:', err));
    }

    exportMapData() {
        const mapData = [];

        this.#placedTiles.forEach((tile, posKey) => {
            const [x, y, layer] = posKey.split(',').map(Number);
            const spriteModel = tile.components.SpriteModel;

            const tileData = {
                x,
                y,
                sprite: spriteModel.sprite.src,
                isSolid: tile.isSolid ?? false,
                layer: layer ?? 0,
            };

            if (tile.isTeleporter) {
                tileData.isTeleporter = true;
                tileData.teleportData = tile.teleportData || {map: '', x: 0, y: 0};
            }

            mapData.push(tileData);
        });

        return mapData;
    }

    // -------------------------------------------------------------------------
    // Privé
    // -------------------------------------------------------------------------

    #loadMapData(mapData) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#placedTiles.forEach((tile) => {
            const index = scene.wgObjects.indexOf(tile);
            if (index > -1) scene.wgObjects.splice(index, 1);
        });
        this.#placedTiles.clear();

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

            tile.isSolid = data.isSolid ?? false;
            tile.layer = data.layer ?? 0;

            if (data.isTeleporter) {
                tile.isTeleporter = true;
                tile.teleportData = data.teleportData || {map: '', x: 0, y: 0};
                tile.isSolid = false;
            }

            if (tile.components.BoxCollider) {
                tile.components.BoxCollider.enabled = tile.isSolid;
            }

            scene.wgObjects.push(tile);
            this.#placedTiles.set(`${data.x},${data.y},${tile.layer}`, tile);
        });

        console.log(`${mapData.length} tuiles chargées`);
    }

    #applyGridSize(tileSize) {
        const halfSize = Math.floor(tileSize / 2);
        const cellSize = 27;

        this.gridBounds = {
            minX: -cellSize * halfSize,
            minY: -cellSize * halfSize,
            maxX: cellSize * halfSize,
            maxY: cellSize * halfSize,
        };

        this.#engine.setGridSize(tileSize);

        console.log(`📐 Taille de grille appliquée: ${tileSize}×${tileSize}`);
    }
}

export {MapService};
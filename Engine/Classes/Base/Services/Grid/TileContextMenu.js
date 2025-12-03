import { GridSnapHelper } from './GridSnapHelper.js';

/**
 * TileContextMenu - Gère le menu contextuel (clic droit) sur les tuiles
 *
 * Permet de :
 * - Afficher un menu au clic droit sur une tuile placée
 * - Basculer entre solide/vide (activation du collider)
 * - Sauvegarder automatiquement les changements
 */
class TileContextMenu {
    #tileDragService;
    #gridSnapHelper;
    #canvas;
    #menuElement;
    #currentTile = null;
    #currentPosition = null;

    constructor(tileDragService, canvas) {
        this.#tileDragService = tileDragService;
        this.#canvas = canvas;
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
        this.#menuElement = document.getElementById('tile-context-menu');

        this.#setupEventListeners();
    }

    /**
     * Configure les événements
     */
    #setupEventListeners() {
        // Clic droit sur le canvas
        this.#canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            this.#handleContextMenu(e);
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!this.#menuElement.contains(e.target)) {
                this.#hideMenu();
            }
        });

        // Bouton toggle solid
        document.getElementById('menu-toggle-solid').addEventListener('click', () => {
            this.#toggleSolid();
        });

        // Bouton supprimer
        document.getElementById('menu-delete-tile').addEventListener('click', () => {
            this.#deleteTile();
        });

        // Sélecteur de layer
        document.getElementById('menu-layer-select').addEventListener('change', (e) => {
            this.#changeLayer(parseInt(e.target.value));
        });

        // Fermer le menu avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.#hideMenu();
            }
        });
    }

    /**
     * Gère le clic droit sur le canvas
     */
    #handleContextMenu(e) {
        // Récupérer la scène via l'engine global
        const engine = window.engineInstance;
        if (!engine) return;

        const scene = engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        // Convertir la position de la souris en coordonnées monde
        const worldPos = this.#gridSnapHelper.screenToWorld(
            e.clientX,
            e.clientY,
            scene.activeCamera,
            this.#canvas
        );

        // Snapper sur la grille pour trouver la tuile
        const snappedPos = this.#gridSnapHelper.snapToGrid(worldPos.x, worldPos.y);

        // Chercher une tuile à cette position
        const tile = this.#findTileAt(snappedPos.x, snappedPos.y);

        if (tile) {
            this.#currentTile = tile;
            this.#currentPosition = { x: snappedPos.x, y: snappedPos.y };
            this.#showMenu(e.clientX, e.clientY, tile);
        } else {
            this.#hideMenu();
        }
    }

    /**
     * Cherche une tuile à une position donnée
     */
    #findTileAt(worldX, worldY) {
        return this.#tileDragService.getTileAt(worldX, worldY);
    }

    /**
     * Affiche le menu contextuel
     */
    #showMenu(x, y, tile) {
        // Mettre à jour l'état du checkbox
        const isSolid = tile.isSolid || false;
        const iconElement = document.getElementById('menu-solid-icon');
        iconElement.textContent = isSolid ? '☑' : '☐';

        // Mettre à jour le layer sélectionné
        const layerSelect = document.getElementById('menu-layer-select');
        layerSelect.value = tile.layer !== undefined ? tile.layer : 0;

        // Mettre à jour la position affichée
        document.getElementById('menu-tile-pos').textContent =
            `Position: (${this.#currentPosition.x}, ${this.#currentPosition.y})`;

        // Positionner le menu
        this.#menuElement.style.left = `${x}px`;
        this.#menuElement.style.top = `${y}px`;
        this.#menuElement.classList.remove('hidden');

        // Ajuster si le menu dépasse de l'écran
        const rect = this.#menuElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.#menuElement.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.#menuElement.style.top = `${y - rect.height}px`;
        }
    }

    /**
     * Cache le menu contextuel
     */
    #hideMenu() {
        this.#menuElement.classList.add('hidden');
        this.#currentTile = null;
        this.#currentPosition = null;
    }

    /**
     * Bascule l'état solide/vide de la tuile
     */
    #toggleSolid() {
        if (!this.#currentTile) return;

        // Inverser l'état
        const newState = !(this.#currentTile.isSolid || false);
        this.#currentTile.isSolid = newState;

        // Activer/désactiver le collider
        if (this.#currentTile.components.BoxCollider) {
            this.#currentTile.components.BoxCollider.enabled = newState;
        }

        console.log(`Tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y}) : ${newState ? '🧱 SOLIDE (Mur)' : '⬜ VIDE (Passage)'}`);

        // Mettre à jour l'icône
        const iconElement = document.getElementById('menu-solid-icon');
        iconElement.textContent = newState ? '☑' : '☐';

        // Sauvegarder automatiquement via la méthode publique
        this.#tileDragService.saveMap();
    }

    /**
     * Supprime la tuile actuelle
     */
    #deleteTile() {
        if (!this.#currentTile || !this.#currentPosition) return;

        // Supprimer via le service
        const deleted = this.#tileDragService.removeTileAt(
            this.#currentPosition.x,
            this.#currentPosition.y
        );

        if (deleted) {
            console.log(`🗑️ Tuile supprimée à (${this.#currentPosition.x}, ${this.#currentPosition.y})`);
        }

        // Fermer le menu
        this.#hideMenu();
    }

    /**
     * Change le layer de la tuile actuelle
     */
    #changeLayer(newLayer) {
        if (!this.#currentTile) return;

        const layerNames = ['🟫 Plan Sol (Derrière)', '🧱 Plan Murs/Déco (Milieu)', '🎨 Plan Sprites (Devant)'];

        // Mettre à jour le layer
        this.#currentTile.layer = newLayer;

        // Layer 1 (Murs/Déco) : peut être solide ou non selon le checkbox
        // On ne change pas automatiquement isSolid ici
        // L'utilisateur peut cocher "Solide" manuellement si c'est un mur

        // Appliquer l'état du collider selon isSolid (peu importe le layer)
        if (this.#currentTile.components.BoxCollider) {
            this.#currentTile.components.BoxCollider.enabled = this.#currentTile.isSolid || false;
        }

        console.log(`📐 Tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y}) → ${layerNames[newLayer]}`);

        // Sauvegarder automatiquement
        this.#tileDragService.saveMap();
    }
}

export { TileContextMenu };


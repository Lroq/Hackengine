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
    #isDrawing = false; // Tracking si on est en train de dessiner/effacer
    #rightClickStartTime = 0; // Timestamp du début du clic droit

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
        // Menu contextuel désactivé : le clic droit sert maintenant à déplacer la caméra
        // Le clic gauche est utilisé pour dessiner/effacer/remplir

        // Tracker le début du clic gauche (mousedown)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.#isDrawing = false;
                this.#rightClickStartTime = Date.now();
            }
        });

        // Tracker le mouvement de la souris (si on bouge = dessin)
        document.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // Clic gauche maintenu
                this.#isDrawing = true;
            }
        });

        // Clic gauche sur le canvas avec menu contextuel
        // Note : Pour l'instant désactivé car on privilégie le dessin direct
        // Le menu contextuel pourrait être réactivé avec un autre raccourci si nécessaire
        /*
        this.#canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            // Vérifier le mode d'édition
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            // Calculer la durée du clic
            const clickDuration = Date.now() - this.#rightClickStartTime;

            // N'afficher le menu QUE si :
            // 1. On n'a pas bougé (pas de dessin)
            // 2. Le clic est court (< 200ms = clic simple)
            // 3. On n'est PAS en mode pot de peinture (le pot utilise le clic droit)
            if (!this.#isDrawing && clickDuration < 200 && editMode !== 'fill') {
                this.#handleContextMenu(e);
            }

            // Réinitialiser l'état
            this.#isDrawing = false;
        });
        */

        // Réinitialiser l'état au relâchement du clic gauche
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.#isDrawing = false;
            }
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

        // Bouton toggle teleport
        document.getElementById('menu-toggle-teleport').addEventListener('click', () => {
            this.#toggleTeleport();
        });

        // Champs de téléportation
        document.getElementById('menu-teleport-map').addEventListener('input', (e) => {
            this.#updateTeleportData('map', e.target.value);
        });

        document.getElementById('menu-teleport-x').addEventListener('input', (e) => {
            this.#updateTeleportData('x', parseFloat(e.target.value) || 0);
        });

        document.getElementById('menu-teleport-y').addEventListener('input', (e) => {
            this.#updateTeleportData('y', parseFloat(e.target.value) || 0);
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
     * Si plusieurs tiles existent (différents layers), retourne celle du layer le plus élevé
     */
    #findTileAt(worldX, worldY) {
        const tiles = this.#tileDragService.getTileAt(worldX, worldY);

        if (!tiles) return null;

        // Si c'est un tableau (plusieurs tiles), retourner celle avec le layer le plus élevé
        if (Array.isArray(tiles)) {
            if (tiles.length === 0) return null;
            if (tiles.length === 1) return tiles[0];

            // Trier par layer décroissant et retourner le premier
            return tiles.sort((a, b) => (b.layer || 0) - (a.layer || 0))[0];
        }

        // Si c'est une seule tile
        return tiles;
    }

    /**
     * Affiche le menu contextuel
     */
    #showMenu(x, y, tile) {
        // Mettre à jour l'état du checkbox solide
        const isSolid = tile.isSolid || false;
        const iconElement = document.getElementById('menu-solid-icon');
        iconElement.textContent = isSolid ? '☑' : '☐';

        // Mettre à jour l'état du téléporteur
        const isTeleporter = tile.isTeleporter || false;
        const teleportIcon = document.getElementById('menu-teleport-icon');
        teleportIcon.textContent = isTeleporter ? '☑' : '☐';

        // Afficher/masquer les paramètres de téléportation
        const teleportSettings = document.getElementById('teleport-settings');
        if (isTeleporter) {
            teleportSettings.classList.remove('hidden');

            // Remplir les champs avec les données existantes
            const teleportData = tile.teleportData || { map: '', x: 0, y: 0 };
            document.getElementById('menu-teleport-map').value = teleportData.map || '';
            document.getElementById('menu-teleport-x').value = teleportData.x || 0;
            document.getElementById('menu-teleport-y').value = teleportData.y || 0;
        } else {
            teleportSettings.classList.add('hidden');
        }

        // Mettre à jour le layer sélectionné
        const layerSelect = document.getElementById('menu-layer-select');
        layerSelect.value = tile.layer !== undefined ? tile.layer : 0;

        // Compter combien de layers sont présents à cette position
        const allTilesAtPos = this.#tileDragService.getTileAt(this.#currentPosition.x, this.#currentPosition.y);
        const layerCount = Array.isArray(allTilesAtPos) ? allTilesAtPos.length : 1;
        const currentLayer = tile.layer !== undefined ? tile.layer : 0;

        // Mettre à jour la position affichée avec info sur les layers
        const layerInfo = layerCount > 1 ? ` | Layer ${currentLayer} (${layerCount} layers)` : ` | Layer ${currentLayer}`;
        document.getElementById('menu-tile-pos').textContent =
            `Position: (${this.#currentPosition.x}, ${this.#currentPosition.y})${layerInfo}`;

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
    }

    /**
     * Bascule l'état téléporteur de la tuile
     */
    #toggleTeleport() {
        if (!this.#currentTile) return;

        // Inverser l'état
        const newState = !(this.#currentTile.isTeleporter || false);
        this.#currentTile.isTeleporter = newState;

        // Initialiser les données de téléportation si activé
        if (newState && !this.#currentTile.teleportData) {
            this.#currentTile.teleportData = {
                map: '',
                x: 0,
                y: 0
            };
        }

        // IMPORTANT: Désactiver le collider pour les téléporteurs (sinon le joueur est bloqué)
        if (newState) {
            this.#currentTile.isSolid = false;
            if (this.#currentTile.components.BoxCollider) {
                this.#currentTile.components.BoxCollider.enabled = false;
            }
        }

        console.log(`Tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y}) : ${newState ? '🌀 TÉLÉPORTEUR' : '⬜ Normal'}`);

        // Mettre à jour l'icône
        const teleportIcon = document.getElementById('menu-teleport-icon');
        teleportIcon.textContent = newState ? '☑' : '☐';

        // Afficher/masquer les paramètres
        const teleportSettings = document.getElementById('teleport-settings');
        if (newState) {
            teleportSettings.classList.remove('hidden');
            // Remplir les champs avec les valeurs actuelles
            const data = this.#currentTile.teleportData;
            document.getElementById('menu-teleport-map').value = data.map || '';
            document.getElementById('menu-teleport-x').value = data.x || 0;
            document.getElementById('menu-teleport-y').value = data.y || 0;
        } else {
            teleportSettings.classList.add('hidden');
        }
    }

    /**
     * Met à jour les données de téléportation
     */
    #updateTeleportData(field, value) {
        if (!this.#currentTile || !this.#currentTile.isTeleporter) return;

        // Initialiser teleportData si nécessaire
        if (!this.#currentTile.teleportData) {
            this.#currentTile.teleportData = { map: '', x: 0, y: 0 };
        }

        // Mettre à jour le champ
        this.#currentTile.teleportData[field] = value;

        console.log(`🌀 Téléporteur à (${this.#currentPosition.x}, ${this.#currentPosition.y}) → ${field}: ${value}`);
    }

    /**
     * Supprime la tuile actuelle
     */
    #deleteTile() {
        if (!this.#currentTile || !this.#currentPosition) return;

        const tileLayer = this.#currentTile.layer || 0;

        // Supprimer uniquement le layer de cette tuile
        const deleted = this.#tileDragService.removeTileAt(
            this.#currentPosition.x,
            this.#currentPosition.y,
            tileLayer
        );

        if (deleted) {
            console.log(`🗑️ Tuile supprimée à (${this.#currentPosition.x}, ${this.#currentPosition.y}) sur layer ${tileLayer}`);
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
        const oldLayer = this.#currentTile.layer || 0;

        // Si le layer n'a pas changé, ne rien faire
        if (oldLayer === newLayer) return;

        // Utiliser la méthode du service pour changer le layer
        const success = this.#tileDragService.updateTileLayer(
            this.#currentPosition.x,
            this.#currentPosition.y,
            oldLayer,
            newLayer
        );

        if (!success) {
            console.error(`Échec du changement de layer`);
            return;
        }

        // Layer 1 (Murs/Déco) : peut être solide ou non selon le checkbox
        // On ne change pas automatiquement isSolid ici
        // L'utilisateur peut cocher "Solide" manuellement si c'est un mur

        // Appliquer l'état du collider selon isSolid (peu importe le layer)
        if (this.#currentTile.components.BoxCollider) {
            this.#currentTile.components.BoxCollider.enabled = this.#currentTile.isSolid || false;
        }

        console.log(`📐 Tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y}) → ${layerNames[newLayer]}`);
    }
}

export { TileContextMenu };


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
        // Alt+Clic gauche sur le canvas - afficher le menu contextuel sur les tiles placées
        this.#canvas.addEventListener('click', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            // Vérifier si Alt est pressé
            if (e.altKey) {
                console.log('📋 Alt+Clic détecté');
                e.preventDefault();
                this.#handleContextMenu(e);
            }
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!this.#menuElement.contains(e.target) && !e.altKey) {
                this.#hideMenu();
            }
        });

        // Bouton de fermeture du menu contextuel
        const closeTileMenuBtn = document.getElementById('close-tile-menu-btn');
        if (closeTileMenuBtn) {
            closeTileMenuBtn.addEventListener('click', () => {
                this.#hideMenu();
            });
        }

        // Bouton toggle téléporteur
        const toggleTeleportBtn = document.getElementById('menu-toggle-teleport');
        if (toggleTeleportBtn) {
            toggleTeleportBtn.addEventListener('click', () => {
                this.#toggleTeleport();
            });
        }

        // Bouton supprimer
        const deleteBtn = document.getElementById('menu-delete-tile');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.#deleteTile();
            });
        }

        // Inputs de téléportation
        const teleportMapInput = document.getElementById('menu-teleport-map');
        const teleportXInput = document.getElementById('menu-teleport-x');
        const teleportYInput = document.getElementById('menu-teleport-y');

        if (teleportMapInput) {
            teleportMapInput.addEventListener('change', () => {
                if (this.#currentTile && this.#currentTile.isTeleporter) {
                    this.#currentTile.teleportData.map = teleportMapInput.value;
                    this.#tileDragService.saveMap();
                }
            });
        }

        if (teleportXInput) {
            teleportXInput.addEventListener('change', () => {
                if (this.#currentTile && this.#currentTile.isTeleporter) {
                    // Multiplier par 27 pour se caler sur la grille
                    const tileX = parseInt(teleportXInput.value) || 0;
                    this.#currentTile.teleportData.x = tileX * 27;
                    this.#tileDragService.saveMap();
                    console.log(`📍 Coordonnée X téléporteur: ${tileX} tiles → ${tileX * 27} pixels`);
                }
            });
        }

        if (teleportYInput) {
            teleportYInput.addEventListener('change', () => {
                if (this.#currentTile && this.#currentTile.isTeleporter) {
                    // Multiplier par 27 pour se caler sur la grille
                    const tileY = parseInt(teleportYInput.value) || 0;
                    this.#currentTile.teleportData.y = tileY * 27;
                    this.#tileDragService.saveMap();
                    console.log(`📍 Coordonnée Y téléporteur: ${tileY} tiles → ${tileY * 27} pixels`);
                }
            });
        }

        // Bouton pour copier les coordonnées actuelles du sprite
        const copySpriteCoords = document.getElementById('copy-sprite-coords-btn');
        if (copySpriteCoords) {
            copySpriteCoords.addEventListener('click', () => {
                this.#copySpriteCoordinates();
            });
        }

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
        console.log('📋 handleContextMenu appelé');

        // Récupérer la scène via l'engine global
        const engine = window.engineInstance;
        if (!engine) {
            console.warn('⚠️ Engine non disponible');
            return;
        }

        const scene = engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) {
            console.warn('⚠️ Scène ou caméra non disponible');
            return;
        }

        // Convertir la position de la souris en coordonnées monde
        const worldPos = this.#gridSnapHelper.screenToWorld(
            e.clientX,
            e.clientY,
            scene.activeCamera,
            this.#canvas
        );

        // Snapper sur la grille pour trouver la tuile
        const snappedPos = this.#gridSnapHelper.snapToGrid(worldPos.x, worldPos.y);
        console.log(`🎯 Position snappée: (${snappedPos.x}, ${snappedPos.y})`);

        // Chercher une tuile à cette position
        const tile = this.#findTileAt(snappedPos.x, snappedPos.y);

        if (tile) {
            console.log('🔍 Tile trouvée:', tile);
            this.#currentTile = tile;
            this.#currentPosition = { x: snappedPos.x, y: snappedPos.y };
            this.#showMenu(e.clientX, e.clientY, tile);
        } else {
            console.log('❌ Aucune tile à cette position');
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
        console.log('✅ Affichage du menu contextuel');

        // Mettre à jour l'état du téléporteur
        const isTeleporter = tile.isTeleporter || false;
        const teleportIcon = document.getElementById('menu-teleport-icon');
        if (teleportIcon) teleportIcon.textContent = isTeleporter ? '☑' : '☐';

        // Afficher/masquer les paramètres de téléportation
        const teleportSettings = document.getElementById('teleport-settings');
        if (teleportSettings) {
            if (isTeleporter) {
                teleportSettings.classList.remove('hidden');

                // Remplir les champs avec les données existantes
                // Diviser par 27 pour afficher en coordonnées tiles au lieu de pixels
                const teleportData = tile.teleportData || { map: '', x: 0, y: 0 };
                const mapInput = document.getElementById('menu-teleport-map');
                const xInput = document.getElementById('menu-teleport-x');
                const yInput = document.getElementById('menu-teleport-y');

                if (mapInput) mapInput.value = teleportData.map || '';
                if (xInput) xInput.value = Math.round((teleportData.x || 0) / 27);
                if (yInput) yInput.value = Math.round((teleportData.y || 0) / 27);
            } else {
                teleportSettings.classList.add('hidden');
            }
        }

        // Mettre à jour la position affichée
        const posElement = document.getElementById('menu-tile-pos');
        if (posElement) {
            posElement.textContent = `Position: (${this.#currentPosition.x}, ${this.#currentPosition.y})`;
        }

        // Positionner le menu et FORCER l'affichage
        this.#menuElement.style.left = `${x}px`;
        this.#menuElement.style.top = `${y}px`;
        this.#menuElement.style.display = 'block';
        this.#menuElement.style.visibility = 'visible';
        this.#menuElement.style.opacity = '1';
        this.#menuElement.style.zIndex = '250';
        this.#menuElement.classList.remove('hidden');

        console.log('📍 Menu positionné à:', { x, y });

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
        this.#menuElement.style.display = 'none';
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

        console.log(`Layer changé de ${oldLayer} à ${newLayer} pour la tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y})`);
    }

    /**
     * Copie les coordonnées actuelles du sprite dans les champs de téléportation
     */
    #copySpriteCoordinates() {
        if (!this.#currentTile || !this.#currentTile.isTeleporter) return;

        // Récupérer le sprite du joueur
        const playerInstance = window.playerInstance;
        if (!playerInstance) {
            console.warn('⚠️ Sprite du joueur non disponible');
            return;
        }

        // Récupérer les coordonnées actuelles du sprite en pixels
        const spriteXPixels = Math.round(playerInstance.coordinates.X);
        const spriteYPixels = Math.round(playerInstance.coordinates.Y);

        // Convertir en coordonnées tiles pour l'affichage
        const spriteXTiles = Math.round(spriteXPixels / 27);
        const spriteYTiles = Math.round(spriteYPixels / 27);

        // Mettre à jour les champs (affichage en tiles)
        const xInput = document.getElementById('menu-teleport-x');
        const yInput = document.getElementById('menu-teleport-y');

        if (xInput && yInput) {
            xInput.value = spriteXTiles;
            yInput.value = spriteYTiles;

            // Mettre à jour les données du téléporteur (stockage en pixels)
            if (!this.#currentTile.teleportData) {
                this.#currentTile.teleportData = { map: '', x: 0, y: 0 };
            }
            this.#currentTile.teleportData.x = spriteXPixels;
            this.#currentTile.teleportData.y = spriteYPixels;

            // Sauvegarder
            this.#tileDragService.saveMap();

            // Feedback visuel
            const btn = document.getElementById('copy-sprite-coords-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✅</span><span>Coordonnées copiées !</span>';
            btn.classList.add('bg-green-600');
            btn.classList.remove('bg-blue-600');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600');
            }, 1500);

            console.log(`📍 Coordonnées du sprite copiées: (${spriteXTiles}, ${spriteYTiles}) tiles → (${spriteXPixels}, ${spriteYPixels}) pixels`);
        }
    }
}

export { TileContextMenu };


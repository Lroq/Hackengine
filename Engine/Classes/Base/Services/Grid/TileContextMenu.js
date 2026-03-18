import {GridSnapHelper} from './GridSnapHelper.js';

/**
 * TileContextMenu - Gère le menu contextuel (Alt+Clic) sur les tuiles en mode construction.
 */
class TileContextMenu {
    #tileDragService;
    #engine;
    #gridSnapHelper;
    #canvas;
    #menuElement;
    #currentTile = null;
    #currentPosition = null;

    constructor(tileDragService, canvas, engine) {
        this.#tileDragService = tileDragService;
        this.#canvas = canvas;
        this.#engine = engine;
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
        this.#menuElement = document.getElementById('tile-context-menu');

        this.#setupEventListeners();
    }

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    #setupEventListeners() {
        this.#canvas.addEventListener('click', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            if (e.altKey) {
                e.preventDefault();
                this.#handleContextMenu(e);
            }
        });

        // Fermer si clic ailleurs
        document.addEventListener('click', (e) => {
            if (!this.#menuElement.contains(e.target) && !e.altKey) {
                this.#hideMenu();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.#hideMenu();
        });

        // Bouton fermeture
        document.getElementById('close-tile-menu-btn')
            ?.addEventListener('click', () => this.#hideMenu());

        // Bouton de sauvegarde du menu contextuel
        const saveTileMenuBtn = document.getElementById('save-tile-menu-btn');
        if (saveTileMenuBtn) {
            saveTileMenuBtn.addEventListener('click', () => {
                this.#saveAndCloseMenu();
            });
        }

        // Bouton toggle téléporteur
        document.getElementById('menu-toggle-teleport')
            ?.addEventListener('click', () => this.#toggleTeleport());

        // Bouton supprimer
        document.getElementById('menu-delete-tile')
            ?.addEventListener('click', () => this.#deleteTile());

        // Inputs de téléportation
        document.getElementById('menu-teleport-map')?.addEventListener('change', (e) => {
            if (this.#currentTile?.isTeleporter) {
                this.#currentTile.teleportData.map = e.target.value;
                this.#tileDragService.saveMap();
            }
        });

        document.getElementById('menu-teleport-x')?.addEventListener('change', (e) => {
            if (this.#currentTile?.isTeleporter) {
                const tileX = parseInt(e.target.value) || 0;
                this.#currentTile.teleportData.x = tileX * 27;
                this.#tileDragService.saveMap();
            }
        });

        document.getElementById('menu-teleport-y')?.addEventListener('change', (e) => {
            if (this.#currentTile?.isTeleporter) {
                const tileY = parseInt(e.target.value) || 0;
                this.#currentTile.teleportData.y = tileY * 27;
                this.#tileDragService.saveMap();
        // Bouton toggle interaction
        const toggleInteractionBtn = document.getElementById('menu-toggle-interaction');
        if (toggleInteractionBtn) {
            toggleInteractionBtn.addEventListener('click', () => {
                this.#toggleInteraction();
            });
        }

        // Input texte d'interaction
        const interactionTextInput = document.getElementById('menu-interaction-text');
        if (interactionTextInput) {
            interactionTextInput.addEventListener('input', () => {
                if (this.#currentTile && this.#currentTile.hasInteraction) {
                    this.#currentTile.interactionText = interactionTextInput.value;
                    this.#tileDragService.saveMap();
                    console.log(`💬 Texte d'interaction mis à jour: "${interactionTextInput.value}"`);
                }
            });
        }

        // Fermer le menu avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.#hideMenu();
            }
        });

        // Copier les coordonnées du joueur
        document.getElementById('copy-sprite-coords-btn')
            ?.addEventListener('click', () => this.#copySpriteCoordinates());
    }

    // -------------------------------------------------------------------------
    // Gestion du menu
    // -------------------------------------------------------------------------

    #handleContextMenu(e) {
        // REFACTOR: engine injecté, plus window.engineInstance
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene?.activeCamera) {
            console.warn('⚠️ Scène ou caméra non disponible');
            return;
        }

        const worldPos = this.#gridSnapHelper.screenToWorld(e.clientX, e.clientY, scene.activeCamera, this.#canvas);
        const snappedPos = this.#gridSnapHelper.snapToGrid(worldPos.x, worldPos.y);
        const tile = this.#findTileAt(snappedPos.x, snappedPos.y);

        if (tile) {
            this.#currentTile = tile;
            this.#currentPosition = {x: snappedPos.x, y: snappedPos.y};
            this.#showMenu(e.clientX, e.clientY, tile);
        } else {
            this.#hideMenu();
        }
    }

    #findTileAt(worldX, worldY) {
        const tiles = this.#tileDragService.getTileAt(worldX, worldY);
        if (!tiles) return null;
        if (!Array.isArray(tiles)) return tiles;
        if (tiles.length === 0) return null;
        return tiles.sort((a, b) => (b.layer || 0) - (a.layer || 0))[0];
    }

    #showMenu(x, y, tile) {
        const isTeleporter = tile.isTeleporter || false;

        const teleportIcon = document.getElementById('menu-teleport-icon');
        if (teleportIcon) teleportIcon.textContent = isTeleporter ? '☑' : '☐';

        const teleportSettings = document.getElementById('teleport-settings');
        if (teleportSettings) {
            if (isTeleporter) {
                teleportSettings.classList.remove('hidden');
                const data = tile.teleportData || {map: '', x: 0, y: 0};
                const mapInput = document.getElementById('menu-teleport-map');
                const xInput = document.getElementById('menu-teleport-x');
                const yInput = document.getElementById('menu-teleport-y');
                if (mapInput) mapInput.value = data.map || '';
                if (xInput) xInput.value = Math.round((data.x || 0) / 27);
                if (yInput) yInput.value = Math.round((data.y || 0) / 27);
            } else {
                teleportSettings.classList.add('hidden');
            }
        }

        // Mettre à jour l'état de l'interaction
        const hasInteraction = tile.hasInteraction || false;
        const interactionIcon = document.getElementById('menu-interaction-icon');
        if (interactionIcon) interactionIcon.textContent = hasInteraction ? '☑' : '☐';

        // Afficher/masquer les paramètres d'interaction
        const interactionSettings = document.getElementById('interaction-settings');
        if (interactionSettings) {
            if (hasInteraction) {
                interactionSettings.classList.remove('hidden');

                // Remplir le champ texte avec la valeur existante
                const textInput = document.getElementById('menu-interaction-text');
                if (textInput) textInput.value = tile.interactionText || '';
            } else {
                interactionSettings.classList.add('hidden');
            }
        }

        // Mettre à jour la position affichée
        const posElement = document.getElementById('menu-tile-pos');
        if (posElement) {
            posElement.textContent = `Position: (${this.#currentPosition.x}, ${this.#currentPosition.y})`;
        }

        this.#menuElement.style.left = `${x}px`;
        this.#menuElement.style.top = `${y}px`;
        this.#menuElement.style.display = 'block';
        this.#menuElement.style.visibility = 'visible';
        this.#menuElement.style.opacity = '1';
        this.#menuElement.style.zIndex = '250';
        this.#menuElement.classList.remove('hidden');

        // Ajuster si le menu dépasse de l'écran
        const rect = this.#menuElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) this.#menuElement.style.left = `${x - rect.width}px`;
        if (rect.bottom > window.innerHeight) this.#menuElement.style.top = `${y - rect.height}px`;
    }

    #hideMenu() {
        this.#menuElement.style.display = 'none';
        this.#menuElement.classList.add('hidden');
        this.#currentTile = null;
        this.#currentPosition = null;
    }

    // -------------------------------------------------------------------------
    // Actions sur la tuile
    // -------------------------------------------------------------------------

    /**
     * Sauvegarde les modifications et ferme le menu contextuel
     */
    #saveAndCloseMenu() {
        // Sauvegarder la map
        this.#tileDragService.saveMap();
        console.log('💾 Tuile sauvegardée avec succès');

        // Fermer le menu
        this.#hideMenu();
    }

    /**
     * Vérifie si le menu contextuel est actuellement visible
     * @returns {boolean} - True si le menu est visible
     */
    isVisible() {
        return this.#menuElement.style.display === 'block' && !this.#menuElement.classList.contains('hidden');
    }

    /**
     * Bascule l'état solide/vide de la tuile
     */
    #toggleSolid() {
        if (!this.#currentTile) return;

        const newState = !(this.#currentTile.isSolid || false);
        this.#currentTile.isSolid = newState;

        if (this.#currentTile.components.BoxCollider) {
            this.#currentTile.components.BoxCollider.enabled = newState;
        }

        const iconElement = document.getElementById('menu-solid-icon');
        if (iconElement) iconElement.textContent = newState ? '☑' : '☐';
    }

    #toggleTeleport() {
        if (!this.#currentTile) return;

        const newState = !(this.#currentTile.isTeleporter || false);
        this.#currentTile.isTeleporter = newState;

        if (newState) {
            if (!this.#currentTile.teleportData) {
                this.#currentTile.teleportData = {map: '', x: 0, y: 0};
            }
            // Les téléporteurs ne doivent jamais être solides
            this.#currentTile.isSolid = false;
            if (this.#currentTile.components.BoxCollider) {
                this.#currentTile.components.BoxCollider.enabled = false;
            }
        }

        const teleportIcon = document.getElementById('menu-teleport-icon');
        if (teleportIcon) teleportIcon.textContent = newState ? '☑' : '☐';

        const teleportSettings = document.getElementById('teleport-settings');
        if (teleportSettings) {
            if (newState) {
                teleportSettings.classList.remove('hidden');
                const data = this.#currentTile.teleportData;
                document.getElementById('menu-teleport-map').value = data.map || '';
                document.getElementById('menu-teleport-x').value = data.x || 0;
                document.getElementById('menu-teleport-y').value = data.y || 0;
            } else {
                teleportSettings.classList.add('hidden');
            }
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
     * Bascule l'état interaction de la tuile
     */
    #toggleInteraction() {
        if (!this.#currentTile) return;

        // Inverser l'état
        const newState = !(this.#currentTile.hasInteraction || false);
        this.#currentTile.hasInteraction = newState;

        // Initialiser le texte d'interaction si activé
        if (newState && !this.#currentTile.interactionText) {
            this.#currentTile.interactionText = '';
        }

        // NOTE: Contrairement aux téléporteurs, les interactions n'affectent PAS le mode solide
        // Une tuile peut être solide ET interactive (ex: un mur avec du texte d'information)

        console.log(`Tuile à (${this.#currentPosition.x}, ${this.#currentPosition.y}) : ${newState ? '💬 INTERACTION' : '⬜ Normal'}`);

        // Mettre à jour l'icône
        const interactionIcon = document.getElementById('menu-interaction-icon');
        interactionIcon.textContent = newState ? '☑' : '☐';

        // Afficher/masquer les paramètres
        const interactionSettings = document.getElementById('interaction-settings');
        if (newState) {
            interactionSettings.classList.remove('hidden');
            // Remplir le champ avec la valeur actuelle
            const textInput = document.getElementById('menu-interaction-text');
            if (textInput) {
                textInput.value = this.#currentTile.interactionText || '';
                // Focus sur le champ pour faciliter la saisie
                textInput.focus();
            }
        } else {
            interactionSettings.classList.add('hidden');
        }

        // Sauvegarder
        this.#tileDragService.saveMap();
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
    }

    #deleteTile() {
        if (!this.#currentTile || !this.#currentPosition) return;

        const deleted = this.#tileDragService.removeTileAt(
            this.#currentPosition.x,
            this.#currentPosition.y,
            this.#currentTile.layer || 0
        );

        if (deleted) {
            console.log(`🗑️ Tuile supprimée à (${this.#currentPosition.x}, ${this.#currentPosition.y})`);
        }

        this.#hideMenu();
    }

    #changeLayer(newLayer) {
        if (!this.#currentTile) return;

        const oldLayer = this.#currentTile.layer || 0;
        if (oldLayer === newLayer) return;

        const success = this.#tileDragService.updateTileLayer(
            this.#currentPosition.x,
            this.#currentPosition.y,
            oldLayer,
            newLayer
        );

        if (!success) {
            console.error('Échec du changement de layer');
            return;
        }

        if (this.#currentTile.components.BoxCollider) {
            this.#currentTile.components.BoxCollider.enabled = this.#currentTile.isSolid || false;
        }
    }

    /**
     * Copie les coordonnées actuelles du joueur dans les champs de téléportation.
     */
    #copySpriteCoordinates() {
        if (!this.#currentTile?.isTeleporter) return;

        const scene = this.#engine.services.SceneService.activeScene;
        const player = scene?.activeCamera?.cameraSubject;

        if (!player) {
            console.warn('⚠️ Aucun cameraSubject défini sur la caméra active');
            return;
        }

        const pixelX = Math.round(player.coordinates.X);
        const pixelY = Math.round(player.coordinates.Y);
        const tileX = Math.round(pixelX / 27);
        const tileY = Math.round(pixelY / 27);

        const xInput = document.getElementById('menu-teleport-x');
        const yInput = document.getElementById('menu-teleport-y');

        if (xInput && yInput) {
            xInput.value = tileX;
            yInput.value = tileY;

            if (!this.#currentTile.teleportData) {
                this.#currentTile.teleportData = {map: '', x: 0, y: 0};
            }
            this.#currentTile.teleportData.x = pixelX;
            this.#currentTile.teleportData.y = pixelY;

            this.#tileDragService.saveMap();

            // Feedback visuel
            const btn = document.getElementById('copy-sprite-coords-btn');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<span>✅</span><span>Coordonnées copiées !</span>';
                btn.classList.replace('bg-blue-600', 'bg-green-600');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.replace('bg-green-600', 'bg-blue-600');
                }, 1500);
            }
        }
    }
}

export {TileContextMenu};
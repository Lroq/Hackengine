import { GridSnapHelper } from '../Grid/GridSnapHelper.js';
import { NPC } from '/Engine/Classes/Custom/WebGameObjects/NPC.js';

/**
 * NPCContextMenu - Menu de configuration des PNJ (Alt+Clic en mode construction)
 *
 * Permet de :
 * - Modifier le nom du PNJ
 * - Changer la sprite
 * - Editer les lignes de dialogue
 * - Configurer le mouvement (static / patrol)
 * - Ajouter/supprimer des waypoints de patrouille
 * - Supprimer le PNJ
 */
class NPCContextMenu {
    #engine = null;
    #canvas = null;
    #gridSnapHelper = null;
    #menuElement = null;
    #currentNPC = null;
    #isPlacingWaypoint = false;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
        this.#menuElement = document.getElementById('npc-context-menu');
        this.#setupEventListeners();
    }

    injectEngine(engine) {
        this.#engine = engine;
    }

    // ==========================================
    // Listeners
    // ==========================================

    #setupEventListeners() {
        // Alt+Clic pour ouvrir le menu sur un PNJ, ou Clic simple pour placer un waypoint
        this.#canvas.addEventListener('click', (e) => {
            // Si on est en train de placer un waypoint depuis le menu
            if (this.#isPlacingWaypoint && this.#currentNPC) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Bloque le placement de PNJ ou de tuiles
                this.#placeWaypointAtClick(e.clientX, e.clientY);
                return;
            }

            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;
            if (!e.altKey) return;

            e.preventDefault();
            this.#handleAltClick(e);
        }, { capture: true }); // S'exécute avant les autres events du canvas

        // Fermer en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!this.#menuElement) return;
            if (this.#isPlacingWaypoint) return; // Ne pas fermer pdt le placement
            
            if (!this.#menuElement.contains(e.target) && !e.altKey && e.target !== this.#canvas) {
                this.#hideMenu();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.#isPlacingWaypoint) {
                    this.#cancelWaypointPlacement();
                } else {
                    this.#hideMenu();
                }
            }
        });

        // --- Boutons du menu ---
        this.#bindMenuButtons();
    }

    #bindMenuButtons() {
        // Nom du PNJ
        const nameInput = document.getElementById('npc-menu-name');
        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => e.stopPropagation());
            nameInput.addEventListener('change', (e) => {
                if (this.#currentNPC) {
                    this.#currentNPC.npcName = e.target.value;
                    this.#save();
                }
            });
        }

        // Sprite (chemin / choix depuis assets)
        document.getElementById('npc-menu-sprite')?.addEventListener('change', (e) => {
            if (this.#currentNPC) {
                const path = e.target.value.trim();
                if (path) {
                    this.#currentNPC.loadSprite(path);
                    this.#currentNPC.spritePath = path;
                } else {
                    this.#currentNPC.loadSprite('/Engine/Assets/texture_not_found.png');
                    this.#currentNPC.spritePath = null;
                }
                this.#save();
            }
        });

        // Type de mouvement
        document.getElementById('npc-menu-movement')?.addEventListener('change', (e) => {
            if (this.#currentNPC) {
                this.#currentNPC.movementType = e.target.value;
                this.#updateMovementUI(e.target.value);
                this.#save();
            }
        });

        // Vitesse de mouvement
        document.getElementById('npc-menu-speed')?.addEventListener('input', (e) => {
            if (this.#currentNPC) {
                this.#currentNPC.moveSpeed = parseFloat(e.target.value) || 0.3;
                document.getElementById('npc-speed-display').textContent =
                    this.#currentNPC.moveSpeed.toFixed(1);
                this.#save();
            }
        });

        // Ajouter un waypoint
        document.getElementById('npc-add-waypoint-btn')?.addEventListener('click', () => {
            if (!this.#currentNPC) return;
            this.#enableWaypointPlacementMode();
        });

        // Vider les waypoints
        document.getElementById('npc-clear-waypoints-btn')?.addEventListener('click', () => {
            if (!this.#currentNPC) return;
            this.#currentNPC.waypoints = [];
            this.#renderWaypoints();
            this.#save();
        });

        // Dialogues
        const dialogueInput = document.getElementById('npc-menu-dialogues');
        if (dialogueInput) {
            dialogueInput.addEventListener('keydown', (e) => e.stopPropagation());
            dialogueInput.addEventListener('change', (e) => {
                if (this.#currentNPC) {
                    // Chaque ligne = un message de dialogue
                    this.#currentNPC.dialogues = e.target.value
                        .split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 0);
                    this.#save();
                }
            });
        }

        // Supprimer le PNJ
        document.getElementById('npc-menu-delete')?.addEventListener('click', () => {
            if (!this.#currentNPC) return;
            if (!confirm(`Supprimer le PNJ "${this.#currentNPC.npcName}" ?`)) return;

            const npcService = this.#getNPCService();
            if (npcService) {
                npcService.removeNPC(this.#currentNPC.npcId);
                npcService.saveNPCs();
            }
            this.#hideMenu();
        });

        // Fermer / sauvegarder
        document.getElementById('npc-menu-close')?.addEventListener('click', () => {
            this.#save();
            this.#hideMenu();
        });

        document.getElementById('npc-menu-save')?.addEventListener('click', () => {
            this.#save();
            this.#hideMenu();
        });
    }

    // ==========================================
    // Gestion du menu
    // ==========================================

    #handleAltClick(e) {
        if (!this.#engine) return;

        const scene = this.#engine.services?.SceneService?.activeScene;
        if (!scene || !scene.activeCamera) return;

        // Convertir la position de la souris en coordonnées monde
        const worldPos = this.#gridSnapHelper.screenToWorld(
            e.clientX, e.clientY,
            scene.activeCamera,
            this.#canvas
        );

        // Chercher un PNJ proche
        const npcService = this.#getNPCService();
        if (!npcService) return;

        const npc = npcService.getNPCAt(worldPos.x, worldPos.y, 40);

        if (npc) {
            this.#currentNPC = npc;
            this.#showMenu(e.clientX, e.clientY, npc);
        }
    }

    #showMenu(x, y, npc) {
        if (!this.#menuElement) {
            console.warn('⚠️ Élément #npc-context-menu introuvable dans le DOM');
            return;
        }

        // Remplir les champs
        const nameInput = document.getElementById('npc-menu-name');
        if (nameInput) nameInput.value = npc.npcName || 'PNJ';

        const spriteInput = document.getElementById('npc-menu-sprite');
        if (spriteInput) spriteInput.value = npc.spritePath || '';

        const movementSelect = document.getElementById('npc-menu-movement');
        if (movementSelect) movementSelect.value = npc.movementType || 'static';

        const speedInput = document.getElementById('npc-menu-speed');
        if (speedInput) speedInput.value = npc.moveSpeed || 0.3;
        const speedDisplay = document.getElementById('npc-speed-display');
        if (speedDisplay) speedDisplay.textContent = (npc.moveSpeed || 0.3).toFixed(1);

        const dialoguesInput = document.getElementById('npc-menu-dialogues');
        if (dialoguesInput) dialoguesInput.value = (npc.dialogues || []).join('\n');

        // Position
        const posEl = document.getElementById('npc-menu-pos');
        if (posEl) posEl.textContent = `(${npc.coordinates.X}, ${npc.coordinates.Y})`;

        this.#updateMovementUI(npc.movementType || 'static');
        this.#renderWaypoints();

        // Afficher et positionner
        this.#menuElement.style.display = 'block';
        this.#menuElement.style.visibility = 'visible';
        this.#menuElement.style.opacity = '1';
        this.#menuElement.style.zIndex = '300';
        this.#menuElement.classList.remove('hidden');
        this.#menuElement.style.left = `${x}px`;
        this.#menuElement.style.top = `${y}px`;

        // Ajustement si hors écran
        const rect = this.#menuElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.#menuElement.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.#menuElement.style.top = `${y - rect.height}px`;
        }

        console.log(`📋 Menu PNJ ouvert pour "${npc.npcName}"`);
    }

    #hideMenu() {
        if (!this.#menuElement) return;
        this.#menuElement.style.display = 'none';
        this.#menuElement.classList.add('hidden');
        this.#currentNPC = null;
        this.#cancelWaypointPlacement();
    }

    isVisible() {
        return this.#menuElement &&
            this.#menuElement.style.display === 'block' &&
            !this.#menuElement.classList.contains('hidden');
    }

    // ==========================================
    // UI helpers
    // ==========================================

    #updateMovementUI(movementType) {
        const waypointSection = document.getElementById('npc-waypoints-section');
        if (waypointSection) {
            waypointSection.style.display = movementType === 'patrol' ? 'block' : 'none';
        }
    }

    #renderWaypoints() {
        const list = document.getElementById('npc-waypoints-list');
        if (!list || !this.#currentNPC) return;

        list.innerHTML = '';

        if (this.#currentNPC.waypoints.length === 0) {
            list.innerHTML = '<div style="color:#666;font-size:11px;padding:4px;">Aucun waypoint</div>';
            return;
        }

        this.#currentNPC.waypoints.forEach((wp, i) => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex;align-items:center;gap:6px;padding:2px 0;';
            item.innerHTML = `
                <span style="color:#00ff41;font-size:11px;">📍 W${i + 1}: (${wp.x}, ${wp.y})</span>
                <button data-idx="${i}" style="
                    background:#dc2626;color:white;border:none;
                    border-radius:3px;padding:1px 5px;font-size:10px;cursor:pointer;
                ">✕</button>
            `;
            item.querySelector('button').addEventListener('click', () => {
                this.#currentNPC.waypoints.splice(i, 1);
                this.#renderWaypoints();
                this.#save();
            });
            list.appendChild(item);
        });
    }

    #enableWaypointPlacementMode() {
        if (!this.#currentNPC) return;
        this.#isPlacingWaypoint = true;
        if (this.#canvas) this.#canvas.style.cursor = 'crosshair';
        
        const btn = document.getElementById('npc-add-waypoint-btn');
        if (btn) btn.textContent = '📍 Ciblez sur la map (Echap=Annuler)';
        
        // Rendre le menu semi-transparent pour y voir plus clair
        if (this.#menuElement) this.#menuElement.style.opacity = '0.5';
    }

    #cancelWaypointPlacement() {
        this.#isPlacingWaypoint = false;
        if (this.#canvas) this.#canvas.style.cursor = 'grab'; // Check if we should restore it nicely
        
        const btn = document.getElementById('npc-add-waypoint-btn');
        if (btn) btn.textContent = '➕ Ajouter Waypoint';
        
        if (this.#menuElement) this.#menuElement.style.opacity = '1';
    }

    #placeWaypointAtClick(screenX, screenY) {
        const scene = this.#engine?.services?.SceneService?.activeScene;
        if (!scene || !scene.activeCamera) return;

        const snapped = this.#gridSnapHelper.screenToGridSnap(
            screenX, screenY,
            scene.activeCamera,
            this.#canvas
        );

        this.#currentNPC.waypoints.push({ x: snapped.x, y: snapped.y });
        this.#renderWaypoints();
        this.#save();

        console.log(`📍 Waypoint ajouté: (${snapped.x}, ${snapped.y})`);

        this.#cancelWaypointPlacement(); // Retour au mode normal
    }

    #save() {
        const npcService = this.#getNPCService();
        if (npcService) npcService.saveNPCs();
    }

    #getNPCService() {
        return this.#engine?.services?.NPCService || window.npcService || null;
    }
}

export { NPCContextMenu };

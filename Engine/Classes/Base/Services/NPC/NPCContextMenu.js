import { GridSnapHelper } from '../Grid/GridSnapHelper.js';
import { NPC } from '/Engine/Classes/Custom/WebGameObjects/NPC.js';

/**
 * NPCContextMenu - Menu de configuration des PNJ (Alt+Clic en mode construction)
 *
 * Permet de :
 * - Modifier le nom du PNJ
 * - Changer la sprite
 * - Editer les lignes de dialogue
 * - Configurer le mouvement (static / patrol / wander)
 * - Ajouter/supprimer des waypoints de patrouille
 * - Supprimer le PNJ
 */
class NPCContextMenu {
    #engine = null;
    #canvas = null;
    #gridSnapHelper = null;
    #menuElement = null;
    #currentNPC = null;

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
        // Alt+Clic pour ouvrir le menu sur un PNJ
        this.#canvas.addEventListener('click', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;
            if (!e.altKey) return;

            e.preventDefault();
            this.#handleAltClick(e);
        });

        // Fermer en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!this.#menuElement) return;
            if (!this.#menuElement.contains(e.target) && !e.altKey) {
                this.#hideMenu();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.#hideMenu();
        });

        // --- Boutons du menu ---
        this.#bindMenuButtons();
    }

    #bindMenuButtons() {
        // Nom du PNJ
        document.getElementById('npc-menu-name')?.addEventListener('input', (e) => {
            if (this.#currentNPC) {
                this.#currentNPC.npcName = e.target.value;
                this.#save();
            }
        });

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
            this.#addCurrentPositionAsWaypoint();
        });

        // Vider les waypoints
        document.getElementById('npc-clear-waypoints-btn')?.addEventListener('click', () => {
            if (!this.#currentNPC) return;
            this.#currentNPC.waypoints = [];
            this.#renderWaypoints();
            this.#save();
        });

        // Dialogues
        document.getElementById('npc-menu-dialogues')?.addEventListener('input', (e) => {
            if (this.#currentNPC) {
                // Chaque ligne = un message de dialogue
                this.#currentNPC.dialogues = e.target.value
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0);
                this.#save();
            }
        });

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

    #addCurrentPositionAsWaypoint() {
        if (!this.#currentNPC) return;

        // Utiliser la position actuelle du joueur comme waypoint de référence
        // ou demander les coordonnées à l'utilisateur
        const scene = this.#engine?.services?.SceneService?.activeScene;
        let x = this.#currentNPC.coordinates.X;
        let y = this.#currentNPC.coordinates.Y;

        const input = prompt(
            `Coordonnées du waypoint (format: x,y)\nPosition actuelle du PNJ: ${x},${y}`,
            `${x},${y}`
        );

        if (!input) return;

        const parts = input.split(',');
        if (parts.length !== 2) return;

        x = parseInt(parts[0].trim()) || 0;
        y = parseInt(parts[1].trim()) || 0;

        // Snapper sur la grille
        const snappedX = Math.floor(x / 27) * 27;
        const snappedY = Math.floor(y / 27) * 27;

        this.#currentNPC.waypoints.push({ x: snappedX, y: snappedY });
        this.#renderWaypoints();
        this.#save();

        console.log(`📍 Waypoint ajouté: (${snappedX}, ${snappedY})`);
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

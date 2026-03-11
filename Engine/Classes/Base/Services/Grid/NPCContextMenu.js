import { GridSnapHelper } from './GridSnapHelper.js';

/**
 * NPCContextMenu - Gère le menu contextuel (Alt+Clic) sur les PNJ
 */
class NPCContextMenu {
    #npcPlacementService;
    #gridSnapHelper;
    #canvas;
    #menuElement;
    #currentNPC = null;
    #currentPosition = null;

    constructor(npcPlacementService, canvas) {
        this.#npcPlacementService = npcPlacementService;
        this.#canvas = canvas;
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
        this.#menuElement = document.getElementById('npc-context-menu');

        this.#setupEventListeners();
    }

    #setupEventListeners() {
        // Alt+Clic gauche sur le canvas
        this.#canvas.addEventListener('click', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            if (e.altKey) {
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

        // Bouton de fermeture
        const closeBtn = document.getElementById('close-npc-menu-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.#hideMenu();
            });
        }

        // Bouton de sauvegarde
        const saveBtn = document.getElementById('save-npc-menu-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.#saveAndCloseMenu();
            });
        }

        // Bouton supprimer
        const deleteBtn = document.getElementById('menu-delete-npc');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.#deleteNPC();
            });
        }

        // Input nom
        const nameInput = document.getElementById('menu-npc-name');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                if (this.#currentNPC) {
                    this.#currentNPC.name = nameInput.value;
                }
            });
        }

        // Input texte
        const textInput = document.getElementById('menu-npc-text');
        if (textInput) {
            textInput.addEventListener('input', () => {
                if (this.#currentNPC) {
                    this.#currentNPC.updateInteractionText(textInput.value);
                }
            });
        }

        // Checkbox solidité
        const solidCheckbox = document.getElementById('menu-npc-solid');
        if (solidCheckbox) {
            solidCheckbox.addEventListener('change', () => {
                if (this.#currentNPC) {
                    this.#currentNPC.setSolid(solidCheckbox.checked);
                }
            });
        }
    }

    #handleContextMenu(e) {
        const engine = window.engineInstance;
        if (!engine) return;

        const scene = engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        const scale = 3;
        const worldX = (e.clientX / scale) - scene.activeCamera.coordinates.X;
        const worldY = (e.clientY / scale) - scene.activeCamera.coordinates.Y;

        const npc = this.#npcPlacementService.findNPCAt(worldX, worldY);

        if (npc) {
            this.#currentNPC = npc;
            this.#currentPosition = { x: npc.coordinates.X, y: npc.coordinates.Y };
            this.#showMenu(e.clientX, e.clientY, npc);
        }
    }

    #showMenu(x, y, npc) {
        // Remplir les champs
        const nameInput = document.getElementById('menu-npc-name');
        const textInput = document.getElementById('menu-npc-text');
        const solidCheckbox = document.getElementById('menu-npc-solid');
        const posElement = document.getElementById('menu-npc-pos');

        if (nameInput) nameInput.value = npc.name;
        if (textInput) textInput.value = npc.interactionText;
        if (solidCheckbox) solidCheckbox.checked = npc.isSolid;
        if (posElement) posElement.textContent = `Position: (${this.#currentPosition.x}, ${this.#currentPosition.y})`;

        // Positionner le menu
        this.#menuElement.style.left = `${x}px`;
        this.#menuElement.style.top = `${y}px`;
        this.#menuElement.style.display = 'block';
        this.#menuElement.classList.remove('hidden');

        // Ajuster si le menu dépasse
        const rect = this.#menuElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.#menuElement.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.#menuElement.style.top = `${y - rect.height}px`;
        }
    }

    #hideMenu() {
        this.#menuElement.style.display = 'none';
        this.#menuElement.classList.add('hidden');
        this.#currentNPC = null;
        this.#currentPosition = null;
    }

    #saveAndCloseMenu() {
        this.#npcPlacementService.saveNPCs();
        console.log('💾 PNJ sauvegardé avec succès');
        this.#hideMenu();
    }

    #deleteNPC() {
        if (!this.#currentNPC) return;

        this.#npcPlacementService.removeNPC(this.#currentNPC);
        this.#hideMenu();
    }

    isVisible() {
        return this.#menuElement.style.display === 'block' && !this.#menuElement.classList.contains('hidden');
    }
}

export { NPCContextMenu };



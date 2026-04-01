import { GridSnapHelper } from '../Grid/GridSnapHelper.js';
import { NPC } from '/Engine/Classes/Custom/WebGameObjects/NPC.js';

/**
 * NPCPlacementService - Gère le placement des PNJ en mode construction
 *
 * Activé quand le mode "npc" est sélectionné dans la barre d'outils.
 * Écoute les clics sur le canvas et place un PNJ aux coordonnées snappées.
 */
class NPCPlacementService {
    #engine = null;
    #canvas = null;
    #gridSnapHelper = null;
    #isActive = false;          // Mode placement PNJ actif ou non
    #selectedConfig = {         // Configuration du prochain PNJ à placer
        name: 'PNJ',
        spritePath: null,
        dialogues: ['Bonjour !'],
        movementType: 'static',
        moveSpeed: 0.3,
        waypoints: []
    };

    constructor(canvas) {
        this.#canvas = canvas;
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    initialize(engine) {
        this.#engine = engine;
        this.#setupEventListeners();
        window.npcPlacementService = this;
        console.log('🧑 NPCPlacementService initialisé');
    }

    // ==========================================
    // Activation / désactivation
    // ==========================================

    activate() {
        this.#isActive = true;
        if (this.#canvas) this.#canvas.style.cursor = 'crosshair';
        console.log('🧑 Mode placement PNJ activé');
    }

    deactivate() {
        this.#isActive = false;
        if (this.#canvas) this.#canvas.style.cursor = 'grab';
        console.log('🧑 Mode placement PNJ désactivé');
    }

    isActive() {
        return this.#isActive;
    }

    // ==========================================
    // Configuration du PNJ à placer
    // ==========================================

    setConfig(config) {
        this.#selectedConfig = { ...this.#selectedConfig, ...config };
    }

    getConfig() {
        return { ...this.#selectedConfig };
    }

    // ==========================================
    // Event listeners
    // ==========================================

    #setupEventListeners() {
        // Clic gauche sur le canvas → placer un PNJ
        this.#canvas.addEventListener('click', (e) => {
            if (!this.#isActive) return;

            const mode = window.getMode ? window.getMode() : 'play';
            if (mode !== 'construction') return;

            // Ignorer si Alt est pressé (c'est pour le menu contextuel)
            if (e.altKey) return;

            e.preventDefault();
            e.stopPropagation();

            this.#placeNPCAtClick(e.clientX, e.clientY);
        });
    }

    #placeNPCAtClick(screenX, screenY) {
        const scene = this.#engine?.services?.SceneService?.activeScene;
        if (!scene || !scene.activeCamera) return;

        const npcService = this.#engine?.services?.NPCService;
        if (!npcService) {
            console.warn('⚠️ NPCService non disponible');
            return;
        }

        // Convertir en coordonnées monde snappées
        const snapped = this.#gridSnapHelper.screenToGridSnap(
            screenX,
            screenY,
            scene.activeCamera,
            this.#canvas
        );

        // Placer le PNJ
        npcService.placeNPC(snapped.x, snapped.y, { ...this.#selectedConfig });

        // Sauvegarder les PNJ
        npcService.saveNPCs();
    }
}

export { NPCPlacementService };

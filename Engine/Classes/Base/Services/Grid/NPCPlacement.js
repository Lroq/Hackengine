import { GridSnapHelper } from './GridSnapHelper.js';
import { NPC } from '../../../Custom/WebGameObjects/NPC.js';

/**
 * NPCPlacementService - Gère le placement des PNJ en mode construction
 */
class NPCPlacementService {
    #engine = null;
    #canvas = null;
    #gridSnapHelper = null;
    #placedNPCs = new Map();
    #npcIdCounter = 0;
    #ghostNPC = null;
    #selectedNPCSprite = null;

    constructor() {
        this.#gridSnapHelper = new GridSnapHelper();
        this.#gridSnapHelper.setCellSize(27);
    }

    initialize(engine, canvas) {
        this.#engine = engine;
        this.#canvas = canvas;
        this.#setupEventListeners();
    }

    #setupEventListeners() {
        this.#canvas.addEventListener('mousemove', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            if (mode !== 'construction' || editMode !== 'npc') return;
            if (!this.#selectedNPCSprite) return;

            this.#updateGhostNPC(e.clientX, e.clientY);
        });

        this.#canvas.addEventListener('click', (e) => {
            const mode = window.getMode ? window.getMode() : 'play';
            const editMode = window.getEditMode ? window.getEditMode() : 'brush';

            if (mode !== 'construction' || editMode !== 'npc') return;
            if (!this.#selectedNPCSprite) return;
            if (e.altKey) return;

            this.#placeNPC(e.clientX, e.clientY);
        });
    }

    selectNPCSprite(spritePath) {
        this.#selectedNPCSprite = spritePath;
        console.log(`👤 Sprite de PNJ sélectionné: ${spritePath}`);
    }

    #updateGhostNPC(screenX, screenY) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        const scale = 3;
        const worldX = (screenX / scale) - scene.activeCamera.coordinates.X;
        const worldY = (screenY / scale) - scene.activeCamera.coordinates.Y;

        const snappedPos = this.#gridSnapHelper.snapToGrid(worldX, worldY);

        if (!this.#ghostNPC) {
            this.#ghostNPC = new NPC("NPC", this.#selectedNPCSprite, "");
            this.#ghostNPC.isGhost = true;
            scene.wgObjects.push(this.#ghostNPC);
        }

        this.#ghostNPC.coordinates.X = snappedPos.x;
        this.#ghostNPC.coordinates.Y = snappedPos.y;
        this.#ghostNPC.updateSprite(this.#selectedNPCSprite);
    }

    #placeNPC(screenX, screenY) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene || !scene.activeCamera) return;

        const scale = 3;
        const worldX = (screenX / scale) - scene.activeCamera.coordinates.X;
        const worldY = (screenY / scale) - scene.activeCamera.coordinates.Y;

        const snappedPos = this.#gridSnapHelper.snapToGrid(worldX, worldY);

        const npcId = `npc_${this.#npcIdCounter++}`;
        const npc = new NPC(`NPC ${this.#npcIdCounter}`, this.#selectedNPCSprite, "Bonjour !");
        npc.coordinates.X = snappedPos.x;
        npc.coordinates.Y = snappedPos.y;

        scene.wgObjects.push(npc);
        this.#placedNPCs.set(npcId, npc);

        console.log(`✅ NPC placé à (${snappedPos.x}, ${snappedPos.y})`);
        this.saveNPCs();
    }

    removeNPC(npc) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return false;

        let npcId = null;
        for (const [id, n] of this.#placedNPCs.entries()) {
            if (n === npc) {
                npcId = id;
                break;
            }
        }

        if (!npcId) return false;

        const index = scene.wgObjects.indexOf(npc);
        if (index > -1) {
            scene.wgObjects.splice(index, 1);
        }

        this.#placedNPCs.delete(npcId);
        console.log(`🗑️ NPC supprimé: ${npc.name}`);
        this.saveNPCs();
        return true;
    }

    clearGhostNPC() {
        if (this.#ghostNPC) {
            const scene = this.#engine.services.SceneService.activeScene;
            if (scene) {
                const index = scene.wgObjects.indexOf(this.#ghostNPC);
                if (index > -1) {
                    scene.wgObjects.splice(index, 1);
                }
            }
            this.#ghostNPC = null;
        }
    }

    exportNPCData() {
        const npcData = [];
        this.#placedNPCs.forEach((npc) => {
            npcData.push(npc.toJSON());
        });
        return npcData;
    }

    loadNPCData(npcData) {
        const scene = this.#engine.services.SceneService.activeScene;
        if (!scene) return;

        this.#placedNPCs.forEach((npc) => {
            const index = scene.wgObjects.indexOf(npc);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
        });
        this.#placedNPCs.clear();

        npcData.forEach((data) => {
            const npc = NPC.fromJSON(data);
            const npcId = `npc_${this.#npcIdCounter++}`;

            scene.wgObjects.push(npc);
            this.#placedNPCs.set(npcId, npc);
        });

        console.log(`✅ ${npcData.length} PNJ chargés`);
    }

    saveNPCs() {
        const npcData = this.exportNPCData();
        const mapName = window.currentMapName || 'default_map';

        fetch('/api/save-npcs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapName, npcData })
        })
        .then(res => res.json())
        .then(data => {
            console.log(`✅ ${data.count} PNJ sauvegardés`);
        })
        .catch(err => {
            console.error('❌ Erreur:', err);
        });
    }

    async loadNPCsFromServer(mapName) {
        try {
            const res = await fetch(`/api/load-npcs?name=${encodeURIComponent(mapName)}`);
            const npcData = await res.json();

            if (npcData && npcData.length > 0) {
                this.loadNPCData(npcData);
            }
        } catch (err) {
            console.error('❌ Erreur:', err);
        }
    }

    findNPCAt(worldX, worldY) {
        for (const npc of this.#placedNPCs.values()) {
            const npcX = npc.coordinates.X;
            const npcY = npc.coordinates.Y;

            if (worldX >= npcX && worldX <= npcX + 27 &&
                worldY >= npcY - 27 && worldY <= npcY + 27) {
                return npc;
            }
        }
        return null;
    }
}

export { NPCPlacementService };


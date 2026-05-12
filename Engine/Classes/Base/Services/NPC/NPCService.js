import { NPC } from '/Engine/Classes/Custom/WebGameObjects/NPC.js';

/**
 * NPCService - Gestion des PNJ dans la scène
 *
 * Responsabilités :
 * - Placer / supprimer des PNJ dans la scène active
 * - Sauvegarder / charger les PNJ depuis le serveur (map JSON)
 * - Interface pour le menu de placement (mode construction)
 */
class NPCService {
    #engine = null;
    #placedNPCs = new Map(); // Map<npcId, NPC>
    #idCounter = 0;

    constructor() {}

    initialize(engine) {
        this.#engine = engine;
        // Exposer globalement pour NPCContextMenu
        window.npcService = this;
        console.log('🧑 NPCService initialisé');
    }

    // ==========================================
    // Génération d'ID unique
    // ==========================================

    #generateId() {
        this.#idCounter++;
        return `npc_${Date.now()}_${this.#idCounter}`;
    }

    // ==========================================
    // Placement
    // ==========================================

    /**
     * Crée et place un PNJ dans la scène active
     * @param {number} worldX - Coordonnée monde X (snappée sur grille)
     * @param {number} worldY - Coordonnée monde Y (snappée sur grille)
     * @param {Object} config - Configuration du PNJ
     * @returns {NPC|null}
     */
    placeNPC(worldX, worldY, config = {}) {
        const scene = this.#getActiveScene();
        if (!scene) {
            console.warn('⚠️ NPCService: Scène non disponible');
            return null;
        }

        const npc = new NPC(config.name || 'PNJ');
        npc.npcId = this.#generateId();
        npc.coordinates.X = worldX;
        npc.coordinates.Y = worldY;
        npc.spawnX = worldX;
        npc.spawnY = worldY;

        // Sprite
        if (config.spritePath) {
            npc.loadSprite(config.spritePath);
        }

        // Dialogues
        if (Array.isArray(config.dialogues)) {
            npc.dialogues = config.dialogues;
        } else if (config.dialogues === undefined) {
            npc.dialogues = ['Bonjour, aventurier !'];
        }

        // Mouvement
        npc.movementType = config.movementType || 'static';
        npc.moveSpeed = config.moveSpeed || 0.3;
        if (Array.isArray(config.waypoints)) {
            npc.waypoints = config.waypoints;
        }

        // Enregistrer et ajouter à la scène
        this.#placedNPCs.set(npc.npcId, npc);
        scene.addWGObject(npc);

        console.log(`✅ PNJ "${npc.npcName}" placé à (${worldX}, ${worldY}) [${npc.npcId}]`);
        return npc;
    }

    /**
     * Supprime un PNJ de la scène
     * @param {string} npcId
     * @returns {boolean}
     */
    removeNPC(npcId) {
        const npc = this.#placedNPCs.get(npcId);
        if (!npc) return false;

        const scene = this.#getActiveScene();
        if (scene) {
            const index = scene.wgObjects.indexOf(npc);
            if (index > -1) {
                scene.wgObjects.splice(index, 1);
            }
        }

        this.#placedNPCs.delete(npcId);
        console.log(`🗑️ PNJ "${npc.npcName}" supprimé [${npcId}]`);
        return true;
    }

    /**
     * Retourne le PNJ le plus proche d'une position monde
     * Dans un rayon de tolerance pixels
     * @param {number} worldX
     * @param {number} worldY
     * @param {number} tolerance
     * @returns {NPC|null}
     */
    getNPCAt(worldX, worldY, tolerance = 30) {
        let closest = null;
        let closestDist = tolerance;

        this.#placedNPCs.forEach((npc) => {
            const dx = npc.coordinates.X - worldX;
            const dy = npc.coordinates.Y - worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closest = npc;
            }
        });

        return closest;
    }

    /**
     * Retourne tous les PNJ de la scène
     * @returns {NPC[]}
     */
    getAllNPCs() {
        return [...this.#placedNPCs.values()];
    }

    // ==========================================
    // Sauvegarde / Chargement
    // ==========================================

    /**
     * Exporte les données de tous les PNJ pour la sauvegarde
     * @returns {Array}
     */
    exportNPCData() {
        const data = [];

        this.#placedNPCs.forEach((npc, npcId) => {
            data.push({
                npcId,
                npcName: npc.npcName,
                x: npc.spawnX !== undefined ? npc.spawnX : npc.coordinates.X,
                y: npc.spawnY !== undefined ? npc.spawnY : npc.coordinates.Y,
                spritePath: npc.spritePath || null,
                dialogues: npc.dialogues || [],
                movementType: npc.movementType || 'static',
                moveSpeed: npc.moveSpeed || 0.3,
                waypoints: npc.waypoints || [],
            });
        });

        return data;
    }

    /**
     * Charge les PNJ depuis des données JSON
     * Nettoie les PNJ existants avant de charger
     * @param {Array} npcData
     */
    loadNPCData(npcData) {
        if (!Array.isArray(npcData) || npcData.length === 0) return;

        const scene = this.#getActiveScene();
        if (!scene) return;

        // Nettoyer les PNJ existants
        this.#placedNPCs.forEach((npc) => {
            const index = scene.wgObjects.indexOf(npc);
            if (index > -1) scene.wgObjects.splice(index, 1);
        });
        this.#placedNPCs.clear();

        // Charger les nouveaux
        npcData.forEach((data) => {
            const npc = new NPC(data.npcName || 'PNJ');
            npc.npcId = data.npcId || this.#generateId();
            npc.coordinates.X = data.x || 0;
            npc.coordinates.Y = data.y || 0;
            npc.spawnX = npc.coordinates.X;
            npc.spawnY = npc.coordinates.Y;

            if (data.spritePath) {
                npc.loadSprite(data.spritePath);
            }

            npc.dialogues = data.dialogues || ['Bonjour !'];
            npc.movementType = data.movementType || 'static';
            npc.moveSpeed = data.moveSpeed || 0.3;
            npc.waypoints = data.waypoints || [];

            this.#placedNPCs.set(npc.npcId, npc);
            scene.addWGObject(npc);
        });

        console.log(`✅ ${npcData.length} PNJ chargé(s)`);
    }

    /**
     * Sauvegarde la map incluant les PNJ
     * Délègue à MapService pour les tiles, ajoute les PNJ en plus
     */
    saveNPCs(mapName) {
        const npcData = this.exportNPCData();
        const title = mapName || window.currentMapName || 'default_map';

        fetch('/api/save-npcs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ npcData, mapName: title })
        })
        .then(res => res.json())
        .then(data => console.log(`✅ PNJ sauvegardés: ${data.message || 'OK'}`))
        .catch(err => console.error('❌ Erreur sauvegarde PNJ:', err));
    }

    /**
     * Charge les PNJ depuis le serveur
     */
    async loadNPCsFromServer(mapName) {
        try {
            const res = await fetch(`/api/load-npcs?name=${encodeURIComponent(mapName)}`);
            if (!res.ok) return;
            const npcData = await res.json();
            this.loadNPCData(npcData);
            console.log(`✅ PNJ chargés pour la map "${mapName}": ${npcData.length}`);
        } catch (err) {
            console.warn(`⚠️ Pas de PNJ pour la map "${mapName}" ou erreur:`, err.message);
        }
    }

    // ==========================================
    // Utilitaires internes
    // ==========================================

    #getActiveScene() {
        if (this.#engine && this.#engine.services.SceneService) {
            return this.#engine.services.SceneService.activeScene;
        }
        return null;
    }

    /**
     * Vérifie si un objet est un NPC géré par ce service
     */
    isNPC(obj) {
        if (!(obj instanceof NPC)) return false;
        return this.#placedNPCs.has(obj.npcId);
    }

    get placedNPCs() {
        return this.#placedNPCs;
    }
}

export { NPCService };

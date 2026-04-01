import { Instance } from "../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../Base/Components/BoxCollider.js";
import { PhysicController } from "../../Base/Components/PhysicController.js";
import { NameTag } from "./NameTag.js";
import { Utils } from "../../Base/Services/Utilities/Utils.js";

/**
 * NPC (Non-Player Character) - Personnage non-joueur
 *
 * Supporte :
 * - Sprite configurable
 * - Nom affiché (NameTag)
 * - Dialogues (tableau de messages)
 * - Mouvements : 'static' | 'patrol'
 * - Waypoints pour le mode patrol
 * - Interaction via touche E
 */
class NPC extends Instance {
    // --- Identité ---
    npcId = null;           // ID unique (généré par NPCService)
    npcName = 'PNJ';       // Nom affiché

    // --- Sprite ---
    spritePath = null;      // Chemin vers le PNG (null = default)
    layer = 2;             // Rendu devant les tiles

    // --- Dialogues ---
    dialogues = [];        // Tableau de chaînes (messages)
    #currentDialogueIndex = 0;

    // --- Mouvement ---
    movementType = 'static';  // 'static' | 'patrol'
    waypoints = [];            // [{x, y}, ...] pour patrol
    moveSpeed = 0.3;
    #currentWaypointIndex = 0;
    #moveTimer = 0;

    // --- Animation ---
    #animFrame = 0;
    #facing = 'down';    // 'up' | 'down' | 'left' | 'right'
    #isMoving = false;
    #spriteCache = {};

    // --- Interaction ---
    hasInteraction = true;  // Toujours interactable via touche E

    // --- Interne ---
    #nameTagRef = null;
    #isTalkingCooldown = false;

    constructor(name = 'PNJ') {
        super();
        this.npcName = name;

        // === Sprite ===
        const sprite = new SpriteModel();
        sprite.enabled = true;
        sprite.size.Width = 27;
        sprite.size.Height = 54;
        sprite.spriteOffset.Y = -50;
        sprite.spriteOffset.X = -4;
        super.addComponent(sprite);

        // === Physique (sans gravité) ===
        const physic = new PhysicController();
        physic.gravityEnabled = false;
        super.addComponent(physic);

        // === Collider ===
        const collider = new BoxCollider();
        collider.enabled = true;
        collider.hitbox.Width = 20;
        collider.hitbox.Height = 4;
        super.addComponent(collider);

        // === NameTag ===
        const nameTag = new NameTag(name);
        nameTag.coordinates.Y = -65;
        nameTag.coordinates.X = -5;
        super.addChild(nameTag);
        this.#nameTagRef = nameTag;
    }

    /**
     * Charge le sprite depuis un chemin
     */
    loadSprite(path) {
        this.spritePath = path;

        const sprite = this.components.SpriteModel;
        if (!sprite) return;

        if (path) {
            sprite.sprite = this.#getCachedSprite(path);
            sprite.rotation = 1; // Reset rotation
        } else {
            sprite.sprite = this.#getCachedSprite('/Engine/Assets/texture_not_found.png');
            sprite.rotation = 1; // Reset rotation
        }
    }

    #getCachedSprite(src) {
        if (!this.#spriteCache[src]) {
            this.#spriteCache[src] = Utils.createSprite(src);
        }
        return this.#spriteCache[src];
    }

    /**
     * Met à jour le nom et le NameTag
     */
    setName(name) {
        this.npcName = name;
    }

    /**
     * Retourne le prochain message de dialogue (cycle)
     */
    getNextDialogue() {
        if (this.dialogues.length === 0) return null;
        const msg = this.dialogues[this.#currentDialogueIndex];
        this.#currentDialogueIndex = (this.#currentDialogueIndex + 1) % this.dialogues.length;
        return msg;
    }

    /**
     * Méthode run() — appelée à chaque tick par l'Engine
     */
    run(Services, DeltaTime) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play') return;

        switch (this.movementType) {
            case 'patrol':
                this.#runPatrol(Services, DeltaTime);
                break;
            case 'static':
            default:
                this.#applyIdleSprite();
                break;
        }
    }

    // ========== Mouvements ==========

    #runPatrol(Services, DeltaTime) {
        if (this.waypoints.length < 2) {
            this.#applyIdleSprite();
            return;
        }

        const physic = this.components.PhysicController;
        if (!physic) return;

        const target = this.waypoints[this.#currentWaypointIndex];
        const dx = target.x - this.coordinates.X;
        const dy = target.y - this.coordinates.Y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            // Waypoint atteint, passer au suivant
            this.#currentWaypointIndex = (this.#currentWaypointIndex + 1) % this.waypoints.length;
            physic.velocity.X = 0;
            physic.velocity.Y = 0;
            this.#isMoving = false;
        } else {
            // Se déplacer vers le waypoint
            const speed = this.moveSpeed;
            physic.velocity.X = (dx / dist) * speed;
            physic.velocity.Y = (dy / dist) * speed;

            this.#isMoving = true;
            this.#updateFacing(dx, dy);
            // Vitesse d'animation relative à la vitesse de déplacement
            this.#animFrame = (this.#animFrame + (speed * 0.4)) % 4;
        }

        this.#applyMovingSprite();
    }

    #updateFacing(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.#facing = dx > 0 ? 'right' : 'left';
        } else {
            this.#facing = dy > 0 ? 'down' : 'up';
        }
    }

    #applyIdleSprite() {
        const physic = this.components.PhysicController;
        if (physic) {
            physic.velocity.X = 0;
            physic.velocity.Y = 0;
        }
        this.#isMoving = false;
        this.#animFrame = 0; 
    }

    #applyMovingSprite() {
        // Optionnel : flip X si le personnage va à gauche
        const spriteComp = this.components.SpriteModel;
        if (spriteComp && this.spritePath) {
            spriteComp.rotation = (this.#facing === 'left') ? -1 : 1;
        }
    }
}

export { NPC };

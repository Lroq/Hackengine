import { Instance } from "../../Base/WebGameObjects/Instance.js";
import { SpriteModel } from "../../Base/Components/SpriteModel.js";
import { BoxCollider } from "../../Base/Components/BoxCollider.js";
import { Utils } from "../../Base/Services/Utilities/Utils.js";

/**
 * NPC - Personnage Non-Joueur
 *
 * Représente un PNJ avec sprite, collision et interactions
 */
class NPC extends Instance {
    // Propriétés de configuration
    name = "NPC";
    spritePath = "";
    interactionText = "";
    isSolid = true; // Par défaut, les PNJ sont solides

    constructor(name = "NPC", spritePath = "", interactionText = "") {
        super();

        this.name = name;
        this.spritePath = spritePath;
        this.interactionText = interactionText;

        // Composant Sprite
        const sprite = new SpriteModel();
        sprite.enabled = true;
        sprite.size.Width = 27;  // Largeur standard d'une tuile
        sprite.size.Height = 54; // Hauteur d'un personnage (2 tuiles)
        sprite.spriteOffset.Y = -27; // Décalage pour centrer le sprite

        if (spritePath && spritePath.trim() !== '') {
            sprite.sprite = Utils.createSprite(spritePath);
        }

        // Composant Collision
        const collider = new BoxCollider();
        collider.enabled = this.isSolid;
        collider.hitbox.Width = 20;  // Un peu plus petit que le sprite pour un meilleur gameplay
        collider.hitbox.Height = 20;

        this.addComponent(sprite);
        this.addComponent(collider);

        // Layer par défaut : 2 (devant)
        this.layer = 2;
    }

    /**
     * Met à jour le sprite du NPC
     */
    updateSprite(newSpritePath) {
        this.spritePath = newSpritePath;
        const spriteModel = this.getComponent(SpriteModel);
        if (spriteModel) {
            spriteModel.sprite = Utils.createSprite(newSpritePath);
        }
    }

    /**
     * Met à jour le texte d'interaction
     */
    updateInteractionText(newText) {
        this.interactionText = newText;
    }

    /**
     * Active/désactive la solidité du NPC
     */
    setSolid(solid) {
        this.isSolid = solid;
        const collider = this.getComponent(BoxCollider);
        if (collider) {
            collider.enabled = solid;
        }
    }

    /**
     * Vérifie si le NPC a une interaction configurée
     */
    hasInteraction() {
        return this.interactionText && this.interactionText.trim() !== '';
    }

    /**
     * Exporte les données du NPC pour la sauvegarde
     */
    toJSON() {
        return {
            type: 'NPC',
            name: this.name,
            x: this.coordinates.X,
            y: this.coordinates.Y,
            spritePath: this.spritePath,
            interactionText: this.interactionText,
            isSolid: this.isSolid,
            layer: this.layer
        };
    }

    /**
     * Crée un NPC depuis des données JSON
     */
    static fromJSON(data) {
        const npc = new NPC(data.name, data.spritePath, data.interactionText);
        npc.coordinates.X = data.x;
        npc.coordinates.Y = data.y;
        npc.isSolid = data.isSolid !== undefined ? data.isSolid : true;
        npc.layer = data.layer !== undefined ? data.layer : 2;
        npc.setSolid(npc.isSolid);
        return npc;
    }
}

export { NPC };


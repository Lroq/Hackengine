/**
 * TileInteractionManager - Gère les interactions avec les tuiles configurées
 *
 * Affiche une icône "E" au-dessus des tuiles interactives proches
 * et déclenche l'affichage du texte configuré lors de l'appui sur E
 */
class TileInteractionManager {
    #player = null;
    #dialogueBox = null;
    #interactionRange = 40; // Distance en pixels pour détecter les tuiles
    #canvas = null;
    #ctx = null;
    #currentInteractableTile = null;
    #eIconImage = null;
    #pulseAnimation = 0; // Pour l'animation de pulsation

    constructor(canvas, dialogueBox) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#dialogueBox = dialogueBox;

        // Charger l'icône E
        this.#loadEIcon();
    }

    /**
     * Charge l'icône E (ou la dessine)
     */
    #loadEIcon() {
        // Pour l'instant, on va dessiner l'icône directement
        // mais on pourrait charger une image
        this.#eIconImage = null;
    }

    /**
     * Définit le joueur à suivre
     */
    setPlayer(player) {
        this.#player = player;
    }

    /**
     * Vérifie et affiche l'icône E si une tuile interactive est proche
     */
    update(inputService) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play' || !this.#player) return;

        // Trouver les tuiles interactives proches
        this.#currentInteractableTile = this.#findNearestInteractableTile();

        // Si le joueur appuie sur E et qu'il y a une tuile interactive
        if (this.#currentInteractableTile && inputService.IsKeyPressed('e')) {
            this.#triggerInteraction(this.#currentInteractableTile);
        }
    }

    /**
     * Trouve la tuile interactive la plus proche
     */
    #findNearestInteractableTile() {
        if (!this.#player) return null;

        const playerX = this.#player.coordinates.X;
        const playerY = this.#player.coordinates.Y;

        // Récupérer toutes les tuiles de la scène
        const engine = window.engineInstance;
        if (!engine) {
            console.warn('⚠️ TileInteractionManager: Engine non disponible');
            return null;
        }

        const activeScene = engine.services.SceneService.activeScene;
        if (!activeScene) {
            console.warn('⚠️ TileInteractionManager: Scène non disponible');
            return null;
        }

        let closestTile = null;
        let closestDistance = this.#interactionRange;

        // Parcourir tous les WGObjects pour trouver les Tiles
        for (const obj of activeScene.wgObjects) {
            // Vérifier si c'est une Tile avec une interaction configurée
            if (obj.constructor.name === 'Tile' && obj.hasInteraction && obj.interactionText) {
                const tileX = obj.coordinates.X;
                const tileY = obj.coordinates.Y;

                const distance = Math.sqrt(
                    Math.pow(playerX - tileX, 2) +
                    Math.pow(playerY - tileY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTile = obj;
                }
            }
        }

        return closestTile;
    }

    /**
     * Déclenche l'interaction avec la tuile
     */
    #triggerInteraction(tile) {
        if (!tile.interactionText) return;

        // Fermer la boîte de dialogue si elle est ouverte
        if (this.#dialogueBox.isVisible()) {
            this.#dialogueBox.hide();
            return;
        }

        // Afficher le texte d'interaction
        this.#dialogueBox.show(tile.interactionText);
        console.log(`💬 Interaction avec tuile: "${tile.interactionText}"`);
    }

    /**
     * Dessine l'icône E au-dessus de la tuile interactive
     */
    render(camera) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play' || !this.#currentInteractableTile || !camera) return;

        const tile = this.#currentInteractableTile;

        // Centrer sur la tuile (27x27) et positionner plus bas (seulement -10px au lieu de -30px)
        const tileSize = 27;
        const worldX = tile.coordinates.X + camera.coordinates.X + (tileSize / 2); // Centré horizontalement
        const worldY = tile.coordinates.Y + camera.coordinates.Y - 10; // Plus bas, juste au-dessus de la tuile

        // Animation de pulsation (0 à 1)
        this.#pulseAnimation += 0.05;
        const pulse = Math.abs(Math.sin(this.#pulseAnimation));

        // Style Hackengine : Design cyberpunk/hacker avec néon vert
        this.#ctx.save();

        // Effet de glow externe avec pulsation (ombre portée verte)
        this.#ctx.shadowColor = '#00ff41';
        this.#ctx.shadowBlur = 2 + pulse * 2; // Pulsation du glow entre 2 et 4
        this.#ctx.shadowOffsetX = 0;
        this.#ctx.shadowOffsetY = 0;

        // Fond du bouton - Rectangle arrondi noir avec bordure néon
        const buttonWidth = 8;
        const buttonHeight = 8;
        const cornerRadius = 1.5;
        const buttonX = worldX - buttonWidth / 2;
        const buttonY = worldY - buttonHeight / 2;

        // Fond noir semi-transparent
        this.#ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.#ctx.beginPath();
        this.#ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, cornerRadius);
        this.#ctx.fill();

        // Bordure néon verte avec intensité qui pulse
        const glowIntensity = 0.7 + pulse * 0.3; // Entre 0.7 et 1.0
        this.#ctx.strokeStyle = `rgba(0, 255, 65, ${glowIntensity})`;
        this.#ctx.lineWidth = 0.5;
        this.#ctx.stroke();

        // Désactiver le glow pour le texte
        this.#ctx.shadowBlur = 0;

        // Lettre "E" en vert néon avec intensité qui pulse
        this.#ctx.fillStyle = `rgba(0, 255, 65, ${glowIntensity})`;
        this.#ctx.font = 'bold 6px "Courier New", monospace'; // Police monospace pour le style hacker
        this.#ctx.textAlign = 'center';
        this.#ctx.textBaseline = 'middle';
        this.#ctx.fillText('E', worldX, worldY);

        this.#ctx.restore();
    }

    /**
     * Vérifie si une tuile a une interaction configurée
     */
    static hasTileInteraction(tile) {
        return tile && tile.hasInteraction === true && tile.interactionText && tile.interactionText.trim() !== '';
    }
}

export { TileInteractionManager };










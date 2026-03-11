/**
 * NPCInteractionManager - Gère les interactions avec les PNJ
 *
 * Affiche une icône "E" au-dessus des PNJ proches et déclenche les dialogues
 */
class NPCInteractionManager {
    #player = null;
    #dialogueBox = null;
    #interactionRange = 40; // Distance en pixels pour détecter les PNJ
    #canvas = null;
    #ctx = null;
    #currentNPC = null;
    #pulseAnimation = 0; // Pour l'animation de pulsation

    constructor(canvas, dialogueBox) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#dialogueBox = dialogueBox;
    }

    /**
     * Définit le joueur à suivre
     */
    setPlayer(player) {
        this.#player = player;
    }

    /**
     * Vérifie et affiche l'icône E si un PNJ est proche
     */
    update(inputService) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play' || !this.#player) return;

        // Trouver le PNJ le plus proche
        this.#currentNPC = this.#findNearestNPC();

        // Si le joueur appuie sur E et qu'il y a un PNJ proche
        if (this.#currentNPC && inputService.IsKeyPressed('e')) {
            this.#triggerInteraction(this.#currentNPC);
        }
    }

    /**
     * Trouve le PNJ le plus proche avec une interaction
     */
    #findNearestNPC() {
        if (!this.#player) return null;

        const playerX = this.#player.coordinates.X;
        const playerY = this.#player.coordinates.Y;

        // Récupérer la scène active
        const engine = window.engineInstance;
        if (!engine) return null;

        const activeScene = engine.services.SceneService.activeScene;
        if (!activeScene) return null;

        let closestNPC = null;
        let closestDistance = this.#interactionRange;

        // Parcourir tous les WGObjects pour trouver les NPCs
        for (const obj of activeScene.wgObjects) {
            // Vérifier si c'est un NPC avec une interaction configurée
            if (obj.constructor.name === 'NPC' && obj.hasInteraction && obj.hasInteraction()) {
                const npcX = obj.coordinates.X;
                const npcY = obj.coordinates.Y;

                const distance = Math.sqrt(
                    Math.pow(playerX - npcX, 2) +
                    Math.pow(playerY - npcY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNPC = obj;
                }
            }
        }

        return closestNPC;
    }

    /**
     * Déclenche l'interaction avec le PNJ
     */
    #triggerInteraction(npc) {
        if (!npc.interactionText) return;

        // Fermer la boîte de dialogue si elle est ouverte
        if (this.#dialogueBox.isVisible()) {
            this.#dialogueBox.hide();
            return;
        }

        // Afficher le texte d'interaction avec le nom du PNJ
        const dialogueText = `**${npc.name}**: ${npc.interactionText}`;
        this.#dialogueBox.show(dialogueText);
        console.log(`💬 Interaction avec ${npc.name}: "${npc.interactionText}"`);
    }

    /**
     * Dessine l'icône E au-dessus du PNJ
     */
    render(camera) {
        const mode = window.getMode ? window.getMode() : 'play';
        if (mode !== 'play' || !this.#currentNPC || !camera) return;

        const npc = this.#currentNPC;

        // Position au-dessus du PNJ (qui fait 54px de haut)
        const worldX = npc.coordinates.X + camera.coordinates.X + 13.5; // Centré sur le NPC (27/2)
        const worldY = npc.coordinates.Y + camera.coordinates.Y - 60; // Au-dessus de la tête

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
        this.#ctx.font = 'bold 6px "Courier New", monospace';
        this.#ctx.textAlign = 'center';
        this.#ctx.textBaseline = 'middle';
        this.#ctx.fillText('E', worldX, worldY);

        this.#ctx.restore();
    }

    /**
     * Nettoie les ressources
     */
    dispose() {
        this.#player = null;
        this.#currentNPC = null;
    }
}

export { NPCInteractionManager };


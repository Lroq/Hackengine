/**
 * ConstructionGrid - Gère le rendu de la grille en mode construction
 *
 * Spécifications :
 * - Zone de 500x500 unités
 * - Centrée en (0, 0)
 * - Cellules de 27x27 unités
 * - Visible uniquement en mode construction
 */
class ConstructionGrid {
    #gridSize = 500;           // Taille totale de la grille (non utilisée, remplacée par largeGridSize)
    #cellSize = 27;            // Taille d'une cellule
    #gridColor = 'rgba(255, 255, 255, 0.3)';   // Couleur des lignes (blanc semi-transparent)
    #lineWidth = 1;            // Épaisseur des lignes

    /**
     * Dessine la grille sur le canvas
     * @param {CanvasRenderingContext2D} context - Contexte de rendu
     * @param {Object} camera - Caméra active pour le calcul des positions
     */
    render(context, camera) {
        // Vérifie si on est en mode construction
        if (typeof window.getMode !== 'function' || window.getMode() !== 'construction') {
            return; // Ne rien faire si pas en mode construction
        }

        context.save();

        // Configuration du style de la grille
        context.strokeStyle = this.#gridColor;
        context.lineWidth = this.#lineWidth;

        // Calculer une grille infinie couvrant tout l'écran visible
        // Au lieu de centrer en (0,0), on dessine une grille beaucoup plus large
        const largeGridSize = 2000; // Grille plus grande
        const halfGridSize = largeGridSize / 2;

        // Centrer la grille autour de (0, 0) du monde
        const worldStartX = -halfGridSize;
        const worldStartY = -halfGridSize;
        const worldEndX = halfGridSize;
        const worldEndY = halfGridSize;

        // Nombre de lignes à dessiner
        const numLines = Math.floor(largeGridSize / this.#cellSize);

        // Dessiner les lignes verticales
        for (let i = 0; i <= numLines; i++) {
            const worldX = worldStartX + (i * this.#cellSize);
            const screenX = camera.coordinates.X + worldX;

            context.beginPath();
            context.moveTo(screenX, camera.coordinates.Y + worldStartY);
            context.lineTo(screenX, camera.coordinates.Y + worldEndY);
            context.stroke();
        }

        // Dessiner les lignes horizontales
        for (let i = 0; i <= numLines; i++) {
            const worldY = worldStartY + (i * this.#cellSize);
            const screenY = camera.coordinates.Y + worldY;

            context.beginPath();
            context.moveTo(camera.coordinates.X + worldStartX, screenY);
            context.lineTo(camera.coordinates.X + worldEndX, screenY);
            context.stroke();
        }

        // ===== INDICATEUR DE L'ORIGINE (0, 0) =====
        const originX = camera.coordinates.X;
        const originY = camera.coordinates.Y;

        // Dessiner les axes principaux en couleurs discrètes
        context.lineWidth = 1.5;

        // Axe X (rouge discret)
        context.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        context.beginPath();
        context.moveTo(originX - 30, originY);
        context.lineTo(originX + 30, originY);
        context.stroke();

        // Axe Y (vert discret)
        context.strokeStyle = 'rgba(100, 255, 100, 0.5)';
        context.beginPath();
        context.moveTo(originX, originY - 30);
        context.lineTo(originX, originY + 30);
        context.stroke();

        // Dessiner un petit cercle au centre
        context.beginPath();
        context.arc(originX, originY, 3, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        context.fill();
        context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        context.lineWidth = 1;
        context.stroke();

        // Ajouter le label "(0, 0)" discret
        context.font = '11px monospace';
        context.fillStyle = 'rgba(200, 200, 200, 0.7)';
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.lineWidth = 2;
        const label = '(0, 0)';
        context.strokeText(label, originX + 8, originY - 8);
        context.fillText(label, originX + 8, originY - 8);

        context.restore();
    }

    /**
     * Met à jour les paramètres de la grille
     * @param {Object} options - Options de configuration
     */
    configure(options = {}) {
        if (options.gridSize !== undefined) this.#gridSize = options.gridSize;
        if (options.cellSize !== undefined) this.#cellSize = options.cellSize;
        if (options.gridColor !== undefined) this.#gridColor = options.gridColor;
        if (options.lineWidth !== undefined) this.#lineWidth = options.lineWidth;
    }

    /**
     * Retourne les paramètres actuels de la grille
     */
    getConfig() {
        return {
            gridSize: this.#gridSize,
            cellSize: this.#cellSize,
            gridColor: this.#gridColor,
            lineWidth: this.#lineWidth
        };
    }
}

export { ConstructionGrid };


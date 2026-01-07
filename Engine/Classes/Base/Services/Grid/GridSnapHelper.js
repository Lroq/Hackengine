/**
 * GridSnapHelper - Utilitaire pour le snapping sur la grille de construction
 *
 * Responsabilités :
 * - Conversion de coordonnées Screen Space → World Space
 * - Calcul du snapping sur la grille (multiple de cellSize)
 * - Alignement correct avec pivot centré en (0,0)
 */
class GridSnapHelper {
    #cellSize = 27;

    /**
     * Configure la taille des cellules de la grille
     * @param {number} cellSize - Taille d'une cellule
     */
    setCellSize(cellSize) {
        this.#cellSize = cellSize;
    }

    /**
     * Convertit les coordonnées de la souris (Screen Space) en coordonnées monde (World Space)
     * @param {number} screenX - Position X de la souris sur l'écran
     * @param {number} screenY - Position Y de la souris sur l'écran
     * @param {Object} camera - La caméra active
     * @param {HTMLCanvasElement} canvas - Le canvas de rendu
     * @returns {{x: number, y: number}} - Coordonnées dans le monde
     */
    screenToWorld(screenX, screenY, camera, canvas) {
        // Récupère les dimensions du canvas et calcule l'échelle
        const rect = canvas.getBoundingClientRect();
        const canvasHeight = canvas.height;
        const scale = canvasHeight * 0.004; // Même calcul que dans Renderer.js

        // Convertit les coordonnées de l'écran en coordonnées du canvas
        const canvasX = ((screenX - rect.left) / rect.width) * canvas.width;
        const canvasY = ((screenY - rect.top) / rect.height) * canvas.height;

        // Convertit les coordonnées du canvas en coordonnées monde
        const worldX = (canvasX / scale) - camera.coordinates.X;
        const worldY = (canvasY / scale) - camera.coordinates.Y;

        return { x: worldX, y: worldY };
    }

    /**
     * Snap une position monde vers la cellule de grille la plus proche
     * La grille est centrée en (0,0) avec des cellules de taille #cellSize
     * @param {number} worldX - Position X dans le monde
     * @param {number} worldY - Position Y dans le monde
     * @returns {{x: number, y: number}} - Position snappée au centre de la cellule
     */
    snapToGrid(worldX, worldY) {
        // Calcule l'index de la cellule (peut être négatif)
        const cellIndexX = Math.floor(worldX / this.#cellSize);
        const cellIndexY = Math.floor(worldY / this.#cellSize);

        // Calcule la position du coin supérieur gauche de la cellule
        const snappedX = cellIndexX * this.#cellSize;
        const snappedY = cellIndexY * this.#cellSize;

        return { x: snappedX, y: snappedY };
    }

    /**
     * Convertit des coordonnées de souris en position de grille snappée
     * (Combine screenToWorld + snapToGrid)
     * @param {number} screenX - Position X de la souris
     * @param {number} screenY - Position Y de la souris
     * @param {Object} camera - La caméra active
     * @param {HTMLCanvasElement} canvas - Le canvas de rendu
     * @returns {{x: number, y: number}} - Position snappée dans le monde
     */
    screenToGridSnap(screenX, screenY, camera, canvas) {
        const worldPos = this.screenToWorld(screenX, screenY, camera, canvas);
        return this.snapToGrid(worldPos.x, worldPos.y);
    }

    /**
     * Retourne la taille de cellule actuelle
     * @returns {number}
     */
    getCellSize() {
        return this.#cellSize;
    }
}

export { GridSnapHelper };


class GameModeService {
    #mode = 'play'; // 'play' | 'construction'
    #editMode = 'brush'; // 'brush' | 'eraser' | 'fill'
    #zoom = 1.0;
    #cameraPan = { x: 0, y: 0 };
    #engine = null;

    constructor() {
    }

    initialize(engine) {
        this.#engine = engine;
        // Exposition globale pour compatibilité temporaire si nécessaire
        window.gameModeService = this;
    }

    getMode() {
        return this.#mode;
    }

    setMode(mode) {
        if (mode === 'play' || mode === 'construction') {
            this.#mode = mode;
            console.log(`🔄 Mode changé: ${mode}`);
        }
    }

    getEditMode() {
        return this.#editMode;
    }

    setEditMode(mode) {
        if (['brush', 'eraser', 'fill', 'npc'].includes(mode)) {
            this.#editMode = mode;
            console.log(`🖌️ Mode d'édition: ${mode}`);
        }
    }

    getZoom() {
        return this.#zoom;
    }

    setZoom(val) {
        this.#zoom = val;
    }

    getCameraPan() {
        return this.#cameraPan;
    }

    setCameraPan(x, y) {
        this.#cameraPan = { x, y };
    }

    // Méthodes de délégation vers TileDragService pour TileLoader.js

    startTileDrag(tilePath) {
        if (this.#engine && this.#engine.services.TileDragService) {
            this.#engine.services.TileDragService.startDrag(tilePath);
        } else {
            console.warn('GameModeService: TileDragService non disponible');
        }
    }

    getSelectedTilePath() {
        if (this.#engine && this.#engine.services.TileDragService) {
            return this.#engine.services.TileDragService.getSelectedTilePath();
        }
        return null;
    }
}

export { GameModeService };


import {CameraType} from '../../WebGameObjects/Camera.js';

/**
 * GameModeService — source de vérité unique pour l'état global du jeu.
 */
class GameModeService {
    #engine = null;
    #tileDragService = null;

    #mode = 'construction';
    #editMode = 'brush';
    #zoom = 1.0;
    #cameraPan = {x: 0, y: 0};

    static MIN_ZOOM = 0.5;
    static MAX_ZOOM = 3.0;
    static ZOOM_STEP = 0.1;

    initialize(engine) {
        this.#engine = engine;
    }

    /**
     * Appelé dans StartEngine.js après la création de TileDragService.
     * @param {TileDragService} tileDragService
     */
    setTileDragService(tileDragService) {
        this.#tileDragService = tileDragService;
    }

    // -------------------------------------------------------------------------
    // Getters — lus par Camera, Renderer, TileDragService
    // -------------------------------------------------------------------------

    getMode() {
        return this.#mode;
    }

    getEditMode() {
        return this.#editMode;
    }

    getZoom() {
        return this.#zoom;
    }

    getCameraPan() {
        return {...this.#cameraPan};
    }

    // -------------------------------------------------------------------------
    // Setters
    // -------------------------------------------------------------------------

    setMode(newMode) {
        this.#mode = newMode;

        const camera = this.#engine?.services.SceneService.activeScene?.activeCamera;

        if (newMode === 'construction') {
            this.#cameraPan = {x: 0, y: 0};
            if (camera) {
                this._savedCameraSubject = camera.cameraSubject;
                camera.cameraSubject = undefined;
                camera.cameraType = CameraType.Scriptable;
            }
        } else if (newMode === 'play') {
            if (camera) {
                camera.cameraSubject = this._savedCameraSubject ?? camera.cameraSubject;
                camera.cameraType = CameraType.Follow;
            }
        }
    }

    setEditMode(editMode) {
        this.#editMode = editMode;
    }

    setZoom(zoom) {
        this.#zoom = Math.max(GameModeService.MIN_ZOOM, Math.min(GameModeService.MAX_ZOOM, zoom));
    }

    zoomIn() {
        this.setZoom(this.#zoom + GameModeService.ZOOM_STEP);
    }

    zoomOut() {
        this.setZoom(this.#zoom - GameModeService.ZOOM_STEP);
    }

    resetZoom() {
        this.setZoom(1.0);
    }

    setCameraPan(x, y) {
        this.#cameraPan = {x, y};
    }

    panCamera(deltaX, deltaY) {
        const camera = this.#engine?.services.SceneService.activeScene?.activeCamera;
        if (camera) {
            camera.coordinates.X += deltaX;
            camera.coordinates.Y += deltaY;
        }
    }

    // -------------------------------------------------------------------------
    // Délégation TileDragService — utilisé par TileLoader.js
    // -------------------------------------------------------------------------

    /**
     * Sélectionne une tile pour le pinceau.
     */
    startDrag(tilePath) {
        this.#tileDragService?.startDrag(tilePath);
    }

    /**
     * Retourne le chemin de la tile sélectionnée.
     */
    getSelectedTilePath() {
        return this.#tileDragService?.getSelectedTilePath() ?? null;
    }

    // -------------------------------------------------------------------------
    // Helpers Game.html / autres
    // -------------------------------------------------------------------------

    getActiveCamera() {
        return this.#engine?.services.SceneService.activeScene?.activeCamera ?? null;
    }

    getPlayer() {
        return this.getActiveCamera()?.cameraSubject ?? null;
    }

    saveMap() {
        this.#engine?.services.MapService?.saveMap();
    }
}

export {GameModeService};
import {CameraType} from '../../WebGameObjects/Camera.js';

/**
 * GameModeService — source de vérité unique pour l'état global du jeu.
 */
class GameModeService {
    #engine = null;

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

    // -------------------------------------------------------------------------
    // Getters (lus par Camera, Renderer, TileDragService)
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

        const scene = this.#engine?.services.SceneService.activeScene;
        const camera = scene?.activeCamera;

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
    // Helpers pour Game.html
    // -------------------------------------------------------------------------

    getActiveCamera() {
        return this.#engine?.services.SceneService.activeScene?.activeCamera ?? null;
    }

    getPlayer() {
        return this.getActiveCamera()?.cameraSubject ?? null;
    }

    /**
     * Sauvegarde la map courante.
     */
    saveMap() {
        this.#engine?.services.MapService?.saveMap();
    }
}

export {GameModeService};
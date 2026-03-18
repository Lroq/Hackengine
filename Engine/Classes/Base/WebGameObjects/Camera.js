import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

/**
 * Camera type enumeration
 */
const CameraType = {
    Scriptable: "CAM_SCRIPTABLE",
    Follow: "CAM_FOLLOW",
    FIXED: "CAM_FIXED",
}

/**
 * Camera that determines what portion of the scene is visible.
 * Can follow a subject or be manually controlled.
 */
class Camera extends WGObject {
    #cameraType = CameraType.Follow;
    #cameraSubject;

    get cameraType() {
        return this.#cameraType;
    }

    set cameraType(value) {
        if (!Object.values(CameraType).includes(value)) {
            throw new TypeError("Invalid camera type. Use CameraType enum.");
        }
        this.#cameraType = value;
    }

    get cameraSubject() {
        return this.#cameraSubject;
    }

    set cameraSubject(value) {
        if (value !== null && value !== undefined && !(value instanceof WGObject)) {
            throw new TypeError("Camera subject must be a WGObject");
        }
        this.#cameraSubject = value;
    }

    /**
     * Met à jour la position de la caméra selon son type.
     * Appelé par Renderer chaque frame.
     *
     * @param {Scene}          scene
     * @param {Size_2D}        canvasSize
     * @param {Object}         services - Services de l'engine
     */
    run(scene, canvasSize, services = null) {
        // REFACTOR: lecture depuis GameModeService, fallback window pour compat temporaire
        const gameModeService = services?.GameModeService;
        const mode = gameModeService ? gameModeService.getMode() : (window.getMode?.() ?? 'play');

        switch (this.#cameraType) {
            case CameraType.Follow: {
                if (mode !== 'play') return;
                if (!this.#cameraSubject) return;

                const scale = canvasSize.Height * 0.004;
                let modelX = 0;
                let modelY = 0;

                if (this.#cameraSubject.components.BoxCollider) {
                    modelX = this.#cameraSubject.components.BoxCollider.hitbox.Width / 2;
                    modelY = this.#cameraSubject.components.BoxCollider.hitbox.Height / 2;
                }

                super.coordinates.X = -this.#cameraSubject.coordinates.X + (canvasSize.Width / 2) / scale - modelX;
                super.coordinates.Y = -this.#cameraSubject.coordinates.Y + (canvasSize.Height / 2) / scale - modelY;
                break;
            }

            case CameraType.Scriptable: {
                break;
            }
        }
    }
}

export {Camera, CameraType}
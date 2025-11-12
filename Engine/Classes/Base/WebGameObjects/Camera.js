import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

/**
 * Camera type enumeration
 */
const CameraType = {
    Scriptable: "CAM_SCRIPTABLE",
    Follow: "CAM_FOLLOW",
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

    /**
     * @param {string} value - Camera type from CameraType enum
     */
    set cameraType(value) {
        if (!Object.values(CameraType).includes(value)) {
            throw new TypeError("Invalid camera type. Use CameraType enum.");
        }
        this.#cameraType = value;
    }

    /**
     * @returns {WGObject|undefined} The object this camera follows
     */
    get cameraSubject() {
        return this.#cameraSubject;
    }

    /**
     * @param {WGObject} value - Object for the camera to follow
     */
    set cameraSubject(value) {
        if (!(value instanceof WGObject)) {
            throw new TypeError("Camera subject must be a WGObject");
        }
        this.#cameraSubject = value;
    }

    /**
     * Updates camera position based on its type and subject.
     * Called by Renderer each frame.
     */
    run(Scene, CanvasSize) {
        switch (this.#cameraType) {
            case CameraType.Follow: {
                const scale = CanvasSize.Height * 0.004;
                let modelX = 0;
                let modelY = 0;

                if (this.#cameraSubject.components.BoxCollider) {
                    modelX = this.#cameraSubject.components.BoxCollider.hitbox.Width / 2;
                    modelY = this.#cameraSubject.components.BoxCollider.hitbox.Height / 2;
                }

                super.coordinates.X = -this.#cameraSubject.coordinates.X + (CanvasSize.Width / 2) / scale - modelX;
                super.coordinates.Y = -this.#cameraSubject.coordinates.Y + (CanvasSize.Height / 2) / scale - modelY;

                break;
            }
        }
    }
}

export {Camera, CameraType}
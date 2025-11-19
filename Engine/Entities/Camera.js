import {WGObject} from './WGObject.js';
import {Coordinates2D} from '../Utils/Coordinates2D.js';

/**
 * Camera type enumeration.
 * @enum {string}
 */
const CameraType = {
    /** Camera follows a target entity */
    FOLLOW: 'FOLLOW',
    /** Camera is manually controlled */
    SCRIPTABLE: 'SCRIPTABLE',
    /** Camera is fixed at a position */
    FIXED: 'FIXED'
};

/**
 * Camera that determines viewport position and what's visible in the scene.
 * @class Camera
 * @extends WGObject
 */
class Camera extends WGObject {
    #cameraType = CameraType.FOLLOW;
    #subject = null;
    #panSpeed = 0.01;

    /**
     * @returns {string} Current camera type
     */
    get cameraType() {
        return this.#cameraType;
    }

    /**
     * @param {string} value - Camera type from CameraType enum
     * @throws {TypeError} If value is not a valid CameraType
     */
    set cameraType(value) {
        if (!Object.values(CameraType).includes(value)) {
            throw new TypeError(`Invalid camera type. Must be one of: ${Object.values(CameraType).join(', ')}`);
        }
        this.#cameraType = value;
    }

    /**
     * @returns {WGObject|null} The entity this camera follows
     */
    get subject() {
        return this.#subject;
    }

    /**
     * @param {WGObject|null} value - Entity for the camera to follow
     * @throws {TypeError} If value is not a WGObject or null
     */
    set subject(value) {
        if (value !== null && !(value instanceof WGObject)) {
            throw new TypeError('Camera subject must be a WGObject or null');
        }
        this.#subject = value;
    }

    /**
     * @deprecated Use subject instead
     */
    get cameraSubject() {
        return this.subject;
    }

    /**
     * @deprecated Use subject instead
     */
    set cameraSubject(value) {
        this.subject = value;
    }

    /**
     * Updates camera position based on type.
     * Called by Renderer each frame.
     * @param {Scene} scene - Active scene
     * @param {Size2D} canvasSize - Canvas dimensions
     */
    run(scene, canvasSize) {
        const mode = window.getMode ? window.getMode() : 'play';

        switch (this.#cameraType) {
            case CameraType.FOLLOW:
                this.#updateFollowCamera(canvasSize, mode);
                break;

            case CameraType.SCRIPTABLE:
                this.#updateScriptableCamera(mode);
                break;

            case CameraType.FIXED:
                // Fixed camera doesn't move automatically
                break;
        }
    }

    /**
     * Updates camera in follow mode.
     * @private
     */
    #updateFollowCamera(canvasSize, mode) {
        if (mode !== 'play' || !this.#subject) {
            return;
        }

        const scale = canvasSize.height * 0.004;
        let offsetX = 0;
        let offsetY = 0;

        // Center on subject's collider if available
        const collider = this.#subject.getComponent('BoxCollider');
        if (collider) {
            offsetX = collider.hitbox.width / 2;
            offsetY = collider.hitbox.height / 2;
        }

        this.coordinates.x = -this.#subject.coordinates.x + (canvasSize.width / 2) / scale - offsetX;
        this.coordinates.y = -this.#subject.coordinates.y + (canvasSize.height / 2) / scale - offsetY;
    }

    /**
     * Updates camera in scriptable mode.
     * @private
     */
    #updateScriptableCamera(mode) {
        // Allow free panning in editor mode
        const pan = window.getCameraPan ? window.getCameraPan() : {x: 0, y: 0};
        this.coordinates.x += pan.x * this.#panSpeed;
        this.coordinates.y += pan.y * this.#panSpeed;
    }

    /**
     * Sets the camera pan speed for scriptable mode.
     * @param {number} speed - Pan speed multiplier
     */
    setPanSpeed(speed) {
        if (typeof speed !== 'number' || speed <= 0) {
            throw new TypeError('Pan speed must be a positive number');
        }
        this.#panSpeed = speed;
    }

    /**
     * Moves camera to a specific position.
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    moveTo(x, y) {
        this.coordinates.set(x, y);
    }

    /**
     * Centers camera on a specific entity.
     * @param {WGObject} entity - Entity to center on
     * @param {Size2D} canvasSize - Canvas dimensions
     */
    centerOn(entity, canvasSize) {
        if (!(entity instanceof WGObject)) {
            throw new TypeError('Entity must be a WGObject');
        }

        const scale = canvasSize.height * 0.004;
        this.coordinates.x = -entity.coordinates.x + (canvasSize.width / 2) / scale;
        this.coordinates.y = -entity.coordinates.y + (canvasSize.height / 2) / scale;
    }
}

export {Camera, CameraType};
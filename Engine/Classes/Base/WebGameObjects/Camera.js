import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

/**
 * Camera type enumeration
 */
const CameraType = {
    Scriptable: "CAM_SCRIPTABLE",
    Follow: "CAM_FOLLOW",
    FIXED: "CAM_FIXED"
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
     * @param {WGObject|null|undefined} value - Object for the camera to follow
     */
    set cameraSubject(value) {
        if (value !== null && value !== undefined && !(value instanceof WGObject)) {
            throw new TypeError("Camera subject must be a WGObject");
        }
        this.#cameraSubject = value;
    }


    /**
     * Updates camera position based on its type and subject.
     * Called by Renderer each frame.
     */
    run(Scene, CanvasSize, Services) {
        let mode = "play";
        let pan = { x: 0, y: 0 };
        let zoom = 1.0;

        if (Services && Services.GameModeService) {
            mode = Services.GameModeService.getMode();
            pan = Services.GameModeService.getCameraPan();
            zoom = Services.GameModeService.getZoom();
        } else {
             // Fallback legacy
             mode = window.getMode ? window.getMode() : "play";
             pan = window.getCameraPan ? window.getCameraPan() : { x: 0, y: 0 };
             zoom = window.constructionZoom || 1.0;
        }

        // Calcul du scale exact utilisé par le Renderer (Height * 0.004)
        let scale = CanvasSize.Height * 0.004;
        if (mode === 'construction') {
            scale *= zoom;
        }

        switch (this.#cameraType) {
            case CameraType.Follow: {
                // ✅ En mode "play" : comportement normal
                if (mode !== "play" || !this.#cameraSubject) return;

                // Centrage parfait : On prend la moitié de l'écran, on divise par le scale pour repasser en monde,
                // et on soustrait la position du sujet (le joueur).
                // On ajoute un léger offset (13.5, 27) pour que le centre du perso (27x54) soit le point de focus.
                this.coordinates.X = (CanvasSize.Width / 2 / scale) - this.#cameraSubject.coordinates.X - 13.5;
                this.coordinates.Y = (CanvasSize.Height / 2 / scale) - this.#cameraSubject.coordinates.Y - 27;
                break;
            }

            case CameraType.Scriptable: {
                // ✅ En mode "construction" : déplacement libre (pan)
                
                if (pan.x !== 0 || pan.y !== 0) {
                    // Adapter la vitesse de déplacement au zoom
                    // Plus le zoom est grand, plus on doit bouger lentement pour garder une sensation cohérente
                    const speed = 1 / zoom;

                    this.coordinates.X += pan.x * speed;
                    this.coordinates.Y += pan.y * speed;
                }
                break;
            }
        }
    }
}

export {Camera, CameraType}
import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";
import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";

/*
* The camera have a few type
* - no type precise = the camera follow the player directly
* - "scriptable" = the camera is free to be controlled by scripts
* - "follow" = the camera follow a subject
*/

const CameraType = {
    Scriptable: "CAM_SCRIPTABLE",
    Follow: "CAM_FOLLOW",
}

class Camera extends WGObject {
    #CameraType = CameraType.Follow
    #CameraSubject;

    get cameraType() {
        return this.#CameraType
    }

    set cameraType(Type) {
        this.#CameraType = Type;
    }

    set cameraSubject(Subject) {
        this.#CameraSubject = Subject;
    }

    get cameraSubject() {
        return this.#CameraSubject
    }

    run(Scene, CanvasSize) {
        switch (this.#CameraType) {
            case CameraType.Follow: {
                const scale = CanvasSize.Height * 0.004;
                let modelX,modelY

                if (this.#CameraSubject.components.BoxCollider){
                    modelX = this.#CameraSubject.components.BoxCollider.hitbox.Width / 2
                    modelY = this.#CameraSubject.components.BoxCollider.hitbox.Height / 2
                }

                super.coordinates.X = -this.#CameraSubject.coordinates.X + (CanvasSize.Width / 2) / scale - modelX;
                super.coordinates.Y = -this.#CameraSubject.coordinates.Y + (CanvasSize.Height / 2) / scale - modelY;

                break;
            }
        }
    }
}

export {Camera, CameraType}
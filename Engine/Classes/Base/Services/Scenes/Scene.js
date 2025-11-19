import {Camera} from "/Engine/Entities/Camera.js";
import {WGObject} from "/Engine/Entities/WGObject.js";

class Scene {
    #ActiveCamera = new Camera();
    #WGObjects = [];

    addWGObject(Object){
        if (Object instanceof WGObject){
            this.#WGObjects.push(Object);
        }
    }

    removeWGObject(Object){

    }

    get activeCamera(){
        return this.#ActiveCamera
    }

    get wgObjects(){
        return this.#WGObjects
    }
}

export {Scene}
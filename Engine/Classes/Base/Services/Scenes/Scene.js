import {Camera} from "/Engine/Classes/Base/WebGameObjects/Camera.js";
import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

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
import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

class Instance extends WGObject {
    run(Services,DeltaTime){
        throw new Error("You must override the 'run' method.")
    }
}

export {Instance}
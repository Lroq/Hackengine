import {WGObject} from "/Engine/Entities/WGObject.js";

class Instance extends WGObject {
    run(Services,DeltaTime){
        throw new Error("You must override the 'run' method.")
    }
}

export {Instance}
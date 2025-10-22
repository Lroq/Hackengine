import {Scene} from "/Engine/Classes/Base/Services/Scenes/Scene.js";

class SceneService {
    #Scenes = {}
    #ActiveScene;

    get scenes(){
        return this.#Scenes
    }

    get activeScene(){
        return this.#ActiveScene
    }

    addScene(Name,_Scene){
        if (_Scene instanceof Scene){
            this.#Scenes[Name] = _Scene;
        }
    }

    set activeScene(_Scene){
        if (_Scene instanceof Scene){
            this.#ActiveScene = _Scene
        }
    }
}

export {SceneService}
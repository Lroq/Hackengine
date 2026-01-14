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

    /**
     * Charge une nouvelle scène depuis un fichier JSON de map
     * @param {string} mapName - Nom de la map à charger
     * @returns {Promise<void>}
     */
    async LoadSceneFromJson(mapName) {
        console.log(`🗺️ Chargement de la map : ${mapName}`);

        // Utiliser le TileDragService global pour charger la map
        if (window.tileDragService) {
            await window.tileDragService.loadMapFromServer(mapName);
            window.currentMapName = mapName;

            // Mettre à jour l'affichage du nom de la map
            if (window.updateMapNameDisplay) {
                window.updateMapNameDisplay(mapName);
            }

            console.log(`✅ Map "${mapName}" chargée avec succès`);
        } else {
            throw new Error('TileDragService non disponible');
        }
    }
}

export {SceneService}
import {Scene} from "/Engine/Classes/Base/Services/Scenes/Scene.js";

class SceneService {
    #Scenes = {};
    #ActiveScene;

    get scenes() {
        return this.#Scenes;
    }

    get activeScene() {
        return this.#ActiveScene;
    }

    addScene(name, scene) {
        if (scene instanceof Scene) {
            this.#Scenes[name] = scene;
        }
    }

    set activeScene(scene) {
        if (scene instanceof Scene) {
            this.#ActiveScene = scene;
        }
    }

    /**
     * Charge une nouvelle map depuis le serveur.
     *
     * @param {string} mapName
     * @param {Object} services - L'objet Services de l'engine
     */
    async LoadSceneFromJson(mapName, services) {
        const mapService = services?.MapService;

        if (!mapService) {
            if (window.tileDragService) {
                console.warn('⚠️ SceneService: MapService non disponible, fallback sur window.tileDragService');
                await window.tileDragService.loadMapFromServer(mapName);
                if (window.updateMapNameDisplay) window.updateMapNameDisplay(mapName);
                return;
            }
            throw new Error('MapService non disponible dans les Services');
        }

        await mapService.loadMapFromServer(mapName);

        if (window.updateMapNameDisplay) {
            window.updateMapNameDisplay(mapName);
        }
    }
}

export {SceneService}
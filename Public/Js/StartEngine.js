// -- :: Dependencies :: -- \\
import {Engine} from "/Engine/Classes/Base/Main/Engine.js";
import {CollisionGroup} from "/Engine/Classes/Base/Services/Collision/CollisionGroup.js";
import {SceneLoader} from "/Engine/Classes/Base/Services/Scenes/SceneLoader.js";
import {SceneService} from "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size_2D} from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {PhysicService} from "/Engine/Classes/Base/Services/Physic/PhysicService.js";
import {InputService} from "../../Engine/Classes/Base/Services/Inputs/InputService.js";
import {TutorialScene} from "/Engine/Classes/Custom/Scenes/TutorialScene.js";
import {TileDragService} from "../../Engine/Classes/Base/Services/Grid/TileDragService.js";
import {TileContextMenu} from "../../Engine/Classes/Base/Services/Grid/TileContextMenu.js";
// -- :: -- :: --:: -- :: -- \\

let Canvas;
let currentMapName = 'default_map';
let mapSelector;

// -- :: Functions :: -- \\
/**
 * Met à jour l'affichage du nom de la map en haut du canvas
 */
function updateMapNameDisplay(mapName) {
    const mapNameElement = document.getElementById('current-map-name');
    if (mapNameElement) {
        mapNameElement.textContent = mapName;
    }
}

async function main() {
    mapSelector = new window.MapSelector();

    await new Promise((resolve) => {
        mapSelector.show((selectedMapName) => {
            currentMapName = selectedMapName;
            console.log(`🗺️ Chargement de la map : ${currentMapName}`);
            resolve();
        });
    });

    const EngineInstance = new Engine({
            SceneService: new SceneService(),
            SceneLoaderService: new SceneLoader(),
            CollisionGroupService: new CollisionGroup(),
            PhysicService: new PhysicService(),
            InputService: new InputService()
        },
        {
            TickRate: 10,
            RefreshRate: 100,
        }, Canvas)

    EngineInstance.resize(new Size_2D(0, 0), {
        FullScreen: true,
    })

    const TUTORIAL_SCENE = new TutorialScene();

    const tileDragService = new TileDragService();
    tileDragService.initialize(EngineInstance, Canvas);
    window.tileDragService = tileDragService;

    await tileDragService.loadMapFromServer(currentMapName);

    EngineInstance.services.SceneService.addScene("Tutorial Scene", TUTORIAL_SCENE);
    EngineInstance.services.SceneService.activeScene = TUTORIAL_SCENE;

    window.engineInstance = EngineInstance;
    window.currentMapName = currentMapName;
    window.updateMapNameDisplay = updateMapNameDisplay;

    updateMapNameDisplay(currentMapName);

    const tileContextMenu = new TileContextMenu(tileDragService, Canvas);
    window.tileContextMenu = tileContextMenu;

    // Bouton de retour à la sélection des maps
    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    backToMapsBtn.addEventListener('click', () => {
        // Réouvrir le sélecteur de maps
        mapSelector.show(async (selectedMapName) => {
            currentMapName = selectedMapName;
            window.currentMapName = currentMapName;
            console.log(`🗺️ Chargement de la nouvelle map : ${currentMapName}`);

            // Charger la nouvelle map
            await tileDragService.loadMapFromServer(currentMapName);

            // Mettre à jour l'affichage du nom de la map
            updateMapNameDisplay(currentMapName);
        });
    });
}

// -- :: -- :: --:: -- :: -- \\

// -- :: Events :: -- \\
window.addEventListener('load', function () {
    Canvas = document.getElementById("game-canvas")
    main();
})
// -- :: -- :: --:: -- :: -- \\
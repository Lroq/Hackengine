// -- :: Dependencies :: -- \\
import {Engine}          from "/Engine/Classes/Base/Main/Engine.js";
import {CollisionGroup}  from "/Engine/Classes/Base/Services/Collision/CollisionGroup.js";
import {SceneLoader}     from "/Engine/Classes/Base/Services/Scenes/SceneLoader.js";
import {SceneService}    from "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size_2D}         from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {PhysicService}   from "/Engine/Classes/Base/Services/Physic/PhysicService.js";
import {InputService}    from "/Engine/Classes/Base/Services/Inputs/InputService.js";
import {ExempleScene}    from "/Engine/Classes/Custom/Scenes/ExempleScene.js";
import {TileDragService} from "/Engine/Classes/Base/Services/Grid/TileDragService.js";
import {TileContextMenu} from "/Engine/Classes/Base/Services/Grid/TileContextMenu.js";
// -- :: -- :: --:: -- :: -- \\

let canvas;
let currentMapName = 'default_map';
let mapSelector;

// -- :: Functions :: -- \\

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

    const engine = new Engine(
        {
            SceneService:          new SceneService(),
            SceneLoaderService:    new SceneLoader(),
            CollisionGroupService: new CollisionGroup(),
            PhysicService:         new PhysicService(),
            InputService:          new InputService(),
        },
        {
            TickRate:    10,
            RefreshRate: 100,
        },
        canvas
    );

    engine.resize(new Size_2D(0, 0), { FullScreen: true });

    const testScene = new ExempleScene();
    await testScene.ready;

    engine.services.SceneService.addScene("TestScene", testScene);
    engine.services.SceneService.activeScene = testScene;

    window.engineInstance = engine;

    const tileDragService = new TileDragService();
    tileDragService.initialize(engine, canvas);
    window.tileDragService = tileDragService;

    await tileDragService.loadMapFromServer(currentMapName);

    window.currentMapName = currentMapName;
    window.updateMapNameDisplay = updateMapNameDisplay;
    updateMapNameDisplay(currentMapName);

    const tileContextMenu = new TileContextMenu(tileDragService, canvas);
    window.tileContextMenu = tileContextMenu;

    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    backToMapsBtn.addEventListener('click', () => {
        mapSelector.show(async (selectedMapName) => {
            currentMapName = selectedMapName;
            window.currentMapName = currentMapName;
            console.log(`🗺️ Chargement de la nouvelle map : ${currentMapName}`);

            await tileDragService.loadMapFromServer(currentMapName);
            updateMapNameDisplay(currentMapName);
        }, true);
    });
}
// -- :: -- :: --:: -- :: -- \\

// -- :: Events :: -- \\
window.addEventListener('load', function () {
    canvas = document.getElementById("game-canvas");
    main();
});
// -- :: -- :: --:: -- :: -- \\
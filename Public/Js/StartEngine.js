// -- :: Dependencies :: -- \\
import {Engine}           from "/Engine/Classes/Base/Main/Engine.js";
import {SceneService}     from "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size_2D}          from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {PhysicService}    from "/Engine/Classes/Base/Services/Physic/PhysicService.js";
import {InputService}     from "/Engine/Classes/Base/Services/Inputs/InputService.js";
import {MapService}       from "/Engine/Classes/Base/Services/Grid/MapService.js";
import {GameModeService}  from "/Engine/Classes/Base/Services/GameMode/GameModeService.js";
import {ExempleScene}     from "/Engine/Classes/Custom/Scenes/ExempleScene.js";
import {TileDragService}  from "/Engine/Classes/Base/Services/Grid/TileDragService.js";
import {TileContextMenu}  from "/Engine/Classes/Base/Services/Grid/TileContextMenu.js";
// -- :: -- :: --:: -- :: -- \\

let canvas;
let mapSelector;

function updateMapNameDisplay(mapName) {
    const el = document.getElementById('current-map-name');
    if (el) el.textContent = mapName;
}

async function main() {
    mapSelector = new window.MapSelector();

    const initialMapName = await new Promise((resolve) => {
        mapSelector.show((selectedMapName) => {
            console.log(`🗺️ Chargement de la map : ${selectedMapName}`);
            resolve(selectedMapName);
        });
    });

    const mapService      = new MapService();
    const gameModeService = new GameModeService();

    const engine = new Engine(
        {
            SceneService:    new SceneService(),
            PhysicService:   new PhysicService(),
            InputService:    new InputService(),
            MapService:      mapService,
            GameModeService: gameModeService,
        },
        { TickRate: 10 },
        canvas
    );

    engine.resize(new Size_2D(0, 0), { FullScreen: true });

    const testScene = new ExempleScene();
    await testScene.ready;

    engine.services.SceneService.addScene("TestScene", testScene);
    engine.services.SceneService.activeScene = testScene;

    const tileDragService = new TileDragService();
    tileDragService.initialize(engine, canvas, mapService);

    await tileDragService.loadMapFromServer(initialMapName);
    updateMapNameDisplay(initialMapName);

    window.updateMapNameDisplay = updateMapNameDisplay;

    const tileContextMenu = new TileContextMenu(tileDragService, canvas, engine);
    window.tileContextMenu = tileContextMenu;

    window.gameModeService = gameModeService;

    window.tileDragService = tileDragService;

    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    backToMapsBtn.addEventListener('click', () => {
        mapSelector.show(async (selectedMapName) => {
            console.log(`🗺️ Chargement de la nouvelle map : ${selectedMapName}`);
            await tileDragService.loadMapFromServer(selectedMapName);
            updateMapNameDisplay(selectedMapName);
        }, true);
    });
}

window.addEventListener('load', () => {
    canvas = document.getElementById("game-canvas");
    main();
});
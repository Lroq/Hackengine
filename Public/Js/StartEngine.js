// -- :: Dependencies :: -- \\
import {Engine}         from "/Engine/Classes/Base/Main/Engine.js";
import {CollisionGroup} from "/Engine/Classes/Base/Services/Collision/CollisionGroup.js";
import {SceneLoader}    from  "/Engine/Classes/Base/Services/Scenes/SceneLoader.js";
import {SceneService}   from  "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size_2D}        from  "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {PhysicService}  from "/Engine/Classes/Base/Services/Physic/PhysicService.js";
import {InputService} from      "../../Engine/Classes/Base/Services/Inputs/InputService.js";
import {ExempleScene} from "../../Engine/Classes/Custom/Scenes/ExempleScene.js";
import {TileDragService} from "../../Engine/Classes/Base/Services/Grid/TileDragService.js";
import {TileContextMenu} from "../../Engine/Classes/Base/Services/Grid/TileContextMenu.js";
// -- :: -- :: --:: -- :: -- \\

let Canvas;

// -- :: Functions :: -- \\
async function main(){
    const EngineInstance = new Engine({
        SceneService :          new SceneService(),
        SceneLoaderService :    new SceneLoader(),
        CollisionGroupService : new CollisionGroup(),
        PhysicService :         new PhysicService(),
        InputService :          new InputService()
    },
        {
            TickRate: 10,
            RefreshRate : 100,
        }, Canvas)

    EngineInstance.resize(new Size_2D(0,0),{
        FullScreen : true,
    })

    const TestScene = new ExempleScene();

    EngineInstance.services.SceneService.addScene("TestScene",TestScene);
    EngineInstance.services.SceneService.activeScene = TestScene;

    // Exposer l'engine globalement pour TileContextMenu
    window.engineInstance = EngineInstance;

    // Initialiser le TileDragService
    const tileDragService = new TileDragService();
    tileDragService.initialize(EngineInstance, Canvas);

    // Exposer le service globalement pour debug/export et pour TileLoader.js
    window.tileDragService = tileDragService;

    // Charger la map sauvegardée (si elle existe)
    await tileDragService.loadMapFromServer();

    // Initialiser le TileContextMenu (clic droit sur les tuiles)
    const tileContextMenu = new TileContextMenu(tileDragService, Canvas);
    window.tileContextMenu = tileContextMenu;
}
// -- :: -- :: --:: -- :: -- \\

// -- :: Events :: -- \\
window.addEventListener('load', function() {
  Canvas = document.getElementById("game-canvas")
  main();
})
// -- :: -- :: --:: -- :: -- \\
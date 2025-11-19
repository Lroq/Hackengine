// -- :: Dependencies :: -- \\
import {Engine}         from "/Engine/Core/Engine.js";
import {CollisionGroup} from "/Engine/Classes/Base/Services/Collision/CollisionGroup.js";
import {SceneLoader}    from  "/Engine/Classes/Base/Services/Scenes/SceneLoader.js";
import {SceneService}   from  "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size2D}        from "/Engine/Utils/Size2D.js";
import {PhysicSystem}  from "/Engine/Systems/PhysicSystem.js";
import {InputSystem} from "../../Engine/Systems/InputSystem.js";
import {ExempleScene} from "../../Engine/Classes/Custom/Scenes/ExempleScene.js";
// -- :: -- :: --:: -- :: -- \\

let Canvas;

// -- :: Functions :: -- \\
async function main(){
    const EngineInstance = new Engine({
        SceneService :          new SceneService(),
        SceneLoaderService :    new SceneLoader(),
        CollisionGroupService : new CollisionGroup(),
        PhysicService :         new PhysicSystem(),
        InputService :          new InputSystem()
    },
        {
            TickRate: 10,
            RefreshRate : 100,
        }, Canvas)

    EngineInstance.resize(new Size2D(0,0),{
        FullScreen : true,
    })

    const TestScene = new ExempleScene();

    EngineInstance.services.SceneService.addScene("TestScene",TestScene);
    EngineInstance.services.SceneService.activeScene = TestScene;
}
// -- :: -- :: --:: -- :: -- \\

// -- :: Events :: -- \\
window.addEventListener('load', function() {
  Canvas = document.getElementById("game-canvas")
  main();
})
// -- :: -- :: --:: -- :: -- \\
// -- :: Dependencies :: -- \\
import {Engine}         from "/Engine/Classes/Base/Main/Engine.js";
import {SceneService}   from "/Engine/Classes/Base/Services/Scenes/SceneService.js";
import {Size_2D}        from "/Engine/Classes/Base/MicroClasses/Size_2D.js";
import {PhysicService}  from "/Engine/Classes/Base/Services/Physic/PhysicService.js";
import {InputService}   from "/Engine/Classes/Base/Services/Inputs/InputService.js";
import {ExempleScene}   from "/Engine/Classes/Custom/Scenes/ExempleScene.js";
import {TileDragService} from "/Engine/Classes/Base/Services/Grid/TileDragService.js";
import {TileContextMenu} from "/Engine/Classes/Base/Services/Grid/TileContextMenu.js";
import {GameModeService} from "/Engine/Classes/Base/Services/GameModeService.js";
import {MapService}     from "/Engine/Classes/Base/Services/Grid/MapService.js";
import {NPCService}     from "/Engine/Classes/Base/Services/NPC/NPCService.js";
import {NPCPlacementService} from "/Engine/Classes/Base/Services/NPC/NPCPlacementService.js";
import {NPCContextMenu} from "/Engine/Classes/Base/Services/NPC/NPCContextMenu.js";
import {initializeGameController} from "/Public/Js/GameController.js";
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

async function main(){
    Canvas = document.getElementById("game-canvas");

    // Afficher le sélecteur de map au démarrage
    mapSelector = new window.MapSelector();

    await new Promise((resolve) => {
        mapSelector.show((selectedMapName) => {
            currentMapName = selectedMapName;
            console.log(`🗺️ Chargement de la map : ${currentMapName}`);
            resolve();
        });
    });

    const gameModeService = new GameModeService();
    const mapService = new MapService();
    const tileDragService = new TileDragService(); // Instantiated here but injected via services
    const npcService = new NPCService();
    const npcPlacementService = new NPCPlacementService(Canvas);

    const EngineInstance = new Engine({
            SceneService :          new SceneService(),
            PhysicService :         new PhysicService(),
            InputService :          new InputService(),
            GameModeService:        gameModeService,
            MapService:             mapService,
            TileDragService:        tileDragService,
            NPCService:             npcService,
            NPCPlacementService:    npcPlacementService
        },
        {
            TickRate: 10,
            RefreshRate : 100,
        }, Canvas)

    // Initialize Services
    gameModeService.initialize(EngineInstance);
    mapService.initialize(EngineInstance);
    tileDragService.initialize(EngineInstance, Canvas);
    npcService.initialize(EngineInstance);
    npcPlacementService.initialize(EngineInstance);

    EngineInstance.resize(new Size_2D(0,0),{
        FullScreen : true,
    })

    const TestScene = new ExempleScene();

    // Attendre que la scène soit prête (init asynchrone)
    if (TestScene.ready) {
        await TestScene.ready;
    }

    EngineInstance.services.SceneService.addScene("TestScene",TestScene);
    EngineInstance.services.SceneService.activeScene = TestScene;

    // Exposer l'engine globalement pour TileContextMenu (legacy compatibility if needed)
    window.engineInstance = EngineInstance;
    window.currentMapName = currentMapName;
    window.updateMapNameDisplay = updateMapNameDisplay;

    // Charger la map sélectionnée VIA MapService
    await mapService.loadMapFromServer(currentMapName);

    // Charger les PNJ de cette map
    await npcService.loadNPCsFromServer(currentMapName);

    // Initialiser le TileContextMenu (clic droit sur les tuiles)
    const tileContextMenu = new TileContextMenu(tileDragService, Canvas);
    // Injecter l'engine dans TileContextMenu
    tileContextMenu.injectEngine(EngineInstance);
    window.tileContextMenu = tileContextMenu;

    // Initialiser le menu contextuel des PNJ (Alt+Clic sur un PNJ)
    const npcContextMenu = new NPCContextMenu(Canvas);
    npcContextMenu.injectEngine(EngineInstance);
    window.npcContextMenu = npcContextMenu;
    window.npcPlacementService = npcPlacementService;

    // Update display
    updateMapNameDisplay(currentMapName);

    // Attendre que le TileInteractionManager soit initialisé par la scène
    // puis le connecter au Renderer
    setTimeout(() => {
        if (window.tileInteractionManager) {
            EngineInstance.services.SceneService.activeScene.renderer = EngineInstance;

            if (EngineInstance.setTileInteractionManager) {
                EngineInstance.setTileInteractionManager(window.tileInteractionManager);
                console.log('✅ TileInteractionManager connecté au Renderer');
            }
        }
    }, 1000); // Wait for scene to fully load

    // Initialiser le contrôleur de jeu (UI, Modes)
    const gameController = initializeGameController(EngineInstance);
    window.setMode = gameController.setMode; // Exposer pour compatibilité si nécessaire

    // Gestion du bouton de retour à la sélection des maps
    const backToMapsBtn = document.getElementById('back-to-maps-btn');
    if (backToMapsBtn) {
        backToMapsBtn.addEventListener('click', () => {
            // Réouvrir le sélecteur de maps avec le bouton de fermeture
            mapSelector.show(async (selectedMapName) => {
                currentMapName = selectedMapName;
                window.currentMapName = currentMapName;
                console.log(`🗺️ Chargement de la nouvelle map : ${currentMapName}`);

                // Charger la nouvelle map via le service
                await mapService.loadMapFromServer(currentMapName);

                // Charger les PNJ de la nouvelle map
                await npcService.loadNPCsFromServer(currentMapName);

                // Mettre à jour l'affichage du nom de la map
                updateMapNameDisplay(currentMapName);
            }, true); // true = afficher le bouton de fermeture
        });
    }
}

window.onload = main;

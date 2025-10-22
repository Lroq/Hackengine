import {Scene} from "../../Base/Services/Scenes/Scene.js";
import {Tile} from "../../Base/WebGameObjects/Tile.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";
import {TextLabel} from "../../Base/WebGameObjects/TextLabel.js";
import {Player} from "../WebGameObjects/Player.js";

class ExempleScene extends Scene {
    async buildScene(){

        for (let i = 2; i < 11; i++) {
            for (let a = 0; a < 8; a++) {
                const TileInstance = new Tile();
                TileInstance.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_floor_house_1.png")

                TileInstance.coordinates.X = i * TileInstance.components.BoxCollider.hitbox.Width;
                TileInstance.coordinates.Y = a * TileInstance.components.BoxCollider.hitbox.Width;

                TileInstance.components.BoxCollider.enabled = false

                super.addWGObject(TileInstance)
            }
        }

        for (let i = 2; i < 11; i++) {
            for (let a = -2; a < 2; a++) {
                const TileInstance = new Tile();
                TileInstance.components.SpriteModel.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_wall_house_1.png")

                TileInstance.coordinates.X = i * TileInstance.components.BoxCollider.hitbox.Width
                TileInstance.coordinates.Y = a * TileInstance.components.BoxCollider.hitbox.Width

                super.addWGObject(TileInstance)
            }
        }

        const Text = new TextLabel();
        Text.font = "Pixel Font"
        Text.color = "red"
        Text.coordinates.Y = 10
        super.addWGObject(Text)

        const PlayerInstance = new Player();
        super.addWGObject(PlayerInstance);

            // Creation of the camera who follow the player
        super.activeCamera.cameraSubject = PlayerInstance;
    }

    constructor() {
        super();
        this.buildScene();
    }
}

export {ExempleScene}
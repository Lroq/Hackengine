import { Utils } from "../../Base/Services/Utilities/Utils.js";

export const PLAYER_STATE = {
    Idling: 0, // Player is not moving
    Moving: 1, // Player is moving
    Freeze: 2, // Controls are frozen (for scripted cutscenes or anything else)
}

export const SPRITES = {
    IDLE: Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), MOVING: {
        Down: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_3.png")],
        Right: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_3.png")],
        Up : [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_3.png")],
    }
}

export  const FACING = {
    Down: "Down", Up: "Up", Right: "Right", Left: "Left"
}
import {Character} from "./Character.js";
import {Utils} from "../../Base/Services/Utilities/Utils.js";

const PLAYER_STATE = {
    Idling: 0, // Player is not moving
    Moving: 1, // Player is moving
    Freeze: 2, // Controls are frozen (for scripted cutscenes or anything else)
}

const SPRITES = {
    IDLE: Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), MOVING: {
        Down: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_3.png")],
        Right: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_3.png")],
        Up : [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_3.png")],
    }
}

const FACING = {
    Down: "Down", Up: "Up", Right: "Right", Left: "Left"
}

class Player extends Character {
    #GlobalState = PLAYER_STATE.Idling;
    #AnimationFrame = 0;
    #Face = FACING.Right;

    constructor(username) {
        super(username);
        this.hp = 3;
    }

    #run_Idling(Services, DeltaTime) {
        super.components.this.sprite = SPRITES.MOVING[this.#Face][0]
        if (Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Moving;
        }
    }

    #run_Moving(Services, DeltaTime) {
        const IsStopped = super.components.PhysicController.velocity.X == 0 && super.components.PhysicController.velocity.Y == 0

        super.components.velocity.Y = 0;
        super.components.velocity.X = 0;

        if (Services.InputService.IsKeyDown("z")) {
            this.#Face = FACING.Up
            super.components.velocity.Y = -0.8;
        } else if (Services.InputService.IsKeyDown("s")) {
            this.#Face = FACING.Down
            super.components.velocity.Y = 0.8;
        }

        if (Services.InputService.IsKeyDown("q")) {
            super.components.velocity.X = -0.8;
            super.components.rotation = -1
            this.#Face = FACING.Right
        } else if (Services.InputService.IsKeyDown("d")) {
            super.components.rotation = 1
            this.#Face = FACING.Right
            super.components.velocity.X = 0.8;
        }

        if (!Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Idling;
        }

        if (!IsStopped) {
            this.#AnimationFrame = (this.#AnimationFrame + 0.06) % 3
        }else{
            this.#AnimationFrame = 0
        }

        super.components.sprite = SPRITES.MOVING[this.#Face][Math.round(this.#AnimationFrame)]
    }

    run(Services, DeltaTime) {
        switch (this.#GlobalState) {
            case PLAYER_STATE.Idling: {
                this.#run_Idling(Services, DeltaTime)
                break;
            }
            case PLAYER_STATE.Moving: {
                this.#run_Moving(Services, DeltaTime)
                break;
            }
            case PLAYER_STATE.Freeze: {
                break
            }
        }
    }
}

export {Player , SPRITES}
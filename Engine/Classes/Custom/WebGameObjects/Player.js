import {Instance} from "/Engine/Entities/Instance.js";
import {SpriteModel} from "/Engine/Components/SpriteModel.js";
import {BoxCollider} from "/Engine/Components/BoxCollider.js";
import {PhysicController} from "/Engine/Components/PhysicController.js";
import {Utils} from "/Engine/Classes/Base/Services/Utilities/Utils.js"
import {Shadow} from "./Shadow.js";
import {NameTag} from "./NameTag.js";
import {TextLabel} from "../../../Entities/TextLabel.js";

const PLAYER_STATE = {
    Idling: 0, // Player is not moving
    Moving: 1, // Player is moving
    Freeze: 2, // Controls are frozen (for scripted cutscenes or anything else)
}

const FACING = {
    Down: "Down", Up: "Up", Right: "Right", Left: "Left"
}

const SPRITES = {
    IDLE: Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), MOVING: {
        Down: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Down_3.png")],
        Right: [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Right_3.png")],
        Up : [Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_0.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_1.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_2.png"), Utils.createSprite("/Public/Assets/Game/Characters/Attacker_Up_3.png")],
    }
}

class Player extends Instance {
    #GlobalState = PLAYER_STATE.Idling;
    #AnimationFrame = 0;
    #Face = FACING.Right;

    constructor(username) {
        super();
        const Tag = new NameTag(username)

        Tag.coordinates.Y = -65;
        Tag.coordinates.X = -5;

        super.addChild(Tag)

        const Sprite = new SpriteModel();
        const Physic = new PhysicController();
        const Collider = new BoxCollider();

        Sprite.sprite = SPRITES.IDLE;
        Sprite.enabled = true;
        Sprite.size.Height = 54;
        Sprite.size.Width = 27;
        Sprite.spriteOffset.Y = -50;
        Sprite.spriteOffset.X = -4;

        Physic.gravityEnabled = false;
        Collider.enabled = true;

        Collider.hitbox.Width = 20
        Collider.hitbox.Height = 4

        super.addComponent(Sprite);
        super.addComponent(Physic);
        super.addComponent(Collider);
    }

    #run_Idling(Services, DeltaTime) {
        super.components.SpriteModel.sprite = SPRITES.MOVING[this.#Face][0]
        if (Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Moving;
        }
    }

    #run_Moving(Services, DeltaTime) {
        const IsStopped = super.components.PhysicController.velocity.X == 0 && super.components.PhysicController.velocity.Y == 0

        super.components.PhysicController.velocity.Y = 0;
        super.components.PhysicController.velocity.X = 0;

        if (Services.InputService.IsKeyDown("z")) {
            this.#Face = FACING.Up
            super.components.PhysicController.velocity.Y = -0.8;
        } else if (Services.InputService.IsKeyDown("s")) {
            this.#Face = FACING.Down
            super.components.PhysicController.velocity.Y = 0.8;
        }

        if (Services.InputService.IsKeyDown("q")) {
            super.components.PhysicController.velocity.X = -0.8;
            super.components.SpriteModel.rotation = -1
            this.#Face = FACING.Right
        } else if (Services.InputService.IsKeyDown("d")) {
            super.components.SpriteModel.rotation = 1
            this.#Face = FACING.Right
            super.components.PhysicController.velocity.X = 0.8;
        }

        if (!Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Idling;
        }

        if (!IsStopped) {
            this.#AnimationFrame = (this.#AnimationFrame + 0.06) % 3
        }else{
            this.#AnimationFrame = 0
        }

        super.components.SpriteModel.sprite = SPRITES.MOVING[this.#Face][Math.round(this.#AnimationFrame)]
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

export {Player}
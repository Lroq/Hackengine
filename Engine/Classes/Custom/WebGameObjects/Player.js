import {Character} from "./Character.js";
import {NameTag} from "./NameTag.js";
import {FACING, PLAYER_STATE , SPRITES} from "./PlayerUtils.js";
import {SpriteModel} from "../../Base/Components/SpriteModel.js";
import {PhysicController} from "../../Base/Components/PhysicController.js";


class Player extends Character {
    #GlobalState = PLAYER_STATE.Idling;
    #AnimationFrame = 0;
    #Face = FACING.Right;

    constructor(username) {
        super();
        const Tag = new NameTag(username)

        Tag.coordinates.Y = -65;
        Tag.coordinates.X = -5;

        super.addChild(Tag)

        this.hp = 3;
    }

    #run_Idling(Services) {
        const sprite = this.getComponent(SpriteModel)       ;
        sprite.sprite = SPRITES.MOVING[this.#Face][0];

        if (Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Moving;
        }
    }

    #run_Moving(Services) {
        const physic = this.getComponent(PhysicController);
        const sprite = this.getComponent(SpriteModel);

        const IsStopped = super.components.PhysicController.velocity.X === 0 && super.components.PhysicController.velocity.Y == 0

        physic.velocity.Y = 0;
        physic.velocity.X = 0;

        if (Services.InputService.IsKeyDown("z")) {
            this.#Face = FACING.Up
            physic.velocity.Y = -0.8;
        } else if (Services.InputService.IsKeyDown("s")) {
            this.#Face = FACING.Down
            physic.velocity.Y = 0.8;
        }

        if (Services.InputService.IsKeyDown("q")) {
            physic.velocity.X = -0.8;
            sprite.rotation = -1
            this.#Face = FACING.Right
        } else if (Services.InputService.IsKeyDown("d")) {
            sprite.rotation = 1
            this.#Face = FACING.Right
            physic.velocity.X = 0.8;
        }

        if (!Services.InputService.IsEitherKeyDown(["z", "q", "s", "d"])) {
            this.#GlobalState = PLAYER_STATE.Idling;
        }

        if (!IsStopped) {
            this.#AnimationFrame = (this.#AnimationFrame + 0.06) % 3
        }else{
            this.#AnimationFrame = 0
        }

        sprite.sprite = SPRITES.MOVING[this.#Face][Math.round(this.#AnimationFrame)];
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

export {Player }




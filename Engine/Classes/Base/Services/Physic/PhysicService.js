import {Instance} from "../../WebGameObjects/Instance.js";

const COLLISION_OFFSET = 0.01;

class PhysicService {
    calculate(WGObject, Scene, DeltaTime) {
        const PhysicController = WGObject.components.PhysicController;

        if (PhysicController) {
            this.#calculateGravity(WGObject, DeltaTime)
            this.#calculateCollisions(WGObject, Scene, DeltaTime)
        }
    }

    #calculateGravity(WGObject, DeltaTime) {
        const PhysicController = WGObject.components.PhysicController;

        if (!WGObject.components.PhysicController.enabled) {
            PhysicController.velocity.Y = 0;
            PhysicController.velocity.X = 0;
            return
        }

        if (PhysicController.gravityEnabled) {
            PhysicController.velocity.Y += 0.03;
        }
    }

    #calculateCollisions(WGObject, Scene, DeltaTime) {
        const Collider = WGObject.components.BoxCollider;
        const PhysicController = WGObject.components.PhysicController;

        if (Collider && Collider.enabled) {
            const WGObjects = Scene.wgObjects;

            const InitialX = WGObject.coordinates.X,
                InitialY = WGObject.coordinates.Y;

            const XVelocity = PhysicController.velocity.X,
                YVelocity = PhysicController.velocity.Y;

            // -- :: Calculate X Velocity :: -- \\

            WGObject.coordinates.X += XVelocity;

            WGObjects.forEach(CWgObject => {
                if (CWgObject !== WGObject && this.detectTouch(WGObject, CWgObject)) {
                    const direction = XVelocity > 0 ? 1 : -1;
                    if (direction === 1) {
                        WGObject.coordinates.X = CWgObject.coordinates.X - WGObject.components.BoxCollider.hitbox.Width - COLLISION_OFFSET;
                    } else {
                        WGObject.coordinates.X = CWgObject.coordinates.X + CWgObject.components.BoxCollider.hitbox.Width + COLLISION_OFFSET;
                    }
                    PhysicController.velocity.X = 0;
                }
            });

            // -- :: Calculate Y Velocity :: -- \\

            WGObject.coordinates.Y += YVelocity;

            WGObjects.forEach(CWgObject => {
                if (CWgObject !== WGObject && this.detectTouch(WGObject, CWgObject)) {
                    const direction = YVelocity > 0 ? 1 : -1;
                    if (direction === 1) {

                        WGObject.coordinates.Y = CWgObject.coordinates.Y - WGObject.components.BoxCollider.hitbox.Height - COLLISION_OFFSET;
                    } else {
                        WGObject.coordinates.Y = CWgObject.coordinates.Y + CWgObject.components.BoxCollider.hitbox.Height + COLLISION_OFFSET;
                    }
                    PhysicController.velocity.Y = 0;
                }
            });

        } else {
            WGObject.coordinates.X += PhysicController.velocity.X;
            WGObject.coordinates.Y += PhysicController.velocity.Y;
        }
    }

    detectTouch(InstanceA, InstanceB) {
        const ColliderA = InstanceA.components.BoxCollider;
        const ColliderB = InstanceB.components.BoxCollider;

        if (ColliderA === undefined || ColliderB === undefined) {
            return false;
        }

        if (!ColliderA.enabled || !ColliderB.enabled) {
            return false;
        }

        const leftA = InstanceA.coordinates.X;
        const rightA = InstanceA.coordinates.X + ColliderA.hitbox.Width;
        const topA = InstanceA.coordinates.Y;
        const bottomA = InstanceA.coordinates.Y + ColliderA.hitbox.Height;

        const leftB = InstanceB.coordinates.X;
        const rightB = InstanceB.coordinates.X + ColliderB.hitbox.Width;
        const topB = InstanceB.coordinates.Y;
        const bottomB = InstanceB.coordinates.Y + ColliderB.hitbox.Height;

        if (rightA >= leftB && leftA <= rightB && bottomA >= topB && topA <= bottomB) {
            return true;
        }

        return false;
    }
}

export {PhysicService}
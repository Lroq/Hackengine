import {Logger} from '../Services/Logger.js';

/**
 * Collision offset to prevent objects from getting stuck.
 * @constant {number}
 */
const COLLISION_OFFSET = 0.01;

/**
 * Default gravity acceleration.
 * @constant {number}
 */
const GRAVITY_ACCELERATION = 0.03;

/**
 * System that handles physics simulation, collision detection, and resolution.
 * @class PhysicSystem
 */
class PhysicSystem {
    #gravityAcceleration;

    /**
     * Creates a new physics system.
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.gravity=0.03] - Gravity acceleration
     */
    constructor(options = {}) {
        this.#gravityAcceleration = options.gravity ?? GRAVITY_ACCELERATION;
    }

    /**
     * Main physics calculation for an entity.
     * @param {WGObject} entity - Entity to simulate
     * @param {Scene} scene - Active scene containing all entities
     * @param {number} deltaTime - Time delta for frame-independent physics
     */
    calculate(entity, scene, deltaTime) {
        const physicController = entity.getComponent('PhysicController');

        if (!physicController || !physicController.enabled) {
            return;
        }

        this.#applyGravity(physicController, deltaTime);
        this.#resolveCollisions(entity, scene, physicController);
    }

    /**
     * Applies gravity to an entity.
     * @private
     * @param {PhysicController} physicController - Physics component
     * @param {number} deltaTime - Time delta
     */
    #applyGravity(physicController, deltaTime) {
        if (physicController.gravityEnabled) {
            physicController.velocity.y += this.#gravityAcceleration * deltaTime;
        }
    }

    /**
     * Resolves collisions and updates entity position.
     * @private
     * @param {WGObject} entity - Entity to check
     * @param {Scene} scene - Active scene
     * @param {PhysicController} physicController - Physics component
     */
    #resolveCollisions(entity, scene, physicController) {
        const collider = entity.getComponent('BoxCollider');

        if (!collider || !collider.enabled) {
            // No collider, just apply velocity
            entity.coordinates.x += physicController.velocity.x;
            entity.coordinates.y += physicController.velocity.y;
            return;
        }

        const entities = scene.entities || scene.wgObjects;
        const velocity = physicController.velocity;

        // Handle X-axis movement
        entity.coordinates.x += velocity.x;

        for (const other of entities) {
            if (other !== entity && this.#detectCollision(entity, other)) {
                this.#resolveXCollision(entity, other, velocity);
                break;
            }
        }

        // Handle Y-axis movement
        entity.coordinates.y += velocity.y;

        for (const other of entities) {
            if (other !== entity && this.#detectCollision(entity, other)) {
                this.#resolveYCollision(entity, other, velocity);
                break;
            }
        }
    }

    /**
     * Resolves collision on X-axis.
     * @private
     */
    #resolveXCollision(entity, other, velocity) {
        const collider = entity.getComponent('BoxCollider');
        const otherCollider = other.getComponent('BoxCollider');

        if (velocity.x > 0) {
            // Moving right, push left
            entity.coordinates.x = other.coordinates.x - collider.hitbox.width - COLLISION_OFFSET;
        } else {
            // Moving left, push right
            entity.coordinates.x = other.coordinates.x + otherCollider.hitbox.width + COLLISION_OFFSET;
        }
        velocity.x = 0;
    }

    /**
     * Resolves collision on Y-axis.
     * @private
     */
    #resolveYCollision(entity, other, velocity) {
        const collider = entity.getComponent('BoxCollider');
        const otherCollider = other.getComponent('BoxCollider');

        if (velocity.y > 0) {
            // Moving down, push up
            entity.coordinates.y = other.coordinates.y - collider.hitbox.height - COLLISION_OFFSET;
        } else {
            // Moving up, push down
            entity.coordinates.y = other.coordinates.y + otherCollider.hitbox.height + COLLISION_OFFSET;
        }
        velocity.y = 0;
    }

    /**
     * Detects collision between two entities using AABB.
     * @param {WGObject} entityA - First entity
     * @param {WGObject} entityB - Second entity
     * @returns {boolean} True if entities are colliding
     */
    #detectCollision(entityA, entityB) {
        const colliderA = entityA.getComponent('BoxCollider');
        const colliderB = entityB.getComponent('BoxCollider');

        if (!colliderA || !colliderB || !colliderA.enabled || !colliderB.enabled) {
            return false;
        }

        const boundsA = colliderA.getBounds(entityA.coordinates);
        const boundsB = colliderB.getBounds(entityB.coordinates);

        return (
            boundsA.right >= boundsB.left &&
            boundsA.left <= boundsB.right &&
            boundsA.bottom >= boundsB.top &&
            boundsA.top <= boundsB.bottom
        );
    }

    /**
     * Public method to check collision between two entities.
     * @param {WGObject} entityA - First entity
     * @param {WGObject} entityB - Second entity
     * @returns {boolean} True if colliding
     */
    detectCollision(entityA, entityB) {
        return this.#detectCollision(entityA, entityB);
    }

    /**
     * Sets gravity acceleration.
     * @param {number} value - New gravity value
     */
    setGravity(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new TypeError('Gravity must be a finite number');
        }
        this.#gravityAcceleration = value;
    }

    /**
     * Gets current gravity acceleration.
     * @returns {number} Gravity value
     */
    getGravity() {
        return this.#gravityAcceleration;
    }
}

export {PhysicSystem, COLLISION_OFFSET, GRAVITY_ACCELERATION};
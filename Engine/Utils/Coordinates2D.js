/**
 * Represents a 2D coordinate in world space.
 * @class Coordinates2D
 */
class Coordinates2D {
    #x = 0;
    #y = 0;

    /**
     * Creates a new 2D coordinate.
     * @param {number} [x=0] - X coordinate
     * @param {number} [y=0] - Y coordinate
     * @throws {TypeError} If x or y is not a number
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @returns {number} The x coordinate
     */
    get x() {
        return this.#x;
    }

    /**
     * @param {number} value - The x coordinate
     * @throws {TypeError} If value is not a number
     */
    set x(value) {
        if (typeof value !== 'number') {
            throw new TypeError(`Coordinates2D.x must be a number, got ${typeof value}`);
        }
        if (!Number.isFinite(value)) {
            throw new RangeError(`Coordinates2D.x must be finite, got ${value}`);
        }
        this.#x = value;
    }

    /**
     * @returns {number} The y coordinate
     */
    get y() {
        return this.#y;
    }

    /**
     * @param {number} value - The y coordinate
     * @throws {TypeError} If value is not a number
     */
    set y(value) {
        if (typeof value !== 'number') {
            throw new TypeError(`Coordinates2D.y must be a number, got ${typeof value}`);
        }
        if (!Number.isFinite(value)) {
            throw new RangeError(`Coordinates2D.y must be finite, got ${value}`);
        }
        this.#y = value;
    }

    /**
     * Sets both coordinates at once.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Coordinates2D} This instance for chaining
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Creates a copy of this coordinate.
     * @returns {Coordinates2D} A new coordinate with the same values
     */
    clone() {
        return new Coordinates2D(this.#x, this.#y);
    }

    /**
     * Adds another coordinate to this one.
     * @param {Coordinates2D} other - Coordinate to add
     * @returns {Coordinates2D} This instance for chaining
     */
    add(other) {
        this.#x += other.x;
        this.#y += other.y;
        return this;
    }

    /**
     * Calculates distance to another coordinate.
     * @param {Coordinates2D} other - Target coordinate
     * @returns {number} Distance
     */
    distanceTo(other) {
        const dx = this.#x - other.x;
        const dy = this.#y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export {Coordinates2D};
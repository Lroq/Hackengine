/**
 * Represents 2D dimensions (width and height).
 * @class Size2D
 */
class Size2D {
    #width = 0;
    #height = 0;

    /**
     * Creates a new 2D size.
     * @param {number} [width=0] - Width dimension
     * @param {number} [height=0] - Height dimension
     * @throws {TypeError} If width or height is not a number
     * @throws {RangeError} If width or height is negative
     */
    constructor(width = 0, height = 0) {
        this.width = width;
        this.height = height;
    }

    /**
     * @returns {number} The width
     */
    get width() {
        return this.#width;
    }

    /**
     * @param {number} value - The width
     * @throws {TypeError} If value is not a number
     * @throws {RangeError} If value is negative or not finite
     */
    set width(value) {
        if (typeof value !== 'number') {
            throw new TypeError(`Size2D.width must be a number, got ${typeof value}`);
        }
        if (!Number.isFinite(value)) {
            throw new RangeError(`Size2D.width must be finite, got ${value}`);
        }
        if (value < 0) {
            throw new RangeError(`Size2D.width must be non-negative, got ${value}`);
        }
        this.#width = value;
    }

    /**
     * @returns {number} The height
     */
    get height() {
        return this.#height;
    }

    /**
     * @param {number} value - The height
     * @throws {TypeError} If value is not a number
     * @throws {RangeError} If value is negative or not finite
     */
    set height(value) {
        if (typeof value !== 'number') {
            throw new TypeError(`Size2D.height must be a number, got ${typeof value}`);
        }
        if (!Number.isFinite(value)) {
            throw new RangeError(`Size2D.height must be finite, got ${value}`);
        }
        if (value < 0) {
            throw new RangeError(`Size2D.height must be non-negative, got ${value}`);
        }
        this.#height = value;
    }

    /**
     * Sets both dimensions at once.
     * @param {number} width - Width dimension
     * @param {number} height - Height dimension
     * @returns {Size2D} This instance for chaining
     */
    set(width, height) {
        this.width = width;
        this.height = height;
        return this;
    }

    /**
     * Creates a copy of this size.
     * @returns {Size2D} A new size with the same values
     */
    clone() {
        return new Size2D(this.#width, this.#height);
    }

    /**
     * Calculates the area.
     * @returns {number} Width × Height
     */
    get area() {
        return this.#width * this.#height;
    }
}

export {Size2D};
class Coordinates2D {
    #X = 0;
    #Y = 0;

    constructor(X=0,Y=0) {
        this.#X = X;
        this.#Y = Y;
    }

    get X() {
        return this.#X;
    }

    set X(value) {
        if (typeof value === 'number') {
            this.#X = value;
        } else {
            throw new TypeError("X must be a number.");
        }
    }

    get Y() {
        return this.#Y;
    }

    set Y(value) {
        if (typeof value === 'number') {
            this.#Y = value;
        } else {
            throw new TypeError("Y Must be a number");
        }
    }
}

export { Coordinates2D }

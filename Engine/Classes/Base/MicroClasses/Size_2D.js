class Size_2D {
    #Height = 0;
    #Width = 0;

    constructor(H=0,W=0) {
        this.#Height = H;
        this.#Width = W;
    }

    get Height() {
        return this.#Height;
    }

    set Height(value) {
        if (typeof value === 'number') {
            this.#Height = value;
        } else {
            throw new TypeError("Height must be a number.");
        }
    }

    get Width() {
        return this.#Width;
    }

    set Width(value) {
        if (typeof value === 'number') {
            this.#Width = value;
        } else {
            throw new TypeError("Width Must be a number");
        }
    }
}

export {Size_2D}

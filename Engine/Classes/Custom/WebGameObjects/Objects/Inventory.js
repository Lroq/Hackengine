/**
 * Inventaire d'un personnage.
 */
export class Inventory {
    #items = [];

    constructor() {
        this.size    = 0;
        this.sizeMax = 50;
    }

    get isFull() {
        return this.#items.length >= this.sizeMax;
    }

    get items() {
        return [...this.#items];
    }
}
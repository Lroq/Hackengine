class Hackemon {
    #data;
    #currentHP;
    #level;

    constructor(data, level = 5) {
        this.#data = data;
        this.#level = level;
        this.#currentHP = data.baseStats.hp;
    }

    get data() {
        return this.#data;
    }

    get currentHP() {
        return this.#currentHP;
    }

    set currentHP(value) {
        this.#currentHP = Math.max(0, Math.min(value, this.#data.baseStats.hp));
    }

    get level() {
        return this.#level;
    }

    get maxHP() {
        return this.#data.baseStats.hp;
    }

    get name() {
        return this.#data.name;
    }

    get attack() {
        return this.#data.baseStats.attack;
    }

    get defense() {
        return this.#data.baseStats.defense;
    }

    get speed() {
        return this.#data.baseStats.speed;
    }

    get spriteURL() {
        return this.#data.spriteURL;
    }

    get attacks() {
        return this.#data.attacks;
    }

    get types() {
        return this.#data.types;
    }

    takeDamage(damage) {
        this.#currentHP = Math.max(0, this.#currentHP - damage);
        return this.#currentHP === 0;
    }

    heal(amount) {
        this.#currentHP = Math.min(this.#data.baseStats.hp, this.#currentHP + amount);
    }

    isAlive() {
        return this.#currentHP > 0;
    }
}

export { Hackemon };
import {WGObject} from "/Engine/Classes/Base/WebGameObjects/WGObject.js";

class TextLabel extends WGObject {
    #Text = "Label";
    #Size = 12;
    #Color = "White";
    #TextAlign = "center";
    #Font = "Arial";

    constructor() {
        super();
    }

    get text() {
        return this.#Text;
    }

    set text(Value) {
        if (typeof Value === "string") {
            this.#Text = Value;
        } else {
            this.#Text = "Label";
        }
    }

    get size() {
        return this.#Size;
    }

    set size(Value) {
        if (typeof Value === "number") {
            this.#Size = Value;
        } else {
            this.#Size = 12;
        }
    }

    get color() {
        return this.#Color;
    }

    set color(Value) {
        if (typeof Value === "string") {
            this.#Color = Value;
        } else {
            this.#Color = "White";
        }
    }

    get textAlign() {
        return this.#TextAlign;
    }

    set textAlign(Value) {
        const validAlignments = ["left", "right", "center", "start", "end", "middle"];
        if (typeof Value === "string" && validAlignments.includes(Value.toLowerCase())) {
            this.#TextAlign = Value.toLowerCase();
        } else {
            this.#TextAlign = "middle";
        }
    }

    get font() {
        return this.#Font;
    }

    set font(Value) {
        if (typeof Value === "string") {
            this.#Font = Value;
        } else {
            this.#Font = "Arial";
        }
    }

    relativeScale() {
        if (super.parent !== undefined) {
            const SpriteModel = super.parent.components.SpriteModel;

            if (SpriteModel === undefined) {
                console.warn("No sprite model found in parent to scale to.");
                return;
            }

            const parentWidth = SpriteModel.size.Width;
            const parentHeight = SpriteModel.size.Height;

            const baseSize = (parentHeight / 10) * 5;
            const textLenFactor = (this.text.length / 10) * parentHeight / 6;
            const finalSize = Math.max(baseSize - textLenFactor,0)
            this.size = finalSize;

            this.coordinates.X = parentWidth / 2;
            this.coordinates.Y = parentHeight / 2;
        } else {
            console.warn(`Couldn't scale ${this}. No parent found.`);
        }
    }

}

export {TextLabel};

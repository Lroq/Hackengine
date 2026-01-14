export class Utils {
    static async wait(Seconds) {
        return new Promise(resolve => setTimeout(resolve, Seconds * 1000));
    }

    static createSprite(src){
        const img = new Image();
        img.src = src;

        return img;
    }
}


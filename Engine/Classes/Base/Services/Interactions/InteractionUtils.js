class InteractionUtils {
    static distance2D(ax, ay, bx, by) {
        return Math.hypot(ax - bx, ay - by);
    }

    static rectsOverlap(a, b) {
        return (
            a.left <= b.right &&
            a.right >= b.left &&
            a.top <= b.bottom &&
            a.bottom >= b.top
        );
    }

    static getObjectRect(object, width = 0, height = 0) {
        const x = object.coordinates?.X ?? 0;
        const y = object.coordinates?.Y ?? 0;

        return {
            left: x,
            top: y,
            right: x + width,
            bottom: y + height
        };
    }

    static normalizeDialogueLines(value) {
        if (Array.isArray(value)) {
            return value.flat().map(line => String(line));
        }
        return [String(value)];
    }
}

export { InteractionUtils };


class DialogueBox {
    #isVisible = false;
    #currentLines = [];
    #callback = null;

    show(text, callback = null) {
        this.#isVisible = true;
        if (Array.isArray(text)) {
            this.#currentLines = text.flat().map(line => String(line));
        } else {
            this.#currentLines = [String(text)];
        }
        this.#callback = callback;
        this.#render();
    }

    hide() {
        this.#isVisible = false;
        this.#render();
        if (this.#callback) {
            this.#callback();
            this.#callback = null;
        }
    }

    #render() {
        let box = document.getElementById('dialogue-box');

        if (!this.#isVisible) {
            if (box) box.remove();
            return;
        }

        if (!box) {
            box = document.createElement('div');
            box.id = 'dialogue-box';
            box.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                max-width: 600px;
                background: rgba(26, 26, 29, 0.95);
                border: 2px solid #3a3a3f;
                border-radius: 12px;
                padding: 20px;
                color: white;
                font-family: 'Pixel Font', monospace;
                font-size: 16px;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            document.body.appendChild(box);
        }

        const linesHtml = this.#currentLines
            .map(line => `<p style="margin: 0 0 8px 0; line-height: 1.5;">${this.#escapeHtml(line)}</p>`)
            .join('');

        box.innerHTML = `
            <div style="margin: 0 0 10px 0;">${linesHtml}</div>
            <div style="text-align: right; margin-top: 10px; font-size: 12px; color: #888;">
                Appuyez sur E pour fermer
            </div>
        `;
    }

    #escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }

    isVisible() {
        return this.#isVisible;
    }
}

export {DialogueBox};
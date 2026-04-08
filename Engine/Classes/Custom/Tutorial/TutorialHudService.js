class TutorialHudService {
    #root = null;
    #objective = null;
    #notificationStack = null;

    mount() {
        this.#root = document.getElementById('tutorial-hud-root');

        if (!this.#root) {
            this.#root = document.createElement('div');
            this.#root.id = 'tutorial-hud-root';
            document.body.appendChild(this.#root);
        }

        this.#root.innerHTML = `
            <div id="tutorial-hud-card" style="
                position: fixed;
                top: 80px;
                right: 16px;
                width: 330px;
                z-index: 920;
                pointer-events: none;
                font-family: 'Pixel Font', monospace;
                background: rgba(18, 18, 22, 0.95);
                border: 1px solid #3a3a3f;
                border-radius: 10px;
                padding: 12px;
                box-shadow: 0 10px 24px rgba(0,0,0,0.35);
            ">
                <div style="font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b9bb4; margin-bottom: 6px;">Mission en cours</div>
                <div id="tutorial-hud-objective" style="font-size: 14px; color: #f4f6ff; line-height: 1.3;"></div>
                <div id="tutorial-hud-notifications" style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
        `;

        this.#objective = document.getElementById('tutorial-hud-objective');
        this.#notificationStack = document.getElementById('tutorial-hud-notifications');
    }

    setObjective(text) {
        if (!this.#objective) return;
        this.#objective.textContent = text || '';
    }

    pushNotification(text, type = 'info') {
        if (!this.#notificationStack || !text) return;

        const colorByType = {
            info: '#67e8f9',
            warning: '#fbbf24',
            success: '#86efac'
        };

        const item = document.createElement('div');
        item.style.cssText = `
            border-left: 3px solid ${colorByType[type] || colorByType.info};
            background: rgba(255,255,255,0.03);
            color: #e6edf9;
            font-size: 12px;
            line-height: 1.3;
            padding: 7px 9px;
            border-radius: 6px;
        `;
        item.textContent = text;

        this.#notificationStack.prepend(item);

        setTimeout(() => {
            if (item.parentElement) {
                item.remove();
            }
        }, 4500);
    }

    blinkScreen() {
        const blink = document.createElement('div');
        blink.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 930;
            pointer-events: none;
            background: rgba(255,255,255,0.7);
            opacity: 0;
            transition: opacity 120ms ease;
        `;

        document.body.appendChild(blink);
        requestAnimationFrame(() => {
            blink.style.opacity = '1';
            setTimeout(() => {
                blink.style.opacity = '0';
                setTimeout(() => blink.remove(), 130);
            }, 120);
        });
    }
}

export { TutorialHudService };


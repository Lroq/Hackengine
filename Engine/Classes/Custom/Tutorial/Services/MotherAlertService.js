import { Utils } from "../../../Base/Services/Utilities/Utils.js";

class MotherAlertService {
    #mother = null;
    #loginFailureCount = 0;
    #maxFailures = 3;
    #onMotherIntervenes = null;
    #isTriggering = false;

    constructor(motherObject, onMotherIntervenes = null) {
        this.#mother = motherObject;
        this.#onMotherIntervenes = onMotherIntervenes;
    }

    /**
     * Enregistre une tentative de login échouée
     */
    recordFailedAttempt() {
        if (this.#isTriggering) return false;

        this.#loginFailureCount++;

        if (this.#loginFailureCount >= this.#maxFailures) {
            this.#triggerMotherAlert();
            return true; // La mère intervient
        }

        return false; // Pas d'intervention
    }

    /**
     * Déclenche l'intervention de la mère
     */
    async #triggerMotherAlert() {
        if (this.#isTriggering) return;
        this.#isTriggering = true;

        if (this.#mother && typeof this.#mother.setState === 'function') {
            this.#mother.setState('Alert');
        }

        // Assombrir l'écran progressivement
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 950;
            background: rgba(0,0,0,0.3);
            transition: background 0.8s ease;
        `;
        document.body.appendChild(overlay);

        // Attendre un peu avant d'assombrir davantage
        await Utils.wait(0.3);
        overlay.style.background = 'rgba(0,0,0,0.7)';

        // Afficher le message de game over
        await Utils.wait(0.5);
        this.#showGameOverScreen();

        await Utils.wait(2.5);
        overlay.remove();

        // Appeler le callback
        if (typeof this.#onMotherIntervenes === 'function') {
            this.#onMotherIntervenes();
        }

        this.#isTriggering = false;
    }

    #showGameOverScreen() {
        const gameOver = document.createElement('div');
        gameOver.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 960;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Pixel Font', monospace;
            pointer-events: none;
        `;

        gameOver.innerHTML = `
            <div style="
                text-align: center;
                font-size: 36px;
                font-weight: bold;
                color: #ff0000;
                text-shadow: 2px 2px 0px rgba(0,0,0,0.8),
                             0 0 10px rgba(255,0,0,0.5);
                animation: shake 0.3s ease-in-out infinite;
            ">
                QU'EST CE QUE TU FAIS ?!!!<br/>
                RETOURNE DANS TA CHAMBRE DE SUITE !!!
            </div>
        `;

        // Ajouter l'animation shake si elle n'existe pas
        if (!document.querySelector('style[data-shake-animation]')) {
            const style = document.createElement('style');
            style.setAttribute('data-shake-animation', 'true');
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(gameOver);
        setTimeout(() => gameOver.remove(), 2500);
    }

    /**
     * Réinitialise les tentatives échouées
     */
    reset() {
        this.#loginFailureCount = 0;
    }

    /**
     * Retourne le nombre de tentatives échouées
     */
    getFailureCount() {
        return this.#loginFailureCount;
    }

    /**
     * Retourne le nombre de tentatives maximal avant alerte
     */
    getMaxFailures() {
        return this.#maxFailures;
    }
}

export { MotherAlertService };



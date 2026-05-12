import { Utils } from "../../../Base/Services/Utilities/Utils.js";

class WindowsSimulatorService {
    #root = null;
    #onLoginSuccess = null;
    #onLoginFailed = null;
    #onTimeout = null;
    #timerHandle = null;
    #loginAttempts = 0;
    #maxAttempts = 3;
    #correctPassword = "clipper150295";
    #isLoginPhase = true;
    #timerDisplay = null;
    #attemptsDisplay = null;
    #stickyNoteTitle = "Post-it";
    #stickyNoteLines = [];

    constructor(correctPassword = "clipper150295", maxAttempts = 3, stickyNote = null) {
        this.#correctPassword = correctPassword;
        this.#maxAttempts = maxAttempts;
        if (stickyNote) {
            this.#stickyNoteTitle = String(stickyNote.title || this.#stickyNoteTitle);
            this.#stickyNoteLines = Array.isArray(stickyNote.lines)
                ? stickyNote.lines.map(line => String(line))
                : [];
        }
    }

    #buildStickyNoteHtml() {
        if (!this.#stickyNoteLines.length) {
            return '';
        }

        const linesHtml = this.#stickyNoteLines
            .map(line => `<div style="font-size: 11px; color: #3f3f46; line-height: 1.35;">• ${line}</div>`)
            .join('');

        return `
            <div style="
                align-self: flex-end;
                width: 220px;
                background: #fff7b2;
                border: 1px solid #e5d26a;
                border-radius: 8px;
                padding: 10px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.18);
                transform: rotate(-1deg);
            ">
                <div style="font-weight: bold; font-size: 12px; color: #374151; margin-bottom: 6px;">${this.#stickyNoteTitle}</div>
                ${linesHtml}
            </div>
        `;
    }

    /**
     * Lance le mini-jeu Windows
     */
     async launch(durationSeconds = 60) {
         // Nettoyer une éventuelle instance précédente
         this.#cleanup();

         this.#root = document.createElement('div');
         this.#root.id = 'windows-simulator';
         this.#root.style.cssText = `
             position: fixed;
             inset: 0;
             z-index: 940;
             display: flex;
             align-items: center;
             justify-content: center;
             background: rgba(0,0,0,0.95);
             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
             backdrop-filter: blur(4px);
         `;

         document.body.appendChild(this.#root);

         // Réinitialiser les tentatives pour chaque nouveau lancement
         this.#loginAttempts = 0;
         this.#isLoginPhase = true;

         // Créer la fenetre Windows
         this.#renderWindowsLogin();

         // Démarrer le timer
         this.#startTimer(durationSeconds);

         return new Promise((resolve) => {
             this.#onLoginSuccess = () => {
                 resolve({ success: true });
             };
             this.#onLoginFailed = () => {
                 this.#cleanup();
                 resolve({ success: false, reason: 'max_attempts' });
             };
             this.#onTimeout = () => {
                 this.#cleanup();
                 resolve({ success: false, reason: 'timeout' });
             };
         });
     }

    #renderWindowsLogin() {
        this.#root.innerHTML = `
            <div style="
                width: 480px;
                max-height: 90vh;
                background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header Windows -->
                <div style="
                    background: linear-gradient(90deg, #0078d4 0%, #106ebe 100%);
                    padding: 12px 16px;
                    border-bottom: 1px solid #0066b3;
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>⊞ Connexion - Identifiant Windows</span>
                    <span style="font-size: 11px; opacity: 0.8;">⊟ □ ✕</span>
                </div>

                <!-- Contenu principal -->
                <div style="
                    flex: 1;
                    background: linear-gradient(180deg, #f0f0f0 0%, #e9e9e9 100%);
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                ">
                    <!-- Timer d'urgence -->
                    <div id="timer-display" style="
                        text-align: center;
                        font-size: 24px;
                        font-weight: bold;
                        color: #d32f2f;
                        font-family: 'Courier New', monospace;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    ">⏱️ 60s</div>

                    ${this.#buildStickyNoteHtml()}

                    <!-- Message de bienvenue -->
                    <div style="
                        background: white;
                        border: 1px solid #d0d0d0;
                        padding: 16px;
                        border-radius: 6px;
                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
                    ">
                        <div style="
                            color: #0078d4;
                            font-weight: bold;
                            font-size: 14px;
                            margin-bottom: 8px;
                        ">Bienvenue</div>
                        <div style="
                            color: #333;
                            font-size: 13px;
                            line-height: 1.4;
                        ">Connectez-vous avec votre compte pour continuer.</div>
                    </div>

                    <!-- Zone de login -->
                    <div style="background: white; border: 1px solid #d0d0d0; border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <!-- Champ username -->
                        <div>
                            <label style="
                                display: block;
                                color: #333;
                                font-size: 12px;
                                font-weight: bold;
                                margin-bottom: 4px;
                            ">Identifiant :</label>
                            <input type="text" id="login-username" value="admin" disabled style="
                                width: 100%;
                                padding: 8px 12px;
                                border: 1px solid #bbb;
                                border-radius: 4px;
                                font-size: 13px;
                                background: #f5f5f5;
                                color: #666;
                                box-sizing: border-box;
                                cursor: not-allowed;
                            " />
                            <div style="font-size: 11px; color: #999; margin-top: 4px;">✓ Déjà entré</div>
                        </div>

                        <!-- Champ password -->
                        <div>
                            <label style="
                                display: block;
                                color: #333;
                                font-size: 12px;
                                font-weight: bold;
                                margin-bottom: 4px;
                            ">Mot de passe :</label>
                            <input type="password" id="login-password" name="wg-login-password" placeholder="Entrez le mot de passe..." autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" spellcheck="false" style="
                                width: 100%;
                                padding: 8px 12px;
                                border: 1px solid #999;
                                border-radius: 4px;
                                font-size: 13px;
                                box-sizing: border-box;
                            " />
                            <div id="password-feedback" style="
                                font-size: 11px;
                                color: #d32f2f;
                                margin-top: 4px;
                                min-height: 16px;
                            "></div>
                        </div>

                        <!-- Nombre de tentatives -->
                        <div id="attempts-display" style="
                            font-size: 11px;
                            color: #ff6f00;
                            font-weight: bold;
                        ">Tentatives : 0/${this.#maxAttempts}</div>
                    </div>

                    <!-- Bouton Connexion -->
                    <button id="login-btn" style="
                        padding: 10px 16px;
                        background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
                        color: white;
                        border: 1px solid #005a9e;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">
                        Connexion
                    </button>

                    <!-- Message info -->
                    <div style="
                        background: #e3f2fd;
                        border: 1px solid #90caf9;
                        border-radius: 4px;
                        padding: 8px 12px;
                        font-size: 11px;
                        color: #1565c0;
                        text-align: center;
                    ">
                        💡 Cherchez le mot de passe dans votre chambre...
                    </div>
                </div>
            </div>
        `;

        this.#timerDisplay = this.#root.querySelector('#timer-display');
        this.#attemptsDisplay = this.#root.querySelector('#attempts-display');
        const loginBtn = this.#root.querySelector('#login-btn');
        const passwordField = this.#root.querySelector('#login-password');
        const feedbackDisplay = this.#root.querySelector('#password-feedback');

        loginBtn.addEventListener('click', () => {
            const password = passwordField.value;
            this.#handleLoginAttempt(password, feedbackDisplay);
        });

        passwordField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const password = passwordField.value;
                this.#handleLoginAttempt(password, feedbackDisplay);
            }
        });

        // Focus sur le champ password
        setTimeout(() => passwordField.focus(), 100);
    }

    #handleLoginAttempt(password, feedbackDisplay) {
        this.#loginAttempts++;
        this.#attemptsDisplay.textContent = `Tentatives : ${this.#loginAttempts}/${this.#maxAttempts}`;

        if (password === this.#correctPassword) {
            feedbackDisplay.textContent = '✓ Connexion reussie !';
            feedbackDisplay.style.color = '#2e7d32';

            setTimeout(() => {
                if (this.#onLoginSuccess) {
                    this.#onLoginSuccess();
                }
            }, 600);
        } else {
            feedbackDisplay.textContent = '✗ Mot de passe incorrect';
            feedbackDisplay.style.color = '#d32f2f';

            if (this.#loginAttempts >= this.#maxAttempts) {
                setTimeout(() => {
                    if (this.#onLoginFailed) {
                        this.#onLoginFailed();
                    }
                }, 800);
            }
        }
    }

    /**
     * Affiche l'écran du contrôle parental à désactiver
     */
    async showParentalControlPanel(durationSeconds = 40) {
        if (!this.#root) {
            return { success: false, reason: 'panel_unavailable' };
        }

        // Peut arriver si la phase login a nettoyé l'overlay avant l'ouverture du panel.
        if (!this.#root.parentElement) {
            document.body.appendChild(this.#root);
        }

        this.#isLoginPhase = false;

        // Effacer le contenu précédent
        this.#root.innerHTML = `
            <div style="
                width: 520px;
                max-height: 90vh;
                background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header Windows -->
                <div style="
                    background: linear-gradient(90deg, #0078d4 0%, #106ebe 100%);
                    padding: 12px 16px;
                    border-bottom: 1px solid #0066b3;
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>Panneau de Controle - Securite et Maintenance</span>
                    <span style="font-size: 11px; opacity: 0.8;">⊟ □ ✕</span>
                </div>

                <!-- Contenu principal -->
                <div style="
                    flex: 1;
                    background: linear-gradient(180deg, #f0f0f0 0%, #e9e9e9 100%);
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                ">
                    <!-- Timer d'urgence -->
                    <div id="timer-display" style="
                        text-align: center;
                        font-size: 22px;
                        font-weight: bold;
                        color: #d32f2f;
                        font-family: 'Courier New', monospace;
                    ">⏱️ ${durationSeconds}s</div>

                    ${this.#buildStickyNoteHtml()}

                    <div style="
                        background: white;
                        border: 1px solid #d0d0d0;
                        border-radius: 6px;
                        padding: 16px;
                    ">
                        <div style="
                            color: #0078d4;
                            font-weight: bold;
                            font-size: 13px;
                            margin-bottom: 12px;
                        ">🔒 Controle Parental</div>
                        
                        <div style="
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            border-radius: 4px;
                            padding: 12px;
                            margin-bottom: 12px;
                            font-size: 12px;
                            color: #856404;
                        ">
                            ⚠️ Le controle parental est actuellement <strong>ACTIVE</strong><br/>
                            Cela restreint l'acces a Internet et aux logiciels
                        </div>

                        <!-- Options du contrôle parental -->
                        <div style="
                            background: #f5f5f5;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 12px;
                            margin-bottom: 12px;
                        ">
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 8px;
                                padding: 8px;
                                background: white;
                                border-radius: 3px;
                                cursor: pointer;
                                border: 2px solid #0078d4;
                            ">
                                <input type="checkbox" id="disable-parental" checked disabled style="
                                    cursor: pointer;
                                    width: 18px;
                                    height: 18px;
                                " />
                                <label for="disable-parental" style="
                                    flex: 1;
                                    color: #333;
                                    font-weight: bold;
                                    font-size: 13px;
                                    cursor: pointer;
                                    margin: 0;
                                ">
                                    Désactiver le controle parental
                                </label>
                            </div>
                            <div style="
                                font-size: 11px;
                                color: #666;
                                margin-left: 26px;
                                font-style: italic;
                            ">Cliquez sur le bouton ci-dessous pour confirmer la desactivation</div>
                        </div>
                    </div>

                    <!-- Bouton Désactiver -->
                    <button id="disable-btn" style="
                        padding: 12px 16px;
                        background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
                        color: white;
                        border: 1px solid #b71c1c;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">
                        🔓 Désactiver
                    </button>

                    <!-- Info -->
                    <div style="
                        background: #e8f5e9;
                        border: 1px solid #c8e6c9;
                        border-radius: 4px;
                        padding: 8px 12px;
                        font-size: 11px;
                        color: #2e7d32;
                        text-align: center;
                    ">
                        ✓ La desactivation prendra effet immediatement
                    </div>
                </div>
            </div>
        `;

        this.#timerDisplay = this.#root.querySelector('#timer-display');
        const disableBtn = this.#root.querySelector('#disable-btn');

        if (this.#timerHandle) {
            clearInterval(this.#timerHandle);
            this.#timerHandle = null;
        }

        // Redémarrer le timer pour cette nouvelle phase
        this.#startTimer(durationSeconds);

        return new Promise((resolve) => {
            this.#onLoginSuccess = () => {
                this.#cleanup();
                resolve({ success: true });
            };
            this.#onTimeout = () => {
                this.#cleanup();
                resolve({ success: false, reason: 'timeout' });
            };

            disableBtn.addEventListener('click', () => {
                disableBtn.disabled = true;
                disableBtn.textContent = '✓ Desactived !';
                disableBtn.style.background = '#4caf50';

                setTimeout(() => {
                    if (this.#onLoginSuccess) {
                        this.#onLoginSuccess();
                    }
                }, 800);
            });
        });
    }

    #startTimer(durationSeconds) {
        let remaining = durationSeconds;

        const updateTimer = () => {
            remaining--;

            if (this.#timerDisplay) {
                this.#timerDisplay.textContent = `⏱️ ${remaining}s`;

                // Changer la couleur en fonction du temps restant
                if (remaining <= 10) {
                    this.#timerDisplay.style.color = '#ff0000';
                    this.#timerDisplay.style.fontSize = '28px';
                    this.#timerDisplay.style.animation = 'pulse 0.5s infinite';
                } else if (remaining <= 20) {
                    this.#timerDisplay.style.color = '#ff6f00';
                }
            }

            if (remaining <= 0) {
                clearInterval(this.#timerHandle);
                if (this.#onTimeout) {
                    this.#onTimeout();
                }
            }
        };

        // Ajouter l'animation pulse en CSS si elle n'existe pas
        if (!document.querySelector('style[data-pulse-animation]')) {
            const style = document.createElement('style');
            style.setAttribute('data-pulse-animation', 'true');
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        this.#timerHandle = setInterval(updateTimer, 1000);
    }

    #cleanup() {
        if (this.#timerHandle) {
            clearInterval(this.#timerHandle);
            this.#timerHandle = null;
        }
        if (this.#root && this.#root.parentElement) {
            this.#root.remove();
        }
        this.#root = null;
        this.#timerDisplay = null;
        this.#attemptsDisplay = null;
        this.#onLoginSuccess = null;
        this.#onLoginFailed = null;
        this.#onTimeout = null;
    }

    isActive() {
        return this.#root && this.#root.parentElement;
    }
}

export { WindowsSimulatorService };





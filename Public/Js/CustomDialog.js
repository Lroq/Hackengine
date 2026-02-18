/**
 * CustomDialog - Modales personnalisées pour remplacer alert/prompt/confirm
 */
class CustomDialog {
    /**
     * Affiche une alerte stylisée
     * @param {string} message - Message à afficher
     * @param {string} title - Titre de la modale (défaut: "Information")
     * @returns {Promise<void>}
     */
    static async alert(message, title = '💡 Information') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[300]';
            modal.innerHTML = `
                <div class="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                    <div class="px-6 py-4 border-b border-gray-700">
                        <h3 class="text-lg font-bold text-white">${this.#escapeHtml(title)}</h3>
                    </div>
                    <div class="p-6">
                        <p class="text-gray-300">${this.#escapeHtml(message)}</p>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-700 flex justify-end">
                        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                            OK
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = () => {
                document.body.removeChild(modal);
                resolve();
            };

            modal.querySelector('button').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    closeModal();
                }
            });
        });
    }

    /**
     * Affiche un prompt stylisé
     * @param {string} message - Message/question
     * @param {string} title - Titre (défaut: "Saisie")
     * @param {string} defaultValue - Valeur par défaut
     * @returns {Promise<string|null>} - Valeur saisie ou null si annulé
     */
    static async prompt(message, title = '✏️ Saisie', defaultValue = '') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[300]';
            modal.innerHTML = `
                <div class="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                    <div class="px-6 py-4 border-b border-gray-700">
                        <h3 class="text-lg font-bold text-white">${this.#escapeHtml(title)}</h3>
                    </div>
                    <div class="p-6">
                        <p class="text-gray-300 mb-4">${this.#escapeHtml(message)}</p>
                        <input type="text" class="custom-dialog-input w-full bg-[#2b2b2f] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" value="${this.#escapeHtml(defaultValue)}" />
                    </div>
                    <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
                        <button class="cancel-btn px-4 py-2 bg-[#2b2b2f] hover:bg-[#3a3a3f] text-white rounded-lg font-semibold transition">
                            Annuler
                        </button>
                        <button class="ok-btn px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                            OK
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const input = modal.querySelector('.custom-dialog-input');
            input.focus();
            input.select();

            const closeModal = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            modal.querySelector('.ok-btn').addEventListener('click', () => {
                closeModal(input.value);
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                closeModal(null);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    closeModal(input.value);
                } else if (e.key === 'Escape') {
                    closeModal(null);
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(null);
            });
        });
    }

    /**
     * Affiche une confirmation stylisée
     * @param {string} message - Message de confirmation
     * @param {string} title - Titre (défaut: "Confirmation")
     * @returns {Promise<boolean>} - true si confirmé, false sinon
     */
    static async confirm(message, title = '⚠️ Confirmation') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[300]';
            modal.innerHTML = `
                <div class="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                    <div class="px-6 py-4 border-b border-gray-700">
                        <h3 class="text-lg font-bold text-white">${this.#escapeHtml(title)}</h3>
                    </div>
                    <div class="p-6">
                        <p class="text-gray-300 whitespace-pre-wrap">${this.#escapeHtml(message)}</p>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
                        <button class="cancel-btn px-4 py-2 bg-[#2b2b2f] hover:bg-[#3a3a3f] text-white rounded-lg font-semibold transition">
                            Annuler
                        </button>
                        <button class="confirm-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                            Confirmer
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                closeModal(true);
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                closeModal(false);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(false);
            });

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    closeModal(false);
                }
            });
        });
    }

    /**
     * Affiche un choix de taille de map stylisé
     * @returns {Promise<{name: string, size: number}|null>}
     */
    static async createMapDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[300]';
            modal.innerHTML = `
                <div class="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                    <div class="px-6 py-4 border-b border-gray-700">
                        <h3 class="text-xl font-bold text-white">➕ Nouvelle Map</h3>
                        <p class="text-sm text-gray-400 mt-1">Configurez votre nouvelle map</p>
                    </div>
                    
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Nom de la map</label>
                            <input type="text" id="map-name-input" class="w-full bg-[#2b2b2f] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="Ma nouvelle map" />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Taille de la grille</label>
                            <select id="map-size-select" class="w-full bg-[#2b2b2f] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                                <option value="25">Petite (25×25 tiles)</option>
                                <option value="50" selected>Moyenne (50×50 tiles)</option>
                                <option value="75">Grande (75×75 tiles)</option>
                                <option value="100">Très grande (100×100 tiles)</option>
                                <option value="custom">Personnalisée...</option>
                            </select>
                        </div>
                        
                        <div id="custom-size-container" class="hidden">
                            <label class="block text-sm font-medium text-gray-300 mb-2">Taille personnalisée (en tiles)</label>
                            <input type="number" id="custom-size-input" class="w-full bg-[#2b2b2f] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="50" min="10" max="200" value="50" />
                            <p class="text-xs text-gray-500 mt-1">Entre 10 et 200 tiles</p>
                        </div>
                        
                        <div class="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                            <p class="text-xs text-blue-300">💡 <strong>Info :</strong></p>
                            <p class="text-xs text-gray-400 mt-1">La grille sera centrée sur (0;0) avec la taille choisie.</p>
                        </div>
                    </div>
                    
                    <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
                        <button class="cancel-btn px-4 py-2 bg-[#2b2b2f] hover:bg-[#3a3a3f] text-white rounded-lg font-semibold transition">Annuler</button>
                        <button class="create-btn px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">Créer</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const nameInput = modal.querySelector('#map-name-input');
            const sizeSelect = modal.querySelector('#map-size-select');
            const customContainer = modal.querySelector('#custom-size-container');
            const customInput = modal.querySelector('#custom-size-input');

            nameInput.focus();

            sizeSelect.addEventListener('change', () => {
                if (sizeSelect.value === 'custom') {
                    customContainer.classList.remove('hidden');
                } else {
                    customContainer.classList.add('hidden');
                }
            });

            const closeModal = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            modal.querySelector('.create-btn').addEventListener('click', () => {
                const name = nameInput.value.trim();
                if (!name) {
                    nameInput.focus();
                    nameInput.classList.add('border-red-500');
                    setTimeout(() => nameInput.classList.remove('border-red-500'), 1000);
                    return;
                }

                let size;
                if (sizeSelect.value === 'custom') {
                    size = Math.max(10, Math.min(200, parseInt(customInput.value) || 50));
                } else {
                    size = parseInt(sizeSelect.value);
                }

                closeModal({ name, size });
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                closeModal(null);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(null);
            });

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    closeModal(null);
                }
            });
        });
    }

    /**
     * Échappe le HTML pour éviter les injections XSS
     * @param {string} str
     * @returns {string}
     */
    static #escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Exporter pour utilisation ES6 modules
export { CustomDialog };

// Exporter globalement pour compatibilité
window.CustomDialog = CustomDialog;


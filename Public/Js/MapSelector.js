/**
 * MapSelector - Gestion de la sélection de map au démarrage
 */

import { CustomDialog } from './CustomDialog.js';

class MapSelector {
    #modal;
    #mapsList;
    #currentMapName = null;
    #onMapSelected = null;

    constructor() {
        this.#modal = document.getElementById('map-selector-modal');
        this.#mapsList = document.getElementById('maps-list');
        this.#setupEventListeners();
    }

    /**
     * Configure les événements
     */
    #setupEventListeners() {
        // Bouton Nouvelle Map
        document.getElementById('create-new-map-btn').addEventListener('click', () => {
            this.#createNewMap();
        });
    }

    /**
     * Affiche la modale et charge les maps
     * @param {Function} onMapSelected - Callback appelé quand une map est sélectionnée
     * @param {boolean} showCloseButton - Si true, affiche le bouton de fermeture
     */
    async show(onMapSelected, showCloseButton = false) {
        this.#onMapSelected = onMapSelected;
        this.#modal.style.display = ''; // Réinitialiser le display au cas où
        this.#modal.classList.remove('hidden');

        // Gérer le bouton de fermeture
        this.#toggleCloseButton(showCloseButton);

        await this.#loadMaps();
    }

    /**
     * Affiche ou cache le bouton de fermeture
     * @param {boolean} show - Si true, affiche le bouton
     */
    #toggleCloseButton(show) {
        const header = this.#modal.querySelector('.px-6.py-4.border-b');
        if (!header) return;

        // Supprimer le bouton existant s'il y en a un
        const existingBtn = header.querySelector('#close-map-selector-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        if (show) {
            // Ajouter le bouton de fermeture
            header.classList.add('flex', 'items-center', 'justify-between');

            // Wrapper le contenu existant dans un div
            const title = header.querySelector('h2');
            const subtitle = header.querySelector('p');

            if (title && !title.parentElement.classList.contains('header-content')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'header-content';
                title.parentNode.insertBefore(wrapper, title);
                wrapper.appendChild(title);
                if (subtitle) wrapper.appendChild(subtitle);
            }

            // Créer et ajouter le bouton
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-map-selector-btn';
            closeBtn.className = 'text-gray-400 hover:text-white text-2xl transition';
            closeBtn.title = 'Fermer';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => {
                this.hide();
            });

            header.appendChild(closeBtn);
        } else {
            // Retirer les classes flex si pas de bouton
            header.classList.remove('flex', 'items-center', 'justify-between');
        }
    }

    /**
     * Cache la modale
     */
    hide() {
        this.#modal.classList.add('hidden');
    }

    /**
     * Charge la liste des maps depuis le serveur
     */
    async #loadMaps() {
        try {
            const res = await fetch('/api/maps/list');
            const maps = await res.json();

            this.#mapsList.innerHTML = '';

            // Filtre de sécurité côté client
            const playableMaps = maps.filter(map => !map.name.includes('.npcs'));

            if (playableMaps.length === 0) {
                this.#mapsList.innerHTML = `
                    <div class="col-span-2 text-center py-8 text-gray-400">
                        <p class="mb-2">🗺️ Aucune map disponible</p>
                        <p class="text-sm">Créez votre première map pour commencer !</p>
                    </div>
                `;
                return;
            }

            playableMaps.forEach(map => {
                this.#createMapCard(map);
            });

        } catch (err) {
            console.error('Erreur lors du chargement des maps:', err);
            this.#mapsList.innerHTML = `
                <div class="col-span-2 text-center py-8 text-red-400">
                    ❌ Erreur lors du chargement des maps
                </div>
            `;
        }
    }

    /**
     * Crée une carte de map
     */
    #createMapCard(map) {
        const card = document.createElement('div');
        card.className = 'relative bg-[#2b2b2f] hover:bg-[#3a3a3f] border border-gray-700 rounded-lg p-4 cursor-pointer transition group';

        card.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                <div class="text-4xl mb-2">🗺️</div>
                <div class="text-white font-semibold text-center">${map.displayName}</div>
                <div class="text-xs text-gray-500 mt-1">${map.name}.json</div>
            </div>
            
            <!-- Bouton de suppression (top-right avec confirm) -->
            <button class="delete-map-btn absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" data-map-name="${map.name}" title="Supprimer cette map">
                ✕
            </button>
        `;

        // Clic sur la carte pour sélectionner
        card.addEventListener('click', (e) => {
            // Ne pas sélectionner si on clique sur le bouton delete
            if (!e.target.classList.contains('delete-map-btn')) {
                this.#selectMap(map.name);
            }
        });

        // Bouton de suppression
        const deleteBtn = card.querySelector('.delete-map-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.#deleteMap(map.name, map.displayName);
        });

        this.#mapsList.appendChild(card);
    }

    /**
     * Sélectionne une map
     */
    #selectMap(mapName) {
        this.#currentMapName = mapName;
        console.log(`✅ Map sélectionnée : ${mapName}`);

        if (this.#onMapSelected) {
            this.#onMapSelected(mapName);
        }

        this.hide();
    }

    /**
     * Crée une nouvelle map avec choix de taille
     */
    async #createNewMap() {
        const result = await CustomDialog.createMapDialog();

        if (!result) {
            return; // Annulé
        }

        try {
            const res = await fetch('/api/maps/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: result.name,
                    size: result.size
                })
            });

            const data = await res.json();

            if (!res.ok) {
                await CustomDialog.alert(data.error, '❌ Erreur');
                return;
            }

            console.log(`✅ ${data.message}`);

            // Recharger la liste
            await this.#loadMaps();

            // Charger automatiquement la nouvelle carte vierge
            this.#selectMap(data.name);

        } catch (err) {
            console.error('Erreur lors de la création de la map:', err);
            await CustomDialog.alert('Erreur lors de la création de la map', '❌ Erreur');
        }
    }

    /**
     * Supprime une map avec confirmation
     */
    async #deleteMap(mapName, displayName) {
        const confirmed = await CustomDialog.confirm(
            `Voulez-vous vraiment supprimer la map "${displayName}" ?\n\nCette action est IRRÉVERSIBLE et supprimera toutes les tuiles de cette map.`,
            '🗑️ Supprimer la map'
        );

        if (!confirmed) {
            return;
        }

        try {
            const res = await fetch('/api/maps/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: mapName })
            });

            const data = await res.json();

            if (!res.ok) {
                await CustomDialog.alert(data.error, '❌ Erreur');
                return;
            }

            console.log(`🗑️ ${data.message}`);

            // Recharger la liste
            await this.#loadMaps();

        } catch (err) {
            console.error('Erreur lors de la suppression de la map:', err);
            await CustomDialog.alert('Erreur lors de la suppression de la map', '❌ Erreur');
        }
    }

    /**
     * Obtient le nom de la map actuellement sélectionnée
     */
    getCurrentMapName() {
        return this.#currentMapName;
    }

    /**
     * Réouvre la modale de sélection des maps
     */
    async reopen() {
        this.#modal.classList.remove('hidden');
        await this.#loadMaps();
    }
}

// Exporter pour utilisation globale
window.MapSelector = MapSelector;


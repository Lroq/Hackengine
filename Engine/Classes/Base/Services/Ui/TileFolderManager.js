/**
 * TileFolderManager - Gère l'organisation des tuiles en dossiers
 *
 * Permet de :
 * - Créer/supprimer des dossiers
 * - Déplacer des tuiles entre dossiers
 * - Persister la structure sur le serveur
 * - Afficher l'arborescence avec drag-and-drop
 */
class TileFolderManager {
    #folderStructure = {
        root: {
            name: 'root',
            folders: [],
            tiles: []
        }
    };

    #expandedFolders = new Set(['root']); // Dossiers actuellement dépliés
    #currentFolder = 'root'; // Dossier actuellement sélectionné
    #isReady = false; // Flag pour savoir si la structure est chargée
    #readyPromise = null; // Promise pour attendre le chargement

    constructor() {
        this.#readyPromise = this.#loadStructure();
    }

    /**
     * Initialise le manager et attend que la structure soit chargée
     * @returns {Promise<void>}
     */
    async initialize() {
        await this.#readyPromise;
        return this;
    }

    /**
     * Vérifie si le manager est prêt
     * @returns {boolean}
     */
    isReady() {
        return this.#isReady;
    }

    /**
     * Charge la structure des dossiers depuis le serveur
     */
    async #loadStructure() {
        try {
            const response = await fetch('/api/tile-folders');
            if (response.ok) {
                const data = await response.json();
                this.#folderStructure = data.structure || this.#folderStructure;
                if (data.expanded) {
                    this.#expandedFolders = new Set(data.expanded);
                }
                console.log('✅ Structure des dossiers chargée:', this.#folderStructure);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger la structure des dossiers, utilisation de la structure par défaut');
        } finally {
            this.#isReady = true;
        }
    }

    /**
     * Sauvegarde la structure des dossiers sur le serveur
     */
    async #saveStructure() {
        try {
            await fetch('/api/tile-folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structure: this.#folderStructure,
                    expanded: Array.from(this.#expandedFolders)
                })
            });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la structure :', error);
        }
    }

    /**
     * Crée un nouveau dossier
     * @param {string} folderName - Nom du dossier
     * @param {string} parentId - ID du dossier parent (défaut: root)
     * @returns {string} - ID du nouveau dossier
     */
    createFolder(folderName, parentId = 'root') {
        const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!this.#folderStructure[parentId]) {
            console.error(`Dossier parent "${parentId}" introuvable`);
            return null;
        }

        // Créer le nouveau dossier
        this.#folderStructure[folderId] = {
            name: folderName,
            parent: parentId,
            folders: [],
            tiles: []
        };

        // Ajouter au parent
        this.#folderStructure[parentId].folders.push(folderId);

        // Sauvegarder
        this.#saveStructure();

        return folderId;
    }

    /**
     * Supprime un dossier et son contenu
     * @param {string} folderId - ID du dossier à supprimer
     */
    deleteFolder(folderId) {
        if (folderId === 'root') {
            console.error('Impossible de supprimer le dossier racine');
            return false;
        }

        const folder = this.#folderStructure[folderId];
        if (!folder) return false;

        // Supprimer récursivement les sous-dossiers
        folder.folders.forEach(subFolderId => {
            this.deleteFolder(subFolderId);
        });

        // Retirer du parent
        const parent = this.#folderStructure[folder.parent];
        if (parent) {
            parent.folders = parent.folders.filter(id => id !== folderId);
        }

        // Supprimer le dossier
        delete this.#folderStructure[folderId];
        this.#expandedFolders.delete(folderId);

        this.#saveStructure();
        return true;
    }

    /**
     * Renomme un dossier
     * @param {string} folderId - ID du dossier
     * @param {string} newName - Nouveau nom
     */
    renameFolder(folderId, newName) {
        if (!this.#folderStructure[folderId]) return false;

        this.#folderStructure[folderId].name = newName;
        this.#saveStructure();
        return true;
    }

    /**
     * Ajoute une tuile à un dossier
     * @param {string} tilePath - Chemin de la tuile
     * @param {string} folderId - ID du dossier (défaut: root)
     */
    addTile(tilePath, folderId = 'root') {
        if (!this.#folderStructure[folderId]) {
            console.error(`Dossier "${folderId}" introuvable`);
            return false;
        }

        // Retirer la tuile de tous les autres dossiers
        this.removeTile(tilePath);

        // Ajouter au nouveau dossier
        this.#folderStructure[folderId].tiles.push(tilePath);
        this.#saveStructure();
        return true;
    }

    /**
     * Retire une tuile de tous les dossiers
     * @param {string} tilePath - Chemin de la tuile
     */
    removeTile(tilePath) {
        Object.values(this.#folderStructure).forEach(folder => {
            folder.tiles = folder.tiles.filter(tile => tile !== tilePath);
        });
    }

    /**
     * Déplace une tuile d'un dossier à un autre
     * @param {string} tilePath - Chemin de la tuile
     * @param {string} targetFolderId - ID du dossier cible
     */
    moveTile(tilePath, targetFolderId) {
        return this.addTile(tilePath, targetFolderId);
    }

    /**
     * Bascule l'état déplié/replié d'un dossier
     * @param {string} folderId - ID du dossier
     */
    toggleFolder(folderId) {
        if (this.#expandedFolders.has(folderId)) {
            this.#expandedFolders.delete(folderId);
        } else {
            this.#expandedFolders.add(folderId);
        }
        this.#saveStructure();
    }

    /**
     * Vérifie si un dossier est déplié
     * @param {string} folderId - ID du dossier
     * @returns {boolean}
     */
    isFolderExpanded(folderId) {
        return this.#expandedFolders.has(folderId);
    }

    /**
     * Récupère la structure complète
     * @returns {Object}
     */
    getStructure() {
        return this.#folderStructure;
    }

    /**
     * Récupère un dossier par son ID
     * @param {string} folderId - ID du dossier
     * @returns {Object|null}
     */
    getFolder(folderId) {
        return this.#folderStructure[folderId] || null;
    }

    /**
     * Récupère toutes les tuiles d'un dossier (sans les sous-dossiers)
     * @param {string} folderId - ID du dossier
     * @returns {Array<string>}
     */
    getTiles(folderId = 'root') {
        const folder = this.#folderStructure[folderId];
        return folder ? [...folder.tiles] : [];
    }

    /**
     * Synchronise avec la liste des tuiles du serveur
     * @param {Array<string>} serverTiles - Liste des tuiles du serveur
     */
    syncWithServerTiles(serverTiles) {
        const allTilesInFolders = new Set();

        // Collecter toutes les tuiles présentes dans les dossiers
        Object.values(this.#folderStructure).forEach(folder => {
            folder.tiles.forEach(tile => allTilesInFolders.add(tile));
        });

        // Ajouter les nouvelles tuiles au dossier root
        serverTiles.forEach(tile => {
            const tilePath = `/Public/Assets/Game/Tiles/${tile}`;
            if (!allTilesInFolders.has(tilePath)) {
                this.#folderStructure.root.tiles.push(tilePath);
            }
        });

        // Retirer les tuiles qui n'existent plus sur le serveur
        const serverTileSet = new Set(serverTiles.map(t => `/Public/Assets/Game/Tiles/${t}`));
        Object.values(this.#folderStructure).forEach(folder => {
            folder.tiles = folder.tiles.filter(tile => {
                const filename = tile.split('/').pop();
                return serverTileSet.has(`/Public/Assets/Game/Tiles/${filename}`);
            });
        });

        this.#saveStructure();
    }
}

export { TileFolderManager };


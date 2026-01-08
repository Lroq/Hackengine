/**
 * API Reference - TileFolderManager
 *
 * Référence complète des méthodes disponibles pour gérer les dossiers de tuiles
 */

// ==========================================
// INITIALISATION
// ==========================================

/**
 * Accès à l'instance globale
 * @type {TileFolderManager}
 */
const folderManager = window.tileFolderManager;

// ==========================================
// GESTION DES DOSSIERS
// ==========================================

/**
 * Créer un nouveau dossier
 * @param {string} folderName - Nom du dossier à créer
 * @param {string} [parentId='root'] - ID du dossier parent
 * @returns {string|null} - ID du dossier créé ou null si erreur
 *
 * @example
 * const folderId = folderManager.createFolder('Mes Personnages');
 * // => "folder_1234567890_abc123"
 *
 * @example
 * // Créer un sous-dossier (futur)
 * const subFolderId = folderManager.createFolder('Héros', folderId);
 */
folderManager.createFolder('nom', 'parentId');

/**
 * Supprimer un dossier et tout son contenu
 * @param {string} folderId - ID du dossier à supprimer
 * @returns {boolean} - true si succès, false si erreur
 *
 * @example
 * folderManager.deleteFolder('folder_1234567890_abc123');
 *
 * @note Le dossier 'root' ne peut pas être supprimé
 */
folderManager.deleteFolder('folderId');

/**
 * Renommer un dossier
 * @param {string} folderId - ID du dossier
 * @param {string} newName - Nouveau nom du dossier
 * @returns {boolean} - true si succès, false si erreur
 *
 * @example
 * folderManager.renameFolder('folder_123', 'Sprites de Personnages');
 */
folderManager.renameFolder('folderId', 'Nouveau Nom');

/**
 * Récupérer un dossier par son ID
 * @param {string} folderId - ID du dossier
 * @returns {Object|null} - Objet dossier ou null si introuvable
 *
 * @example
 * const folder = folderManager.getFolder('folder_123');
 * console.log(folder.name); // "Personnages"
 * console.log(folder.tiles); // ["/Public/Assets/..."]
 * console.log(folder.folders); // ["folder_456", "folder_789"]
 */
folderManager.getFolder('folderId');

/**
 * Récupérer toute la structure des dossiers
 * @returns {Object} - Structure complète
 *
 * @example
 * const structure = folderManager.getStructure();
 * // {
 * //   root: { name: 'root', folders: [...], tiles: [...] },
 * //   folder_123: { name: 'Personnages', parent: 'root', ... }
 * // }
 */
folderManager.getStructure();

// ==========================================
// GESTION DES TUILES
// ==========================================

/**
 * Ajouter une tuile à un dossier
 * @param {string} tilePath - Chemin complet de la tuile
 * @param {string} [folderId='root'] - ID du dossier cible
 * @returns {boolean} - true si succès
 *
 * @example
 * folderManager.addTile('/Public/Assets/Game/Tiles/player.png', 'folder_123');
 *
 * @note La tuile est automatiquement retirée de tous les autres dossiers
 */
folderManager.addTile('/Public/Assets/Game/Tiles/tile.png', 'folderId');

/**
 * Déplacer une tuile d'un dossier vers un autre
 * @param {string} tilePath - Chemin complet de la tuile
 * @param {string} targetFolderId - ID du dossier de destination
 * @returns {boolean} - true si succès
 *
 * @example
 * folderManager.moveTile('/Public/Assets/Game/Tiles/hero.png', 'folder_personnages');
 */
folderManager.moveTile('tilePath', 'targetFolderId');

/**
 * Retirer une tuile de tous les dossiers
 * @param {string} tilePath - Chemin complet de la tuile
 *
 * @example
 * folderManager.removeTile('/Public/Assets/Game/Tiles/old_tile.png');
 *
 * @note Utilisé automatiquement par addTile() et moveTile()
 */
folderManager.removeTile('tilePath');

/**
 * Récupérer toutes les tuiles d'un dossier
 * @param {string} [folderId='root'] - ID du dossier
 * @returns {Array<string>} - Tableau des chemins de tuiles
 *
 * @example
 * const tiles = folderManager.getTiles('folder_123');
 * // ["/Public/Assets/Game/Tiles/tile1.png", "/Public/Assets/Game/Tiles/tile2.png"]
 */
folderManager.getTiles('folderId');

// ==========================================
// GESTION DE L'INTERFACE
// ==========================================

/**
 * Basculer l'état plié/déplié d'un dossier
 * @param {string} folderId - ID du dossier
 *
 * @example
 * folderManager.toggleFolder('folder_123');
 */
folderManager.toggleFolder('folderId');

/**
 * Vérifier si un dossier est déplié
 * @param {string} folderId - ID du dossier
 * @returns {boolean} - true si déplié, false si plié
 *
 * @example
 * if (folderManager.isFolderExpanded('folder_123')) {
 *   console.log('Le dossier est ouvert');
 * }
 */
folderManager.isFolderExpanded('folderId');

// ==========================================
// SYNCHRONISATION
// ==========================================

/**
 * Synchroniser avec la liste des tuiles du serveur
 * @param {Array<string>} serverTiles - Liste des noms de fichiers
 *
 * @example
 * fetch('/api/tiles')
 *   .then(res => res.json())
 *   .then(tiles => {
 *     folderManager.syncWithServerTiles(tiles);
 *   });
 *
 * @note Cette méthode :
 * - Ajoute les nouvelles tuiles au dossier root
 * - Supprime les tuiles qui n'existent plus sur le serveur
 */
folderManager.syncWithServerTiles(['tile1.png', 'tile2.png']);

// ==========================================
// EXEMPLES D'UTILISATION AVANCÉE
// ==========================================

/**
 * Exemple 1 : Créer une structure complète
 */
function createProjectStructure() {
    const characters = folderManager.createFolder('Personnages');
    const terrain = folderManager.createFolder('Terrain');
    const decorations = folderManager.createFolder('Décorations');

    // Déplier tous les dossiers
    folderManager.toggleFolder(characters);
    folderManager.toggleFolder(terrain);
    folderManager.toggleFolder(decorations);

    console.log('✅ Structure créée !');
}

/**
 * Exemple 2 : Organiser automatiquement les tuiles
 */
async function autoOrganizeTiles() {
    const response = await fetch('/api/tiles');
    const tiles = await response.json();

    tiles.forEach(tile => {
        const tilePath = `/Public/Assets/Game/Tiles/${tile}`;

        // Trier par préfixe
        if (tile.startsWith('player_') || tile.startsWith('npc_')) {
            const personnagesId = findFolderByName('Personnages');
            if (personnagesId) {
                folderManager.addTile(tilePath, personnagesId);
            }
        } else if (tile.startsWith('tile_floor')) {
            const terrainId = findFolderByName('Terrain');
            if (terrainId) {
                folderManager.addTile(tilePath, terrainId);
            }
        }
    });

    console.log('✅ Tuiles organisées automatiquement !');
}

/**
 * Exemple 3 : Trouver un dossier par son nom
 */
function findFolderByName(name) {
    const structure = folderManager.getStructure();

    for (const [id, folder] of Object.entries(structure)) {
        if (folder.name === name) {
            return id;
        }
    }

    return null;
}

/**
 * Exemple 4 : Lister tous les dossiers
 */
function listAllFolders() {
    const structure = folderManager.getStructure();

    console.log('📁 Dossiers disponibles :');
    Object.entries(structure).forEach(([id, folder]) => {
        if (id !== 'root') {
            const tileCount = folder.tiles.length;
            const folderCount = folder.folders.length;
            console.log(`  - ${folder.name} (${tileCount} tuiles, ${folderCount} sous-dossiers)`);
        }
    });
}

/**
 * Exemple 5 : Exporter la structure pour backup
 */
function exportStructure() {
    const structure = folderManager.getStructure();
    const json = JSON.stringify(structure, null, 2);

    // Créer un fichier de téléchargement
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tile-folders-backup.json';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ Structure exportée !');
}

// ==========================================
// ÉVÉNEMENTS ET INTÉGRATION
// ==========================================

/**
 * Recharger l'interface après modifications
 */
function refreshUI() {
    // Appeler la fonction loadTiles() si elle existe
    if (typeof loadTiles === 'function') {
        loadTiles();
    } else {
        console.warn('loadTiles() non disponible, rechargement de la page...');
        location.reload();
    }
}

/**
 * Exemple : Écouter les modifications et logger
 */
const originalCreateFolder = folderManager.createFolder.bind(folderManager);
folderManager.createFolder = function(name, parentId) {
    console.log(`📁 Création du dossier: ${name}`);
    return originalCreateFolder(name, parentId);
};

// ==========================================
// NOTES IMPORTANTES
// ==========================================

/*
 * ⚠️ Points importants :
 *
 * 1. Toutes les modifications sont automatiquement sauvegardées
 * 2. Le dossier 'root' est toujours présent et ne peut être supprimé
 * 3. Les IDs de dossiers sont générés automatiquement
 * 4. Une tuile ne peut être que dans un seul dossier à la fois
 * 5. La suppression d'un dossier supprime aussi ses sous-dossiers
 *
 * 💡 Astuces :
 *
 * - Utilisez des noms de dossiers descriptifs
 * - Organisez par type ou par niveau de jeu
 * - Sauvegardez régulièrement la structure (exportStructure)
 * - Testez dans la console avant d'implémenter
 */


/**
 * Gestion de l'upload et de la suppression des tiles
 * Avec système d'organisation en dossiers
 */

import { TileFolderManager } from '../../Engine/Classes/Base/Services/Ui/TileFolderManager.js';

const folderManager = new TileFolderManager();
window.tileFolderManager = folderManager; // Exposer globalement

// Initialiser et charger les tuiles au démarrage
async function initializeTileSystem() {
    console.log('🚀 Initialisation du système de tuiles...');

    // Afficher un indicateur de chargement
    const container = document.getElementById('tiles-container');
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">📦 Chargement des dossiers...</div>';
    }

    try {
        await folderManager.initialize();
        console.log('✅ Système de tuiles prêt!');
        await loadTiles();
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">❌ Erreur de chargement</div>';
        }
    }
}

// Démarrer l'initialisation dès que possible
initializeTileSystem();

// Gestion du bouton d'ajout
document.getElementById('add-tile-btn').addEventListener('click', () => {
    document.getElementById('tile-input').click();
});

// Gestion du bouton de création de dossier
document.getElementById('create-folder-btn').addEventListener('click', () => {
    const folderName = prompt('Nom du nouveau dossier :');
    if (folderName && folderName.trim()) {
        folderManager.createFolder(folderName.trim());
        loadTiles();
    }
});

// Gestion de l'upload
document.getElementById('tile-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/png') {
        alert('Seuls les fichiers PNG sont autorisés.');
        return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
        if (img.width !== 27 || img.height !== 27) {
            alert('Le fichier doit être exactement de 27x27 pixels.');
            URL.revokeObjectURL(url);
            return;
        }

        // Upload vers le serveur
        const formData = new FormData();
        formData.append('tile', file);

        fetch('/api/upload-tile', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                // Recharger la liste des tiles après upload
                loadTiles();
            })
            .catch(err => alert('Erreur upload : ' + err));

        URL.revokeObjectURL(url);
    };

    img.src = url;
    event.target.value = '';
});

/**
 * Charge les tiles depuis le serveur et crée l'arborescence de dossiers
 */
async function loadTiles() {
    try {
        const res = await fetch('/api/tiles');
        const tiles = await res.json();
        const container = document.getElementById('tiles-container');
        container.innerHTML = '';

        // Synchroniser avec le serveur
        folderManager.syncWithServerTiles(tiles);

        // Afficher l'arborescence
        const structure = folderManager.getStructure();
        renderFolder('root', structure, container, 0);

    } catch (err) {
        console.error('Erreur en chargeant les tiles :', err);
    }
}

/**
 * Rend un dossier et son contenu de manière récursive
 * @param {string} folderId - ID du dossier
 * @param {Object} structure - Structure complète
 * @param {HTMLElement} parentElement - Élément parent HTML
 * @param {number} depth - Profondeur dans l'arborescence
 */
function renderFolder(folderId, structure, parentElement, depth) {
    const folder = structure[folderId];
    if (!folder) return;

    const isRoot = folderId === 'root';
    const isExpanded = folderManager.isFolderExpanded(folderId);

    // Conteneur du dossier
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-item';
    folderDiv.dataset.folderId = folderId;

    // En-tête du dossier (sauf pour root)
    if (!isRoot) {
        const folderHeader = document.createElement('div');
        folderHeader.className = 'flex items-center justify-between px-2 py-1 hover:bg-[#2b2b2f] rounded cursor-pointer group';
        folderHeader.style.paddingLeft = `${depth * 12 + 8}px`;
        folderHeader.draggable = true; // Rendre le dossier draggable
        folderHeader.dataset.folderId = folderId;
        folderHeader.dataset.folderName = folder.name;

        // Gestion du drag-and-drop de dossiers
        folderHeader.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-folder-id', folderId);
            e.dataTransfer.setData('application/x-folder-name', folder.name);
            folderHeader.classList.add('opacity-50');
            console.log('📁 Drag dossier started:', folder.name);
        });

        folderHeader.addEventListener('dragend', () => {
            folderHeader.classList.remove('opacity-50');
            console.log('📁 Drag dossier ended');
        });

        // Permettre de drop un dossier sur un autre dossier (création de sous-dossier)
        folderHeader.addEventListener('dragover', (e) => {
            // Vérifier si c'est un dossier qui est draggé
            if (e.dataTransfer.types.includes('application/x-folder-id')) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                folderHeader.classList.add('bg-blue-900', 'border-blue-500');
            }
        });

        folderHeader.addEventListener('dragleave', (e) => {
            if (!folderHeader.contains(e.relatedTarget)) {
                folderHeader.classList.remove('bg-blue-900', 'border-blue-500');
            }
        });

        folderHeader.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderHeader.classList.remove('bg-blue-900', 'border-blue-500');

            const draggedFolderId = e.dataTransfer.getData('application/x-folder-id');
            const draggedFolderName = e.dataTransfer.getData('application/x-folder-name');

            if (draggedFolderId && draggedFolderId !== folderId) {
                console.log(`📁 Drop dossier "${draggedFolderName}" dans "${folder.name}"`);
                if (folderManager.moveFolder(draggedFolderId, folderId)) {
                    loadTiles();
                    console.log('✅ Dossier déplacé avec succès!');
                } else {
                    alert('Impossible de déplacer ce dossier ici.');
                }
            }
        });

        // Partie gauche (icône + nom)
        const leftPart = document.createElement('div');
        leftPart.className = 'flex items-center gap-1 flex-1';

        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = isExpanded ? '📂' : '📁';
        toggleIcon.className = 'text-sm';

        const folderName = document.createElement('span');
        folderName.textContent = folder.name;
        folderName.className = 'text-sm font-medium';

        leftPart.appendChild(toggleIcon);
        leftPart.appendChild(folderName);

        // Boutons d'action (visible au survol)
        const actions = document.createElement('div');
        actions.className = 'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

        // Bouton ajouter sous-dossier
        const addSubfolderBtn = createActionButton('➕', 'Ajouter sous-dossier', () => {
            const subfolderName = prompt('Nom du sous-dossier :');
            if (subfolderName && subfolderName.trim()) {
                folderManager.createFolder(subfolderName.trim(), folderId);
                folderManager.toggleFolder(folderId); // Déplier le dossier parent
                loadTiles();
            }
        });
        addSubfolderBtn.classList.add('text-green-500');

        // Bouton renommer
        const renameBtn = createActionButton('✏️', 'Renommer', () => {
            const newName = prompt('Nouveau nom :', folder.name);
            if (newName && newName.trim()) {
                folderManager.renameFolder(folderId, newName.trim());
                loadTiles();
            }
        });

        // Bouton supprimer
        const deleteBtn = createActionButton('🗑️', 'Supprimer', () => {
            if (confirm(`Supprimer le dossier "${folder.name}" et tout son contenu ?`)) {
                folderManager.deleteFolder(folderId);
                loadTiles();
            }
        });
        deleteBtn.classList.add('hover:bg-red-600');

        actions.appendChild(addSubfolderBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);

        // Toggle sur clic de l'en-tête
        folderHeader.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                folderManager.toggleFolder(folderId);
                loadTiles();
            }
        });

        folderHeader.appendChild(leftPart);
        folderHeader.appendChild(actions);
        folderDiv.appendChild(folderHeader);
    }

    // Contenu du dossier (si déplié)
    if (isExpanded || isRoot) {
        // Afficher les sous-dossiers
        folder.folders.forEach(subFolderId => {
            renderFolder(subFolderId, structure, folderDiv, depth + 1);
        });

        // Afficher les tuiles
        if (folder.tiles.length > 0) {
            const tilesGrid = document.createElement('div');
            tilesGrid.className = 'grid grid-cols-4 gap-2 mb-2';
            tilesGrid.style.paddingLeft = isRoot ? '0' : `${(depth + 1) * 12 + 8}px`;
            tilesGrid.dataset.folderId = folderId;

            // Permettre le drop de tuiles dans ce dossier
            setupDropZone(tilesGrid, folderId);

            folder.tiles.forEach(tilePath => {
                const filename = tilePath.split('/').pop();
                const tileElement = createTileElement(tilePath, filename, folderId);
                tilesGrid.appendChild(tileElement);
            });

            folderDiv.appendChild(tilesGrid);
        } else if (!isRoot) {
            // Zone de drop vide pour les dossiers sans tuiles
            const emptyZone = document.createElement('div');
            emptyZone.className = 'text-xs text-gray-500 italic px-3 py-2 border border-dashed border-gray-700 rounded mx-2 mb-2';
            emptyZone.textContent = 'Glissez des tuiles ici';
            emptyZone.style.marginLeft = `${(depth + 1) * 12 + 8}px`;
            setupDropZone(emptyZone, folderId);
            folderDiv.appendChild(emptyZone);
        }
    }

    parentElement.appendChild(folderDiv);
}

/**
 * Crée un bouton d'action
 */
function createActionButton(icon, title, onClick) {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.title = title;
    btn.className = 'w-5 h-5 rounded hover:bg-[#3a3a3f] flex items-center justify-center text-xs';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return btn;
}

/**
 * Crée un élément tuile draggable
 */
function createTileElement(tilePath, filename, folderId) {
    const tileWrapper = document.createElement('div');
    tileWrapper.className = 'relative group';
    tileWrapper.draggable = true;
    tileWrapper.dataset.tilePath = tilePath;
    tileWrapper.dataset.folderId = folderId;

    // Image du tile
    const img = document.createElement('img');
    img.src = tilePath;
    img.alt = filename;
    img.className = 'w-full h-auto rounded-lg border border-gray-700 cursor-grab active:cursor-grabbing';
    img.draggable = false;

    let isCanvasDrag = false;

    // Gestion du drag vers le canvas avec Alt+Drag ou double-clic+drag
    img.addEventListener('mousedown', (e) => {
        // Si Alt est pressé, c'est un drag vers le canvas
        if (e.altKey || e.button === 1) { // Alt ou bouton du milieu
            e.preventDefault();
            isCanvasDrag = true;
            tileWrapper.draggable = false; // Désactiver le drag natif
            if (window.tileDragService) {
                window.tileDragService.startDrag(img.src);
                img.classList.add('opacity-50');
            }
        }
        // Sinon, laisser le drag natif fonctionner
    });

    img.addEventListener('mouseup', () => {
        img.classList.remove('opacity-50');
        isCanvasDrag = false;
        tileWrapper.draggable = true; // Réactiver le drag natif
    });

    // Gestion du drag-and-drop entre dossiers (drag natif)
    tileWrapper.addEventListener('dragstart', (e) => {
        if (isCanvasDrag) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tilePath);
        e.dataTransfer.setData('application/x-tile-filename', filename);
        tileWrapper.classList.add('opacity-50');
        console.log('🎯 Drag started:', tilePath);
    });

    tileWrapper.addEventListener('dragend', () => {
        tileWrapper.classList.remove('opacity-50');
        console.log('🏁 Drag ended');
    });

    // Bouton de suppression
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '✕';
    deleteBtn.className = 'absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
    deleteBtn.title = `Supprimer ${filename}`;

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Voulez-vous vraiment supprimer "${filename}" ?\n\nCette action est irréversible.`)) {
            deleteTile(filename);
        }
    });

    tileWrapper.appendChild(img);
    tileWrapper.appendChild(deleteBtn);

    return tileWrapper;
}

/**
 * Configure une zone comme drop zone pour les tuiles
 */
function setupDropZone(element, folderId) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        element.classList.add('bg-[#2b2b2f]', 'border-blue-500');
        console.log('📦 Dragover sur dossier:', folderId);
    });

    element.addEventListener('dragleave', (e) => {
        // Vérifier que l'on quitte vraiment l'élément (pas juste un enfant)
        if (!element.contains(e.relatedTarget)) {
            element.classList.remove('bg-[#2b2b2f]', 'border-blue-500');
            console.log('👋 Dragleave du dossier:', folderId);
        }
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('bg-[#2b2b2f]', 'border-blue-500');

        const tilePath = e.dataTransfer.getData('text/plain');
        const filename = e.dataTransfer.getData('application/x-tile-filename');

        console.log('🎯 Drop détecté!');
        console.log('  - Tuile:', tilePath);
        console.log('  - Fichier:', filename);
        console.log('  - Dossier cible:', folderId);

        if (tilePath) {
            console.log('✅ Déplacement de la tuile...');
            folderManager.moveTile(tilePath, folderId);
            loadTiles();
            console.log('✨ Tuile déplacée avec succès!');
        } else {
            console.error('❌ Aucun chemin de tuile trouvé dans le dataTransfer');
        }
    });
}

/**
 * Charge les tiles depuis le serveur et crée les éléments avec bouton de suppression
 * @deprecated - Utiliser loadTiles() à la place
 */
async function loadTilesOld() {
    try {
        const res = await fetch('/api/tiles');
        const tiles = await res.json();
        const container = document.getElementById('tiles-container');
        container.innerHTML = '';

        tiles.forEach(tile => {
            // Conteneur pour chaque tile (position relative pour le bouton)
            const tileWrapper = document.createElement('div');
            tileWrapper.className = 'relative group';

            // Image du tile
            const img = document.createElement('img');
            img.src = `/Public/Assets/Game/Tiles/${tile}`;
            img.alt = tile;
            img.className = 'w-full h-auto rounded-lg border border-gray-700 cursor-grab active:cursor-grabbing';
            img.draggable = false;

            // Gestion du drag and drop
            img.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (window.tileDragService) {
                    window.tileDragService.startDrag(img.src);
                    img.classList.add('opacity-50');
                }
            });

            img.addEventListener('mouseup', () => {
                img.classList.remove('opacity-50');
            });

            // Empêcher le drag natif
            img.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });

            // Bouton de suppression (visible au hover)
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✕';
            deleteBtn.className = 'absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
            deleteBtn.title = `Supprimer ${tile}`;

            // Gestionnaire de suppression avec confirmation
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.confirm(`Voulez-vous vraiment supprimer "${tile}" ?\n\nCette action est irréversible.`)) {
                    deleteTile(tile);
                }
            });

            tileWrapper.appendChild(img);
            tileWrapper.appendChild(deleteBtn);
            container.appendChild(tileWrapper);
        });
    } catch (err) {
        console.error('Erreur en chargeant les tiles :', err);
    }
}

/**
 * Supprime un tile du serveur
 * @param {string} filename - Nom du fichier à supprimer
 */
async function deleteTile(filename) {
    if (!confirm(`Voulez-vous vraiment supprimer "${filename}" ?`)) {
        return;
    }

    try {
        const res = await fetch('/api/delete-tile', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename })
        });

        const data = await res.json();

        if (res.ok) {
            console.log(data.message);
            // Recharger la liste après suppression
            loadTiles();
        } else {
            alert(`Erreur : ${data.error}`);
        }
    } catch (err) {
        console.error('Erreur lors de la suppression :', err);
        alert('Erreur lors de la suppression du tile');
    }
}

// Le chargement initial est maintenant géré par initializeTileSystem() au début du fichier

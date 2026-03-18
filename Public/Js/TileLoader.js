/**
 * Gestion de l'upload et de la suppression des tiles
 */

import {TileFolderManager} from '../../Engine/Classes/Base/Services/Ui/TileFolderManager.js';

const folderManager = new TileFolderManager();
window.tileFolderManager = folderManager;

async function initializeTileSystem() {
    console.log('🚀 Initialisation du système de tuiles...');

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

initializeTileSystem();

window.addEventListener('load', () => {
    const assetsPanel = document.getElementById('assets-panel');
    if (assetsPanel) {
        assetsPanel.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }
});

document.getElementById('add-tile-btn').addEventListener('click', () => {
    document.getElementById('tile-input').click();
});

document.getElementById('create-folder-btn').addEventListener('click', () => {
    const folderName = prompt('Nom du nouveau dossier :');
    if (folderName && folderName.trim()) {
        folderManager.createFolder(folderName.trim());
        loadTiles();
    }
});

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

        const formData = new FormData();
        formData.append('tile', file);

        fetch('/api/upload-tile', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                loadTiles();
            })
            .catch(err => alert('Erreur upload : ' + err));

        URL.revokeObjectURL(url);
    };

    img.src = url;
    event.target.value = '';
});

// ─────────────────────────────────────────────────────────────────────────────
// Chargement et rendu
// ─────────────────────────────────────────────────────────────────────────────

async function loadTiles() {
    try {
        const res = await fetch('/api/tiles');
        const tiles = await res.json();
        const container = document.getElementById('tiles-container');
        container.innerHTML = '';

        folderManager.syncWithServerTiles(tiles);

        const structure = folderManager.getStructure();
        renderFolder('root', structure, container, 0);

        restoreSelection();
    } catch (err) {
        console.error('Erreur en chargeant les tiles :', err);
    }
}

/**
 * Restaure la sélection visuelle de la tile active.
 */
function restoreSelection() {
    const selectedTilePath = window.gameModeService?.getSelectedTilePath();
    if (!selectedTilePath) return;

    document.querySelectorAll('[data-tile-path]').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (img && img.src === selectedTilePath) {
            wrapper.classList.add('tile-selected');
        }
    });
}

function renderFolder(folderId, structure, parentElement, depth) {
    const folder = structure[folderId];
    if (!folder) return;

    const isRoot = folderId === 'root';
    const isExpanded = folderManager.isFolderExpanded(folderId);

    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-item';
    folderDiv.dataset.folderId = folderId;

    if (!isRoot) {
        const folderHeader = document.createElement('div');
        folderHeader.className = 'flex items-center justify-between px-2 py-1 hover:bg-[#2b2b2f] rounded cursor-pointer group';
        folderHeader.style.paddingLeft = `${depth * 12 + 8}px`;
        folderHeader.draggable = true;
        folderHeader.dataset.folderId = folderId;
        folderHeader.dataset.folderName = folder.name;

        folderHeader.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-folder-id', folderId);
            e.dataTransfer.setData('application/x-folder-name', folder.name);
            folderHeader.classList.add('opacity-50');
        });

        folderHeader.addEventListener('dragend', () => {
            folderHeader.classList.remove('opacity-50');
        });

        folderHeader.addEventListener('dragover', (e) => {
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
                if (folderManager.moveFolder(draggedFolderId, folderId)) {
                    loadTiles();
                } else {
                    alert('Impossible de déplacer ce dossier ici.');
                }
            }
        });

        const leftPart = document.createElement('div');
        leftPart.className = 'flex items-center gap-1 flex-1';

        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = isExpanded ? '📂' : '📁';
        toggleIcon.className = 'text-sm';

        const folderNameEl = document.createElement('span');
        folderNameEl.textContent = folder.name;
        folderNameEl.className = 'text-sm font-medium';

        leftPart.appendChild(toggleIcon);
        leftPart.appendChild(folderNameEl);

        const actions = document.createElement('div');
        actions.className = 'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

        const addSubfolderBtn = createActionButton('➕', 'Ajouter sous-dossier', () => {
            const subfolderName = prompt('Nom du sous-dossier :');
            if (subfolderName && subfolderName.trim()) {
                folderManager.createFolder(subfolderName.trim(), folderId);
                folderManager.toggleFolder(folderId);
                loadTiles();
            }
        });
        addSubfolderBtn.classList.add('text-green-500');

        const renameBtn = createActionButton('✏️', 'Renommer', () => {
            const newName = prompt('Nouveau nom :', folder.name);
            if (newName && newName.trim()) {
                folderManager.renameFolder(folderId, newName.trim());
                loadTiles();
            }
        });

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

    if (isExpanded || isRoot) {
        folder.folders.forEach(subFolderId => {
            renderFolder(subFolderId, structure, folderDiv, depth + 1);
        });

        if (folder.tiles.length > 0) {
            const tilesGrid = document.createElement('div');
            tilesGrid.className = 'grid grid-cols-4 gap-2 mb-2';
            tilesGrid.style.paddingLeft = isRoot ? '0' : `${(depth + 1) * 12 + 8}px`;
            tilesGrid.dataset.folderId = folderId;

            setupDropZone(tilesGrid, folderId);

            folder.tiles.forEach(tilePath => {
                const filename = tilePath.split('/').pop();
                const tileElement = createTileElement(tilePath, filename, folderId);
                tilesGrid.appendChild(tileElement);
            });

            folderDiv.appendChild(tilesGrid);
        } else if (!isRoot) {
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
 * Crée un élément tuile draggable.
 */
function createTileElement(tilePath, filename, folderId) {
    const tileWrapper = document.createElement('div');
    tileWrapper.className = 'relative group';
    tileWrapper.dataset.tilePath = tilePath;
    tileWrapper.dataset.folderId = folderId;

    const img = document.createElement('img');
    img.src = tilePath;
    img.alt = filename;
    img.className = 'w-full h-auto rounded-lg border border-gray-700 cursor-grab active:cursor-grabbing';
    img.draggable = false;

    let isDraggingToFolder = false;
    let draggedTileData = null;

    img.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            e.preventDefault();

            document.querySelectorAll('.tile-selected').forEach(t => t.classList.remove('tile-selected'));
            tileWrapper.classList.add('tile-selected');
            window.gameModeService?.startDrag(img.src);
            img.classList.add('opacity-50');

        } else if (e.button === 2) {
            e.preventDefault();
            isDraggingToFolder = true;
            draggedTileData = {tilePath, filename};
            img.classList.add('opacity-50', 'border-2', 'border-blue-500');
        }
    });

    img.addEventListener('mouseup', () => {
        img.classList.remove('opacity-50', 'border-2', 'border-blue-500');
        if (isDraggingToFolder) {
            isDraggingToFolder = false;
            draggedTileData = null;
        }
    });

    img.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    tileWrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    tileWrapper.getDragData = () => (isDraggingToFolder && draggedTileData) ? draggedTileData : null;

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

function setupDropZone(element, folderId) {
    let isHovering = false;

    element.addEventListener('mouseenter', () => {
        isHovering = true;
        const allTiles = document.querySelectorAll('[data-tile-path]');
        allTiles.forEach(tile => {
            if (tile.getDragData?.()) {
                element.classList.add('bg-[#2b2b2f]', 'border-2', 'border-blue-500');
            }
        });
    });

    element.addEventListener('mouseleave', () => {
        isHovering = false;
        element.classList.remove('bg-[#2b2b2f]', 'border-2', 'border-blue-500');
    });

    element.addEventListener('mouseup', (e) => {
        if (e.button === 2 && isHovering) {
            document.querySelectorAll('[data-tile-path]').forEach(tile => {
                const dragData = tile.getDragData?.();
                if (dragData) {
                    folderManager.moveTile(dragData.tilePath, folderId);
                    loadTiles();
                    element.classList.remove('bg-[#2b2b2f]', 'border-2', 'border-blue-500');
                }
            });
        }
    });

    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        element.classList.add('bg-[#2b2b2f]', 'border-blue-500');
    });

    element.addEventListener('dragleave', (e) => {
        if (!element.contains(e.relatedTarget)) {
            element.classList.remove('bg-[#2b2b2f]', 'border-blue-500');
        }
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('bg-[#2b2b2f]', 'border-blue-500');

        const tilePath = e.dataTransfer.getData('text/plain');
        if (tilePath) {
            folderManager.moveTile(tilePath, folderId);
            loadTiles();
        }
    });
}

async function deleteTile(filename) {
    if (!confirm(`Voulez-vous vraiment supprimer "${filename}" ?`)) return;

    try {
        const res = await fetch('/api/delete-tile', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({filename}),
        });
        const data = await res.json();

        if (res.ok) {
            console.log(data.message);
            loadTiles();
        } else {
            alert(`Erreur : ${data.error}`);
        }
    } catch (err) {
        console.error('Erreur lors de la suppression :', err);
        alert('Erreur lors de la suppression du tile');
    }
}
/**
 * Gestion de l'upload et de la suppression des tiles
 */

// Gestion du bouton d'ajout
document.getElementById('add-tile-btn').addEventListener('click', () => {
    document.getElementById('tile-input').click();
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
 * Charge les tiles depuis le serveur et crée les éléments avec bouton de suppression
 */
async function loadTiles() {
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
            img.className = 'w-full h-auto rounded-lg border border-gray-700';
            img.draggable = false;

            // Bouton de suppression (visible au hover)
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✕';
            deleteBtn.className = 'absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
            deleteBtn.title = `Supprimer ${tile}`;

            // Gestionnaire de suppression
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTile(tile);
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

// Chargement initial
loadTiles();
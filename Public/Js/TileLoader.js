document.getElementById('add-tile-btn').addEventListener('click', () => {
    document.getElementById('tile-input').click();
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
                // Ajouter à la grille après upload réussi
                img.className = 'w-full h-auto rounded-lg border border-gray-700';
                document.getElementById('tiles-container').appendChild(img);
            })
            .catch(err => alert('Erreur upload : ' + err));

        URL.revokeObjectURL(url);
    };

    img.src = url;
    event.target.value = '';
});

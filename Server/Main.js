const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 8080;

const tilesDir = path.join(__dirname, '../Public/Assets/Game/Tiles');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tilesDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') cb(null, true);
        else cb(new Error('Seuls les PNG sont autorisés'));
    }
});

app.use(express.json());

app.use('/Engine', express.static(path.join(__dirname, '../Engine')));
app.use('/Public', express.static(path.join(__dirname, '../Public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/Html/Game.html'));
});

// Upload tile
app.post('/api/upload-tile', upload.single('tile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    res.json({ message: 'Tile ajouté', filename: req.file.filename });
});

// Lister tiles
app.get('/api/tiles', (req, res) => {
    fs.readdir(tilesDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Impossible de lire le dossier Tiles' });
        const images = files.filter(f => /\.png$/i.test(f));
        res.json(images);
    });
});

// Supprimer un tile
app.delete('/api/delete-tile', (req, res) => {
    const { filename } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'Nom de fichier manquant' });
    }

    // Sécurité : vérifier que le filename ne contient pas de path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    const filePath = path.join(tilesDir, filename);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier introuvable' });
    }

    // Supprimer le fichier
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
        }
        res.json({ message: 'Tile supprimé avec succès', filename });
    });
});

// Sauvegarder la map
app.post('/api/save-map', (req, res) => {
    const { mapData } = req.body;

    if (!mapData || !Array.isArray(mapData)) {
        return res.status(400).json({ error: 'Données de map invalides' });
    }

    const mapFilePath = path.join(__dirname, '../Public/Assets/Game/map.json');

    fs.writeFile(mapFilePath, JSON.stringify(mapData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde de la map:', err);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde de la map' });
        }
        console.log(`Map sauvegardée : ${mapData.length} tuiles`);
        res.json({ message: 'Map sauvegardée avec succès', tileCount: mapData.length });
    });
});

// Charger la map
app.get('/api/load-map', (req, res) => {
    const mapFilePath = path.join(__dirname, '../Public/Assets/Game/map.json');

    // Vérifier si le fichier existe
    if (!fs.existsSync(mapFilePath)) {
        // Retourner une map vide si le fichier n'existe pas
        return res.json([]);
    }

    fs.readFile(mapFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors du chargement de la map:', err);
            return res.status(500).json({ error: 'Erreur lors du chargement de la map' });
        }

        try {
            const mapData = JSON.parse(data);
            console.log(`Map chargée : ${mapData.length} tuiles`);
            res.json(mapData);
        } catch (parseErr) {
            console.error('Erreur de parsing JSON:', parseErr);
            res.status(500).json({ error: 'Fichier de map corrompu' });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
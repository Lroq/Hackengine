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
    const { mapData, mapName } = req.body;

    if (!mapData || !Array.isArray(mapData)) {
        return res.status(400).json({ error: 'Données de map invalides' });
    }

    const mapsDir = path.join(__dirname, '../Public/Assets/Game/maps');
    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }

    const name = mapName || 'default_map';
    const mapFilePath = path.join(mapsDir, `${name}.json`);

    fs.writeFile(mapFilePath, JSON.stringify(mapData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde de la map:', err);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde de la map' });
        }
        console.log(`Map "${name}" sauvegardée : ${mapData.length} tuiles`);
        res.json({ message: 'Map sauvegardée avec succès', tileCount: mapData.length });
    });
});

// Charger la map
app.get('/api/load-map', (req, res) => {
    const mapName = req.query.name || 'default_map';
    const mapsDir = path.join(__dirname, '../Public/Assets/Game/maps');
    const mapFilePath = path.join(mapsDir, `${mapName}.json`);

    if (!fs.existsSync(mapFilePath)) {
        return res.json([]);
    }

    fs.readFile(mapFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors du chargement de la map:', err);
            return res.status(500).json({ error: 'Erreur lors du chargement de la map' });
        }

        try {
            const mapData = JSON.parse(data);
            console.log(`Map "${mapName}" chargée : ${mapData.length} tuiles`);
            res.json(mapData);
        } catch (parseErr) {
            console.error('Erreur de parsing JSON:', parseErr);
            res.status(500).json({ error: 'Fichier de map corrompu' });
        }
    });
});

// Lister toutes les maps
app.get('/api/maps/list', (req, res) => {
    const mapsDir = path.join(__dirname, '../Public/Assets/Game/maps');

    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
        return res.json([]);
    }

    fs.readdir(mapsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture des maps' });
        }

        const maps = files
            .filter(f => f.endsWith('.json'))
            .map(f => ({
                name: f.replace('.json', ''),
                displayName: f.replace('.json', '').replace(/_/g, ' ')
            }));

        res.json(maps);
    });
});

// Créer une nouvelle map
app.post('/api/maps/create', (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const mapsDir = path.join(__dirname, '../Public/Assets/Game/maps');
    const newMapPath = path.join(mapsDir, `${sanitizedName}.json`);

    if (fs.existsSync(newMapPath)) {
        return res.status(400).json({ error: 'Une map avec ce nom existe déjà' });
    }

    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }

    // Charger la map exemple
    const exampleMapPath = path.join(mapsDir, 'exemple_map.json');
    let exampleData = [];

    if (fs.existsSync(exampleMapPath)) {
        try {
            exampleData = JSON.parse(fs.readFileSync(exampleMapPath, 'utf8'));
        } catch (err) {
            console.warn('Map exemple non disponible');
        }
    }

    fs.writeFile(newMapPath, JSON.stringify(exampleData, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création de la map' });
        }

        console.log(`Map "${sanitizedName}" créée`);
        res.json({ message: 'Map créée avec succès', name: sanitizedName });
    });
});

// Supprimer une map
app.delete('/api/maps/delete', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const mapsDir = path.join(__dirname, '../Public/Assets/Game/maps');
    const mapFilePath = path.join(mapsDir, `${name}.json`);

    if (!fs.existsSync(mapFilePath)) {
        return res.status(404).json({ error: 'Map introuvable' });
    }

    fs.unlink(mapFilePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }

        console.log(`Map "${name}" supprimée`);
        res.json({ message: 'Map supprimée avec succès' });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
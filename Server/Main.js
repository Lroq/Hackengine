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
// Dans Server/Main.js, ligne ~183
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

    const emptyMapData = [];

    fs.writeFile(newMapPath, JSON.stringify(emptyMapData, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création de la map' });
        }

        console.log(`Map "${sanitizedName}" créée (vide)`);
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

// === Routes pour la gestion des dossiers de tuiles ===

const tileFoldersFile = path.join(__dirname, '../Public/Assets/Game/tile-folders.json');
const defaultFoldersFile = path.join(__dirname, '../Public/Assets/Game/tile-folders-default.json');

// Charger la structure des dossiers
app.get('/api/tile-folders', (req, res) => {
    if (!fs.existsSync(tileFoldersFile)) {
        // Charger la structure par défaut depuis le fichier
        if (fs.existsSync(defaultFoldersFile)) {
            try {
                const defaultData = fs.readFileSync(defaultFoldersFile, 'utf8');
                const defaultStructure = JSON.parse(defaultData);
                console.log('📁 Utilisation de la structure par défaut avec sous-dossiers');
                return res.json(defaultStructure);
            } catch (err) {
                console.error('Erreur lors du chargement de la structure par défaut:', err);
            }
        }

        // Structure minimale de secours
        console.log('📁 Utilisation de la structure minimale de secours');
        return res.json({
            structure: {
                root: {
                    name: 'root',
                    folders: [],
                    tiles: []
                }
            },
            expanded: ['root']
        });
    }

    fs.readFile(tileFoldersFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors du chargement des dossiers:', err);
            return res.status(500).json({ error: 'Erreur lors du chargement' });
        }

        try {
            const folderData = JSON.parse(data);
            res.json(folderData);
        } catch (parseErr) {
            console.error('Erreur de parsing JSON:', parseErr);
            // Retourner structure par défaut en cas d'erreur
            if (fs.existsSync(defaultFoldersFile)) {
                try {
                    const defaultData = fs.readFileSync(defaultFoldersFile, 'utf8');
                    const defaultStructure = JSON.parse(defaultData);
                    return res.json(defaultStructure);
                } catch (err2) {
                    console.error('Erreur lors du chargement de secours:', err2);
                }
            }

            res.json({
                structure: {
                    root: {
                        name: 'root',
                        folders: [],
                        tiles: []
                    }
                },
                expanded: ['root']
            });
        }
    });
});

// Sauvegarder la structure des dossiers
app.post('/api/tile-folders', (req, res) => {
    const { structure, expanded } = req.body;

    if (!structure) {
        return res.status(400).json({ error: 'Structure invalide' });
    }

    const folderData = {
        structure,
        expanded: expanded || ['root']
    };

    fs.writeFile(tileFoldersFile, JSON.stringify(folderData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde des dossiers:', err);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }

        res.json({ message: 'Structure des dossiers sauvegardée' });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
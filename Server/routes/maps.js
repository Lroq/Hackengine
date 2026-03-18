const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');

function ensureMapsDir() {
    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }
}

// POST /api/save-map
router.post('/save-map', (req, res) => {
    const { mapData, mapName } = req.body;

    if (!mapData || !Array.isArray(mapData)) {
        return res.status(400).json({ error: 'Données de map invalides' });
    }

    ensureMapsDir();

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

// GET /api/load-map
router.get('/load-map', (req, res) => {
    const mapName = req.query.name || 'default_map';
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
        } catch {
            console.error('Erreur de parsing JSON');
            res.status(500).json({ error: 'Fichier de map corrompu' });
        }
    });
});

// GET /api/map-metadata
router.get('/map-metadata', (req, res) => {
    const { name: mapName } = req.query;

    if (!mapName) {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const metaPath = path.join(mapsDir, `${mapName}.meta.json`);

    if (!fs.existsSync(metaPath)) {
        return res.json({ name: mapName, size: 50 });
    }

    fs.readFile(metaPath, 'utf8', (err, data) => {
        if (err) {
            console.warn(`⚠️ Erreur lecture métadonnées pour ${mapName}:`, err);
            return res.json({ name: mapName, size: 50 });
        }

        try {
            res.json(JSON.parse(data));
        } catch {
            console.warn(`⚠️ Métadonnées corrompues pour ${mapName}`);
            res.json({ name: mapName, size: 50 });
        }
    });
});

// GET /api/maps/list
router.get('/list', (req, res) => {
    ensureMapsDir();

    fs.readdir(mapsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture des maps' });
        }

        const maps = files
            .filter(f => f.endsWith('.json') && !f.endsWith('.meta.json'))
            .map(f => ({
                name: f.replace('.json', ''),
                displayName: f.replace('.json', '').replace(/_/g, ' ')
            }));

        res.json(maps);
    });
});

// POST /api/maps/create
router.post('/create', (req, res) => {
    const { name, size } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const mapSize = size || 50;

    ensureMapsDir();

    const newMapPath = path.join(mapsDir, `${sanitizedName}.json`);
    const metaPath = path.join(mapsDir, `${sanitizedName}.meta.json`);

    if (fs.existsSync(newMapPath)) {
        return res.status(400).json({ error: 'Une map avec ce nom existe déjà' });
    }

    const metadata = {
        name: sanitizedName,
        size: mapSize,
        createdAt: new Date().toISOString()
    };

    fs.writeFile(newMapPath, JSON.stringify([], null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création de la map' });
        }

        fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8', (metaErr) => {
            if (metaErr) {
                console.warn('⚠️ Erreur lors de la création des métadonnées:', metaErr);
            }
        });

        console.log(`✅ Map "${sanitizedName}" créée (${mapSize}×${mapSize})`);
        res.json({ message: 'Map créée avec succès', name: sanitizedName, size: mapSize });
    });
});

// DELETE /api/maps/delete
router.delete('/delete', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

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

module.exports = router;
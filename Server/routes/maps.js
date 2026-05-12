const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Sauvegarder la map
router.post('/save-map', (req, res) => {
    const { mapData, mapName } = req.body;

    if (!mapData || !Array.isArray(mapData)) {
        return res.status(400).json({ error: 'Données de map invalides' });
    }

    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');
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
router.get('/load-map', (req, res) => {
    const mapName = req.query.name || 'default_map';
    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');
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

// Récupérer les métadonnées d'une map
router.get('/map-metadata', (req, res) => {
    const mapName = req.query.name; // On suppose que le client envoie ?name=xxx

    // Si name n'est pas fourni, on essaie de le déduire (non implémenté ici pour rester simple)
    if (!mapName) {
        // Optionnel : retourner une erreur ou une liste vide
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');
    const metaPath = path.join(mapsDir, `${mapName}.meta.json`);

    // Si pas de fichier de métadonnées, retourner valeur par défaut
    if (!fs.existsSync(metaPath)) {
        return res.json({ name: mapName, size: 50 });
    }

    fs.readFile(metaPath, 'utf8', (err, data) => {
        if (err) {
            console.warn(`⚠️ Erreur lecture métadonnées pour ${mapName}:`, err);
            return res.json({ name: mapName, size: 50 });
        }

        try {
            const metadata = JSON.parse(data);
            res.json(metadata);
        } catch (parseErr) {
            console.warn(`⚠️ Métadonnées corrompues pour ${mapName}`);
            res.json({ name: mapName, size: 50 });
        }
    });
});


// Lister toutes les maps
router.get('/maps/list', (req, res) => {
    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');

    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
        return res.json([]);
    }

    fs.readdir(mapsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture des maps' });
        }

        const maps = files
            .filter(f => f.endsWith('.json') && !f.endsWith('.meta.json') && !f.endsWith('.npcs.json'))
            .map(f => {
                const name = f.replace('.json', '');
                return {
                    name: name,
                    displayName: name.replace('.npcs', '').replace(/_/g, ' ')
                };
            });

        res.json(maps);
    });
});

// Créer une nouvelle map
router.post('/maps/create', (req, res) => {
    const { name, size } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const mapSize = size || 50; // Taille par défaut: 50×50
    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');
    const newMapPath = path.join(mapsDir, `${sanitizedName}.json`);
    const metaPath = path.join(mapsDir, `${sanitizedName}.meta.json`);

    if (fs.existsSync(newMapPath)) {
        return res.status(400).json({ error: 'Une map avec ce nom existe déjà' });
    }

    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }

    const emptyMapData = [];
    const metadata = {
        name: sanitizedName,
        size: mapSize,
        createdAt: new Date().toISOString()
    };

    // Créer le fichier de map vide
    fs.writeFile(newMapPath, JSON.stringify(emptyMapData, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création de la map' });
        }

        // Créer le fichier de métadonnées
        fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8', (metaErr) => {
            if (metaErr) {
                console.warn('⚠️ Erreur lors de la création des métadonnées:', metaErr);
            }
        });

        console.log(`✅ Map "${sanitizedName}" créée (${mapSize}×${mapSize})`);
        res.json({ message: 'Map créée avec succès', name: sanitizedName, size: mapSize });
    });
});

// Supprimer une map
router.delete('/maps/delete', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nom de map requis' });
    }

    const mapsDir = path.join(__dirname, '../../Public/Assets/Game/maps');
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


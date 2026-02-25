const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const tileFoldersFile  = path.join(__dirname, '../../Public/Assets/Game/tile-folders.json');
const defaultFoldersFile = path.join(__dirname, '../../Public/Assets/Game/tile-folders-default.json');

const FALLBACK_STRUCTURE = {
    structure: {
        root: { name: 'root', folders: [], tiles: [] }
    },
    expanded: ['root']
};

function loadDefaultStructure() {
    if (fs.existsSync(defaultFoldersFile)) {
        try {
            return JSON.parse(fs.readFileSync(defaultFoldersFile, 'utf8'));
        } catch {
            console.error('Erreur lors du chargement de la structure par défaut');
        }
    }
    return FALLBACK_STRUCTURE;
}

// GET /api/tile-folders
router.get('/', (req, res) => {
    if (!fs.existsSync(tileFoldersFile)) {
        console.log('📁 Utilisation de la structure par défaut');
        return res.json(loadDefaultStructure());
    }

    fs.readFile(tileFoldersFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors du chargement des dossiers:', err);
            return res.status(500).json({ error: 'Erreur lors du chargement' });
        }

        try {
            res.json(JSON.parse(data));
        } catch {
            console.error('Erreur de parsing JSON — fallback sur structure par défaut');
            res.json(loadDefaultStructure());
        }
    });
});

// POST /api/tile-folders
router.post('/', (req, res) => {
    const { structure, expanded } = req.body;

    if (!structure) {
        return res.status(400).json({ error: 'Structure invalide' });
    }

    const folderData = { structure, expanded: expanded || ['root'] };

    fs.writeFile(tileFoldersFile, JSON.stringify(folderData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde des dossiers:', err);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }

        res.json({ message: 'Structure des dossiers sauvegardée' });
    });
});

module.exports = router;
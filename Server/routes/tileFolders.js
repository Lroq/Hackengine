const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const tileFoldersFile = path.join(__dirname, '../../Public/Assets/Game/tile-folders.json');
const defaultFoldersFile = path.join(__dirname, '../../Public/Assets/Game/tile-folders-default.json');


// Charger la structure des dossiers
router.get('/tile-folders', (req, res) => {
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
router.post('/tile-folders', (req, res) => {
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

module.exports = router;


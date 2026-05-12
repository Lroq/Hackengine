const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const getMapsDir = () => path.join(__dirname, '../../Public/Assets/Game/maps');

/**
 * GET /api/load-npcs?name=xxx
 * Charge les PNJ d'une map
 */
router.get('/load-npcs', (req, res) => {
    const mapName = req.query.name || 'default_map';
    const mapsDir = getMapsDir();
    const npcFilePath = path.join(mapsDir, `${mapName}.npcs.json`);

    if (!fs.existsSync(npcFilePath)) {
        return res.json([]); // Aucun PNJ → tableau vide
    }

    fs.readFile(npcFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur chargement PNJ:', err);
            return res.status(500).json({ error: 'Erreur lors du chargement des PNJ' });
        }

        try {
            const npcData = JSON.parse(data);
            console.log(`PNJ chargés pour "${mapName}": ${npcData.length}`);
            res.json(npcData);
        } catch (parseErr) {
            console.error('Erreur parsing PNJ JSON:', parseErr);
            res.status(500).json({ error: 'Fichier PNJ corrompu' });
        }
    });
});

/**
 * POST /api/save-npcs
 * Sauvegarde les PNJ d'une map
 * Body: { npcData: [...], mapName: string }
 */
router.post('/save-npcs', (req, res) => {
    const { npcData, mapName } = req.body;

    if (!Array.isArray(npcData)) {
        return res.status(400).json({ error: 'Données PNJ invalides' });
    }

    const mapsDir = getMapsDir();
    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }

    const name = mapName || 'default_map';
    const npcFilePath = path.join(mapsDir, `${name}.npcs.json`);

    fs.writeFile(npcFilePath, JSON.stringify(npcData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur sauvegarde PNJ:', err);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde des PNJ' });
        }
        console.log(`PNJ sauvegardés pour "${name}": ${npcData.length} PNJ`);
        res.json({ message: `${npcData.length} PNJ sauvegardé(s)`, count: npcData.length });
    });
});

/**
 * DELETE /api/delete-npc
 * Supprime un PNJ d'une map
 * Body: { npcId: string, mapName: string }
 */
router.delete('/delete-npc', (req, res) => {
    const { npcId, mapName } = req.body;

    if (!npcId || !mapName) {
        return res.status(400).json({ error: 'npcId et mapName requis' });
    }

    const mapsDir = getMapsDir();
    const npcFilePath = path.join(mapsDir, `${mapName}.npcs.json`);

    if (!fs.existsSync(npcFilePath)) {
        return res.status(404).json({ error: 'Fichier PNJ introuvable' });
    }

    fs.readFile(npcFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erreur lecture' });

        let npcData;
        try {
            npcData = JSON.parse(data);
        } catch {
            return res.status(500).json({ error: 'Fichier corrompu' });
        }

        const filtered = npcData.filter(n => n.npcId !== npcId);
        if (filtered.length === npcData.length) {
            return res.status(404).json({ error: 'PNJ introuvable' });
        }

        fs.writeFile(npcFilePath, JSON.stringify(filtered, null, 2), 'utf8', (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Erreur sauvegarde' });
            res.json({ message: 'PNJ supprimé', npcId });
        });
    });
});

module.exports = router;

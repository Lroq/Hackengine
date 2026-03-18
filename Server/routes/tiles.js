const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

const tilesDir = path.join(__dirname, '../../Public/Assets/Game/Tiles');

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

// POST /api/upload-tile
router.post('/upload-tile', upload.single('tile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    res.json({ message: 'Tile ajouté', filename: req.file.filename });
});

// GET /api/tiles
router.get('/', (req, res) => {
    fs.readdir(tilesDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Impossible de lire le dossier Tiles' });
        const images = files.filter(f => /\.png$/i.test(f));
        res.json(images);
    });
});

// DELETE /api/delete-tile
router.delete('/delete-tile', (req, res) => {
    const { filename } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'Nom de fichier manquant' });
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    const filePath = path.join(tilesDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier introuvable' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
        }
        res.json({ message: 'Tile supprimé avec succès', filename });
    });
});

module.exports = router;
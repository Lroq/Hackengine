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

// Lister tiles
router.get('/tiles', (req, res) => {
    fs.readdir(tilesDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Impossible de lire le dossier Tiles' });
        const images = files.filter(f => /\.png$/i.test(f));
        res.json(images);
    });
});

// Lister persos (uniquement l'image principale de chaque dossier)
router.get('/characters', (req, res) => {
    const charsDir = path.join(__dirname, '../../Public/Assets/Game/Characters');
    const result = [];
    
    if (fs.existsSync(charsDir)) {
        try {
            const folders = fs.readdirSync(charsDir, { withFileTypes: true });
            for (const folder of folders) {
                if (folder.isDirectory()) {
                    const folderPath = path.join(charsDir, folder.name);
                    const files = fs.readdirSync(folderPath);
                    // Prendre seulement le premier PNG trouvé comme sprite "principal"
                    const mainPng = files.find(f => f.endsWith('.png'));
                    if (mainPng) {
                        result.push(`${folder.name}/${mainPng}`);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
    
    res.json(result);
});

// Upload tile
router.post('/upload-tile', upload.single('tile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    res.json({ message: 'Tile ajouté', filename: req.file.filename });
});

// Supprimer un tile
router.delete('/delete-tile', (req, res) => {
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

module.exports = router;


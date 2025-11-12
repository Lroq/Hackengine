const express = require('express');
const path = require('path');
const { urlencoded } = require("express");
const fs = require("fs");

const DependencyService = require(__dirname + "/Services/DependencyService.js");

const app = express();
const port = 80;

// Configuration EJS/HTML
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '../Public/Html'));

app.use(urlencoded({ extended: true }));
app.use(express.json());

// Routes principales
app.get('/', (req, res) => {
    res.render('Game', { dependencies: DependencyService.getDependencies() });
});

// Servir les fichiers statiques
app.use("/Public", express.static(path.join(__dirname, '../Public')));
app.use("/Engine", express.static(path.join(__dirname, '../Engine')));

// Endpoint pour récupérer la liste des tiles
app.get('/api/tiles', (req, res) => {
    const tilesDir = path.join(__dirname, '../Public/Assets/Game/Tiles');
    fs.readdir(tilesDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Impossible de lire le dossier Tiles' });
        // Filtrer seulement les fichiers images
        const images = files.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
        res.json(images);
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`[+] Server started on http://localhost:${port}`);
});

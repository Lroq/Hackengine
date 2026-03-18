const express = require('express');
const path = require('path');
const tileRoutes = require('./routes/tiles');
const mapRoutes = require('./routes/maps');
const tileFolderRoutes = require('./routes/tileFolders');

const app = express();
const PORT = 8080;

app.use(express.json());

// Routes statiques pour le moteur et les assets publics
app.use('/Engine', express.static(path.join(__dirname, '../Engine')));
app.use('/Public', express.static(path.join(__dirname, '../Public')));

// Route principale (Page de jeu)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/Html/Game.html'));
});

// Enregistrement des routes API
app.use('/api', tileRoutes);
app.use('/api', mapRoutes);
app.use('/api', tileFolderRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

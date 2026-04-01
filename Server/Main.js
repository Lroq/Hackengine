const express = require('express');
const path = require('path');
const tileRoutes = require('./routes/tiles');
const mapRoutes = require('./routes/maps');
const tileFolderRoutes = require('./routes/tileFolders');
const npcRoutes = require('./routes/npcs');

const app = express();
const PORT = 9000;

app.use(express.json());

// Routes statiques pour le moteur et les assets publics
// IMPORTANT : Ces routes doivent être déclarées AVANT les routes API
// pour éviter les conflits de MIME type
const staticOptions = {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
};

app.use('/Engine', express.static(path.join(__dirname, '../Engine'), staticOptions));
app.use('/Public', express.static(path.join(__dirname, '../Public'), staticOptions));

// Route principale (Page de jeu)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/Html/Game.html'));
});

// Enregistrement des routes API
app.use('/api', tileRoutes);
app.use('/api', mapRoutes);
app.use('/api', tileFolderRoutes);
app.use('/api', npcRoutes);

// Gestionnaire 404 pour les routes non trouvées
app.use((req, res) => {
    res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.url}` });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

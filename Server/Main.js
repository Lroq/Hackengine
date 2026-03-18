const express = require('express');
const path = require('path');

const tilesRouter      = require('./routes/tiles.js');
const mapsRouter       = require('./routes/maps.js');
const tileFoldersRouter = require('./routes/tileFolders.js');

const app  = express();
const PORT = 8080;

app.use(express.json());

app.use('/Engine', express.static(path.join(__dirname, '../Engine')));
app.use('/Public', express.static(path.join(__dirname, '../Public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/Html/Game.html'));
});

// API routes
app.use('/api/tiles',        tilesRouter);
app.use('/api/maps',         mapsRouter);
app.use('/api/tile-folders', tileFoldersRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
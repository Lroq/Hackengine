const express = require('express');
const path = require('path');

const app = express();
const PORT = 9000;

const tilesDir = path.join(__dirname, '../Public/Assets/Game/Tiles');

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

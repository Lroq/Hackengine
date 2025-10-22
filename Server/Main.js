const express = require('express');
const path = require('path');
const { urlencoded } = require("express");
const fs = require("fs");

const DependencyService = require(__dirname+"/Services/DependencyService.js")

const app = express();
const port = 80;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '../Public/Html'));

app.use(urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('Game', {dependencies : DependencyService.getDependencies()});
});

app.use("/Public", express.static(path.join(__dirname, '../Public')));
app.use("/Engine", express.static(path.join(__dirname, '../Engine')));

app.listen(port, () => {
  console.log(`[+] Server started on http://localhost:${port}`);
});

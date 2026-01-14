# Hackengine

Moteur de jeu 2D pour le projet Hackemon avec système d'organisation des assets.

## 🆕 Nouveau : Système de Gestion de Fichiers pour les Tuiles

Le moteur dispose maintenant d'un **système complet d'organisation des tuiles** avec :

### ✨ Fonctionnalités
- **📁 Création de dossiers** - Organisez vos tuiles dans des dossiers personnalisés
- **🎯 Drag-and-drop** - Déplacez les tuiles entre dossiers par glisser-déposer
- **✏️ Renommage** - Renommez vos dossiers facilement
- **🗑️ Suppression** - Supprimez les dossiers et leur contenu
- **💾 Persistance** - La structure est automatiquement sauvegardée
- **🎨 Interface intuitive** - Arborescence pliable/dépliable

### 🚀 Utilisation Rapide

1. **Créer un dossier** : Cliquez sur le bouton "📁 Dossier" en bas du panneau
2. **Ajouter des tuiles** : Cliquez sur "➕ Tuile" pour uploader une image PNG 27x27
3. **Organiser** : Glissez-déposez les tuiles dans les dossiers
4. **Placer sur la grille** : En mode construction, glissez une tuile vers le canvas

### 📖 Documentation Complète
Voir [TILE_FOLDER_SYSTEM.md](./TILE_FOLDER_SYSTEM.md) pour plus de détails.

---

## <a name="run-the-server"> 🛜 Run the server </a>

### Run the program with CLI
Run the **Hack Engine** for the first time you need to write :

```bash
npm install 
npm start
```

To run the server next times you can use :
```bash
npm start
```

After that, open your web browser and go to [http://localhost:80/](http://localhost:80/) to use the hack engine.

The server will be hosted on your localhost address on the port **80**

> ❗A firewall warning may appear, be trustfully 😊 some firewall need that to host the server on your localhost address.

---
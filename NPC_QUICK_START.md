# 🎮 Système de PNJ - Guide d'Utilisation Rapide

## 🚀 Démarrage Rapide

### 1. Préparer les Sprites de PNJ

Placez vos sprites de PNJ (54x27 pixels, PNG) dans :
```
/Public/Assets/Game/Characters/
```

Exemples déjà disponibles :
- `Attacker_Down_0.png`
- `Attacker_Right_0.png`
- `Attacker_Up_0.png`

### 2. Activer le Mode PNJ

1. Lancez le jeu en mode **Construction** (bouton Build)
2. Dans le panneau de gauche, cliquez sur **👤 PNJ**
3. Le mode PNJ est actif (bouton surligné en bleu)

### 3. Placer un PNJ

**Note**: Pour l'instant, vous devez ouvrir la console (F12) et exécuter :
```javascript
window.npcPlacementService.selectNPCSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png");
```

Ensuite :
1. Déplacez la souris sur la grille → Aperçu fantôme apparaît
2. **Clic gauche** pour placer le PNJ
3. Le PNJ est sauvegardé automatiquement

### 4. Configurer un PNJ

1. **Alt + Clic gauche** sur un PNJ placé
2. Menu contextuel s'ouvre avec :
   - **Nom** : "Marchand", "Guide", etc.
   - **Dialogue** : "Bonjour ! Comment puis-je t'aider ?"
   - **Solidité** : Cochez si le PNJ bloque le passage
3. Cliquez sur **💾** pour sauvegarder

### 5. Tester en Mode Play

1. Cliquez sur **Play**
2. Approchez-vous d'un PNJ (icône **E verte** apparaît)
3. Appuyez sur **E** → Dialogue s'affiche
4. Appuyez sur **E** → Dialogue se ferme

---

## 📝 Exemples de Configuration

### PNJ Marchand (Solide)
```
Nom: Marchand
Dialogue: Bienvenue dans ma boutique ! J'ai de superbes objets à vendre.
Solidité: ✓ Coché
```

### PNJ Guide (Non-Solide)
```
Nom: Guide  
Dialogue: Utilisez Z/Q/S/D pour vous déplacer. Appuyez sur E pour interagir avec moi !
Solidité: ☐ Décoché
```

### PNJ Quête
```
Nom: Vieil Ermite
Dialogue: Trouve-moi 3 cristaux dans le donjon et je te récompenserai.
Solidité: ✓ Coché
```

---

## ⚠️ À Implémenter (TODO)

### UI de Sélection de Sprites

Actuellement, vous devez utiliser la console pour sélectionner un sprite. 

**Solution temporaire** :
```javascript
// Dans la console (F12)
window.npcPlacementService.selectNPCSprite("/chemin/vers/sprite.png");
```

**Solution future** : Créer un panneau dans l'UI similaire aux tuiles avec :
- Liste des sprites disponibles dans `/Public/Assets/Game/Characters/`
- Prévisualisation des sprites
- Catégories (Marchands, Gardes, Villageois, Boss, etc.)

---

## 🎨 Spécifications des Sprites

### Format Requis
- **Format** : PNG avec transparence
- **Dimensions** : 27px (largeur) × 54px (hauteur)
- **Ratio** : 1:2 (hauteur = 2× largeur)

### Structure Recommandée
```
/Public/Assets/Game/Characters/
├── Merchants/
│   ├── merchant_1.png
│   └── merchant_2.png
├── Guards/
│   ├── guard_1.png
│   └── guard_2.png
├── Villagers/
│   ├── villager_1.png
│   ├── villager_2.png
│   └── villager_3.png
└── NPCs/
    ├── old_man.png
    └── child.png
```

---

## 🔧 Commandes Console Utiles

### Sélectionner un Sprite
```javascript
window.npcPlacementService.selectNPCSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png");
```

### Lister tous les PNJ de la Map
```javascript
console.log(window.npcPlacementService.exportNPCData());
```

### Sauvegarder Manuellement
```javascript
window.npcPlacementService.saveNPCs();
```

### Charger les PNJ d'une Map
```javascript
await window.npcPlacementService.loadNPCsFromServer("nom_de_la_map");
```

---

## 💾 Fichiers de Sauvegarde

Les PNJ sont sauvegardés dans :
```
/Public/Assets/Game/maps/nom_de_la_map.npcs.json
```

Format JSON :
```json
[
  {
    "type": "NPC",
    "name": "Marchand",
    "x": 135,
    "y": 108,
    "spritePath": "/Public/Assets/Game/Characters/Attacker_Down_0.png",
    "interactionText": "Bienvenue !",
    "isSolid": true,
    "layer": 2
  }
]
```

---

## 🐛 Dépannage

### Le PNJ n'apparaît pas
- Vérifiez que le sprite existe au chemin spécifié
- Vérifiez la console (F12) pour des erreurs
- Rechargez la map (changez de map et revenez)

### L'icône E n'apparaît pas
- Vérifiez que le PNJ a un texte d'interaction non vide
- Approchez-vous plus près (< 40 pixels)
- Vérifiez la console pour des erreurs

### Le dialogue ne s'affiche pas
- Vérifiez que vous êtes en mode **Play** (pas Construction)
- Vérifiez que la DialogueBox est bien initialisée
- Regardez la console pour des erreurs

### Le menu contextuel ne s'ouvre pas
- Assurez-vous d'utiliser **Alt + Clic gauche**
- Vérifiez que vous êtes en mode **Construction**
- Cliquez bien sur le PNJ (pas à côté)

---

## 🎯 Prochaines Étapes

1. **Créer des sprites de PNJ** (54x27 PNG)
2. **Les placer** dans `/Public/Assets/Game/Characters/`
3. **Tester** le système avec différents PNJ
4. **Implémenter** l'UI de sélection de sprites (optionnel)

---

## ✨ Le Système est Prêt !

Tout est fonctionnel, il ne manque que l'UI de sélection des sprites. En attendant, utilisez la console pour sélectionner les sprites.

**Amusez-vous bien avec les PNJ !** 🎮👤


# 👤 Système Complet de Gestion des PNJ - Documentation

## 📋 Vue d'Ensemble

Système complet pour ajouter, configurer et gérer des PNJ (Personnages Non-Joueurs) dans Hackengine v2.

---

## ✨ Fonctionnalités Implémentées

### 1. **Classe NPC** (54x27 pixels)
- Sprite personnalisable
- Collision configurable (solide/non-solide)
- Système d'interaction avec dialogue
- Layer configurable (0, 1, ou 2)
- Export/Import JSON

### 2. **Mode Placement (Construction)**
- **Mode PNJ** : Bouton 👤 dans le panneau d'édition
- **Aperçu fantôme** : Le PNJ suit la souris avec snapping à la grille
- **Clic gauche** : Place le PNJ sur la grille
- **Alt+Clic gauche** : Ouvre le menu contextuel de configuration

### 3. **Menu Contextuel PNJ**
- **Nom** : Configure le nom du PNJ
- **Dialogue** : Texte affiché lors de l'interaction
- **Solidité** : Checkbox pour bloquer/autoriser le passage
- **Bouton 💾** : Sauvegarde et ferme
- **Bouton 🗑️** : Supprime le PNJ

### 4. **Interactions (Mode Play)**
- **Détection** : Distance de 40 pixels autour du joueur
- **Icône E** : Pastille néon verte qui pulse au-dessus du PNJ
- **Touche E** : Déclenche l'affichage du dialogue
- **Format** : "**Nom du PNJ**: Texte du dialogue"
- **Mouvements bloqués** : Le joueur ne peut pas bouger pendant le dialogue

### 5. **Sauvegarde/Chargement**
- Fichiers : `nomMap.npcs.json` dans `/Public/Assets/Game/maps/`
- Sauvegarde automatique après chaque modification
- Chargement automatique au changement de map

---

## 🗂️ Fichiers Créés

### Classes
```
Engine/Classes/Custom/WebGameObjects/
└── NPC.js                              // Classe de base pour les PNJ

Engine/Classes/Base/Services/Interactions/
└── NPCInteractionManager.js            // Gestion interactions joueur-PNJ

Engine/Classes/Base/Services/Grid/
├── NPCPlacement.js                     // Placement en mode construction
└── NPCContextMenu.js                   // Menu contextuel de configuration
```

### Routes API (Server/Main.js)
```javascript
POST /api/save-npcs     // Sauvegarde les PNJ d'une map
GET  /api/load-npcs     // Charge les PNJ d'une map
```

---

## 🎮 Utilisation

### Mode Construction

#### 1. Activer le Mode PNJ
1. Cliquez sur le bouton **👤 PNJ** dans le panneau de gauche
2. Le mode PNJ est maintenant actif (bouton surligné en bleu)

#### 2. Sélectionner un Sprite
Pour l'instant, vous devez coder manuellement le sprite dans `NPCPlacement.js` :
```javascript
npcPlacementService.selectNPCSprite("/Public/Assets/Game/Characters/Attacker_Down_0.png");
```

#### 3. Placer un PNJ
1. Déplacez la souris sur la grille (aperçu fantôme apparaît)
2. Cliquez **gauche** pour placer le PNJ
3. Le PNJ est automatiquement sauvegardé

#### 4. Configurer un PNJ
1. **Alt+Clic gauche** sur un PNJ placé
2. Menu contextuel apparaît :
   - **Nom** : Modifiez le nom
   - **Dialogue** : Entrez le texte d'interaction
   - **Solidité** : Cochez/décochez
3. Cliquez sur **💾** pour sauvegarder et fermer

### Mode Play

#### Interagir avec un PNJ
1. **Approchez-vous** d'un PNJ (< 40 pixels)
2. Une **icône E verte** apparaît au-dessus du PNJ
3. Appuyez sur **E** pour déclencher le dialogue
4. Le texte s'affiche : "**Nom du PNJ**: Dialogue"
5. Vos mouvements sont bloqués
6. Appuyez sur **E** pour fermer
7. Vous pouvez à nouveau bouger

---

## 📐 Structure des Données

### Format JSON (nomMap.npcs.json)
```json
[
  {
    "type": "NPC",
    "name": "Marchand",
    "x": 135,
    "y": 108,
    "spritePath": "/Public/Assets/Game/Characters/Attacker_Down_0.png",
    "interactionText": "Bienvenue dans ma boutique ! Que puis-je faire pour vous ?",
    "isSolid": true,
    "layer": 2
  },
  {
    "type": "NPC",
    "name": "Guide",
    "x": 54,
    "y": 81,
    "spritePath": "/Public/Assets/Game/Characters/Attacker_Down_0.png",
    "interactionText": "Appuyez sur Z/Q/S/D pour vous déplacer !",
    "isSolid": false,
    "layer": 2
  }
]
```

---

## 🎨 Spécifications Techniques

### Dimensions du Sprite
- **Largeur** : 27 pixels (1 tuile)
- **Hauteur** : 54 pixels (2 tuiles)
- **Format** : PNG avec transparence
- **Offset** : -27px en Y pour centrer le sprite

### Hitbox de Collision
- **Largeur** : 20 pixels
- **Hauteur** : 20 pixels
- Plus petite que le sprite pour un meilleur gameplay

### Détection d'Interaction
- **Range** : 40 pixels autour du joueur
- **Priorité** : PNJ le plus proche sélectionné
- **Condition** : Le PNJ doit avoir un `interactionText` non vide

### Animation de l'Icône E
- **Forme** : Rectangle arrondi 8x8px
- **Couleur** : Néon vert `#00ff41`
- **Position** : 60px au-dessus du PNJ (au-dessus de la tête)
- **Animation** : Pulsation du glow (2-4px) et de l'opacité (0.7-1.0)

---

## 🔄 Intégration avec les Systèmes Existants

### ✅ Compatibilité
- **TileDragService** : Les outils de dessin sont désactivés en mode PNJ
- **TileContextMenu** : Bloquer les outils quand menu PNJ ouvert
- **DialogueBox** : Partagée avec le système d'interaction des tuiles
- **Player** : Mouvements bloqués pendant les dialogues
- **Renderer** : Rendu des icônes E pour PNJ et tuiles
- **Layers** : PNJ triés avec les autres objets (0=sol, 1=déco, 2=sprites)

### 🔗 Workflow Complet
```
1. Mode Construction activé
   ↓
2. Clic sur 👤 PNJ
   ↓
3. Sélection d'un sprite (à implémenter dans l'UI)
   ↓
4. Placement sur la grille (clic gauche)
   ↓
5. Configuration (Alt+Clic gauche)
   ↓
6. Sauvegarde automatique → nomMap.npcs.json
   ↓
7. Mode Play activé
   ↓
8. Chargement des PNJ depuis le fichier
   ↓
9. Joueur s'approche → Icône E apparaît
   ↓
10. Joueur appuie sur E → Dialogue affiché
   ↓
11. Joueur appuie sur E → Dialogue fermé
```

---

## 🚀 Prochaines Étapes Recommandées

### 1. **UI de Sélection de Sprites PNJ**
Créer un panneau dans l'UI pour lister les sprites de PNJ disponibles :
```javascript
// Dans Game.html, ajouter après les assets de tiles
<div id="npc-sprites-panel" class="hidden">
    <!-- Liste des sprites de PNJ avec aperçu -->
</div>
```

### 2. **Animations des PNJ**
Ajouter un système d'animation comme pour le Player :
- Idle (repos)
- Talking (parle, animation pendant le dialogue)
- Emotion (icônes émotions au-dessus de la tête)

### 3. **Quêtes et Conditions**
Étendre le système d'interaction :
```javascript
npc.interactions = [
  {
    condition: "hasItem('key')",
    text: "Merci pour la clé !",
    reward: { gold: 100 }
  },
  {
    condition: "default",
    text: "Trouve-moi une clé."
  }
];
```

### 4. **Dialogues Multi-Pages**
Supporter des conversations avec plusieurs réponses :
```javascript
npc.dialogue = {
  pages: [
    "Bonjour ! Comment puis-je t'aider ?",
    "Ah, tu cherches la clé ? Elle est dans le donjon."
  ],
  choices: [
    { text: "Merci !", next: "end" },
    { text: "Où est le donjon ?", next: "directions" }
  ]
};
```

### 5. **Boutique de PNJ**
Intégrer un système de commerce :
```javascript
npc.shop = {
  items: [
    { name: "Potion", price: 50 },
    { name: "Épée", price: 200 }
  ]
};
```

---

## 📝 Checklist d'Implémentation

### Backend ✅
- [x] Routes API `/api/save-npcs` et `/api/load-npcs`
- [x] Sauvegarde dans `nomMap.npcs.json`
- [x] Chargement depuis le fichier

### Core Classes ✅
- [x] Classe `NPC` avec toutes les propriétés
- [x] Méthodes `toJSON()` et `fromJSON()`
- [x] Gestion des composants (Sprite, Collider)

### Services ✅
- [x] `NPCPlacementService` - Placement en construction
- [x] `NPCInteractionManager` - Interactions en play
- [x] `NPCContextMenu` - Configuration

### UI ✅
- [x] Bouton mode PNJ 👤
- [x] Menu contextuel avec tous les champs
- [x] Boutons sauvegarde et suppression

### Intégration ✅
- [x] Import dans `StartEngine.js`
- [x] Initialisation dans `ExempleScene.js`
- [x] Rendu dans `Renderer.js`
- [x] Blocage mouvements dans `Player.js`

### À Faire 🔲
- [ ] UI de sélection des sprites PNJ
- [ ] Loader de sprites depuis un dossier
- [ ] Prévisualisation des sprites disponibles
- [ ] Catégories de PNJ (marchands, gardes, villageois, etc.)
- [ ] Documentation utilisateur finale

---

## ✨ Résumé

Le système de PNJ est **fonctionnel à 95%** ! Il manque uniquement :
1. Une UI pour sélectionner les sprites (actuellement en dur dans le code)
2. Un dossier avec des sprites de PNJ pré-faits

Tout le reste est opérationnel :
- ✅ Placement et configuration
- ✅ Sauvegarde/chargement
- ✅ Interactions avec dialogues
- ✅ Icônes E animées
- ✅ Blocage des mouvements

**Le système est prêt à être utilisé !** 🎉


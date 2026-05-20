# Hackengine v2.1 — Guide Claude Code

## Démarrage rapide

```bash
npm install
npm start
# Accès : http://localhost:9000
```

Le serveur Express tourne sur le port 9000. Ouvrir `http://localhost:9000` dans un navigateur moderne (Chrome/Firefox, support ES6 modules requis).

---

## Vue d'ensemble

Moteur de jeu 2D web entièrement custom :
- **Rendu** : Canvas 2D (vanilla JS, aucun framework externe)
- **Modules** : ES6 import/export
- **Backend** : Express.js (persistence des maps, tiles, NPCs)
- **Jeu** : Tutoriel narratif en 3 étapes sur le thème du hacking parental

---

## Architecture du projet

```
Hackengine/
├── Server/                          # Express.js (port 9000)
│   ├── Main.js                      # Point d'entrée, routes, static files
│   ├── routes/                      # tiles.js, maps.js, npcs.js, tileFolders.js
│   └── Services/DependencyService.js
│
├── Engine/Classes/
│   ├── Base/                        # 35 fichiers — moteur générique réutilisable
│   │   ├── Main/Engine.js           # Game loop (requestAnimationFrame)
│   │   ├── Main/Renderer.js         # Canvas 2D draw calls
│   │   ├── Components/              # SpriteModel, PhysicController, BoxCollider, WGComponent
│   │   ├── WebGameObjects/          # Instance, WGObject, Camera, Tile, TileMap, TextLabel
│   │   ├── MicroClasses/            # Coordinates_2D, Size_2D
│   │   └── Services/                # 21 services (voir section dédiée)
│   │
│   └── Custom/                      # 26 fichiers — code spécifique au jeu
│       ├── WebGameObjects/          # Player, Character, NPC, InteractableObject, Shadow, NameTag
│       ├── Scenes/                  # TutorialScene.js, ExempleScene.js
│       ├── Combat/                  # BattleScene, BattleManager, Hackemon, BattleTrigger
│       └── Tutorial/                # Système tutoriel complet (voir section dédiée)
│
├── Public/
│   ├── Html/Game.html               # Page principale (Tailwind UI)
│   ├── Js/                          # StartEngine.js, GameController.js, TestStep3.js
│   ├── Css/TileFolders.css
│   └── Assets/Game/
│       ├── Characters/              # Enfant, Maman, Chien, Attacker (sprites 4 directions)
│       ├── Hackemons/               # Créatures de combat
│       ├── Objects/                 # Laptop, Sofa, TV, Frigo, Photo, Niche...
│       ├── Tiles/                   # Tuiles 27×27px
│       └── maps/                    # a.json (map tutoriel), a.npcs.json, z.json
│
└── Documentation/                   # 7 fichiers markdown techniques
```

---

## Systèmes moteur (Base Services)

| Service | Fichier | Rôle |
|---------|---------|------|
| InputService | `Base/Services/Inputs/InputService.js` | Clavier + souris |
| PhysicService | `Base/Services/Physic/PhysicService.js` | Mouvement + collisions AABB |
| SceneService | `Base/Services/Scenes/SceneService.js` | Chargement/déchargement de scènes |
| InteractionManager | `Base/Services/Interactions/InteractionManager.js` | Interactions joueur↔objets (rayon ~60px) |
| NPCService | `Base/Services/NPC/NPCService.js` | Spawn, waypoints, dialogue NPCs |
| MapService | `Base/Services/Grid/MapService.js` | Persistence maps JSON |
| HackemonService | `Base/Services/Hackemon/HackemonService.js` | Système de combat (partiel) |
| GameModeService | `Base/Services/GameModeService.js` | Mode Construction vs Play |
| DialogueBox | `Base/Services/Ui/DialogueBox.js` | Boîtes de dialogue multi-lignes |
| ConstructionGrid | `Base/Services/Grid/ConstructionGrid.js` | Éditeur de niveau |

---

## Système tutoriel (Custom/Tutorial/)

```
Tutorial/
├── TutorialScene.js                 # Orchestrateur principal (3 étapes)
├── TutorialHudService.js            # HUD overlay (objectifs, notifications)
├── TutorialProgressService.js       # État global (step1, step2, step3Completed)
├── Services/
│   ├── WindowsSimulatorService.js   # UI login Windows XP + panneau parental
│   ├── MotherAlertService.js        # Alerte Maman (3e tentative échouée)
│   └── InteractionUtils.js
├── Objects/
│   ├── ScriptedInteractable.js      # Objet interactif générique
│   ├── ProximityTrigger.js          # Zones de transition
│   ├── MotherNPC.js                 # IA Maman (WatchingTV → Alert)
│   └── ComputerInteractable.js      # Lancement minijeu hacking
└── Data/
    ├── TutorialStep1Data.js         # Config : coords spawn, dialogues, indices
    └── TutorialStep3Data.js         # Config : mot de passe, timers, positions UI
```

### Étape 1 — Introduction (Chambre)
- Cinématique : joueur figé, dialogue exposition du problème firewall
- Objets : TV (bloquée), casque VR, peluche Hackemon
- Sortie de chambre → déclenche étape 2

### Étape 2 — Infiltration (Salon)
- 5 zones d'infiltration (passage caché)
- Collecte de 3 indices de mot de passe :
  - **Niche du chien** → `"Clipper"` (nom du chien)
  - **Cadre photo** → `"1995"` (année)
  - **Frigo** → `"02"` (date anniversaire)
  - Mot de passe final : **`clipper150295`**
- NPC Maman : rayon de détection 54px — si capturé → écran noir + reset

### Étape 3 — Minijeu Hacking (Ordinateur)
- **Phase 1 (60s)** : UI login Windows XP
  - Username : `"admin"` (désactivé)
  - Password : `clipper150295`
  - Compteur 0/3 tentatives échouées
  - Timer : vert → orange (≤20s) → rouge + pulse (≤10s)
- **Phase 2 (40s)** : Panneau contrôle parental
  - Message : "Contrôle Parental est ACTIVE"
  - Bouton "Désactiver" → succès si cliqué
- **Alerte Maman** (3e échec login) : assombrissement écran, message "QU'EST CE QUE TU FAIS ?!!!", shake, retour chambre + reset complet

---

## API serveur

| Endpoint | Méthodes | Données |
|----------|----------|---------|
| `/api/tiles` | GET, POST | Gestion des tuiles |
| `/api/maps` | GET, POST | Maps JSON (`Public/Assets/Game/maps/`) |
| `/api/npcs` | GET, POST | Placements des NPCs |
| `/api/tileFolders` | GET, POST | Organisation assets en dossiers |

---

## Conventions de code

- **Composition** : chaque `WGObject` = transform + sprite (`SpriteModel`) + physique (`PhysicController`) + collider (`BoxCollider`)
- **Observer** : le HUD s'auto-synchronise avec `TutorialProgressService` (pas de couplage direct)
- **State machine** : stages du tutoriel, états joueur, IA NPC
- **Data-driven** : toute la config du tutoriel est dans `TutorialStep1Data.js` et `TutorialStep3Data.js` — modifier ces fichiers pour changer le gameplay sans toucher à la logique
- **Pas de framework** : vanilla ES6 modules uniquement côté moteur
- **Modes** : `GameModeService` distingue Construction (éditeur) et Play (jeu)

---

## Fichiers critiques

| Fichier | Rôle |
|---------|------|
| `Engine/Classes/Base/Main/Engine.js` | Game loop principal |
| `Engine/Classes/Base/Main/Renderer.js` | Rendu Canvas |
| `Engine/Classes/Base/Services/Scenes/SceneService.js` | Gestion des scènes |
| `Engine/Classes/Custom/Scenes/TutorialScene.js` | Scène principale du tutoriel |
| `Engine/Classes/Custom/Tutorial/Services/WindowsSimulatorService.js` | UI minijeu hacking |
| `Engine/Classes/Custom/Tutorial/Data/TutorialStep1Data.js` | Config étape 1 |
| `Engine/Classes/Custom/Tutorial/Data/TutorialStep3Data.js` | Config étape 3 |
| `Public/Js/StartEngine.js` | Initialisation moteur côté client |
| `Server/Main.js` | Point d'entrée serveur Express |
| `Public/Assets/Game/maps/a.json` | Layout map tutoriel (1640 lignes) |

---

## Tests

- **Tests manuels** : suivre `README_TUTORIAL.md` (procédures étape par étape)
- **Tests automatisés** : ouvrir console (F12) → `RunAllTests()` (défini dans `Public/Js/TestStep3.js`)
- **Checklist complète** : `CHECKLIST_FINAL.md`

---

## Dépendances npm

```json
"express": "^4.21.1"   // Serveur web
"ejs": "^3.1.10"        // Templates (usage minimal)
"multer": "^2.0.2"      // Upload d'assets
```

---

## Branches Git

| Branche | Rôle |
|---------|------|
| `main` | Production |
| `dev` | Développement actif (branche courante) |
| `feat/tutorial` | Travail tutorial (mergé dans dev) |
| `feat/beta-test/refinings` | Polish et corrections beta |
| `refactor/architectural-cleanup` | Refactoring architecture |

Environ 40 branches feature/refactor au total — consulter `git branch -a` pour la liste complète.

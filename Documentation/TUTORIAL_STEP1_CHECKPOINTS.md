# Tutoriel Step 1 - Checkpoints de validation

Ce document suit une strategie "commit par commit" pour isoler rapidement une regression.

## Commit 1

`37184d2` - `feat(interactions): unify proximity utils and support multiline dialogue/player freeze`

### Objectif
- Uniformiser les calculs de proximite d'interaction.
- Autoriser les dialogues multi-lignes.
- Exposer `freeze()` / `unfreeze()` / emote sur `Player`.

### Validation
- Ouvrir une interaction existante en mode play avec `E`.
- Verifier que la fermeture via `E` reste coherente.
- Verifier qu'un texte multi-ligne s'affiche ligne par ligne.

## Commit 2

`b7b67ab` - `feat(tutorial): implement step1 scene flow with cinematic, clues, mother trigger state`

### Objectif
- Ajouter l'architecture tuto step 1 (scene, data, hud, progression, NPC mere, triggers).

### Validation
- Charger la scene tutoriel.
- Verifier la cinematique de debut (freeze + blink + notification).
- Verifier interactions chambre:
  - TV / console
  - Casque VR
  - Ordinateur
  - Peluche
- Verifier indices salon (niche, frigo, cadre).
- Verifier detection de la mere et reposition script.
- Verifier trigger de sortie de chambre vers step 2.

## Commit 3

`6b12805` - `feat(bootstrap): wire tutorial scene and play-only mission HUD container`

### Objectif
- Brancher `TutorialScene` dans le bootstrap.
- Ajouter conteneur HUD mission dans `Game.html`.
- Masquer le HUD en mode construction.

### Validation
- Lancer en mode tuto (`map a` ou `?tutorial=1`).
- Verifier affichage HUD en mode play.
- Basculer en mode construction et verifier HUD masque.

## Commandes de controle rapide

```powershell
npm start
```

```powershell
git --no-pager log --oneline -n 10
```

```powershell
git status --short --branch
```

## Notes
- Le workspace local contient des changements de contenu map non inclus dans ces commits:
  - `Public/Assets/Game/tile-folders.json`
  - `Public/Assets/Game/maps/a.json`
- Ces fichiers peuvent etre commits a part, independamment du code moteur/tutorial.


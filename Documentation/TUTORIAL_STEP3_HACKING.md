Étape 3 : Pirater la box internet

## Vue d'ensemble
L'étape 3 est un mini-jeu de piratage où le joueur doit :
1. Interagir avec l'ordinateur du salon
2. Se connecter à Windows avec le mot de passe trouvé dans les indices
3. Accéder au panneau de contrôle parental
4. Désactiver le contrôle parental pour retrouver l'accès à Internet

## Mécaniques clés

### 1. Timer d'urgence (60 secondes)
- Un chrono démarre dès que le joueur interagit avec l'ordinateur
- La lumière de l'écran peut réveiller la mère
- Si le temps s'écoule, le jeu échoue et un message d'alerte s'affiche
- Le timer devient de plus en plus visible et clignotant au-dessous de 10 secondes

### 2. Interface Windows simulée
- Design authentique ressemblant à Windows 7/10
- Écran de login avec :
  - Username : "admin" (pré-rempli et désactivé)
  - Password : champ à remplir par le joueur
  - Bouton "Connexion"
  - Compteur de tentatives

### 3. Système de tentatives
- Le joueur a 3 tentatives pour entrer le bon mot de passe
- Le mot de passe correct est : `clipper150295`
  - Dérivé des indices trouvés :
    - "clipper" (nom du chien de la niche)
    - "1502" (15 février, anniversaire de la mère)
    - "95" (année de naissance de la mère, 1995)

### 4. Panneau de contrôle parental
- Après un login réussi, un panneau de contrôle s'affiche
- Le joueur doit cliquer sur "Désactiver" pour désactiver le contrôle parental
- Une fois désactivé, l'étape est complétée

### 5. Système d'alerte de la mère
- Si le joueur échoue trop de fois, la mère se réveille
- L'écran s'assombrit progressivement
- Un message s'affiche : "QU'EST CE QUE TU FAIS ?!!! RETOURNE DANS TA CHAMBRE DE SUITE !!!"
- Le joueur est téléporté à sa position initiale
- La progression est réinitialisée

## Fichiers créés

### TutorialStep3Data.js
Contient toute la configuration pour l'étape 3 :
- Objectif et messages
- Configuration du timer
- Configuration de l'interface Windows
- Configuration du contrôle parental
- Position de l'ordinateur

### WindowsSimulatorService.js
Service qui gère l'interface Windows simulée :
- Rendu de l'écran de login
- Gestion des tentatives de connexion
- Affichage du panneau de contrôle parental
- Timer d'urgence avec animations

### MotherAlertService.js
Service qui gère les alertes de la mère :
- Enregistrement des tentatives échouées
- Déclenchement de l'intervention de la mère
- Affichage de l'écran de game over

### ComputerInteractable.js
Objet interactif représentant l'ordinateur :
- Gère l'interaction du joueur
- Peut être activé/désactivé pendant le mini-jeu
- Affiche les dialogues introductifs

### Modifications à TutorialScene.js
- Import des nouveaux services et objets
- Ajout de propriétés privées pour l'étape 3
- Intégration de l'ordinateur dans la chambre
- Création du service d'alerte de la mère
- Méthode #startStep3() qui gère le flux du mini-jeu
- Méthode #completeStep3() qui marque la réussite

## Flow d'exécution

1. Joueur interagit avec l'ordinateur
   ↓
2. Le joueur est gelé, une notification d'avertissement s'affiche
   ↓
3. L'écran de login Windows s'affiche avec un timer de 60 secondes
   ↓
4. Le joueur entre le mot de passe (3 tentatives max)
   ↓
5. Cas A - Succès :
   - Le panneau de contrôle parental s'affiche
   - Le joueur a 40 secondes pour cliquer sur "Désactiver"
   - Étape 3 marquée comme complétée
   ↓
6. Cas B - Échec (mot de passe wrong ou timeout) :
   - Nombre de tentatives échouées enregistré
   - Si >= 3 : intervention de la mère (game over)
   - Sinon : message d'erreur simple

## Mot de passe

Le mot de passe correct est **"clipper150295"** qui est composé de :
- **clipper** : le nom du chien (trouvé en interagissant avec la niche)
- **1502** : 15 février, anniversaire de la mère (trouvé sur le calendrier du frigo)
- **95** : année de naissance de la mère (trouvé sur le cadre photo)

Le joueur doit avoir collecté ces indices dans l'étape 2 pour connaître le mot de passe.

## CSS et Animations

### Animations intégrées
- **pulse** : Animation du timer quand il reste ≤ 10 secondes
- **shake** : Animation du message de game over

### Couleurs du timer
- Normal (> 20s) : Vert (#2e7d32)
- Attention (10-20s) : Orange (#ff6f00)
- Critique (< 10s) : Rouge (#ff0000) avec animation pulse

## Integration avec le TutorialHud

Le HUD tutoriel affiche :
- L'objectif courant
- Les notifications d'avertissement/succès
- Les indicateurs de progression

## Notes de développement

- Le ordinateur est placé en chambre (position configurée dans TutorialStep3Data)
- L'objet ComputerInteractable peut être désactivé/réactivé pour éviter les interactions multiples
- Le service WindowsSimulatorService retourne une promesse avec le résultat
- Le service MotherAlertService peut être réutilisé pour d'autres événements d'alerte


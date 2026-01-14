/**
 * Script de test pour le système de dossiers de tuiles
 * À exécuter dans la console du navigateur (F12)
 */

// Test 1: Créer des dossiers
console.log('🧪 Test 1: Création de dossiers');
const personnagesId = window.tileFolderManager.createFolder('Personnages');
const tilesId = window.tileFolderManager.createFolder('Tuiles de Sol');
const mursId = window.tileFolderManager.createFolder('Murs et Déco');
console.log('✅ Dossiers créés:', { personnagesId, tilesId, mursId });

// Test 2: Afficher la structure
console.log('🧪 Test 2: Structure actuelle');
console.log(window.tileFolderManager.getStructure());

// Test 3: Déplacer des tuiles (simulé)
console.log('🧪 Test 3: Déplacement de tuiles (simulé)');
// Note: Vous devrez remplacer les chemins par vos vraies tuiles
const exampleTile = '/Public/Assets/Game/Tiles/example.png';
window.tileFolderManager.addTile(exampleTile, personnagesId);
console.log('✅ Tuile ajoutée au dossier Personnages');

// Test 4: Récupérer les tuiles d'un dossier
console.log('🧪 Test 4: Tuiles du dossier Personnages');
console.log(window.tileFolderManager.getTiles(personnagesId));

// Test 5: Renommer un dossier
console.log('🧪 Test 5: Renommer un dossier');
window.tileFolderManager.renameFolder(personnagesId, 'Sprites de Personnages');
console.log('✅ Dossier renommé');

// Test 6: Recharger l'interface
console.log('🧪 Test 6: Recharger l\'interface');
window.location.reload();

console.log('🎉 Tests terminés! Vérifiez le panneau latéral.');


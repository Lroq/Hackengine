// Ce fichier contient la logique précédemment présente dans Game.html
// Il gère l'interface utilisateur et les interactions globales

let mode = 'construction';
let editMode = 'brush'; // 'brush', 'fill', 'eraser'
let gameModeService;
let sceneService; // Reference to SceneService

// Variables pour le zoom
let currentZoom = 1.0;
const minZoom = 0.5;
const maxZoom = 3.0;
const zoomStep = 0.1;

// Variables de caméra
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let cameraPanVelocityX = 0;
let cameraPanVelocityY = 0;

export function initializeGameController(engineInstance) {
    console.log("🎮 Initialisation du GameController...");

    // Récupérer les services
    if (engineInstance) {
        if (engineInstance.services.GameModeService) {
            gameModeService = engineInstance.services.GameModeService;
            // Synchroniser l'état initial
            gameModeService.setMode(mode);
            gameModeService.setEditMode(editMode);
            gameModeService.setZoom(currentZoom);
        } else {
            console.warn("⚠️ GameModeService non trouvé lors de l'initialisation du contrôleur");
        }

        if (engineInstance.services.SceneService) {
            sceneService = engineInstance.services.SceneService;
        }
    }

    setupEventListeners();
    setupUI();

    // Démarrer la boucle de rendu forcé pour l'UI si nécessaire
    // (Non implémenté ici car le moteur gère sa propre boucle)

    return {
        setMode,
        getMode: () => mode,
        setEditMode,
        getEditMode: () => editMode
    };
}

/**
 * Change le mode d'édition actuel (brush, fill, eraser, npc, none)
 * @param {string} newEditMode 
 */
export function setEditMode(newEditMode) {
    editMode = newEditMode;
    console.log(`🛠️ Mode d'édition changé : ${editMode}`);

    if (gameModeService) {
        gameModeService.setEditMode(editMode);
    }

    // Mettre à jour l'interface (boutons)
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(btn => {
        if (btn.getAttribute('data-mode') === editMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Gestion du placement des PNJ
    if (window.npcPlacementService) {
        if (editMode === 'npc') {
            window.npcPlacementService.activate();
        } else {
            window.npcPlacementService.deactivate();
        }
    }

    // Mise à jour du curseur si on est en construction
    if (mode === 'construction' && !isPanning) {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            if (editMode === 'none') {
                canvas.style.cursor = 'grab';
            } else if (editMode === 'npc') {
                canvas.style.cursor = 'crosshair';
            }
            // Les autres modes (brush, etc.) peuvent avoir leurs propres curseurs 
            // mais par défaut on garde grab ou celui défini par le service
        }
    }

    // Legacy global
    window.editMode = editMode;
}


function setupEventListeners() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    // --- Gestion du pan de caméra ---
    canvas.addEventListener('mousedown', (e) => {
        if (mode === 'construction' && e.button === 2) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning && mode === 'construction') {
            const deltaX = e.clientX - panStartX;
            const deltaY = e.clientY - panStartY;

            // Mettre à jour les vélocités
            cameraPanVelocityX = deltaX;
            cameraPanVelocityY = deltaY;

            panStartX = e.clientX;
            panStartY = e.clientY;

            // Mettre à jour le service
            if (gameModeService) {
                gameModeService.setCameraPan(cameraPanVelocityX, cameraPanVelocityY);
            }

            // Mise à jour directe de la caméra pour feedback immédiat (deprecated but useful fallback)
            const activeCamera = getActiveCamera();
            if (activeCamera) {
                activeCamera.coordinates.X += deltaX;
                activeCamera.coordinates.Y += deltaY;
            }
            e.preventDefault();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            isPanning = false;
            cameraPanVelocityX = 0;
            cameraPanVelocityY = 0;

            if (gameModeService) {
                gameModeService.setCameraPan(0, 0);
            }

            updateCursor();
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            cameraPanVelocityX = 0;
            cameraPanVelocityY = 0;

            if (gameModeService) {
                gameModeService.setCameraPan(0, 0);
            }

            updateCursor();
        }
    });

    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });

    // --- Gestion du Zoom ---
    canvas.addEventListener('wheel', (e) => {
        if (mode !== 'construction') return;
        e.preventDefault();
        const delta = -Math.sign(e.deltaY) * zoomStep;
        updateZoom(currentZoom + delta);
    }, { passive: false });

    // --- Gestion des boutons UI ---

    // Zoom buttons
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => updateZoom(currentZoom + zoomStep));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => updateZoom(currentZoom - zoomStep));
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => updateZoom(1.0));

    // Mode buttons
    document.getElementById('play-btn')?.addEventListener('click', () => setMode('play'));
    document.getElementById('stop-btn')?.addEventListener('click', () => setMode('construction'));

    // Mode buttons
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetMode = button.getAttribute('data-mode');
            
            // Si on clique sur le mode déjà actif, on peut passer en mode 'none' (vue libre)
            if (editMode === targetMode) {
                setEditMode('none');
            } else {
                setEditMode(targetMode);
            }
        });
    });


    // --- Téléportation ---
    document.getElementById('teleport-to-sprite-btn')?.addEventListener('click', teleportToSprite);
    document.getElementById('teleport-to-zero-btn')?.addEventListener('click', teleportToZero);

    // --- Sauvegarde ---
    document.getElementById('save-map-btn')?.addEventListener('click', saveMapManually);
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveMapManually();
        }
    });

    // --- Aide ---
    setupHelpModal();

    // --- Resize ---
    window.addEventListener('resize', resizeCanvas);
}

function setupUI() {
    resizeCanvas();
    updateLayout();
    updateCursor();
    updateModeIndicator(mode);

    // Autosave
    startAutoSave();
}

function resizeCanvas() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const section = document.querySelector('section.flex-1');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const availableWidth = rect.width * 0.95;
    const availableHeight = rect.height * 0.95;

    canvas.style.width = availableWidth + 'px';
    canvas.style.height = availableHeight + 'px';
}

function updateLayout() {
    const aside = document.querySelector('aside');
    const editModePanel = document.querySelector('.absolute.top-4.left-4');

    if (aside) aside.style.display = mode === 'play' ? 'none' : 'flex';
    if (editModePanel) editModePanel.style.display = mode === 'play' ? 'none' : 'block';

    setTimeout(() => {
        resizeCanvas();
    }, 100);
}

function setMode(newMode) {
    mode = newMode;
    console.log(`🔄 Mode global changé : ${mode}`);

    if (gameModeService) {
        gameModeService.setMode(mode);
    }

    updateModeIndicator(mode);

    const canvas = document.getElementById('game-canvas');

    if (mode === "construction") {
        cameraPanVelocityX = 0;
        cameraPanVelocityY = 0;
        isPanning = false;

        if (gameModeService) {
            gameModeService.setCameraPan(0, 0);
        }

        // Détache la caméra du joueur
        const activeCamera = getActiveCamera();
        if (activeCamera) {
            console.log("📸 Caméra passée en mode SCRIPTABLE");
            activeCamera.cameraSubject = undefined;
            activeCamera.cameraType = "CAM_SCRIPTABLE"; // Correspond à CameraType.Scriptable
        } else {
            console.warn("⚠️ Caméra non trouvée pour le mode construction");
        }

        if (canvas) canvas.style.cursor = "grab";
    }

    if (mode === "play") {
        // Rattache la caméra au joueur
        const activeCamera = getActiveCamera();
        const player = getPlayerInstance();
        
        if (activeCamera && player) {
            console.log("📸 Caméra passée en mode FOLLOW (Suivi joueur)");
            activeCamera.cameraSubject = player;
            activeCamera.cameraType = "CAM_FOLLOW"; // Correspond à CameraType.Follow
            
            // Forcer le repositionnement immédiat pour éviter le "saut" ou la perte de vue
            const scale = canvas.height * 0.004;
            activeCamera.coordinates.X = (canvas.width / 2 / scale) - player.coordinates.X - 13.5;
            activeCamera.coordinates.Y = (canvas.height / 2 / scale) - player.coordinates.Y - 27;
            
            // Reset zoom au passage en jeu pour plus de clarté
            updateZoom(1.0);
        } else {
            console.error("❌ Impossible de rattacher la caméra : Joueur ou Caméra introuvable");
        }

        if (canvas) canvas.style.cursor = "default";
    }

    updateLayout();
}

function updateCursor() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    if (mode === 'construction') {
        canvas.style.cursor = isPanning ? 'grabbing' : 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
}

function updateZoom(newZoom) {
    if (mode !== 'construction') return;

    currentZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

    if (gameModeService) {
        gameModeService.setZoom(currentZoom);
    }

    // Legacy global
    window.constructionZoom = currentZoom;

    const display = document.getElementById('zoom-level-display');
    if (display) {
        display.textContent = Math.round(currentZoom * 100) + '%';
    }
}

function updateModeIndicator(mode) {
    const indicator = document.getElementById('mode-indicator');
    const icon = document.getElementById('mode-icon');
    const text = document.getElementById('mode-text');

    if (!indicator || !icon || !text) return;

    if (mode === 'play') {
        indicator.style.borderColor = '#10b981';
        indicator.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        icon.textContent = '▶️';
        text.textContent = 'Mode Play';
    } else {
        indicator.style.borderColor = '#3b82f6';
        indicator.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        icon.textContent = '🧱';
        text.textContent = 'Mode Construction';
    }
}

function teleportToSprite() {
    const activeCamera = getActiveCamera();
    const playerInstance = getPlayerInstance();

    if (activeCamera && playerInstance) {
        const spriteX = playerInstance.coordinates.X;
        const spriteY = playerInstance.coordinates.Y;

        const canvasHeight = 600; // Legacy hardcoded
        const canvasWidth = 800; // Legacy hardcoded
        let scale = canvasHeight * 0.004;

        let modelX = 0;
        let modelY = 0;
        if (playerInstance.components.BoxCollider) {
            modelX = playerInstance.components.BoxCollider.hitbox.Width / 2;
            modelY = playerInstance.components.BoxCollider.hitbox.Height / 2;
        }

        activeCamera.coordinates.X = -spriteX + (canvasWidth / 2) / scale - modelX;
        activeCamera.coordinates.Y = -spriteY + (canvasHeight / 2) / scale - modelY;

        const btn = document.getElementById('teleport-to-sprite-btn');
        if (btn) {
            btn.classList.add('bg-green-600');
            setTimeout(() => btn.classList.remove('bg-green-600'), 300);
        }
    }
}

function teleportToZero() {
    const activeCamera = getActiveCamera();
    if (activeCamera) {
        const canvasHeight = 600;
        const canvasWidth = 800;
        const scale = canvasHeight * 0.004;

        activeCamera.coordinates.X = (canvasWidth / 2) / scale;
        activeCamera.coordinates.Y = (canvasHeight / 2) / scale;

        const btn = document.getElementById('teleport-to-zero-btn');
        if (btn) {
            btn.classList.add('bg-green-600');
            setTimeout(() => btn.classList.remove('bg-green-600'), 300);
        }
    }
}

function saveMapManually() {
    // Utiliser gameModeService ou tileDragService via engineInstance
    if (window.engineInstance && window.engineInstance.services.TileDragService) {
        window.engineInstance.services.TileDragService.saveMap();

        // Sauvegarder aussi les PNJ
        const npcService = window.engineInstance.services.NPCService || window.npcService;
        if (npcService) {
            npcService.saveNPCs();
        }

        const saveBtn = document.getElementById('save-map-btn');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span>✅</span><span>Sauvegardé !</span>';
            saveBtn.classList.add('bg-green-700');
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('bg-green-700');
            }, 2000);
        }
    } else if (window.tileDragService) {
        // Fallback legacy
        window.tileDragService.saveMap();
    }
}

function setupHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (!helpModal) return;

    document.getElementById('help-btn')?.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    document.querySelectorAll('#close-help-btn, #close-help-btn-2').forEach(btn => {
        btn.addEventListener('click', () => helpModal.classList.add('hidden'));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
            helpModal.classList.add('hidden');
        }
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
}

function startAutoSave() {
    // 60000 ms = 1 minute
    setInterval(() => {
        if (mode === 'construction') {
            console.log('🕒 Sauvegarde automatique...');
            saveMapManually();
        }
    }, 60000);
    console.log('✅ Sauvegarde automatique activée');
}

// Helper to get active camera through services
function getActiveCamera() {
    if (sceneService && sceneService.activeScene) {
        return sceneService.activeScene.activeCamera;
    }
    return window.activeCamera; // Fallback
}

// Helper to get player instance through active scene
function getPlayerInstance() {
    if (sceneService && sceneService.activeScene) {
        // Accès direct à l'instance stockée dans la scène
        if (sceneService.activeScene.player) {
            return sceneService.activeScene.player;
        }

        // Fallback : recherche dans les WGObjects par nom de classe
        const player = sceneService.activeScene.wgObjects.find(obj => obj.constructor.name === 'Player');
        if (player) return player;
    }
    return window.playerInstance; // Ultime secours
}

// Shims de compatibilité
window.getMode = () => mode;
window.getEditMode = () => editMode;
window.getCameraPan = () => ({ x: cameraPanVelocityX, y: cameraPanVelocityY });
window.constructionZoom = currentZoom;


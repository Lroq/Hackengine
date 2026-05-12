const TutorialStep3Data = {
    objective: "Désactiver le contrôle parental sur l'ordinateur du salon",
    failText: "QU'EST CE QUE TU FAIS ?!!! RETOURNE DANS TA CHAMBRE DE SUITE !!!",
    introMessage: "Une lumière brille depuis l'ordinateur... la mere pourrait se reveiller !",

    // Configuration du timer
    timer: {
        maxDurationSeconds: 90,  // Temps limite login
        panelDurationSeconds: 75,  // Temps limite panneau parental
        warningThresholdSeconds: 15,  // Alerte visuelle à 15 secondes
        motherAlertAttemptsThreshold: 3,  // Nombre de tentatives avant alerte
    },

    // Configuration du système Windows simulé
    windowsUI: {
        username: "admin",
        passwordHint: "Tu dois trouver le mot de passe dans les indices...",
        correctPassword: "clipper150295",  // Dérivé de paperclip150295
        maxLoginAttempts: 3,
    },

    // Configuration du contrôle parental
    parentalControl: {
        enabledByDefault: true,
        disableSteps: [
            "Cliquez sur le raccourci 'Contrôle Parental' sur le bureau",
            "Cliquez sur 'Désactiver' dans le panneau",
            "Confirmez la désactivation"
        ]
    },

    // Position de l'ordinateur sur la map (au salon)
    computerInteractable: {
        id: "computer_salon",
        spritePath: "/Public/Assets/Game/Objects/Laptop.gif",
        x: 90,
        y: 135,
        width: 30,
        height: 25,
        label: "ordinateur",
        interactionRange: 34,
        // Dialogues pour étape 1 (chambre)
        linesStep1: [
            "Impossible d'utiliser le PC ! Y'a le pare-feu qui bloque tout !",
            "Ma mere ne sait pas que je l'ai ..."
        ],
        // Dialogues pour étape 3 (salon - mini-jeu)
        linesStep3: [
            "L'ecran de l'ordinateur brille dans le noir...",
            "Je dois etre rapide, la lumiere pourrait reveiller maman !"
        ],
        linesAfterFirewall: [
            "Controle parental desactive.",
            "Connexion Internet retablie !"
        ]
    }
};

export { TutorialStep3Data };

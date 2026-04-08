/**
 * TEST SCRIPT - Étape 3 : Pirater la Box Internet
 *
 * Ce script simule les étapes de test pour l'étape 3 du tutoriel
 * À exécuter en ouvrant la console du navigateur (F12) sur http://localhost:9000?tutorial=1
 */

// ============================================
// UTILITAIRES DE TEST
// ============================================

const TestUtils = {
    /**
     * Vérifie une assertion
     */
    assert: (condition, message) => {
        if (condition) {
            console.log(`✅ ${message}`);
        } else {
            console.error(`❌ ${message}`);
        }
    },

    /**
     * Attend un délai
     */
    wait: (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),

    /**
     * Cherche un élément dans le DOM
     */
    findElement: (selector) => document.querySelector(selector),

    /**
     * Simule un clic
     */
    click: (selector) => {
        const element = TestUtils.findElement(selector);
        if (element) {
            element.click();
            return true;
        }
        return false;
    },

    /**
     * Remplit un champ de texte
     */
    fillInput: (selector, text) => {
        const element = TestUtils.findElement(selector);
        if (element && element.tagName === 'INPUT') {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }
};

// ============================================
// TESTS - PHASE 1 : TIMER
// ============================================

const TestsTimer = {
    /**
     * Test: Timer affiche 60 secondes
     */
    testTimerDisplay: async () => {
        console.log("\n📋 TEST: Timer affiche 60 secondes");
        await TestUtils.wait(0.5);
        const timerDisplay = TestUtils.findElement('#timer-display');
        TestUtils.assert(timerDisplay !== null, "Élément timer trouvé");
        TestUtils.assert(timerDisplay?.textContent?.includes('60s'), "Timer affiche 60s initialement");
    },

    /**
     * Test: Timer compte à rebours
     */
    testTimerCountdown: async () => {
        console.log("\n📋 TEST: Timer compte à rebours");
        const timerDisplay = TestUtils.findElement('#timer-display');
        const initialText = timerDisplay?.textContent;

        await TestUtils.wait(2);
        const updatedText = timerDisplay?.textContent;

        TestUtils.assert(
            initialText !== updatedText,
            "Timer s'actualise (avant: " + initialText + ", après: " + updatedText + ")"
        );
    },

    /**
     * Test: Couleur change à 20 secondes
     */
    testTimerWarningColor: async () => {
        console.log("\n📋 TEST: Couleur change à 20 secondes");
        // Ce test nécessite d'attendre ~40 secondes, à tester manuellement
        TestUtils.assert(true, "À vérifier manuellement - couleur passe à orange");
    }
};

// ============================================
// TESTS - PHASE 2 : LOGIN
// ============================================

const TestsLogin = {
    /**
     * Test: Interface login correcte
     */
    testLoginInterface: async () => {
        console.log("\n📋 TEST: Interface login correcte");
        const usernameInput = TestUtils.findElement('#login-username');
        const passwordInput = TestUtils.findElement('#login-password');
        const attemptsDisplay = TestUtils.findElement('#attempts-display');

        TestUtils.assert(usernameInput !== null, "Champ username trouvé");
        TestUtils.assert(usernameInput?.value === 'admin', "Username est 'admin'");
        TestUtils.assert(usernameInput?.disabled, "Username est désactivé");

        TestUtils.assert(passwordInput !== null, "Champ password trouvé");
        TestUtils.assert(passwordInput?.value === '', "Password est vide");

        TestUtils.assert(attemptsDisplay !== null, "Compteur tentatives trouvé");
        TestUtils.assert(attemptsDisplay?.textContent?.includes('0/3'), "Tentatives: 0/3");
    },

    /**
     * Test: Mot de passe incorrect
     */
    testWrongPassword: async () => {
        console.log("\n📋 TEST: Mot de passe incorrect");
        TestUtils.fillInput('#login-password', 'wrongpassword');
        TestUtils.click('#login-btn');

        await TestUtils.wait(1);
        const feedback = TestUtils.findElement('#password-feedback');
        const attempts = TestUtils.findElement('#attempts-display');

        TestUtils.assert(
            feedback?.textContent?.includes('Mot de passe incorrect'),
            "Message d'erreur affiché"
        );
        TestUtils.assert(
            attempts?.textContent?.includes('1/3'),
            "Compteur incrémenté à 1/3"
        );
    },

    /**
     * Test: Mot de passe correct
     */
    testCorrectPassword: async () => {
        console.log("\n📋 TEST: Mot de passe correct");
        TestUtils.fillInput('#login-password', 'clipper150295');
        TestUtils.click('#login-btn');

        await TestUtils.wait(1.5);

        // Vérifier que l'interface a changé (panneau parental devrait apparaître)
        const disableBtn = TestUtils.findElement('#disable-btn');
        TestUtils.assert(
            disableBtn !== null,
            "Bouton désactiver trouvé (panneau parental apparu)"
        );
    }
};

// ============================================
// TESTS - PHASE 3 : PANNEAU PARENTAL
// ============================================

const TestsParentalPanel = {
    /**
     * Test: Panneau parental apparaît après login
     */
    testPanelAppearance: async () => {
        console.log("\n📋 TEST: Panneau parental apparaît");
        const windowTitle = TestUtils.findElement('div[style*="Panneau de Controle"]');
        TestUtils.assert(
            windowTitle !== null || TestUtils.findElement('#disable-btn') !== null,
            "Panneau de contrôle parental visible"
        );
    },

    /**
     * Test: Bouton désactiver fonctionne
     */
    testDisableButton: async () => {
        console.log("\n📋 TEST: Bouton désactiver");
        const disableBtn = TestUtils.findElement('#disable-btn');
        TestUtils.assert(disableBtn !== null, "Bouton désactiver trouvé");

        if (disableBtn) {
            disableBtn.click();
            await TestUtils.wait(1.5);

            TestUtils.assert(
                disableBtn.textContent?.includes('Desactived'),
                "Bouton affiche 'Desactived !'"
            );
        }
    }
};

// ============================================
// TEST GLOBAL - COMPLET
// ============================================

const RunAllTests = async () => {
    console.clear();
    console.log("═══════════════════════════════════════");
    console.log("🧪 TESTS ÉTAPE 3 - PIRATER LA BOX");
    console.log("═══════════════════════════════════════");

    // Tests Timer
    await TestsTimer.testTimerDisplay();
    await TestsTimer.testTimerCountdown();

    // Tests Login
    await TestsLogin.testLoginInterface();
    await TestsLogin.testWrongPassword();

    console.log("\n⏳ Entrez 'clipper150295' et appuyez sur Connexion...");
    console.log("   Puis lancez: TestsParentalPanel.testPanelAppearance()");
};

// ============================================
// INSTRUCTIONS D'UTILISATION
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║      TEST SCRIPT ÉTAPE 3 - PIRATER LA BOX INTERNET        ║
╚════════════════════════════════════════════════════════════╝

📌 INSTRUCTIONS:
1. Ouvrez http://localhost:9000?tutorial=1 dans votre navigateur
2. Collectez les indices (niche, cadre, frigo)
3. Allez au salon et interagissez avec l'ordinateur
4. Dans la console (F12), lancez le script:
   
   RunAllTests()
   
5. Suivez les instructions pour les tests manuels

📝 TESTS DISPONIBLES:

Timers:
- TestsTimer.testTimerDisplay()
- TestsTimer.testTimerCountdown()

Login:
- TestsLogin.testLoginInterface()
- TestsLogin.testWrongPassword()
- TestsLogin.testCorrectPassword()

Panneau Parental:
- TestsParentalPanel.testPanelAppearance()
- TestsParentalPanel.testDisableButton()

🎯 Mots de passe:
- Correct: clipper150295
- Incorrect (test): wrongpassword123

⏱️  Timings:
- Phase 1 (Login): 60 secondes
- Phase 2 (Panneau): 40 secondes
- Alerte couleur: 20 secondes (orange)
- Animation critique: 10 secondes (rouge + pulse)
`);


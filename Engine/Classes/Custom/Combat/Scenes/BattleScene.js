import {Scene} from "../../../Base/Services/Scenes/Scene.js";
import {WGObject} from "../../../Base/WebGameObjects/WGObject.js";
import {SpriteModel} from "../../../Base/Components/SpriteModel.js";
import {Utils} from "../../../Base/Services/Utilities/Utils.js";
import {CameraType} from "../../../Base/WebGameObjects/Camera.js";
import {TextLabel} from "../../../Base/WebGameObjects/TextLabel.js";

class BattleScene extends Scene {
    #battleManager;
    #uiElements = {};
    #playerHackemon = null;
    #enemyHackemon = null;

    constructor() {
        super();
        this.#setupCamera();
        this.#initializeUI();
    }

    #setupCamera() {
        super.activeCamera.cameraType = CameraType.Scriptable;
        super.activeCamera.coordinates.X = 0;
        super.activeCamera.coordinates.Y = 0;
    }

    #initializeUI() {
        const background = new WGObject();
        const bgSprite = new SpriteModel();
        bgSprite.enabled = true;
        bgSprite.sprite = Utils.createSprite("/Public/Assets/Game/Tiles/tile_floor_house_1.png");
        bgSprite.size.Width = 800;
        bgSprite.size.Height = 600;
        background.addComponent(bgSprite);
        background.coordinates.X = 0;
        background.coordinates.Y = 0;
        super.addWGObject(background);
    }

    #renderHackemon(hackemon, isPlayer = true) {
        if (!hackemon) {
            console.error("❌ No Hackemon to render");
            return;
        }

        const baseX = isPlayer ? 80 : 340;
        const baseY = isPlayer ? 200 : 120;

        // === SPRITE ===
        const spriteObj = new WGObject();
        const spriteModel = new SpriteModel();
        spriteModel.sprite = Utils.createSprite(hackemon.spriteURL);
        spriteModel.enabled = true;
        spriteModel.size.Width = 120;  // Majuscule
        spriteModel.size.Height = 120; // Majuscule

        spriteObj.coordinates.X = baseX;  // Majuscule
        spriteObj.coordinates.Y = baseY;  // Majuscule
        spriteObj.addComponent(spriteModel);
        super.addWGObject(spriteObj);

        const key = isPlayer ? "playerSprite" : "enemySprite";
        this.#uiElements[key] = spriteObj;

        // === INFO PANEL ===
        this.#renderInfoPanel(hackemon, isPlayer, baseX, baseY);
    }

    #renderInfoPanel(hackemon, isPlayer, baseX, baseY) {
        const panelX = isPlayer ? baseX + 140 : baseX - 140;
        const panelY = baseY + 20;

        // Name
        const nameLabel = new TextLabel();
        nameLabel.text = hackemon.name;
        nameLabel.font = "Pixel Font";
        nameLabel.size = 18;
        nameLabel.color = "white";
        nameLabel.coordinates.X = panelX;  // Majuscule
        nameLabel.coordinates.Y = panelY;  // Majuscule
        super.addWGObject(nameLabel);

        // Level
        const levelLabel = new TextLabel();
        levelLabel.text = `Niv. ${hackemon.level}`;
        levelLabel.font = "Pixel Font";
        levelLabel.size = 14;
        levelLabel.color = "yellow";
        levelLabel.coordinates.X = panelX;  // Majuscule
        levelLabel.coordinates.Y = panelY + 25;  // Majuscule
        super.addWGObject(levelLabel);

        // HP Bar
        const hpLabel = new TextLabel();
        hpLabel.text = `HP: ${hackemon.currentHP}/${hackemon.maxHP}`;
        hpLabel.font = "Pixel Font";
        hpLabel.size = 14;
        hpLabel.color = this.#getHPColor(hackemon.currentHP, hackemon.maxHP);
        hpLabel.coordinates.X = panelX;  // Majuscule
        hpLabel.coordinates.Y = panelY + 45;  // Majuscule
        super.addWGObject(hpLabel);

        const hpKey = isPlayer ? "playerHP" : "enemyHP";
        this.#uiElements[hpKey] = hpLabel;

        // Stats (only for player)
        if (isPlayer) {
            this.#renderStats(hackemon, panelX, panelY + 70);
        }
    }

    #renderStats(hackemon, x, y) {
        const stats = [
            `ATK: ${hackemon.attack}`,
            `DEF: ${hackemon.defense}`,
            `SPD: ${hackemon.speed}`
        ];

        stats.forEach((stat, i) => {
            const label = new TextLabel();
            label.text = stat;
            label.font = "Pixel Font";
            label.size = 12;
            label.color = "lightblue";
            label.coordinates.X = x;  // Majuscule
            label.coordinates.Y = y + (i * 20);  // Majuscule
            super.addWGObject(label);
        });
    }

    #getHPColor(current, max) {
        const ratio = current / max;
        if (ratio > 0.5) return "lightgreen";
        if (ratio > 0.2) return "orange";
        return "red";
    }

    #renderAttacks(hackemon) {
        const startX = 50;
        const startY = 400;

        this.#uiElements.attackButtons = [];

        hackemon.attacks.forEach((atkName, i) => {
            const button = new TextLabel();
            button.text = `${i + 1}. ${atkName}`;
            button.font = "Pixel Font";
            button.size = 16;
            button.color = "yellow";
            button.coordinates.X = startX + (i % 2) * 200;  // Majuscule
            button.coordinates.Y = startY + Math.floor(i / 2) * 30;  // Majuscule

            super.addWGObject(button);
            this.#uiElements.attackButtons.push(button);
        });
    }

    /**
     * Start battle with player and enemy Hackemons
     */
    startBattle(playerHackemon, enemyHackemon = null) {
        console.log("🎮 Starting battle with:", playerHackemon);

        this.#playerHackemon = playerHackemon;
        this.#enemyHackemon = enemyHackemon;

        // Render player's Hackemon
        this.#renderHackemon(playerHackemon, true);

        // Render enemy if provided
        if (enemyHackemon) {
            this.#renderHackemon(enemyHackemon, false);
        }

        // Render attack buttons
        this.#renderAttacks(playerHackemon);
    }

    endBattle() {
        console.log("⚔️ Battle ended!");
        // TODO: Return to previous scene
    }
}

export {BattleScene};
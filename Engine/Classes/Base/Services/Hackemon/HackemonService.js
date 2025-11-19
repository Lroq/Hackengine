import { Hackemon } from "../../../Custom/Combat/Hackemon/Hackemon.js";

class HackemonService {
    static #hackemonsData = null;
    static #attacksData = null;
    static #typesData = null;

    /**
     * Initialize and load all Hackemon data
     */
    static async initialize() {
        try {
            const [hackemonsResponse, attacksResponse, typesResponse] = await Promise.all([
                fetch('/Engine/Classes/Custom/Combat/Data/hackemons.json'),
                fetch('/Engine/Classes/Custom/Combat/Data/attacks.json'),
                fetch('/Engine/Classes/Custom/Combat/Data/types.json')
            ]);

            HackemonService.#hackemonsData = await hackemonsResponse.json();
            HackemonService.#attacksData = await attacksResponse.json();
            HackemonService.#typesData = await typesResponse.json();

            console.log("✅ Hackemon data loaded successfully");
        } catch (error) {
            console.error("❌ Failed to load Hackemon data:", error);
        }
    }

    /**
     * Create a Hackemon by ID
     * @param {string} hackemonId - ID from hackemons.json (e.g., "cle_USB")
     * @param {number} level - Hackemon level
     * @returns {Hackemon}
     */
    static createHackemon(hackemonId, level = 5) {
        if (!HackemonService.#hackemonsData) {
            throw new Error("HackemonService not initialized! Call HackemonService.initialize() first.");
        }

        const data = HackemonService.#hackemonsData[hackemonId];
        if (!data) {
            throw new Error(`Hackemon with ID "${hackemonId}" not found`);
        }

        return new Hackemon(data, level);
    }

    /**
     * Get attack data by name
     */
    static getAttack(attackName) {
        return HackemonService.#attacksData?.[attackName];
    }

    /**
     * Get type data by name
     */
    static getType(typeName) {
        return HackemonService.#typesData?.[typeName];
    }

    /**
     * Get all available Hackemons
     */
    static getAllHackemons() {
        return HackemonService.#hackemonsData;
    }
}

export { HackemonService };
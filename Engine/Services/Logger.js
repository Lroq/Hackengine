/**
 * Centralized logging service for the engine.
 * Provides different log levels and formatted output.
 * @class Logger
 */
class Logger {
    static LogLevel = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    };

    static #currentLevel = Logger.LogLevel.INFO;

    /**
     * Sets the minimum log level to display.
     * @param {number} level - Log level from Logger.LogLevel
     */
    static setLevel(level) {
        if (!Object.values(Logger.LogLevel).includes(level)) {
            throw new TypeError('Invalid log level');
        }
        Logger.#currentLevel = level;
    }

    /**
     * Logs a debug message.
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    static debug(message, ...args) {
        if (Logger.#currentLevel <= Logger.LogLevel.DEBUG) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Logs an info message.
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    static info(message, ...args) {
        if (Logger.#currentLevel <= Logger.LogLevel.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    /**
     * Logs a warning message.
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    static warn(message, ...args) {
        if (Logger.#currentLevel <= Logger.LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    /**
     * Logs an error message.
     * @param {string} message - Message to log
     * @param {Error} [error] - Optional error object
     * @param {...any} args - Additional arguments
     */
    static error(message, error, ...args) {
        if (Logger.#currentLevel <= Logger.LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, error, ...args);
        }
    }
}

export {Logger};
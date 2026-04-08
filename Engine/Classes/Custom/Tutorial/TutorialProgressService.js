class TutorialProgressService {
    #listeners = new Set();
    #state = {
        currentStep: "step1",
        currentObjective: "",
        objectiveDone: false,
        roomExited: false,
        foundClues: new Set(),
        password: "paperclip150295"
    };

    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        this.#listeners.add(listener);
        listener(this.snapshot());
        return () => this.#listeners.delete(listener);
    }

    snapshot() {
        return {
            ...this.#state,
            foundClues: [...this.#state.foundClues]
        };
    }

    #emit() {
        const snapshot = this.snapshot();
        this.#listeners.forEach(listener => listener(snapshot));
    }

    setObjective(text) {
        this.#state.currentObjective = text;
        this.#emit();
    }

    markObjectiveDone() {
        this.#state.objectiveDone = true;
        this.#emit();
    }

    collectClue(clueId) {
        if (!clueId || this.#state.foundClues.has(clueId)) {
            return false;
        }

        this.#state.foundClues.add(clueId);
        this.#emit();
        return true;
    }

    goToStep(stepId) {
        this.#state.currentStep = stepId;
        this.#emit();
    }

    markRoomExited() {
        this.#state.roomExited = true;
        this.#emit();
    }

    get password() {
        return this.#state.password;
    }
}

export { TutorialProgressService };


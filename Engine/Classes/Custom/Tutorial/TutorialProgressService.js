class TutorialProgressService {
    #listeners = new Set();
    #state = {
        currentStep: "step1",
        currentObjective: "",
        objectiveDone: false,
        roomExited: false,
        infiltrationStarted: false,
        infiltrationPathIndex: 0,
        missionFailed: false,
        foundClues: new Set(),
        password: "paperclip150295",
        step3Completed: false
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

    startInfiltration() {
        this.#state.infiltrationStarted = true;
        this.#state.infiltrationPathIndex = 0;
        this.#state.missionFailed = false;
        this.#emit();
    }

    setInfiltrationPathIndex(index) {
        this.#state.infiltrationPathIndex = index;
        this.#emit();
    }

    setMissionFailed(failed) {
        this.#state.missionFailed = !!failed;
        this.#emit();
    }

    resetStepTwoProgress() {
        this.#state.currentStep = "step1";
        this.#state.objectiveDone = false;
        this.#state.roomExited = false;
        this.#state.infiltrationStarted = false;
        this.#state.infiltrationPathIndex = 0;
        this.#state.missionFailed = false;
        this.#state.foundClues = new Set();
        this.#emit();
    }

    isStep3Completed() {
        return this.#state.step3Completed;
    }

    markStep3Completed() {
        this.#state.step3Completed = true;
        this.#state.objectiveDone = true;
        this.#emit();
    }

    hasClue(clueId) {
        return this.#state.foundClues.has(clueId);
    }

    get password() {
        return this.#state.password;
    }
}

export { TutorialProgressService };

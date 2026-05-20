class AudioService {
    #basePath = '/Public/Assets/Game/Sounds';
    #sounds = {};
    #footstepAudios = [];
    #footstepCount = 27; // 27 files available (step_01 to step_27)
    #footstepPool = [];
    #footstepPoolIndex = 27; // Force shuffle on first use
    #footstepLastTime = 0;
    #footstepInterval = 380; // ms between steps
    #loops = {};
    #ctx = null;
    #sfxGain = null;   // Sound effects channel
    #musicGain = null; // Music channel (separate volume)
    #connected = new Map(); // audio element → gain node it was wired to

    #getCtx() {
        if (!this.#ctx) {
            this.#ctx = new (window.AudioContext || window.webkitAudioContext)();

            this.#sfxGain = this.#ctx.createGain();
            this.#sfxGain.gain.value = 3.0;
            this.#sfxGain.connect(this.#ctx.destination);

            this.#musicGain = this.#ctx.createGain();
            this.#musicGain.gain.value = 0.2;
            this.#musicGain.connect(this.#ctx.destination);
        }
        if (this.#ctx.state === 'suspended') {
            this.#ctx.resume().catch(() => {});
        }
        return this.#ctx;
    }

    // Each HTMLMediaElement can only be wired once to a MediaElementSourceNode
    #wire(audio, channel) {
        if (this.#connected.has(audio)) return;
        const ctx = this.#getCtx(); // Must run first — creates #sfxGain / #musicGain
        const gainNode = channel === 'music' ? this.#musicGain : this.#sfxGain;
        const src = ctx.createMediaElementSource(audio);
        src.connect(gainNode);
        this.#connected.set(audio, channel);
    }

    preload() {
        for (let i = 1; i <= this.#footstepCount; i++) {
            const n = String(i).padStart(2, '0');
            const audio = new Audio(`${this.#basePath}/Footsteps/step_${n}.mp3`);
            audio.preload = 'auto';
            this.#footstepAudios.push(audio);
        }

        const named = {
            computer_error:   `${this.#basePath}/Computer/computer_error.mp3`,
            computer_startup: `${this.#basePath}/Computer/computer_startup.mp3`,
            computer_fan:     `${this.#basePath}/Computer/computer_fan.mp3`,
            dog_snore:        `${this.#basePath}/Dog/dog_snore.mp3`,
            fridge_ambient:   `${this.#basePath}/Fridge/fridge_ambiant.mp3`,
            intro_music:      `${this.#basePath}/Music/intro_music.wav`,
        };

        for (const [name, path] of Object.entries(named)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.#sounds[name] = audio;
        }
    }

    #shufflePool() {
        this.#footstepPool = Array.from({length: this.#footstepCount}, (_, i) => i);
        for (let i = this.#footstepCount - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.#footstepPool[i], this.#footstepPool[j]] = [this.#footstepPool[j], this.#footstepPool[i]];
        }
        this.#footstepPoolIndex = 0;
    }

    playFootstep() {
        const now = Date.now();
        if (now - this.#footstepLastTime < this.#footstepInterval) return;
        this.#footstepLastTime = now;

        if (this.#footstepPoolIndex >= this.#footstepCount) {
            this.#shufflePool();
        }

        const audio = this.#footstepAudios[this.#footstepPool[this.#footstepPoolIndex++]];
        if (!audio) return;
        this.#wire(audio, 'sfx');
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    playOneShot(name) {
        const audio = this.#sounds[name];
        if (!audio) return;
        this.#wire(audio, 'sfx');
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    playLoop(name) {
        if (this.#loops[name]) return;
        const audio = this.#sounds[name];
        if (!audio) return;
        this.#wire(audio, 'sfx');
        audio.loop = true;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        this.#loops[name] = audio;
    }

    // Separate method for background music — routed through the music channel
    playMusic(name) {
        if (this.#loops[name]) return;
        const audio = this.#sounds[name];
        if (!audio) return;
        this.#wire(audio, 'music');
        audio.loop = true;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        this.#loops[name] = audio;
    }

    stopLoop(name) {
        const audio = this.#loops[name];
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        delete this.#loops[name];
    }

    setSfxVolume(value) {
        if (this.#sfxGain) this.#sfxGain.gain.value = value;
    }

    setMusicVolume(value) {
        if (this.#musicGain) this.#musicGain.gain.value = value;
    }
}

export { AudioService };

/**
 * 1982: Héroes de Malvinas - Retro Audio Synthesizer
 * Synthesizes arcade-style 8-bit/16-bit sound effects and background music
 * using the browser's Web Audio API, completely offline and with zero external assets.
 */

class RetroAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.bgmVolume = null;
        this.sfxVolume = null;
        this.isMuted = false;
        this.bgmInterval = null;
        this.bgmPlaying = false;
        
        // Sequencer settings
        this.bpm = 135;
        this.currentStep = 0;
        this.notes = [
            // E Minor tense driving military bassline
            'E2', 'E2', 'G2', 'E2', 'A2', 'E2', 'B2', 'A2',
            'E2', 'E2', 'G2', 'E2', 'D3', 'B2', 'A2', 'G2'
        ];
        
        // Frequencies map
        this.frequencies = {
            'E2': 82.41, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'G3': 196.00,
            'A3': 220.00, 'B3': 246.94
        };
    }

    /**
     * Initializes the audio context. Must be triggered by user interaction.
     */
    init() {
        if (this.ctx) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            // Set up volume nodes
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.5, this.ctx.currentTime);
            this.masterVolume.connect(this.ctx.destination);
            
            this.bgmVolume = this.ctx.createGain();
            this.bgmVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
            this.bgmVolume.connect(this.masterVolume);
            
            this.sfxVolume = this.ctx.createGain();
            this.sfxVolume.gain.setValueAtTime(0.8, this.ctx.currentTime);
            this.sfxVolume.connect(this.masterVolume);
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterVolume) {
            this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    /**
     * SFX: Player Laser (A-4 / Pucará fire)
     */
    playLaser() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'square';
        // Fast downward pitch sweep
        osc.frequency.setValueAtTime(650, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
        
        gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    /**
     * SFX: Exocet Missile Zoom (Super Étendard special)
     */
    playExocet() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc2.type = 'triangle';
        
        // Fast pitch slide upward then steady buzzing
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.25);
        osc.frequency.linearRampToValueAtTime(380, now + 0.6);
        
        osc2.frequency.setValueAtTime(125, now);
        osc2.frequency.linearRampToValueAtTime(445, now + 0.25);
        osc2.frequency.linearRampToValueAtTime(385, now + 0.6);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.45);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc2.start();
        
        osc.stop(now + 0.6);
        osc2.stop(now + 0.6);
    }

    /**
     * SFX: Bomb Falling & Explosive thud (A-4 Special)
     */
    playBombDrop() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(now + 0.8);
        
        // Schedule explosion at the end
        setTimeout(() => {
            this.playExplosion(true);
        }, 800);
    }

    /**
     * SFX: Explosion (Uses Synthesized Noise)
     * @param {boolean} isHeavy - If true, produces a massive bassy explosion (ships/bosses)
     */
    playExplosion(isHeavy = false) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const bufferSize = this.ctx.sampleRate * (isHeavy ? 1.5 : 0.4);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise mixed with low-frequency rumble
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        const now = this.ctx.currentTime;
        if (isHeavy) {
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(10, now + 1.2);
        } else {
            filter.frequency.setValueAtTime(500, now);
            filter.frequency.exponentialRampToValueAtTime(20, now + 0.35);
        }
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(isHeavy ? 0.8 : 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 1.4 : 0.38));
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        noise.start();
        noise.stop(now + (isHeavy ? 1.5 : 0.4));
    }

    /**
     * SFX: Enemy Laser
     */
    playEnemyLaser() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /**
     * SFX: Player Hit / Shield Crash
     */
    playPlayerHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    /**
     * SFX: Arcade Coin Insert
     */
    playCoin() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.setValueAtTime(0.2, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(now + 0.35);
    }

    /**
     * SFX: Chime when Special Ability is fully charged
     */
    playSpecialReady() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.setValueAtTime(0.25, now + 0.24);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxVolume);
        
        osc.start();
        osc.stop(now + 0.55);
    }

    /**
     * BGM: Retro 8-bit Step Sequencer Loop
     */
    startBGM() {
        if (!this.ctx || this.bgmPlaying) return;
        this.resume();
        
        this.bgmPlaying = true;
        const stepDuration = 60 / this.bpm / 2; // Eighth notes
        
        const scheduleNextStep = () => {
            const now = this.ctx.currentTime;
            const noteName = this.notes[this.currentStep];
            const frequency = this.frequencies[noteName];
            
            // Bassline synth note
            if (frequency && !this.isMuted) {
                const osc = this.ctx.createOscillator();
                const gainNode = this.ctx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(frequency, now);
                
                // Add a subtle slide/pitch envelope for arcade feel
                osc.frequency.exponentialRampToValueAtTime(frequency * 0.95, now + stepDuration * 0.9);
                
                gainNode.gain.setValueAtTime(0.18, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);
                
                osc.connect(gainNode);
                gainNode.connect(this.bgmVolume);
                
                osc.start(now);
                osc.stop(now + stepDuration * 0.95);
            }
            
            // Minimal drum track (arcade noise snare on steps 4, 8, 12, 16)
            if ((this.currentStep % 4 === 2) && !this.isMuted) {
                // White noise burst
                const bufferSize = this.ctx.sampleRate * 0.05;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noiseNode = this.ctx.createBufferSource();
                noiseNode.buffer = buffer;
                
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1000, now);
                
                const drumGain = this.ctx.createGain();
                drumGain.gain.setValueAtTime(0.08, now);
                drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                
                noiseNode.connect(filter);
                filter.connect(drumGain);
                drumGain.connect(this.bgmVolume);
                
                noiseNode.start(now);
                noiseNode.stop(now + 0.05);
            }
            
            // Hi-hat tick on steps 1, 3, 5, 7...
            if ((this.currentStep % 2 === 0) && (this.currentStep % 4 !== 2) && !this.isMuted) {
                const hatOsc = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                hatOsc.type = 'sine';
                hatOsc.frequency.setValueAtTime(8000, now);
                
                hatGain.gain.setValueAtTime(0.02, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
                
                hatOsc.connect(hatGain);
                hatGain.connect(this.bgmVolume);
                
                hatOsc.start(now);
                hatOsc.stop(now + 0.015);
            }

            this.currentStep = (this.currentStep + 1) % this.notes.length;
        };

        // Run the scheduler using setInterval for absolute simplicity in this arcade frame
        // This is safe since it only triggers note scheduling ahead on steps
        this.bgmInterval = setInterval(scheduleNextStep, stepDuration * 1000);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.bgmPlaying = false;
    }
}

// Export global audio instance
window.audioEngine = new RetroAudioEngine();

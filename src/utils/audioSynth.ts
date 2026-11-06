// Web Audio API Romantic Wedding Synthesizer
// Zero external network dependency - plays beautiful ambient piano chords

class RomanticAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private hasMp3: boolean = false;

  constructor() {
    // Check if an MP3 exists
    this.checkMp3Support();
  }

  private checkMp3Support() {
    try {
      const audio = new Audio("/audio/wedding-music.mp3");
      audio.loop = true;
      audio.preload = "auto";
      audio.addEventListener("canplaythrough", () => {
        this.hasMp3 = true;
        this.htmlAudio = audio;
      });
      audio.addEventListener("error", () => {
        this.hasMp3 = false;
        this.htmlAudio = null;
      });
    } catch {
      this.hasMp3 = false;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  public async start(): Promise<boolean> {
    if (this.isPlaying) return true;

    // Try HTML audio first if available
    if (this.hasMp3 && this.htmlAudio) {
      try {
        await this.htmlAudio.play();
        this.isPlaying = true;
        return true;
      } catch (err) {
        console.warn("HTML audio play error, falling back to Web Audio synth", err);
      }
    }

    // Web Audio Synthesizer fallback
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return false;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      this.isPlaying = true;
      this.startMelodyLoop();
      return true;
    } catch (e) {
      console.error("Web audio failed to initialize", e);
      return false;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private playTone(freq: number, startTime: number, duration: number, volume: number = 0.12) {
    if (!this.audioCtx || !this.isPlaying) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Soft triangle/sine wave for a warm music-box / electric piano sound
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Envelope: gentle attack, warm decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignore audio glitches
    }
  }

  private startMelodyLoop(): void {
    if (!this.isPlaying || !this.audioCtx) return;

    // Frequencies for a romantic Pachelbel / Wedding progression in D Major:
    // D4, F#4, A4, D5 | A3, C#4, E4, A4 | B3, D4, F#4, B4 | F#3, A3, C#4, F#4
    // G3, B3, D4, G4 | D3, F#3, A3, D4 | G3, B3, D4, G4 | A3, C#4, E4, A4
    const chords: number[][] = [
      [293.66, 369.99, 440.0, 587.33], // D maj
      [220.0, 277.18, 329.63, 440.0],  // A maj
      [246.94, 293.66, 369.99, 493.88], // B min
      [185.0, 220.0, 277.18, 369.99],   // F# min
      [196.0, 246.94, 293.66, 392.0],   // G maj
      [146.83, 220.0, 293.66, 369.99],  // D maj
      [196.0, 246.94, 293.66, 440.0],   // G maj
      [220.0, 277.18, 329.63, 493.88],  // A maj
    ];

    let chordIndex = 0;

    const playNextBar = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      // Arpeggiate the 4 notes gently across 2.4 seconds
      const step = 0.55;
      notes.forEach((freq, idx) => {
        this.playTone(freq, now + idx * step, 1.8, idx === 0 ? 0.14 : 0.09);
        // Add a gentle octave sparkle for the melody
        if (idx === 3) {
          this.playTone(freq * 1.5, now + idx * step + 0.3, 1.2, 0.05);
        }
      });

      this.timerId = window.setTimeout(playNextBar, 2300);
    };

    playNextBar();
  }
}

export const romanticAudio = new RomanticAudioPlayer();

// Web Audio API Romantic Wedding Player
// Ưu tiên phát file MP3 nhạc nền thực tế, fallback về Web Audio synth nếu cần

class RomanticAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private htmlAudio: HTMLAudioElement | null = null;

  constructor() {
    // Tạo sẵn Audio element ngay lúc khởi tạo (không chờ event)
    this.prepareAudioElement();
  }

  private prepareAudioElement() {
    try {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      // Thêm nhiều source để tăng khả năng tương thích (đặc biệt iOS Safari)
      audio.src = "/music/nhac_nen.mp3";
      // Gắn vào DOM ẩn để iOS không block (iOS yêu cầu element phải có trong document)
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      this.htmlAudio = audio;
    } catch {
      this.htmlAudio = null;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  /**
   * Phải được gọi TRỰC TIẾP trong một user gesture handler (click, touch)
   * để iOS Safari cho phép phát audio.
   */
  public async start(): Promise<boolean> {
    if (this.isPlaying) return true;

    // --- Thử phát HTML Audio (MP3) ---
    if (this.htmlAudio) {
      try {
        // Reset lại src nếu bị lỗi trước đó
        if (this.htmlAudio.error) {
          this.htmlAudio.load();
        }
        await this.htmlAudio.play();
        this.isPlaying = true;
        return true;
      } catch (err) {
        console.warn("[Audio] HTML audio play failed, falling back to Web Audio synth:", err);
      }
    }

    // --- Fallback: Web Audio API Synthesizer ---
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
      console.error("[Audio] Web audio failed to initialize:", e);
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
    if (this.audioCtx) {
      this.audioCtx.suspend().catch(() => {});
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

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Bỏ qua lỗi audio nhỏ
    }
  }

  private startMelodyLoop(): void {
    if (!this.isPlaying || !this.audioCtx) return;

    const chords: number[][] = [
      [293.66, 369.99, 440.0, 587.33],
      [220.0, 277.18, 329.63, 440.0],
      [246.94, 293.66, 369.99, 493.88],
      [185.0, 220.0, 277.18, 369.99],
      [196.0, 246.94, 293.66, 392.0],
      [146.83, 220.0, 293.66, 369.99],
      [196.0, 246.94, 293.66, 440.0],
      [220.0, 277.18, 329.63, 493.88],
    ];

    let chordIndex = 0;

    const playNextBar = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      const step = 0.55;
      notes.forEach((freq, idx) => {
        this.playTone(freq, now + idx * step, 1.8, idx === 0 ? 0.14 : 0.09);
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

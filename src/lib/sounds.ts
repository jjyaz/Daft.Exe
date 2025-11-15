export class SoundManager {
  private context: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  playStartup() {
    this.playTone(523.25, 0.1);
    setTimeout(() => this.playTone(659.25, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 0.15), 200);
  }

  playClick() {
    this.playTone(800, 0.05, 'square');
  }

  playOpen() {
    this.playTone(440, 0.08);
    setTimeout(() => this.playTone(554.37, 0.08), 80);
  }

  playClose() {
    this.playTone(554.37, 0.08);
    setTimeout(() => this.playTone(440, 0.08), 80);
  }

  playError() {
    this.playTone(200, 0.2, 'sawtooth');
  }

  playSuccess() {
    this.playTone(523.25, 0.1);
    setTimeout(() => this.playTone(659.25, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 0.1), 200);
    setTimeout(() => this.playTone(1046.50, 0.15), 300);
  }

  playNotification() {
    this.playTone(880, 0.1);
    setTimeout(() => this.playTone(988, 0.1), 100);
  }
}

export const soundManager = new SoundManager();

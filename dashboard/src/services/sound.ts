class SoundService {
  private ctx: AudioContext | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmInterval: number | null = null;
  private isAlarmRunning: boolean = false;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playCircleNotify() {
    try {
      const audio = new Audio('/sounds/circle-notify.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {
        this.synthCircleNotify();
      });
    } catch {
      this.synthCircleNotify();
    }
  }

  playEmergencyAlert() {
    try {
      const audio = new Audio('/sounds/emergency-alert.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {
        this.synthEmergencyAlert();
      });
    } catch {
      this.synthEmergencyAlert();
    }
  }

  playSound(key: string) {
    if (key === 'emergency_alert') {
      this.playEmergencyAlert();
    } else {
      this.playCircleNotify();
    }
  }

  private synthCircleNotify() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  }

  private synthEmergencyAlert() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Two urgent alarm pulses
    [0, 0.25, 0.5].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.linearRampToValueAtTime(659, now + offset + 0.18);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.22);
    });
  }

  startAlarm(): boolean {
    if (this.isAlarmRunning) return true;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    this.isAlarmRunning = true;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    this.alarmOscillator = osc;
    this.alarmGain = gain;

    let high = false;
    this.alarmInterval = window.setInterval(() => {
      if (!this.alarmOscillator || !this.ctx) return;
      const targetFreq = high ? 700 : 1050;
      this.alarmOscillator.frequency.cancelScheduledValues(this.ctx.currentTime);
      this.alarmOscillator.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.2);
      high = !high;
    }, 250);

    return true;
  }

  stopAlarm() {
    if (!this.isAlarmRunning) return;
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch {
        // already stopped
      }
      this.alarmOscillator = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch {
        // already disconnected
      }
      this.alarmGain = null;
    }
    this.isAlarmRunning = false;
  }

  get isAlarming(): boolean {
    return this.isAlarmRunning;
  }
}

export const soundService = new SoundService();

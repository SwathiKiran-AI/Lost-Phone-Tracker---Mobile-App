/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for anti-theft siren alerts
let audioCtx: AudioContext | null = null;
let oscillator1: OscillatorNode | null = null;
let oscillator2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let modulatorNode: OscillatorNode | null = null;
let sweepInterval: any = null;

export function startSiren() {
  try {
    // Lazy initialize standard web audio context
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Prevent multiple sirens running at once
    stopSiren();

    // Create central nodes
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // moderate safe volume

    oscillator1 = audioCtx.createOscillator();
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(800, audioCtx.currentTime);

    oscillator2 = audioCtx.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(805, audioCtx.currentTime); // slightly off to produce beat frequency

    // Modulate frequency to create an aggressive anti-theft yelp
    let up = true;
    let freq = 800;
    
    sweepInterval = setInterval(() => {
      if (!audioCtx) return;
      if (up) {
        freq += 40;
        if (freq >= 1200) up = false;
      } else {
        freq -= 40;
        if (freq <= 600) up = true;
      }
      
      if (oscillator1) {
        oscillator1.frequency.linearRampToValueAtTime(freq, audioCtx.currentTime + 0.05);
      }
      if (oscillator2) {
        oscillator2.frequency.linearRampToValueAtTime(freq + 5, audioCtx.currentTime + 0.05);
      }
    }, 50);

    // Dynamic warning strobe modulation
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator1.start();
    oscillator2.start();
  } catch (error) {
    console.warn("Failed to generate synthesized sound due to web audio restrictions:", error);
  }
}

export function stopSiren() {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
  
  try {
    if (oscillator1) {
      oscillator1.stop();
      oscillator1.disconnect();
      oscillator1 = null;
    }
    if (oscillator2) {
      oscillator2.stop();
      oscillator2.disconnect();
      oscillator2 = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch (e) {
    // swallow shutdown errors
  }
}

// Retro-neon synth sound generator using the Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Lazy initialization after first user interaction to bypass browser autoplay blocks
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a subtle neon-themed digital sound when a number is successfully placed
 */
export function playPlacementSound(isNotesMode = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    if (isNotesMode) {
      // Gentle, high-pitched double tic for pencil notes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      // Warm, melodic analog synth pluck for real placements
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      // Slightly detuned oscillators for a retro chorus feel
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(329.63, now); // E4
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(330.63, now); // detuned slightly
      
      // Decay filter
      filterNode.type = 'lowpass';
      filterNode.Q.setValueAtTime(3, now);
      filterNode.frequency.setValueAtTime(1200, now);
      filterNode.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    }
  } catch (error) {
    console.debug('Audio playback bypassed:', error);
  }
}

/**
 * Play a polite, non-scary neon alert sound on mistakes
 */
export function playMistakeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A soft retro digital "downward slide" minor sound, clear but gentle
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Gentle minor 3rd drop: G4 (392Hz) to E4 (329.6Hz) to draw attention and guide
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.exponentialRampToValueAtTime(329.6, now + 0.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (error) {
    console.debug('Audio playback bypassed:', error);
  }
}

/**
 * Play a beautiful, rapid neon arpeggio theme upon completing the puzzle
 */
export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Notes of a joyful Major 7th chord rolling upwards
    const notes = [
      261.63, // C4
      329.63, // E4
      392.00, // G4
      493.88, // B4
      523.25, // C5
      659.25, // E5
      783.99, // G5
      987.77, // B5
      1046.50 // C6
    ];

    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.08;
      const noteTime = now + noteDelay;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, noteTime);
      filter.frequency.exponentialRampToValueAtTime(400, noteTime + 0.3);

      gain.gain.setValueAtTime(0.08, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  } catch (error) {
    console.debug('Audio playback bypassed:', error);
  }
}

/**
 * Play a lovely welcome ring when starting/entering the app
 */
export function playWelcomeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Ambient rising pad/chime
    const notes = [196.00, 246.94, 293.66, 392.00]; // G3 B3 D4 G4
    
    notes.forEach((freq, idx) => {
      const delay = idx * 0.12;
      const playTime = now + delay;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);
      
      gain.gain.setValueAtTime(0, playTime);
      gain.gain.linearRampToValueAtTime(0.05, playTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(playTime);
      osc.stop(playTime + 0.85);
    });
  } catch (error) {
    console.debug('Audio playback bypassed:', error);
  }
}

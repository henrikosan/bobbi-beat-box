// Advanced modular synthesis engine with complex routing and cross-modulation
export const generateModularSound = (ctx: AudioContext, synthParams: any, selectedPreset: any) => {
  const now = ctx.currentTime;
  const duration = Math.max(0.1, 0.1 + (synthParams.envelopeShape * 0.5));
  
  // Safe parameter validation to prevent NaN/Infinity
  const safeParam = (value: number, min = 0, max = 1) => {
    const num = Number(value);
    if (!isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
  };
  
  // Base frequency calculation with validation
  let baseFreq = selectedPreset.category === 'sounds' 
    ? 150 + (safeParam(synthParams.fmAmount) * 800)
    : 60;
  baseFreq = Math.max(20, Math.min(2000, baseFreq)); // Clamp to reasonable range
  
  // Create primary oscillator with validated frequency
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(baseFreq, now);
  
  // Create a second oscillator for harmonic content
  const osc2 = ctx.createOscillator();
  const osc2Gain = ctx.createGain();
  
  const harmonicFreq = baseFreq * (1 + safeParam(synthParams.crossMod, 0, 2));
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(harmonicFreq, now);
  
  // FM oscillator with safe parameters
  const fmOsc = ctx.createOscillator();
  const fmGain = ctx.createGain();
  
  const fmFreq = baseFreq * (2 + safeParam(synthParams.fmAmount) * 6);
  const fmDepth = safeParam(synthParams.fmAmount) * 50;
  
  fmOsc.frequency.setValueAtTime(fmFreq, now);
  fmGain.gain.setValueAtTime(fmDepth, now);
  
  // Connect FM properly
  fmOsc.connect(fmGain);
  fmGain.connect(osc.frequency);
  
  // Safe noise generation
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  const noiseLevel = safeParam(synthParams.noiseLayer);
  const chaosLevel = safeParam(synthParams.chaosLevel, 0, 0.5); // Limit chaos to prevent infinity
  
  for (let i = 0; i < noiseData.length; i++) {
    const t = i / noiseData.length;
    
    // Basic noise sources
    const whiteNoise = (Math.random() * 2 - 1);
    const pinkNoise = Math.sin(t * Math.PI * 20) * (Math.random() * 2 - 1) * 0.5;
    
    // Safe chaos generation - limit input to prevent tan() infinity
    const chaosInput = Math.max(-1.5, Math.min(1.5, t * Math.PI * chaosLevel));
    const chaos = Math.sin(chaosInput) * chaosLevel;
    
    const noiseMix = whiteNoise * (1 - noiseLevel * 0.5) + 
                    pinkNoise * (noiseLevel * 0.3) + 
                    chaos * 0.2;
    
    // Safe waveshaping
    const driveAmount = 1 + safeParam(synthParams.driveColor) * 3;
    const shaped = Math.tanh(noiseMix * driveAmount);
    
    noiseData[i] = shaped * noiseLevel;
  }
  
  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noiseSource.buffer = noiseBuffer;
  
  // Safe filter setup
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  
  const cutoffFreq = Math.max(80, 200 + safeParam(synthParams.resonance) * 2000);
  const qValue = Math.max(0.1, 1 + safeParam(synthParams.resonance) * 15);
  
  filter.frequency.setValueAtTime(cutoffFreq, now);
  filter.Q.setValueAtTime(qValue, now);
  
  // Master gain
  const masterGain = ctx.createGain();
  
  // Connect audio graph safely
  osc.connect(oscGain);
  osc2.connect(osc2Gain);
  noiseSource.connect(noiseGain);
  
  oscGain.connect(filter);
  osc2Gain.connect(filter);
  noiseGain.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);
  
  // Safe envelope parameters
  const attackTime = Math.max(0.001, 0.005 + safeParam(synthParams.envelopeShape) * 0.02);
  const releaseStart = now + attackTime;
  const releaseEnd = now + duration;
  
  // Oscillator envelopes with validation
  const oscLevel = 0.3;
  const osc2Level = 0.2 * safeParam(synthParams.crossMod);
  const noiseLevel2 = safeParam(synthParams.noiseLayer) * 0.4;
  
  // Set safe gain values
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(oscLevel, releaseStart);
  oscGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
  
  osc2Gain.gain.setValueAtTime(0, now);
  osc2Gain.gain.linearRampToValueAtTime(osc2Level, releaseStart);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
  
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(noiseLevel2, releaseStart * 0.5);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd * 0.7);
  
  // Master envelope
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.8, releaseStart);
  masterGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
  
  // Frequency modulation over time
  const freqEnd = baseFreq * 0.5;
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), releaseEnd);
  
  // Start sources
  fmOsc.start(now);
  osc.start(now);
  osc2.start(now);
  noiseSource.start(now);
  
  // Stop sources
  const stopTime = now + duration + 0.1;
  fmOsc.stop(stopTime);
  osc.stop(stopTime);
  osc2.stop(stopTime);
  noiseSource.stop(stopTime);
  
  return duration * 1000; // Return duration in milliseconds
};
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
  // Wave morphing between different waveforms
  const waveTypes = ['sine', 'square', 'sawtooth', 'triangle'];
  const waveIndex = Math.floor(safeParam(synthParams.waveMorph) * (waveTypes.length - 0.01));
  osc2.type = waveTypes[waveIndex] as OscillatorType;
  osc2.frequency.setValueAtTime(harmonicFreq, now);
  
  // LFO for modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const lfoRate = 0.1 + safeParam(synthParams.lfoRate) * 10; // 0.1 to 10 Hz
  const lfoDepth = safeParam(synthParams.lfoRate) * 20;
  
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(lfoRate, now);
  lfoGain.gain.setValueAtTime(lfoDepth, now);
  
  // Connect LFO to oscillator frequency for vibrato
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  // Ring modulator
  const ringModGain = ctx.createGain();
  const ringModDepth = safeParam(synthParams.ringMod);
  ringModGain.gain.setValueAtTime(ringModDepth, now);
  
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
    
  // Safe chaos generation - make it more prominent
  const chaosInput = Math.max(-1.5, Math.min(1.5, t * Math.PI * chaosLevel * 5)); // Amplify chaos
  const chaos = Math.sin(chaosInput) * chaosLevel * 2; // Double the chaos effect
  
  const noiseMix = whiteNoise * (1 - noiseLevel * 0.3) + 
                  pinkNoise * (noiseLevel * 0.5) + 
                  chaos * (chaosLevel * 3); // Make chaos more prominent
    
    // Safe waveshaping
    const driveAmount = 1 + safeParam(synthParams.driveColor) * 3;
    const shaped = Math.tanh(noiseMix * driveAmount);
    
    noiseData[i] = shaped * noiseLevel * 2; // Amplify noise for better audibility
  }
  
  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noiseSource.buffer = noiseBuffer;
  
  // Sample & Hold for stepped modulation
  const sampleHoldRate = 1 + safeParam(synthParams.sampleHold) * 20;
  const sampleHoldLFO = ctx.createOscillator();
  const sampleHoldGain = ctx.createGain();
  // Sample & Hold creates stepped modulation effect
  sampleHoldLFO.type = 'square'; // Creates stepped effect
  sampleHoldLFO.frequency.setValueAtTime(sampleHoldRate, now);
  sampleHoldGain.gain.setValueAtTime(sampleHoldRate * 10, now); // Connect S&H to affect filter cutoff
  
  // Connect Sample & Hold to modulate filter frequency
  sampleHoldLFO.connect(sampleHoldGain);
  
  // Filter routing - series vs parallel
  const filter1 = ctx.createBiquadFilter();
  const filter2 = ctx.createBiquadFilter();
  
  filter1.type = 'lowpass';
  filter2.type = 'highpass';
  
  const cutoffFreq = Math.max(80, 200 + safeParam(synthParams.resonance) * 2000);
  const qValue = Math.max(0.1, 1 + safeParam(synthParams.resonance) * 15);
  const routeAmount = safeParam(synthParams.filterRoute);
  
  filter1.frequency.setValueAtTime(cutoffFreq, now);
  filter1.Q.setValueAtTime(qValue, now);
  filter2.frequency.setValueAtTime(cutoffFreq * 0.5, now);
  filter2.Q.setValueAtTime(qValue * 0.8, now);
  
  // Connect Sample & Hold to modulate filter frequency for stepped effect
  if (safeParam(synthParams.sampleHold) > 0.01) {
    sampleHoldGain.connect(filter1.frequency);
  }
  
  // Feedback loop
  const feedbackDelay = ctx.createDelay(0.1);
  const feedbackGain = ctx.createGain();
  const feedbackAmount = safeParam(synthParams.feedback, 0, 0.9); // Limit to prevent runaway
  
  feedbackDelay.delayTime.setValueAtTime(0.01 + safeParam(synthParams.feedback) * 0.05, now);
  feedbackGain.gain.setValueAtTime(feedbackAmount, now);
  
  // Master gain
  const masterGain = ctx.createGain();
  
  // Connect audio graph with simplified routing
  osc.connect(oscGain);
  osc2.connect(osc2Gain);
  noiseSource.connect(noiseGain);
  
  // Simple ring modulation using GainNode
  const ringMix = ctx.createGain();
  ringMix.gain.setValueAtTime(1 - ringModDepth, now);
  
  if (ringModDepth > 0.01) {
    // Create proper ring mod by using gain nodes
    const ringModulator = ctx.createGain();
    ringModulator.gain.setValueAtTime(ringModDepth, now);
    
    osc.connect(ringModulator);
    osc2.connect(ringModulator);
    ringModulator.connect(ringMix);
  }
  
  // Main signal path
  oscGain.connect(ringMix);
  osc2Gain.connect(filter1);
  noiseGain.connect(filter1);
  ringMix.connect(filter1);
  
  // Simple filter routing
  if (routeAmount > 0.5) {
    // Series routing
    filter1.connect(filter2);
    filter2.connect(masterGain);
  } else {
    // Direct routing
    filter1.connect(masterGain);
  }
  
  // Feedback loop (simplified)
  if (feedbackAmount > 0.01) {
    masterGain.connect(feedbackDelay);
    feedbackDelay.connect(feedbackGain);
    feedbackGain.connect(filter1);
  }
  
  masterGain.connect(ctx.destination);
  
  // Safe envelope parameters
  const attackTime = Math.max(0.001, 0.005 + safeParam(synthParams.envelopeShape) * 0.02);
  const releaseStart = now + attackTime;
  const releaseEnd = now + duration;
  
  // Oscillator envelopes with validation
  const oscLevel = 0.3;
  const osc2Level = 0.2 * safeParam(synthParams.crossMod);
  const noiseLevel2 = safeParam(synthParams.noiseLayer) * 0.8; // Increase noise level
  
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
  lfo.start(now);
  sampleHoldLFO.start(now);
  osc.start(now);
  osc2.start(now);
  noiseSource.start(now);
  
  // Stop sources
  const stopTime = now + duration + 0.1;
  fmOsc.stop(stopTime);
  lfo.stop(stopTime);
  sampleHoldLFO.stop(stopTime);
  osc.stop(stopTime);
  osc2.stop(stopTime);
  noiseSource.stop(stopTime);
  
  return duration * 1000; // Return duration in milliseconds
};
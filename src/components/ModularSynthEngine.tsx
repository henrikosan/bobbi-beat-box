// Advanced modular synthesis engine with voltage-controlled modulation
// Inspired by classic semi-modular synthesizers - "the sound of voltage itself"
export const generateModularSound = (ctx: BaseAudioContext, synthParams: any, selectedPreset: any) => {
  const now = ctx.currentTime;
  const duration = Math.max(0.1, 0.1 + (synthParams.envelopeShape * 0.5));
  
  // Safe parameter validation to prevent NaN/Infinity
  const safeParam = (value: number, min = 0, max = 1) => {
    const num = Number(value);
    if (!isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
  };
  
  // Base frequency calculation with modular character
  let baseFreq = selectedPreset.category === 'sounds' 
    ? 150 + (safeParam(synthParams.fmAmount) * 800)
    : 60;
  baseFreq = Math.max(20, Math.min(2000, baseFreq));
  
  // VOLTAGE-CONTROLLED OSCILLATORS - Classic modular style
  const vco1 = ctx.createOscillator();
  const vco2 = ctx.createOscillator();
  const vco1Gain = ctx.createGain();
  const vco2Gain = ctx.createGain();
  
  // VCO1: Primary oscillator with voltage control
  vco1.type = 'sawtooth'; // Classic analog waveform
  vco1.frequency.setValueAtTime(baseFreq, now);
  
  // VCO2: Detuned oscillator for thickness (classic analog technique)
  const detune = 1 + (safeParam(synthParams.crossMod) * 0.1 - 0.05); // ±5% detune
  vco2.type = 'square'; // Different waveform for harmonic content
  vco2.frequency.setValueAtTime(baseFreq * detune, now);
  
  // VOLTAGE-CONTROLLED FILTER (VCF) - The heart of modular sound
  const vcf1 = ctx.createBiquadFilter();
  const vcf2 = ctx.createBiquadFilter();
  
  // Dual filter configuration for complex filtering
  vcf1.type = 'lowpass';
  vcf2.type = 'bandpass';
  
  const cutoffBase = Math.max(80, 200 + safeParam(synthParams.resonance) * 3000);
  const resonanceQ = Math.max(0.1, 1 + safeParam(synthParams.resonance) * 8); // Controlled Q to prevent self-oscillation
  
  vcf1.frequency.setValueAtTime(cutoffBase, now);
  vcf1.Q.setValueAtTime(resonanceQ, now);
  vcf2.frequency.setValueAtTime(cutoffBase * 1.5, now);
  vcf2.Q.setValueAtTime(resonanceQ * 0.7, now);
  
  // ENVELOPE GENERATORS - "Pumping envelopes" with voltage control
  const envelopeCV = ctx.createGain();
  const filterCV = ctx.createGain();
  
  // Create complex envelope shapes for "pumping" character - ensure proper timing for offline context
  const attackTime = Math.max(0.002, 0.005 + safeParam(synthParams.envelopeShape) * 0.08);
  const decayTime = attackTime * (3 + safeParam(synthParams.envelopeShape) * 8);
  const sustainLevel = selectedPreset.category === 'drums' ? 0.05 : safeParam(synthParams.envelopeShape) * 0.5;
  const releaseTime = duration * (0.4 + safeParam(synthParams.envelopeShape) * 0.6);
  
  // VOLTAGE-CONTROLLED AMPLIFIER (VCA) with pumping action
  const vca = ctx.createGain();
  vca.gain.setValueAtTime(0, now);
  
  // Envelope automation with proper offline context timing
  if (selectedPreset.category === 'drums') {
    // Punchy drum envelope with sharp attack
    vca.gain.setValueAtTime(0, now);
    vca.gain.linearRampToValueAtTime(1.0, now + attackTime);
    vca.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + attackTime + decayTime);
    vca.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);
    vca.gain.setValueAtTime(0, now + duration);
  } else {
    // More sustained envelope for sounds with voltage-style curves
    vca.gain.setValueAtTime(0, now);
    vca.gain.linearRampToValueAtTime(0.9, now + attackTime);
    vca.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + attackTime + decayTime);
    vca.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel * 0.3), now + duration - releaseTime);
    vca.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.01);
    vca.gain.setValueAtTime(0, now + duration);
  }
  
  // LOW FREQUENCY OSCILLATOR (LFO) - Voltage-controlled modulation
  const lfo1 = ctx.createOscillator(); // Primary LFO
  const lfo2 = ctx.createOscillator(); // Secondary LFO for complex modulation
  const lfo1Gain = ctx.createGain();
  const lfo2Gain = ctx.createGain();
  
  const lfoRate1 = 0.1 + safeParam(synthParams.lfoRate) * 15; // Wide LFO range
  const lfoRate2 = lfoRate1 * (1.618); // Golden ratio for complex beating
  const lfoDepth1 = safeParam(synthParams.lfoRate) * 30;
  const lfoDepth2 = safeParam(synthParams.lfoRate) * 20;
  
  lfo1.type = 'triangle'; // Smooth modulation
  lfo2.type = 'sine';
  lfo1.frequency.setValueAtTime(lfoRate1, now);
  lfo2.frequency.setValueAtTime(lfoRate2, now);
  lfo1Gain.gain.setValueAtTime(lfoDepth1, now);
  lfo2Gain.gain.setValueAtTime(lfoDepth2, now);
  
  // Cross-modulate LFOs for complex voltage-style behavior
  lfo1.connect(lfo1Gain);
  lfo2.connect(lfo2Gain);
  
  // FREQUENCY MODULATION - "Razor-sharp FM chirps"
  const fmOsc = ctx.createOscillator();
  const fmGain = ctx.createGain();
  
  const fmRatio = 2 + safeParam(synthParams.fmAmount) * 8; // Classic FM ratios
  const fmIndex = safeParam(synthParams.fmAmount) * 100; // Deep FM for razor-sharp sounds
  
  fmOsc.type = 'sine'; // Pure sine for clean FM
  fmOsc.frequency.setValueAtTime(baseFreq * fmRatio, now);
  fmGain.gain.setValueAtTime(fmIndex, now);
  
  // Envelope control for FM - creates "chirp" effects
  const fmEnvelope = ctx.createGain();
  fmEnvelope.gain.setValueAtTime(1, now);
  fmEnvelope.gain.exponentialRampToValueAtTime(0.1, now + attackTime * 3);
  
  // NOISE GENERATORS - "Layers of manipulated noise"
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (duration + 0.1)), ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  const noiseLevel = safeParam(synthParams.noiseLayer);
  const chaosLevel = safeParam(synthParams.chaosLevel, 0, 0.8);
  
  // Generate complex noise layers with enhanced offline context compatibility
  for (let i = 0; i < noiseData.length; i++) {
    const t = i / noiseData.length;
    
    // Multiple noise sources for complex texture
    const whiteNoise = (Math.random() * 2 - 1);
    const pinkNoise = Math.sin(t * Math.PI * 40) * (Math.random() * 2 - 1) * 0.7;
    const digitalNoise = Math.sign(Math.sin(t * Math.PI * 100 * chaosLevel)) * Math.random();
    
    // Voltage-controlled noise manipulation
    const voltageNoise = Math.tanh(whiteNoise * (1 + chaosLevel * 3)) * 0.8;
    
    // Layer and shape the noise
    const noiseMix = whiteNoise * (1 - noiseLevel * 0.4) + 
                    pinkNoise * (noiseLevel * 0.6) + 
                    digitalNoise * (chaosLevel * 0.4) +
                    voltageNoise * (noiseLevel * 0.3);
    
    // Apply analog-style saturation
    noiseData[i] = Math.tanh(noiseMix * (1 + safeParam(synthParams.driveColor) * 2)) * 0.9;
  }
  
  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  
  // Ensure noise buffer is properly assigned
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = false; // Ensure single playback
  
  // Voltage-controlled noise filtering
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(100 + safeParam(synthParams.filterRoute) * 2000, now);
  noiseFilter.Q.setValueAtTime(1 + safeParam(synthParams.resonance) * 4, now); // Reduced noise filter Q
  
  // SAMPLE & HOLD - Classic modular technique
  const sampleHoldRate = 2 + safeParam(synthParams.sampleHold) * 50;
  const sampleHoldLFO = ctx.createOscillator();
  const sampleHoldGain = ctx.createGain();
  
  sampleHoldLFO.type = 'square'; // Creates stepped voltage levels
  sampleHoldLFO.frequency.setValueAtTime(sampleHoldRate, now);
  sampleHoldGain.gain.setValueAtTime(sampleHoldRate * 15, now);
  
  // VOLTAGE-CONTROLLED MIXER - Complex signal routing
  const mixer1 = ctx.createGain();
  const mixer2 = ctx.createGain();
  const mixBalance = safeParam(synthParams.filterRoute);
  
  mixer1.gain.setValueAtTime(1 - mixBalance, now);
  mixer2.gain.setValueAtTime(mixBalance, now);
  
  // RING MODULATOR - For metallic textures
  const ringMod = ctx.createGain();
  const ringModDepth = safeParam(synthParams.ringMod);
  
  // FEEDBACK LOOP - Classic analog feedback
  const feedbackDelay = ctx.createDelay(0.1);
  const feedbackGain = ctx.createGain();
  const feedbackAmount = Math.min(0.4, safeParam(synthParams.feedback) * 0.3); // Reduced feedback to prevent screaming
  
  feedbackDelay.delayTime.setValueAtTime(0.005 + safeParam(synthParams.feedback) * 0.02, now);
  feedbackGain.gain.setValueAtTime(feedbackAmount, now);
  
  // MASTER OUTPUT STAGE
  const masterVCA = ctx.createGain();
  const masterSaturation = ctx.createWaveShaper();
  
  // Analog-style saturation curve
  const saturationCurve = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const x = (i - 32768) / 16384;
    saturationCurve[i] = Math.tanh(x * (1 + safeParam(synthParams.driveColor) * 2)) * 0.9;
  }
  masterSaturation.curve = saturationCurve;
  masterSaturation.oversample = '2x';
  
  // PATCHING - Connect the modular system
  
  // VCOs to mixer
  vco1.connect(vco1Gain);
  vco2.connect(vco2Gain);
  
  // FM patching - "razor-sharp FM chirps"
  fmOsc.connect(fmGain);
  fmGain.connect(fmEnvelope);
  fmEnvelope.connect(vco1.frequency);
  
  // VCF patching with CV control
  vco1Gain.connect(mixer1);
  vco2Gain.connect(mixer2);
  
  // Dual filter path
  mixer1.connect(vcf1);
  mixer2.connect(vcf2);
  
  // LFO modulation patching
  lfo1Gain.connect(vcf1.frequency);
  lfo2Gain.connect(vcf2.frequency);
  
  // Sample & Hold to filter cutoff
  sampleHoldLFO.connect(sampleHoldGain);
  if (safeParam(synthParams.sampleHold) > 0.01) {
    sampleHoldGain.connect(vcf1.frequency);
  }
  
  // Noise path - ensure proper connection for offline rendering
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterVCA); // Direct connection to ensure capture
  
  // Ring modulation
  if (ringModDepth > 0.01) {
    vcf1.connect(ringMod);
    vcf2.connect(ringMod.gain);
  }
  
  // Final mixer and VCA - ensure all sources are connected
  vcf1.connect(masterVCA);
  vcf2.connect(masterVCA);
  // Noise already connected above
  if (ringModDepth > 0.01) {
    ringMod.connect(masterVCA);
  }
  
  // Feedback patching
  if (feedbackAmount > 0.01) {
    masterVCA.connect(feedbackDelay);
    feedbackDelay.connect(feedbackGain);
    feedbackGain.connect(vcf1);
  }
  
  // Master output chain
  masterVCA.connect(vca);
  vca.connect(masterSaturation);
  masterSaturation.connect(ctx.destination);
  
  // Set gain levels with voltage-style curves
  const vco1Level = 0.4 * (1 + safeParam(synthParams.crossMod) * 0.5);
  const vco2Level = 0.3 * safeParam(synthParams.crossMod);
  const noiseLevel2 = Math.max(0.001, safeParam(synthParams.noiseLayer) * 0.8); // Ensure minimum noise level for capture
  
  vco1Gain.gain.setValueAtTime(vco1Level, now);
  vco2Gain.gain.setValueAtTime(vco2Level, now);
  
  // Noise envelope - different curve for drums vs sounds with proper offline timing
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(noiseLevel2, now + attackTime * 0.8);
  if (selectedPreset.category === 'drums') {
    noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.001, noiseLevel2 * 0.1), now + duration * 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.01);
  } else {
    noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.001, noiseLevel2 * 0.4), now + duration - releaseTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.01);
  }
  noiseGain.gain.setValueAtTime(0, now + duration);
  
  // Voltage-style frequency sweeps
  const freqSweepAmount = safeParam(synthParams.envelopeShape) * baseFreq * 0.5;
  if (selectedPreset.category === 'drums') {
    // Punchy frequency sweep for drums
    vco1.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq - freqSweepAmount), now + duration * 0.8);
  }
  
  // Filter envelope - creates "pumping" character with proper offline timing
  const filterSweep = cutoffBase * (0.8 + safeParam(synthParams.envelopeShape) * 2.5);
  vcf1.frequency.setValueAtTime(cutoffBase * 0.5, now);
  vcf1.frequency.linearRampToValueAtTime(filterSweep, now + attackTime * 1.2);
  vcf1.frequency.exponentialRampToValueAtTime(Math.max(80, cutoffBase * 0.4), now + duration - releaseTime);
  vcf1.frequency.exponentialRampToValueAtTime(Math.max(80, cutoffBase * 0.2), now + duration - 0.01);
  
  // Secondary filter envelope
  vcf2.frequency.setValueAtTime(cutoffBase * 0.7, now);
  vcf2.frequency.linearRampToValueAtTime(filterSweep * 1.2, now + attackTime * 0.8);
  vcf2.frequency.exponentialRampToValueAtTime(Math.max(80, cutoffBase * 0.6), now + duration - 0.01);
  
  // Start all oscillators with slight timing offsets (analog behavior)
  const startOffset = 0.001;
  fmOsc.start(now);
  lfo1.start(now + startOffset * 0.5);
  lfo2.start(now + startOffset * 0.7);
  sampleHoldLFO.start(now + startOffset);
  vco1.start(now + startOffset * 0.3);
  vco2.start(now + startOffset * 0.6);
  noiseSource.start(now); // Start noise immediately for proper capture
  
  // Stop with clean timing to prevent artifacts
  const stopTime = now + duration;
  fmOsc.stop(stopTime);
  lfo1.stop(stopTime);
  lfo2.stop(stopTime);
  sampleHoldLFO.stop(stopTime);
  vco1.stop(stopTime);
  vco2.stop(stopTime);
  noiseSource.stop(stopTime); // Ensure noise stops at exact time
  
  return duration * 1000; // Return duration in milliseconds
};
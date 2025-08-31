// Advanced modular synthesis engine with complex routing and cross-modulation
export const generateModularSound = (ctx: AudioContext, synthParams: any, selectedPreset: any) => {
  const now = ctx.currentTime;
  const duration = 0.1 + (synthParams.envelopeShape * 0.5);
  
  // Base frequency calculation
  let baseFreq = 60;
  if (selectedPreset.category === 'sounds') {
    baseFreq = 150 + (synthParams.fmAmount * 1200);
  }
  
  // Create LFO for modulation
  const lfo1 = ctx.createOscillator();
  const lfo2 = ctx.createOscillator();
  const lfoGain1 = ctx.createGain();
  const lfoGain2 = ctx.createGain();
  
  lfo1.frequency.setValueAtTime(0.1 + (synthParams.lfoRate * 20), now);
  lfo2.frequency.setValueAtTime(0.3 + (synthParams.lfoRate * 15), now);
  lfoGain1.gain.setValueAtTime(synthParams.lfoRate * 50, now);
  lfoGain2.gain.setValueAtTime(synthParams.lfoRate * 30, now);
  
  // Create multiple oscillators with different waveforms
  const oscillators = [];
  const gains = [];
  const waveforms = ['sine', 'sawtooth', 'square', 'triangle'];
  
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Wave morphing between different waveforms
    const waveIndex = Math.floor(synthParams.waveMorph * (waveforms.length - 1));
    osc.type = waveforms[waveIndex] as OscillatorType;
    
    // Mathematical frequency relationships
    const freqRatios = [1, 1.618, Math.PI/2, Math.sqrt(2)]; // Golden ratio, Pi/2, sqrt(2)
    osc.frequency.setValueAtTime(baseFreq * freqRatios[i], now);
    
    oscillators.push(osc);
    gains.push(gain);
  }
  
  // Cross-modulation routing - each oscillator modulates the next
  for (let i = 0; i < oscillators.length; i++) {
    const nextIndex = (i + 1) % oscillators.length;
    const crossModGain = ctx.createGain();
    crossModGain.gain.setValueAtTime(synthParams.crossMod * 100, now);
    
    oscillators[i].connect(crossModGain);
    crossModGain.connect(oscillators[nextIndex].frequency);
  }
  
  // Ring modulation between oscillators
  const ringModGain = ctx.createGain();
  ringModGain.gain.setValueAtTime(synthParams.ringMod, now);
  
  // Create ring modulator using gain node multiplication
  const ringMod1 = ctx.createGain();
  const ringMod2 = ctx.createGain();
  ringMod1.gain.setValueAtTime(0, now);
  ringMod2.gain.setValueAtTime(0, now);
  
  oscillators[0].connect(ringMod1.gain);
  oscillators[1].connect(ringMod2);
  ringMod2.connect(ringMod1);
  
  // Sample & Hold modulation
  const sampleHoldBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const sampleHoldData = sampleHoldBuffer.getChannelData(0);
  const sampleRate = 10 + (synthParams.sampleHold * 100); // 10-110 Hz sample rate
  
  let currentSample = 0;
  let sampleCounter = 0;
  const samplesPerHold = Math.floor(ctx.sampleRate / sampleRate);
  
  for (let i = 0; i < sampleHoldData.length; i++) {
    if (sampleCounter >= samplesPerHold) {
      currentSample = Math.random() * 2 - 1;
      sampleCounter = 0;
    }
    sampleHoldData[i] = currentSample * synthParams.sampleHold;
    sampleCounter++;
  }
  
  const sampleHoldSource = ctx.createBufferSource();
  const sampleHoldGain = ctx.createGain();
  sampleHoldSource.buffer = sampleHoldBuffer;
  sampleHoldGain.gain.setValueAtTime(synthParams.sampleHold * 200, now);
  
  // Enhanced noise generation with multiple sources
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < noiseData.length; i++) {
    const t = i / noiseData.length;
    
    // Multiple noise sources
    const whiteNoise = Math.random() * 2 - 1;
    const pinkNoise = Math.sin(t * Math.PI * 50) * (Math.random() * 2 - 1);
    const metallicNoise = Math.sin(t * Math.PI * 200 + Math.random()) * (Math.random() * 2 - 1);
    
    // Chaos generator - feedback with mathematical operations
    const chaos = Math.sin(t * Math.PI * synthParams.chaosLevel * 100) * 
                  Math.tan(whiteNoise * synthParams.chaosLevel * 5);
    
    const noiseMix = (
      whiteNoise * (1 - synthParams.noiseLayer * 0.3) +
      pinkNoise * (synthParams.noiseLayer * 0.4) +
      metallicNoise * (synthParams.noiseLayer * 0.3) +
      chaos * (synthParams.chaosLevel * 0.5)
    );
    
    // Mathematical waveshaping with feedback
    const feedbackAmount = synthParams.feedback * 0.3;
    const shaped = Math.tanh(noiseMix * (1 + synthParams.driveColor * 4 + feedbackAmount));
    noiseData[i] = shaped * synthParams.noiseLayer;
  }
  
  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noiseSource.buffer = noiseBuffer;
  
  // Advanced filter routing system
  const filters = [];
  for (let i = 0; i < 3; i++) {
    const filter = ctx.createBiquadFilter();
    const types: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass'];
    filter.type = types[i];
    
    const baseFreq = 100 + (i * 500) + (synthParams.resonance * 2000);
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(1 + (synthParams.resonance * 20), now);
    
    filters.push(filter);
  }
  
  // Dynamic filter routing based on filterRoute parameter
  const routingConfig = Math.floor(synthParams.filterRoute * 4);
  
  // Delay line for feedback and metallic resonance
  const delay = ctx.createDelay(0.1);
  const delayFeedback = ctx.createGain();
  const delayMix = ctx.createGain();
  
  delay.delayTime.setValueAtTime(0.001 + (synthParams.feedback * 0.05), now);
  delayFeedback.gain.setValueAtTime(synthParams.feedback * 0.8, now);
  delayMix.gain.setValueAtTime(0.3, now);
  
  // Master output
  const masterGain = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  
  // Connect everything based on routing configuration
  oscillators.forEach((osc, index) => {
    const gain = gains[index];
    osc.connect(gain);
    
    // LFO modulation
    lfo1.connect(lfoGain1);
    lfo2.connect(lfoGain2);
    lfoGain1.connect(osc.frequency);
    lfoGain2.connect(gain.gain);
    
    // Sample & Hold modulation
    sampleHoldSource.connect(sampleHoldGain);
    sampleHoldGain.connect(osc.frequency);
    
    // Route through filters based on configuration
    switch (routingConfig) {
      case 0: // Series
        if (index === 0) gain.connect(filters[0]);
        break;
      case 1: // Parallel  
        gain.connect(filters[index % filters.length]);
        break;
      case 2: // Feedback
        gain.connect(filters[0]);
        gain.connect(delay);
        break;
      default: // Complex routing
        gain.connect(filters[index % filters.length]);
        if (index % 2 === 0) gain.connect(delay);
    }
  });
  
  // Connect filters in series for some configurations
  if (routingConfig === 0 || routingConfig === 2) {
    filters[0].connect(filters[1]);
    filters[1].connect(filters[2]);
    filters[2].connect(compressor);
  } else {
    filters.forEach(filter => filter.connect(compressor));
  }
  
  // Ring modulation output
  ringMod1.connect(compressor);
  
  // Noise path
  noiseSource.connect(noiseGain);
  noiseGain.connect(filters[1]);
  
  // Delay feedback loop
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(compressor);
  
  // Final output
  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);
  
  // Complex mathematical envelopes
  const attackTime = 0.005 + (synthParams.envelopeShape * 0.02);
  const decayTime = duration - attackTime;
  
  // Individual gain envelopes with mathematical curves
  gains.forEach((gain, index) => {
    const amplitude = 0.4 / (index + 1); // Harmonic series
    const curve = Math.pow(2, -index); // Exponential decay per oscillator
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(amplitude * curve, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  });
  
  // Noise envelope
  const noisePeak = synthParams.noiseLayer * 0.6;
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(noisePeak, now + attackTime * 0.5);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
  
  // Master envelope with mathematical shaping
  const masterPeak = 0.8;
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.setTargetAtTime(masterPeak, now, attackTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  // Start all sources
  lfo1.start(now);
  lfo2.start(now);
  oscillators.forEach(osc => osc.start(now));
  sampleHoldSource.start(now);
  noiseSource.start(now);
  
  // Stop all sources
  const stopTime = now + duration;
  lfo1.stop(stopTime);
  lfo2.stop(stopTime);
  oscillators.forEach(osc => osc.stop(stopTime));
  sampleHoldSource.stop(stopTime);
  noiseSource.stop(stopTime);
  
  return duration * 1000; // Return duration in milliseconds
};
// Costa Serena — audio.js: all sound is synthesised with WebAudio, no audio files.
// Three radio stations run little procedural note patterns (a synthwave arpeggio, a
// slow chord pad, a talk-and-static harbour station), the engine hums under the
// player car, and every effect — shots, sirens, pickups, the mission jingle — is an
// oscillator or a noise burst shaped by hand.

let audioCtx = null, engineOsc = null, engineGain = null, radioTimer = null, radioStep = 0;

function ensureAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineGain.gain.value = 0;
    const engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = 'lowpass'; engineFilter.frequency.value = 420;
    engineOsc.connect(engineFilter); engineFilter.connect(engineGain); engineGain.connect(audioCtx.destination);
    engineOsc.start();
  } catch (e) { audioCtx = null; }
}

function updateEngineSound(ratio) {
  if (!audioCtx || !engineOsc) return;
  const target = G.inCar && G.started && !G.paused ? 0.05 + ratio * 0.05 : 0;
  engineGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.09);
  engineOsc.frequency.setTargetAtTime(52 + ratio * 130, audioCtx.currentTime, 0.09);
}

function playTone(freq, dur, type, vol, slideTo) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  gn.gain.setValueAtTime(vol || 0.12, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(gn); gn.connect(audioCtx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function playNoise(dur, vol, filterFreq) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq || 1800;
  const gn = audioCtx.createGain(); gn.gain.value = vol || 0.2;
  src.connect(f); f.connect(gn); gn.connect(audioCtx.destination);
  src.start(t);
}

function playSfx(kind) {
  if (!audioCtx) return;
  if (kind === 'shot') { playNoise(0.13, 0.25, 900); playTone(160, 0.09, 'square', 0.1, 60); }
  else if (kind === 'swing') playNoise(0.07, 0.07, 2400);
  else if (kind === 'door') playTone(140, 0.08, 'sine', 0.12, 90);
  else if (kind === 'click') playTone(880, 0.05, 'square', 0.06);
  else if (kind === 'pickup') { playTone(660, 0.09, 'sine', 0.12); setTimeout(function () { playTone(990, 0.12, 'sine', 0.12); }, 70); }
  else if (kind === 'buy') { playTone(520, 0.08, 'triangle', 0.14); setTimeout(function () { playTone(780, 0.1, 'triangle', 0.14); }, 80); }
  else if (kind === 'mission') { playTone(392, 0.14, 'triangle', 0.14); setTimeout(function () { playTone(523, 0.14, 'triangle', 0.14); }, 120); setTimeout(function () { playTone(659, 0.22, 'triangle', 0.14); }, 240); }
  else if (kind === 'siren') playTone(660, 0.3, 'sine', 0.035, 990);
}

// --- radio ---------------------------------------------------------------------
const RADIO_SCALES = {
  minor: [0, 3, 5, 7, 10, 12, 15],
  major: [0, 2, 4, 7, 9, 12, 14]
};
function radioNote() {
  if (!audioCtx || !G.radioOn || G.paused) return;
  const st = CS.radioStations[G.radioIndex];
  const scale = G.radioIndex === 1 ? RADIO_SCALES.major : RADIO_SCALES.minor;
  const step = radioStep++;
  if (G.radioIndex === 2) {
    // harbour talk: burbling low blips under static
    if (step % 3 === 0) playNoise(0.16, 0.018, 500);
    if (Math.random() < 0.6) playTone(st.base * (1 + (step % 5) * 0.06), 0.12, st.wave, 0.028);
  } else if (G.radioIndex === 1) {
    const chord = [0, 4, 7][Math.floor(step / 4) % 3];
    if (step % 4 === 0) for (const n of [0, 4, 7]) playTone(st.base * Math.pow(2, (chord + n) / 12), 1.4, st.wave, 0.02);
    if (step % 2 === 0) playTone(st.base * 2 * Math.pow(2, scale[step % scale.length] / 12), 0.4, 'sine', 0.016);
  } else {
    const n = scale[[0, 2, 4, 5, 4, 2, 1, 2][step % 8]];
    playTone(st.base * Math.pow(2, n / 12), 0.3, st.wave, 0.022);
    if (step % 8 === 0) playTone(st.base / 2, 0.8, 'triangle', 0.03);
    if (step % 2 === 0) playNoise(0.03, 0.012, 6000);
  }
  radioTimer = setTimeout(radioNote, st.tempo * 1000);
}

function setRadio(on) {
  G.radioOn = on;
  const el = document.getElementById('radio');
  if (on) {
    const st = CS.radioStations[G.radioIndex];
    el.textContent = '♪ ' + st.name + ' — ' + st.tag;
    el.style.display = 'block';
    if (radioTimer) clearTimeout(radioTimer);
    radioNote();
  } else {
    el.style.display = 'none';
    if (radioTimer) clearTimeout(radioTimer);
  }
}

function cycleRadio() {
  if (!G.radioOn) { setRadio(true); return; }
  G.radioIndex = (G.radioIndex + 1) % CS.radioStations.length;
  if (G.radioIndex === 0 && Math.random() < 0) return;
  setRadio(true);
  showToast('♪ ' + CS.radioStations[G.radioIndex].name, 1.4);
}

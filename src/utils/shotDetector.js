/**
 * Motore audio del cronometro da tiro dinamico (shot timer).
 *
 * Riproduce il funzionamento dei timer da gara (CED7000, PACT, Kestrel KST1000,
 * Shooters Global...):
 *
 *  1. alla pressione di START parte un ritardo (fisso, random o istantaneo);
 *  2. allo scadere del ritardo viene emesso il beep di partenza (~2.5 kHz):
 *     quello e' l'istante zero del cronometro;
 *  3. da li' in poi il microfono ascolta e ogni picco sonoro sopra la soglia
 *     di sensibilita' viene registrato come colpo;
 *  4. dopo ogni colpo scatta un "tempo morto" (anti-eco): i picchi che cadono
 *     entro quella finestra sono considerati eco/rimbombo dello stesso sparo
 *     (sui timer da gara il valore tipico e' 0.10 - 0.11 s).
 *
 * Il rilevamento gira dentro un AudioWorklet (compilato al volo da una Blob URL,
 * cosi' non servono file extra e continua a funzionare offline nella PWA):
 * ogni blocco di 128 campioni viene analizzato, quindi la risoluzione temporale
 * e' di ~3 ms contro i ~16 ms di un loop su requestAnimationFrame.
 * Dove l'AudioWorklet non e' disponibile si ricade su ScriptProcessorNode.
 */

/** Soglie di picco (0..1) per gli 8 livelli di sensibilita': 1 = sorda, 8 = sensibilissima. */
export const SENSITIVITY_THRESHOLDS = [0.50, 0.40, 0.30, 0.22, 0.16, 0.11, 0.075, 0.05];

export const DEFAULT_SENSITIVITY = 5;   // -> 0.16
export const DEFAULT_DEAD_TIME_MS = 110;
export const DEFAULT_BEEP_MS = 250;
export const DEFAULT_BEEP_FREQ = 2500;  // Hz, come i buzzer dei timer da gara

/** Margine di sicurezza dopo la fine del beep prima di riarmare il microfono. */
export const BEEP_GUARD_MS = 50;

const WORKLET_NAME = 'ipsc-shot-processor';

const WORKLET_SOURCE = `
class ShotProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.threshold = o.threshold || 0.16;
    this.deadTime = (o.deadTimeMs || 110) / 1000;
    this.armAtTime = o.armAtTime || 0;
    this.enabled = false;
    this.lastShotTime = -1e9;
    this.levelPeak = 0;
    this.levelFrames = 0;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (d.type !== 'config') return;
      if (d.threshold != null) this.threshold = d.threshold;
      if (d.deadTimeMs != null) this.deadTime = d.deadTimeMs / 1000;
      if (d.armAtTime != null) this.armAtTime = d.armAtTime;
      if (d.enabled != null) this.enabled = d.enabled;
      if (d.resetLastShot) this.lastShotTime = -1e9;
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch) return true;

    let peak = 0;
    let peakIdx = 0;
    for (let i = 0; i < ch.length; i++) {
      const v = ch[i] < 0 ? -ch[i] : ch[i];
      if (v > peak) { peak = v; peakIdx = i; }
    }

    // VU meter: un messaggio ogni ~80 ms
    if (peak > this.levelPeak) this.levelPeak = peak;
    this.levelFrames += ch.length;
    if (this.levelFrames >= sampleRate * 0.08) {
      this.port.postMessage({ type: 'level', peak: this.levelPeak });
      this.levelPeak = 0;
      this.levelFrames = 0;
    }

    if (this.enabled && peak >= this.threshold) {
      const t = currentTime + peakIdx / sampleRate;
      if (t >= this.armAtTime && t - this.lastShotTime >= this.deadTime) {
        this.lastShotTime = t;
        this.port.postMessage({ type: 'shot', time: t, peak: peak });
      }
    }
    return true;
  }
}
registerProcessor('${WORKLET_NAME}', ShotProcessor);
`;

function createAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor({ latencyHint: 'interactive' });
}

export function isMicrophoneSupported() {
  return typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';
}

export class ShotTimerEngine {
  constructor() {
    this.ctx = null;
    this.stream = null;
    this.source = null;
    this.node = null;      // AudioWorkletNode oppure ScriptProcessorNode
    this.sink = null;      // gain a 0: tiene vivo il grafo senza rimandare il mic in altoparlante
    this.usingWorklet = false;
    this.onShot = null;
    this.onLevel = null;
    this.config = {
      threshold: SENSITIVITY_THRESHOLDS[DEFAULT_SENSITIVITY - 1],
      deadTimeMs: DEFAULT_DEAD_TIME_MS,
      armAtTime: 0,
      enabled: false,
    };
    this._scheduled = [];  // beep gia' messi in coda sul clock audio
    this._lastShotTime = -1e9;   // usato solo dal fallback ScriptProcessor
  }

  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  get micActive() {
    return !!this.stream;
  }

  /**
   * Latenza di uscita della scheda audio: il beep viene *schedulato* sul clock
   * di AudioContext ma esce dall'altoparlante qualche ms dopo, mentre i colpi
   * arrivano dal flusso di ingresso. Compensarla evita un bias sistematico.
   */
  get outputLatency() {
    if (!this.ctx) return 0;
    return this.ctx.outputLatency || this.ctx.baseLatency || 0;
  }

  async ensureContext() {
    if (!this.ctx) {
      this.ctx = createAudioContext();
      if (!this.ctx) throw new Error('Web Audio non supportato da questo browser.');
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  /** Chiede il permesso al microfono e costruisce la catena di rilevamento. */
  async enableMicrophone() {
    if (!isMicrophoneSupported()) {
      throw new Error('Microfono non disponibile: serve una connessione HTTPS e un browser recente.');
    }
    await this.ensureContext();
    if (this.stream) return;

    // I filtri del browser (cancellazione eco, riduzione rumore, gain automatico)
    // ucciderebbero il transiente dello sparo: vanno disattivati.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.sink = this.ctx.createGain();
    this.sink.gain.value = 0;

    let built = false;
    if (this.ctx.audioWorklet) {
      try {
        const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
          await this.ctx.audioWorklet.addModule(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        this.node = new AudioWorkletNode(this.ctx, WORKLET_NAME, {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: { ...this.config },
        });
        this.node.port.onmessage = (e) => this._handleMessage(e.data);
        this.usingWorklet = true;
        built = true;
      } catch {
        this.usingWorklet = false;
      }
    }

    if (!built) {
      this.node = this._createScriptProcessor();
      this.usingWorklet = false;
    }

    this.source.connect(this.node);
    this.node.connect(this.sink);
    this.sink.connect(this.ctx.destination);
    this._pushConfig();
  }

  _createScriptProcessor() {
    const bufferSize = 512;
    const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0);
      const sr = this.ctx.sampleRate;
      let peak = 0;
      let peakIdx = 0;
      for (let i = 0; i < ch.length; i++) {
        const v = Math.abs(ch[i]);
        if (v > peak) { peak = v; peakIdx = i; }
      }
      this._handleMessage({ type: 'level', peak });

      if (!this.config.enabled || peak < this.config.threshold) return;
      // Il buffer contiene audio gia' catturato: parte circa una durata-buffer fa.
      const blockStart = this.ctx.currentTime - ch.length / sr;
      const t = blockStart + peakIdx / sr;
      if (t < this.config.armAtTime) return;
      if (t - this._lastShotTime < this.config.deadTimeMs / 1000) return;
      this._lastShotTime = t;
      this._handleMessage({ type: 'shot', time: t, peak });
    };
    return node;
  }

  _handleMessage(data) {
    if (!data) return;
    if (data.type === 'shot' && this.onShot) this.onShot(data);
    else if (data.type === 'level' && this.onLevel) this.onLevel(data.peak);
  }

  _pushConfig() {
    if (this.usingWorklet && this.node && this.node.port) {
      this.node.port.postMessage({ type: 'config', ...this.config });
    }
  }

  setConfig(partial) {
    Object.assign(this.config, partial);
    this._pushConfig();
  }

  /** Arma il rilevamento a partire dall'istante indicato (clock di AudioContext). */
  arm(atTime) {
    this._lastShotTime = -1e9;
    this.config.armAtTime = atTime;
    this.config.enabled = true;
    if (this.usingWorklet && this.node && this.node.port) {
      this.node.port.postMessage({ type: 'config', ...this.config, resetLastShot: true });
    }
  }

  disarm() {
    this.config.enabled = false;
    this._pushConfig();
  }

  /**
   * Schedula il beep sul clock audio (precisione al campione).
   * @returns {number} istante di inizio del beep, clock di AudioContext.
   */
  scheduleBeep(atTime, { freq = DEFAULT_BEEP_FREQ, durationMs = DEFAULT_BEEP_MS, volume = 1 } = {}) {
    if (!this.ctx) return atTime;
    const start = Math.max(atTime, this.ctx.currentTime + 0.01);
    const dur = durationMs / 1000;
    const gain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    osc.type = 'square';   // onda quadra: stridula come i buzzer dei timer veri
    osc.frequency.setValueAtTime(freq, start);

    const peak = Math.max(0.0001, Math.min(1, volume)) * 0.9;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.005);
    gain.gain.setValueAtTime(peak, start + dur - 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    const entry = { osc, gain };
    this._scheduled.push(entry);
    osc.onended = () => {
      this._scheduled = this._scheduled.filter(e => e !== entry);
      try { osc.disconnect(); gain.disconnect(); } catch { /* gia' scollegato */ }
    };
    return start;
  }

  /**
   * Annulla i beep ancora in coda (beep di partenza durante lo stand by,
   * beep del par time dopo uno stop anticipato).
   */
  cancelScheduledBeeps() {
    this._scheduled.forEach(({ osc, gain }) => {
      try { osc.onended = null; osc.stop(); } catch { /* gia' fermato */ }
      try { osc.disconnect(); gain.disconnect(); } catch { /* gia' scollegato */ }
    });
    this._scheduled = [];
  }

  disableMicrophone() {
    this.cancelScheduledBeeps();
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    try { if (this.source) this.source.disconnect(); } catch { /* noop */ }
    try { if (this.node) this.node.disconnect(); } catch { /* noop */ }
    try { if (this.sink) this.sink.disconnect(); } catch { /* noop */ }
    if (this.node && this.node.onaudioprocess) this.node.onaudioprocess = null;
    this.source = null;
    this.node = null;
    this.sink = null;
    this.config.enabled = false;
  }

  async close() {
    this.disableMicrophone();
    if (this.ctx) {
      try { await this.ctx.close(); } catch { /* noop */ }
      this.ctx = null;
    }
  }
}

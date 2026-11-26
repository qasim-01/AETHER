import { useSimulationStore } from '../store/useSimulationStore';
import { getEngine } from './engineRef';
import { PRESETS, instantiate } from './presets';
import { PresetId } from '../../types/simulation';

export function loadPreset(id: PresetId) {
  const engine = getEngine();
  const preset = PRESETS.find((p) => p.id === id);
  if (!engine || !preset) return;
  engine.seed(preset.seed);
  useSimulationStore.getState().setForces(instantiate(preset, engine.width, engine.height));
}

export function randomize() {
  loadPreset('chaos');
}

export function resetParticles() {
  getEngine()?.seed('uniform');
}

export function bigBang() {
  const engine = getEngine();
  if (!engine) return;
  engine.seed('burst');
}

export function shockwaveCenter() {
  const engine = getEngine();
  if (!engine) return;
  engine.pulse(engine.width / 2, engine.height / 2, 2);
}

export function shake() {
  getEngine()?.shake(8);
}

function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function screenshot() {
  const engine = getEngine();
  if (!engine) return;
  download(engine.snapshot(), `aether-${Date.now()}.png`);
}

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export function canRecord() {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
}

export function toggleRecording() {
  const engine = getEngine();
  const store = useSimulationStore.getState();
  if (!engine || !canRecord()) return;

  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    return;
  }

  const stream = engine.canvas.captureStream(60);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
  try {
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 12_000_000 } : undefined);
  } catch {
    return;
  }
  chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    const type = recorder?.mimeType || 'video/webm';
    const blob = new Blob(chunks, { type });
    const url = URL.createObjectURL(blob);
    download(url, `aether-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    stream.getTracks().forEach((t) => t.stop());
    useSimulationStore.getState().setRecording(false);
    recorder = null;
  };
  recorder.start(250);
  store.setRecording(true);
}

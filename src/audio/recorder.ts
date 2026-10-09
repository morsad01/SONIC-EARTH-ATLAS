import { AudioContextManager } from './audioContext';

/** Records the app's own audio output (not the microphone) for `seconds`, then downloads it. */
export async function recordOutput(seconds: number, onTick: (left: number) => void): Promise<string | null> {
  await AudioContextManager.init();
  const stream = AudioContextManager.getRecordStream();
  if (!stream || typeof MediaRecorder === 'undefined') return null;
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start(250);
  for (let left = seconds; left > 0; left--) {
    onTick(left);
    await new Promise((r) => setTimeout(r, 1000));
    if (rec.state !== 'recording') break;
  }
  if (rec.state === 'recording') rec.stop();
  await done;
  const ext = (rec.mimeType || 'audio/webm').includes('ogg') ? 'ogg' : (rec.mimeType || '').includes('mp4') ? 'm4a' : 'webm';
  const name = `sonic-earth-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
  const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return name;
}

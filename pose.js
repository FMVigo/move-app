// Camera, body tracking and rep counting.
const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

let landmarker = null, stream = null, running = false, lastTs = -1;
let videoEl, canvasEl, onFrame;

// Returns true when body tracking works, false when only the mirror works.
export async function startCamera(video, canvas, frameCb, onVideo) {
  videoEl = video; canvasEl = canvas; onFrame = frameCb;
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  video.srcObject = stream;
  await video.play();
  onVideo && onVideo();
  try {
    if (!landmarker) {
      const { FilesetResolver, PoseLandmarker } = await import(CDN + '/vision_bundle.mjs');
      const files = await FilesetResolver.forVisionTasks(CDN + '/wasm');
      const opts = d => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
      try { landmarker = await PoseLandmarker.createFromOptions(files, opts('GPU')); }
      catch (e) { landmarker = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
    }
  } catch (e) { console.warn('Tracking unavailable', e); return false; }
  if (!stream) return true;
  running = true;
  loop();
  return true;
}

export function stopCamera() {
  running = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  if (videoEl) videoEl.srcObject = null;
}

function loop() {
  if (!running) return;
  const v = videoEl;
  if (v.readyState >= 2 && landmarker) {
    const ts = performance.now();
    if (ts - lastTs > 45) {
      lastTs = ts;
      let lm = null;
      try { const r = landmarker.detectForVideo(v, ts); lm = r.landmarks && r.landmarks[0]; } catch (e) { }
      draw(lm);
      onFrame && onFrame(lm, ts / 1000);
    }
  }
  requestAnimationFrame(loop);
}

function draw(lm) {
  const c = canvasEl, v = videoEl;
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== w * 2) { c.width = w * 2; c.height = h * 2; }
  const ctx = c.getContext('2d');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!lm) return;
  // Map normalised video coords to the object-fit: cover box, mirrored.
  const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
  const sc = Math.max(w / vw, h / vh);
  const dx = (w - vw * sc) / 2, dy = (h - vh * sc) / 2;
  const P = p => [w - (dx + p.x * vw * sc), dy + p.y * vh * sc];
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4;
  BONES.forEach(([a, b]) => {
    if (lm[a].visibility < 0.4 || lm[b].visibility < 0.4) return;
    const A = P(lm[a]), B = P(lm[b]);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  });
  ctx.fillStyle = '#ff5a36';
  [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => {
    if (lm[i].visibility < 0.4) return;
    const A = P(lm[i]); ctx.beginPath(); ctx.arc(A[0], A[1], 5, 0, Math.PI * 2); ctx.fill();
  });
}

// ---------- Rep counting ----------
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });

export class RepCounter {
  constructor(metric, tempo) {
    this.metric = metric; this.tempo = tempo || 2;
    this.reps = 0; this.hist = []; this.state = 'low'; this.ema = null; this.ref = 0;
    this.status = 'ok';
  }
  signal(lm) {
    const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
    if (Math.min(ls.visibility, rs.visibility, lh.visibility, rh.visibility) < 0.5) { this.status = 'body'; return null; }
    const S = mid(ls, rs), H = mid(lh, rh);
    const torso = Math.hypot(S.x - H.x, S.y - H.y);
    this.ref = Math.max(this.ref * 0.995, torso);
    const ref = this.ref || torso;
    const needFeet = ['hipY', 'hipX'].includes(this.metric);
    const ankVis = Math.min(lm[27].visibility, lm[28].visibility);
    if (needFeet && ankVis < 0.4) { this.status = 'feet'; return null; }
    this.status = 'ok';
    const A = mid(lm[27], lm[28]);
    switch (this.metric) {
      case 'hipY': return (A.y - H.y) / ref;
      case 'hipX': return (H.x - A.x) / ref;
      case 'wristY': return (S.y - Math.min(lm[15].y, lm[16].y)) / ref;
      case 'kneeY': return (H.y - Math.min(lm[25].y, lm[26].y)) / ref;
      case 'twist': return (ls.z - rs.z) / ref * 0.6;
      case 'lean': return (S.x - H.x) / ref;
      case 'torsoUp': return (H.y - S.y) / ref;
      default: return null;
    }
  }
  push(lm, t) {
    if (this.metric === 'none' || !lm) { if (!lm) this.status = 'body'; return this.reps; }
    const v = this.signal(lm);
    if (v == null || !isFinite(v)) return this.reps;
    this.ema = this.ema == null ? v : this.ema + (v - this.ema) * 0.35;
    this.hist.push([t, this.ema]);
    const win = Math.max(3, this.tempo * 2.2);
    while (this.hist.length && t - this.hist[0][0] > win) this.hist.shift();
    let lo = Infinity, hi = -Infinity;
    for (const [, x] of this.hist) { if (x < lo) lo = x; if (x > hi) hi = x; }
    const range = hi - lo;
    if (range < 0.12) return this.reps;
    const m = (hi + lo) / 2, band = range * 0.22;
    if (this.state === 'low' && this.ema > m + band) { this.state = 'high'; }
    else if (this.state === 'high' && this.ema < m - band) { this.state = 'low'; this.reps++; this.onRep && this.onRep(this.reps); }
    return this.reps;
  }
}

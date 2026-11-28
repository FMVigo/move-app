import { startCamera, stopCamera, RepCounter, setDrawHook } from './pose.js';

const $ = id => document.getElementById(id);
const COLORS = { body: '#f6efe6', bodyFar: '#8f857a', torso: '#ff5a36', shorts: '#3a342d', hair: '#3a2a20', bell: '#55585e', bellShine: '#8f949b', shadow: 'rgba(0,0,0,.35)', ghost: 'rgba(241,228,211,.16)', path: 'rgba(255,90,54,.75)', joint: '#ff5a36', jointFar: '#a8462e', floor: 'rgba(246,239,230,.25)' };
const QUOTES = [
  'Ten minutes now, a better day all day.',
  'Small moves, every day. That is the whole secret.',
  'Your back will thank you by lunchtime.',
  'Show up. The rest takes care of itself.',
  'Strong body, clear head, better meetings.',
  'Motion is lotion for the joints.',
  'You never regret the workout you did.'
];
const PUSH = ['Nice and steady.', 'Looking strong.', 'Keep breathing.', 'Good work, keep going.', 'You have got this.', 'Smooth and controlled.'];

// ---------- storage ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('move.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('move.' + k, JSON.stringify(v)); } catch (e) { } }
};
const settings = Object.assign({ voice: true, cam: true, kb: 16 }, store.get('settings', {}));
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const log = () => store.get('log', {});
function markDone(id) {
  const l = log(); const k = dayKey();
  l[k] = Array.from(new Set([...(l[k] || []), id]));
  store.set('log', l);
}
function streak() {
  const l = log(); let n = 0; const d = new Date();
  if (!(l[dayKey(d)] || []).length) d.setDate(d.getDate() - 1);
  while ((l[dayKey(d)] || []).length) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- home ----------
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function renderHome() {
  $('hello').innerHTML = `${greeting()}, <span>Francisco</span>`;
  $('quote').textContent = QUOTES[new Date().getDate() % QUOTES.length];
  const today = log()[dayKey()] || [];
  $('streakN').textContent = streak();
  $('todayN').textContent = today.length + '/3';
  const l = log(); const wk = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); wk.push((l[dayKey(d)] || []).length ? '<i class="d"></i>' : '<i></i>'); }
  $('week').innerHTML = wk.join('');
  $('todayBar').innerHTML = ['morning', 'office1', 'office2'].map(id => today.includes(id) ? '<i class="d"></i>' : '<i></i>').join('');
  $('cards').innerHTML = Object.values(ROUTINES).map(r => `
    <button class="card ${today.includes(r.id) ? 'done' : ''}" data-id="${r.id}">
      <canvas data-ex="${r.id === 'morning' ? 'armsUp' : r.id === 'office1' ? 'swing' : 'gobletSquat'}"></canvas>
      <div><div class="meta">${r.when} · ${Math.round(routineSeconds(r) / 60)} min</div><h2>${r.title}</h2><p>${r.sub}</p></div>
      <span class="tick">${today.includes(r.id) ? '✓' : ''}</span>
    </button>`).join('');
  document.querySelectorAll('.card').forEach(b => b.onclick = () => startSession(b.dataset.id));
  $('setVoice').setAttribute('aria-pressed', settings.voice);
  $('setCam').setAttribute('aria-pressed', settings.cam);
  $('setKb').textContent = 'Kettlebell ' + settings.kb + ' kg';
  const links = [['lymph flow', IG.lymph], ['Qi Gong flow', IG.qigong], ['kettlebell 9 grid', IG.kb9], ['kettlebell circuit', IG.kbcircuit], ['mobility', IG.mobility]];
  $('srcLinks').innerHTML = links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(', ');
}
let homeAnim = 0;
function animateHome(ts) {
  if (!$('home').classList.contains('on')) return;
  document.querySelectorAll('.card canvas').forEach(c => {
    const w = c.clientWidth, h = c.clientHeight; if (!w) return;
    if (c.width !== w * 2) { c.width = w * 2; c.height = h * 2; }
    const ctx = c.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0);
    drawFigure(ctx, w, h, poseAt(EX[c.dataset.ex], ts / 1000, false), COLORS, extent(EX[c.dataset.ex]));
  });
  homeAnim = requestAnimationFrame(animateHome);
}
$('setVoice').onclick = () => { settings.voice = !settings.voice; store.set('settings', settings); renderHome(); };
$('setCam').onclick = () => { settings.cam = !settings.cam; store.set('settings', settings); renderHome(); };
$('setKb').onclick = () => { const o = [8, 12, 14, 16, 20, 24]; settings.kb = o[(o.indexOf(settings.kb) + 1) % o.length]; store.set('settings', settings); renderHome(); };

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  if (id === 'home') { renderHome(); cancelAnimationFrame(homeAnim); homeAnim = requestAnimationFrame(animateHome); }
}

// ---------- voice and sound ----------
let voice = null, actx = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /en-GB/.test(v.lang) && /Daniel|Arthur|Serena|Kate/.test(v.name)) || vs.find(v => /en-GB/.test(v.lang)) || vs.find(v => /^en/.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, interrupt) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 1.02; u.pitch = 1;
  speechSynthesis.speak(u);
}
function beep(f = 880, d = 0.12) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = f; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.25, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d);
    o.start(); o.stop(actx.currentTime + d);
  } catch (e) { }
}

// ---------- session engine ----------
let S = null, wakeLock = null, trackingOff = false, form = null, formEma = null;
const SEG_BONES = { torso: ['hip', 'sho'], uaL: [11, 13], faL: [13, 15], uaR: [12, 14], faR: [14, 16], thL: [23, 25], shL: [25, 27], thR: [24, 26], shR: [26, 28] };
const errColor = e => e == null ? 'rgba(255,255,255,.85)' : e < 20 ? '#7fd18b' : e < 35 ? '#ffc247' : '#ff5a36';
setDrawHook((ctx, lm, P, w, h) => {
  if (!S || !form) return false;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // target outline from the coach, drawn on you
  const T = form.target;
  ctx.strokeStyle = 'rgba(255,255,255,.38)'; ctx.lineWidth = 10;
  [[T.P0, T.M, T.N], [T.Sl, T.Sr], [T.Hl, T.Hr], [T.Sl, T.El, T.Wl], [T.Sr, T.Er, T.Wr], [T.Hl, T.Kl, T.Fl], [T.Hr, T.Kr, T.Fr]].forEach(l => {
    ctx.beginPath(); l.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  });
  // you, coloured by how close each part is: green good, amber close, coral off
  const pt = k => k === 'hip' ? [(P(lm[23])[0] + P(lm[24])[0]) / 2, (P(lm[23])[1] + P(lm[24])[1]) / 2] : k === 'sho' ? [(P(lm[11])[0] + P(lm[12])[0]) / 2, (P(lm[11])[1] + P(lm[12])[1]) / 2] : P(lm[k]);
  const vis = k => k === 'hip' ? lm[23].visibility > 0.4 && lm[24].visibility > 0.4 : k === 'sho' ? lm[11].visibility > 0.4 && lm[12].visibility > 0.4 : lm[k].visibility > 0.4;
  ctx.lineWidth = 5;
  for (const n in SEG_BONES) {
    const [a, b] = SEG_BONES[n]; if (!vis(a) || !vis(b)) continue;
    const A = pt(a), B = pt(b);
    ctx.strokeStyle = errColor(form.errs[n]);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
  [[11, 12], [23, 24]].forEach(([a, b]) => { if (!vis(a) || !vis(b)) return; const A = P(lm[a]), B = P(lm[b]); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); });
  return true;
});
function overlayMapper() {
  const v = $('video'), c = $('overlay'); const w = c.clientWidth, h = c.clientHeight;
  const vw = v.videoWidth || 640, vh = v.videoHeight || 480, sc = Math.max(w / vw, h / vh);
  const dx = (w - vw * sc) / 2, dy = (h - vh * sc) / 2;
  return p => [w - (dx + p.x * vw * sc), dy + p.y * vh * sc];
}
const RING = 333;

function startSession(id) {
  const r = ROUTINES[id];
  const steps = buildSteps(r);
  trackingOff = false;
  S = { r, steps, i: 0, t: 0, ready: r.getReady, paused: false, last: performance.now(), anim: 0, said: {}, counter: null, total: steps.reduce((s, x) => s + x.dur, 0), elapsed: 0 };
  // warm up audio and speech inside the tap
  beep(660, 0.05);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  say(r.id === 'morning' ? 'Good morning Francisco. Ten minutes for your body. Let\'s go.' : 'Kettlebell time. Quick and strong between meetings. Let\'s go.');
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => wakeLock = l).catch(() => { }); } catch (e) { }
  $('stage').classList.toggle('nocam', !settings.cam);
  $('camPanel').style.display = settings.cam ? '' : 'none';
  show('player');
  enterStep();
  if (settings.cam) {
    $('camMsg').style.display = 'grid'; $('camMsg').textContent = 'Starting camera…';
    startCamera($('video'), $('overlay'), onPose, () => { $('camMsg').style.display = 'none'; })
      .then(ok => { if (!ok) { trackingOff = true; $('reps').style.display = 'none'; } })
      .catch(e => { $('camMsg').textContent = 'Camera not available. Allow camera access for this app in Settings, or turn Camera off on the home screen.'; });
  }
  S.anim = requestAnimationFrame(tick);
}

function curStep() { return S.steps[S.i]; }
function nextWork(from) { for (let j = from; j < S.steps.length; j++) if (S.steps[j].phase === 'work') return S.steps[j]; return null; }

function enterStep() {
  const st = curStep();
  const shown = EX[st.phase === 'work' ? st.id : nextWork(S.i + 1).id];
  $('stage').classList.toggle('stack', !!shown.keys[0].floor);
  const view = shown.keys[0].floor ? 'floor' : shown.keys[0].view;
  $('coachTag').textContent = view === 'front' ? 'Coach · facing you' : view === 'floor' ? 'Coach · on the floor' : 'Coach · side-on';
  formEma = null;
  if (S.i === 0 || (S.lastView && S.lastView !== view)) {
    S.viewCue = view === 'front' ? (S.i === 0 ? 'Face the phone.' : 'Turn to face the phone.') : view === 'floor' ? 'Get on the floor, side-on to the phone.' : 'Turn side-on to the phone.';
  } else S.viewCue = '';
  S.lastView = view;
  S.t = 0; S.said = {};
  const prev = S.steps[S.i - 1];
  S.ready = st.phase === 'work' && !(prev && prev.phase === 'rest') ? (st.ready || S.r.getReady) : 0;
  if (st.phase === 'work') {
    const ex = EX[st.id];
    S.counter = new RepCounter(ex.metric, ex.tempo);
    S.counter.onRep = n => { if (n % 5 === 0) beep(1200, 0.06); };
    $('reps').style.display = ex.metric === 'none' || trackingOff ? 'none' : '';
    $('reps').innerHTML = '0<small>reps</small>';
    $('exname').textContent = ex.name;
    $('cue').textContent = ex.cues[0];
    $('phase').textContent = (st.round ? 'Round ' + st.round + ' of 2 · ' : '') + (ex.kb ? settings.kb + ' kg' : 'Move ' + (workIndex() + 1) + ' of ' + workCount());
    const nx = nextWork(S.i + 1);
    $('next').textContent = nx ? 'Next: ' + EX[nx.id].name : 'Last one. Finish strong.';
    if (S.ready) {
      $('countdown').classList.add('on'); $('cdT').textContent = 'Get ready';
      say((S.i === 0 ? 'First up, ' : 'Next, ') + ex.name + '. ' + (S.viewCue ? S.viewCue + ' ' : '') + ex.cues[0]);
    } else {
      $('countdown').classList.remove('on');
      say(ex.name + '. ' + (S.viewCue ? S.viewCue + ' ' : '') + 'Go!', true);
    }
  } else {
    const nx = nextWork(S.i + 1);
    const ex = EX[nx.id];
    S.counter = null;
    $('reps').style.display = 'none';
    $('countdown').classList.remove('on');
    $('phase').textContent = 'Rest';
    $('exname').textContent = 'Breathe';
    $('cue').textContent = 'Next up: ' + ex.name + '. ' + ex.cues[0];
    $('next').textContent = '';
    say('Rest. Next up, ' + ex.name + '. ' + (S.viewCue ? S.viewCue + ' ' : '') + ex.cues[0], true);
  }
}
function workIndex() { let n = 0; for (let j = 0; j < S.i; j++) if (S.steps[j].phase === 'work') n++; return n; }
function workCount() { return S.steps.filter(s => s.phase === 'work').length; }

function onPose(lm, t) {
  if (!S) return;
  const st0 = curStep();
  const exF = st0 && EX[st0.phase === 'work' ? st0.id : (nextWork(S.i + 1) || st0).id];
  form = null;
  if (lm && exF && st0.phase === 'work') {
    const mirrored = exF.sides && S.t > st0.dur / 2;
    form = formCheck(exF, mirrored, lm, overlayMapper());
  }
  const badge = $('formBadge');
  if (form && S.ready <= 0) {
    formEma = formEma == null ? form.score : formEma + (form.score - formEma) * 0.25;
    const sc = Math.round(formEma);
    badge.style.display = 'block';
    badge.textContent = 'Form ' + sc + '%';
    badge.style.background = sc >= 75 ? '#2f6b3a' : sc >= 55 ? '#8a6414' : '#9b2f17';
    const tipEl = $('formTip');
    if (sc < 70 && form.worst) { tipEl.textContent = FORM_TIPS[form.worst][exF.keys[0].view === 'side' ? 'side' : 'front']; tipEl.style.display = 'block'; }
    else tipEl.style.display = 'none';
  } else { badge.style.display = 'none'; $('formTip').style.display = 'none'; }
  if (S.paused || !S.counter || S.ready > 0) return;
  const st = curStep(); if (!st || st.phase !== 'work') return;
  const n = S.counter.push(lm, t);
  $('reps').innerHTML = n + '<small>reps</small>';
  const hint = $('hint');
  const msg = S.counter.status === 'body' ? 'Step into view so I can see your body.' : S.counter.status === 'feet' ? 'Step back a little so your feet are in view.' : '';
  hint.textContent = msg; hint.style.display = msg ? 'block' : 'none';
}

function tick(now) {
  if (!S) return;
  const dt = Math.min(0.1, (now - S.last) / 1000); S.last = now;
  const st = curStep();
  if (!S.paused) {
    if (S.ready > 0) {
      const before = Math.ceil(S.ready);
      S.ready -= dt;
      const after = Math.ceil(S.ready);
      $('cdN').textContent = Math.max(1, after);
      if (after !== before && after <= 3 && after > 0) beep(660);
      if (S.ready <= 0) { $('countdown').classList.remove('on'); beep(1000, 0.2); say('Go!', false); }
    } else {
      S.t += dt; S.elapsed += dt;
      cues(st);
      if (S.t >= st.dur) { return advance(1); }
    }
  }
  // draw coach
  const c = $('coach'); const w = c.clientWidth, h = c.clientHeight;
  if (w) {
    if (c.width !== Math.round(w * 2)) { c.width = Math.round(w * 2); c.height = Math.round(h * 2); }
    const ctx = c.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0);
    const exId = st.phase === 'work' ? st.id : nextWork(S.i + 1).id;
    const ex = EX[exId];
    const mirrored = ex.sides && st.phase === 'work' && S.t > st.dur / 2;
    drawCoach(ctx, w, h, ex, S.paused ? 0 : now / 1000, mirrored, COLORS);
  }
  const left = Math.max(0, Math.ceil(st.dur - S.t));
  $('time').textContent = left;
  $('ring').setAttribute('stroke-dashoffset', RING * (S.t / st.dur));
  $('ring').setAttribute('stroke', st.phase === 'rest' ? '#7fd18b' : '#ff5a36');
  $('prog').style.width = (100 * S.elapsed / S.total) + '%';
  S.anim = requestAnimationFrame(tick);
}

function cues(st) {
  const left = st.dur - S.t;
  const once = (k, fn) => { if (!S.said[k]) { S.said[k] = 1; fn(); } };
  if (st.phase === 'work') {
    const ex = EX[st.id];
    if (ex.sides && S.t >= st.dur / 2) once('switch', () => { say('Switch sides.', true); beep(900); $('cue').textContent = 'Switch sides. ' + ex.cues[1]; });
    if (S.t > st.dur * 0.3) once('c1', () => { $('cue').textContent = ex.cues[1]; if (!ex.sides) say(ex.cues[1]); });
    if (S.t > st.dur * 0.6) once('c2', () => { $('cue').textContent = ex.cues[2]; say(ex.cues[2]); });
    if (st.dur >= 45 && S.t > st.dur * 0.45) once('push', () => { if (!ex.sides) say(PUSH[Math.floor(Math.random() * PUSH.length)]); });
    if (left <= 10 && st.dur > 20) once('ten', () => say('Ten seconds. Finish strong.'));
  }
  if (left <= 3) {
    const k = 'b' + Math.ceil(left);
    once(k, () => beep(left <= 1 ? 1000 : 700));
  }
}

function advance(dir) {
  S.i += dir;
  if (S.i < 0) S.i = 0;
  if (S.i >= S.steps.length) return finish();
  if (dir > 0 && S.steps[S.i - 1] && S.steps[S.i - 1].phase === 'work') { /* moving on */ }
  enterStep();
  S.last = performance.now();
  S.anim = requestAnimationFrame(tick);
}

function finish() {
  const id = S.r.id;
  cancelAnimationFrame(S.anim);
  stopCamera();
  markDone(id);
  try { wakeLock && wakeLock.release(); } catch (e) { }
  const n = streak();
  $('doneStreak').textContent = n;
  $('doneTitle').textContent = id === 'morning' ? 'Body awake' : 'Session done';
  const today = (log()[dayKey()] || []).length;
  $('doneText').textContent = (n === 1 ? 'Day one of your streak. ' : n + ' days in a row. ') +
    (today >= 3 ? 'All three sessions done today. Outstanding.' : id === 'morning' ? 'Enjoy the shower. See you at the office for the kettlebell.' : 'Back to work feeling sharper.');
  say(id === 'morning' ? 'Brilliant. Your body is awake. Enjoy your shower.' : 'Great work Francisco. Back to it, feeling strong.', true);
  S = null;
  show('done');
}

function quit() {
  if (!S) return show('home');
  cancelAnimationFrame(S.anim); stopCamera();
  try { wakeLock && wakeLock.release(); } catch (e) { }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  S = null; show('home');
}

$('pause').onclick = () => {
  if (!S) return;
  S.paused = !S.paused;
  $('pause').textContent = S.paused ? 'Resume' : 'Pause';
  if (S.paused) { speechSynthesis && speechSynthesis.cancel(); } else say('Back to it.');
};
$('skip').onclick = () => { if (!S) return; cancelAnimationFrame(S.anim); advance(1); };
$('back').onclick = () => {
  if (!S) return; cancelAnimationFrame(S.anim);
  if (S.t > 3 || S.i === 0) { enterStep(); S.last = performance.now(); S.anim = requestAnimationFrame(tick); }
  else { advance(-1); if (curStep().phase === 'rest' && S.i > 0) { cancelAnimationFrame(S.anim); advance(-1); } }
};
$('quit').onclick = quit;
$('home2').onclick = () => show('home');
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S && wakeLock === null) { try { navigator.wakeLock.request('screen').then(l => wakeLock = l); } catch (e) { } }
});

window.__moveTest = { onPose: (lm, t) => onPose(lm, t), state: () => S };
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
show('home');

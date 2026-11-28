// Animated coach figure drawn on a canvas.
const L = { lowT: 0.15, upT: 0.17, neck: 0.035, headR: 0.068, upA: 0.15, foA: 0.14, thigh: 0.215, shin: 0.215, sh: 0.095, hip: 0.058 };
const ANG = ['t', 'u', 'h', 'la', 'lf', 'ra', 'rf', 'lt', 'ls', 'rt', 'rs'];
const rad = d => d * Math.PI / 180;
const dirDown = a => [Math.sin(rad(a)), Math.cos(rad(a))];   // limb direction, 0 = down
const dirUp = a => [Math.sin(rad(a)), -Math.cos(rad(a))];    // spine direction, 0 = up
const add = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];

function lerpAngle(a, b, k) {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return a + d * k;
}
const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

function mirrorPose(p) {
  const m = Object.assign({}, p);
  if (p.view === 'side') {
    m.la = p.ra; m.lf = p.rf; m.ra = p.la; m.rf = p.lf;
    m.lt = p.rt; m.ls = p.rs; m.rt = p.lt; m.rs = p.ls;
  } else {
    m.t = -p.t; m.u = -p.u; m.h = -p.h;
    m.la = -p.ra; m.lf = -p.rf; m.ra = -p.la; m.rf = -p.lf;
    m.lt = -p.rt; m.ls = -p.rs; m.rt = -p.lt; m.rs = -p.ls;
  }
  if (p.bell === 'R') m.bell = 'L'; else if (p.bell === 'L') m.bell = 'R';
  return m;
}

// Pose at time (seconds) through an exercise loop.
function poseAt(ex, time, mirrored) {
  const keys = ex.keys;
  const n = keys.length;
  const seg = ex.tempo / n;
  const tt = ((time % ex.tempo) + ex.tempo) % ex.tempo;
  const i = Math.floor(tt / seg) % n;
  const k = ease((tt - i * seg) / seg);
  const a = keys[i], b = keys[(i + 1) % n];
  const out = Object.assign({}, a);
  ANG.forEach(q => { out[q] = lerpAngle(a[q], b[q], k); });
  out.sw = a.sw + (b.sw - a.sw) * k;
  out.hw = a.hw + (b.hw - a.hw) * k;
  out.bellBehind = k < 0.5 ? a.bellBehind : b.bellBehind;
  return mirrored ? mirrorPose(out) : out;
}

function solve(p) {
  const P0 = [0, 0];
  const M = add(P0, dirUp(p.t), L.lowT);
  const N = add(M, dirUp(p.u), L.upT);
  const perpU = [Math.cos(rad(p.u)), Math.sin(rad(p.u))];
  const perpT = [Math.cos(rad(p.t)), Math.sin(rad(p.t))];
  const Sl = add(N, perpU, -L.sh * p.sw), Sr = add(N, perpU, L.sh * p.sw);
  const Hl = add(P0, perpT, -L.hip * p.hw), Hr = add(P0, perpT, L.hip * p.hw);
  const head = add(N, dirUp(p.h), L.neck + L.headR);
  const El = add(Sl, dirDown(p.la), L.upA), Wl = add(El, dirDown(p.lf), L.foA);
  const Er = add(Sr, dirDown(p.ra), L.upA), Wr = add(Er, dirDown(p.rf), L.foA);
  const Kl = add(Hl, dirDown(p.lt), L.thigh), Fl = add(Kl, dirDown(p.ls), L.shin);
  const Kr = add(Hr, dirDown(p.rt), L.thigh), Fr = add(Kr, dirDown(p.rs), L.shin);
  const pts = { P0, M, N, Sl, Sr, Hl, Hr, head, El, Wl, Er, Wr, Kl, Fl, Kr, Fr };
  let gy, gx;
  if (p.floor) {
    // Floor moves: whatever is lowest touches the ground, body centred on the hips.
    gy = -Infinity;
    for (const k in pts) {
      const r = k === 'head' ? L.headR : ['P0', 'M', 'N', 'Sl', 'Sr', 'Hl', 'Hr'].includes(k) ? 0.055 : 0.028;
      gy = Math.max(gy, pts[k][1] + r);
    }
    gx = P0[0] + 0.07;
  } else {
    // Standing moves: lowest foot on the ground, feet centred.
    gy = Math.max(Fl[1], Fr[1]);
    gx = (Fl[0] + Fr[0]) / 2;
  }
  for (const k in pts) pts[k] = [pts[k][0] - gx, pts[k][1] - gy];
  return pts;
}

// Size of the space an exercise needs, so the figure fills its panel.
function extent(ex) {
  if (ex._ext) return ex._ext;
  let xm = 0.22, ym = ex.keys[0].floor ? 0.25 : 0.9;
  const poses = [];
  for (let i = 0; i < 16; i++) { const p = poseAt(ex, i * ex.tempo / 16, false); poses.push(p); if (ex.sides) poses.push(mirrorPose(p)); }
  poses.forEach(p => { const pts = solve(p); for (const k in pts) { xm = Math.max(xm, Math.abs(pts[k][0]) + 0.08); ym = Math.max(ym, -pts[k][1] + 0.1); } });
  ex._ext = { xm, ym };
  return ex._ext;
}

function frameFor(w, h, ext) {
  const e = ext || { xm: 0.39, ym: 1.05 };
  const s = Math.min(h * 0.93 / e.ym, w / (2 * e.xm));
  const oy = e.ym < 0.6 ? h * 0.5 + e.ym * s * 0.5 : h * 0.94;
  return { s, ox: w / 2, oy };
}

function drawFigure(ctx, w, h, pose, colors, ext, keep, ghost) {
  const pts = solve(pose);
  const { s, ox, oy } = frameFor(w, h, ext);
  const X = p => [ox + p[0] * s, oy + p[1] * s];
  if (!keep) ctx.clearRect(0, 0, w, h);
  drawSkeleton(ctx, pts, X, s, pose, colors, !!ghost);
}

// Skeleton drawn in the same style as the camera overlay (white bones, coral joints),
// so the coach and your own outline can be compared directly.
function drawSkeleton(ctx, pts, X, s, pose, colors, ghost) {
  const side = pose.view === 'side';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (!ghost && colors.floor) {
    const g = X([0, 0.004]);
    ctx.strokeStyle = colors.floor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g[0] - s * 0.55, g[1]); ctx.lineTo(g[0] + s * 0.55, g[1]); ctx.stroke();
  }
  const line = (list, wd, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, wd * s);
    ctx.beginPath(); list.map(X).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  };
  const dot = (p, col, r) => { const q = X(p); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(2.5, r * s), 0, Math.PI * 2); ctx.fill(); };
  const face = side ? 1 : 0;
  const foot = (K, F) => {
    const dir = side ? 1 : (F[0] < 0 ? -0.6 : 0.6);
    return [F, [F[0] + dir * 0.07, F[1] + 0.003]];
  };
  const limb = (S, E, W, col, wd) => line([S, E, W], wd, col);
  const leg = (H, K, F, col) => { line([H, K, F], 0.05, col); line(foot(K, F), 0.035, col); };
  const far = side ? colors.bodyFar : colors.body;
  const bellPos = pose.bell === 'both' ? [(pts.Wl[0] + pts.Wr[0]) / 2, (pts.Wl[1] + pts.Wr[1]) / 2] : pose.bell === 'L' ? pts.Wl : pose.bell === 'R' ? pts.Wr : null;
  const bell = p => {
    const C = X([p[0], p[1] + 0.06]), r = s * 0.052;
    ctx.fillStyle = colors.bell; ctx.beginPath(); ctx.arc(C[0], C[1], r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.bell; ctx.lineWidth = s * 0.016;
    ctx.beginPath(); ctx.arc(C[0], C[1] - r * 0.95, r * 0.55, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    if (!ghost) { ctx.fillStyle = colors.bellShine; ctx.beginPath(); ctx.arc(C[0] - r * 0.35, C[1] - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill(); }
  };
  // far side first
  leg(pts.Hl, pts.Kl, pts.Fl, far);
  limb(pts.Sl, pts.El, pts.Wl, far, 0.045);
  if (bellPos && pose.bellBehind) bell(bellPos);
  // spine, shoulders and hips
  line([pts.P0, pts.M, pts.N], 0.06, colors.body);
  line([pts.Sl, pts.Sr], 0.045, colors.body);
  line([pts.Hl, pts.Hr], 0.045, colors.body);
  line([pts.N, pts.head], 0.04, colors.body);
  const Hc = X(pts.head);
  ctx.fillStyle = colors.body; ctx.beginPath(); ctx.arc(Hc[0], Hc[1], L.headR * s, 0, Math.PI * 2); ctx.fill();
  if (side && !ghost) {          // nose shows which way the figure faces
    const a = rad(pose.h + 90);
    const n0 = X(add(pts.head, dirUp(pose.h + 90), L.headR * 0.7)), n1 = X(add(pts.head, dirUp(pose.h + 90), L.headR * 1.25));
    ctx.strokeStyle = colors.body; ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.beginPath(); ctx.moveTo(n0[0], n0[1]); ctx.lineTo(n1[0], n1[1]); ctx.stroke();
  }
  // near side
  leg(pts.Hr, pts.Kr, pts.Fr, colors.body);
  limb(pts.Sr, pts.Er, pts.Wr, colors.body, 0.045);
  if (bellPos && !pose.bellBehind) bell(bellPos);
  if (!ghost) {
    const jc = colors.joint || '#ff5a36';
    [pts.Sl, pts.El, pts.Wl, pts.Hl, pts.Kl, pts.Fl].forEach(p => dot(p, side ? colors.jointFar || jc : jc, 0.022));
    [pts.Sr, pts.Er, pts.Wr, pts.Hr, pts.Kr, pts.Fr].forEach(p => dot(p, jc, 0.022));
  }
}

// Coach view: faint outlines of the key positions, the path of the hands
// (or kettlebell) and feet, then the moving figure on top.
function drawCoach(ctx, w, h, ex, time, mirrored, colors) {
  const ext = extent(ex);
  ctx.clearRect(0, 0, w, h);
  const ghost = Object.assign({}, colors, { body: colors.ghost, bodyFar: colors.ghost, torso: colors.ghost, shorts: colors.ghost, hair: colors.ghost, bell: colors.ghost, bellShine: colors.ghost, shadow: 'rgba(0,0,0,0)' });
  ctx.save(); ctx.globalAlpha = 0.5;
  ex.keys.forEach(k => drawFigure(ctx, w, h, mirrored ? mirrorPose(k) : k, ghost, ext, true, true));
  ctx.restore();
  // movement path
  const { s, ox, oy } = frameFor(w, h, ext);
  const N = 40, paths = { Wr: [], Wl: [], Fr: [], Fl: [], head: [] };
  for (let i = 0; i <= N; i++) {
    const pts = solve(poseAt(ex, i * ex.tempo / N, mirrored));
    for (const k in paths) paths[k].push([ox + pts[k][0] * s, oy + pts[k][1] * s]);
  }
  ctx.save();
  ctx.setLineDash([4, 6]); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = colors.path;
  for (const k in paths) {
    const pth = paths[k];
    let len = 0; for (let i = 1; i < pth.length; i++) len += Math.hypot(pth[i][0] - pth[i - 1][0], pth[i][1] - pth[i - 1][1]);
    if (len < s * 0.12) continue;          // only joints that really travel
    ctx.beginPath(); pth.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  }
  ctx.restore();
  drawFigure(ctx, w, h, poseAt(ex, time, mirrored), colors, ext, true);
}

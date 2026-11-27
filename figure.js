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

function drawFigure(ctx, w, h, pose, colors, ext, keep) {
  const pts = solve(pose);
  const { s, ox, oy } = frameFor(w, h, ext);
  const X = p => [ox + p[0] * s, oy + p[1] * s];
  if (!keep) ctx.clearRect(0, 0, w, h);

  // floor shadow
  ctx.fillStyle = colors.shadow;
  ctx.beginPath();
  ctx.ellipse(ox, oy + 4, s * 0.2, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();

  const seg = (a, b, wd, col) => {
    const A = X(a), B = X(b);
    ctx.strokeStyle = col; ctx.lineWidth = wd * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  };
  const limbArm = (S, E, W, col) => { seg(S, E, 0.052, col); seg(E, W, 0.045, col); };
  const limbLeg = (H, K, F, col) => {
    seg(H, K, 0.075, col); seg(K, F, 0.058, col);
    const Fp = X(F);
    ctx.fillStyle = col;
    ctx.beginPath();
    const dir = pose.view === 'side' ? 1 : (F[0] < 0 ? -1 : 1);
    ctx.ellipse(Fp[0] + dir * s * 0.025, Fp[1] + s * 0.004, s * 0.045, s * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const bell = (p) => {
    const C = X([p[0], p[1] + 0.06]);
    const r = s * 0.052;
    ctx.fillStyle = colors.bell;
    ctx.beginPath(); ctx.arc(C[0], C[1], r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.bell; ctx.lineWidth = s * 0.016;
    ctx.beginPath(); ctx.arc(C[0], C[1] - r * 0.95, r * 0.55, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = colors.bellShine;
    ctx.beginPath(); ctx.arc(C[0] - r * 0.35, C[1] - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill();
  };
  const bellPos = () => {
    if (pose.bell === 'both') return [(pts.Wl[0] + pts.Wr[0]) / 2, (pts.Wl[1] + pts.Wr[1]) / 2];
    if (pose.bell === 'L') return pts.Wl;
    if (pose.bell === 'R') return pts.Wr;
    return null;
  };
  const bp = bellPos();

  const side = pose.view === 'side';
  const far = side ? colors.bodyFar : colors.body;
  // far limbs first in side view
  if (side) {
    limbLeg(pts.Hl, pts.Kl, pts.Fl, far);
    limbArm(pts.Sl, pts.El, pts.Wl, far);
  } else {
    limbLeg(pts.Hl, pts.Kl, pts.Fl, colors.body);
  }
  limbLeg(pts.Hr, pts.Kr, pts.Fr, colors.body);
  if (bp && pose.bellBehind) bell(bp);

  // torso
  ctx.fillStyle = colors.torso; ctx.strokeStyle = colors.torso;
  ctx.lineJoin = 'round'; ctx.lineWidth = (side ? 0.11 : 0.05) * s;
  const poly = [pts.Sl, pts.Sr, pts.Hr, pts.Hl].map(X);
  ctx.beginPath(); poly.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // shorts
  ctx.fillStyle = colors.shorts; ctx.strokeStyle = colors.shorts;
  ctx.lineWidth = (side ? 0.1 : 0.06) * s;
  const mid = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const sp = [mid(pts.Hl, pts.Sl, 0.12), mid(pts.Hr, pts.Sr, 0.12), mid(pts.Hr, pts.Kr, 0.4), mid(pts.Hl, pts.Kl, 0.4)].map(X);
  ctx.beginPath(); sp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // neck and head
  seg(pts.N, add(pts.N, dirUp(pose.h), L.neck + 0.02), 0.05, colors.body);
  const Hc = X(pts.head);
  ctx.fillStyle = colors.body;
  ctx.beginPath(); ctx.arc(Hc[0], Hc[1], L.headR * s, 0, Math.PI * 2); ctx.fill();
  // hair cap
  ctx.fillStyle = colors.hair;
  ctx.beginPath();
  const ha = rad(pose.h);
  ctx.arc(Hc[0], Hc[1], L.headR * s * 1.02, Math.PI + ha - (side ? 0.5 : 0.15), 2 * Math.PI + ha + (side ? -0.25 : 0.15));
  ctx.fill();

  if (!side) limbArm(pts.Sl, pts.El, pts.Wl, colors.body);
  limbArm(pts.Sr, pts.Er, pts.Wr, colors.body);
  if (bp && !pose.bellBehind) bell(bp);
}

// Coach view: faint outlines of the key positions, the path of the hands
// (or kettlebell) and feet, then the moving figure on top.
function drawCoach(ctx, w, h, ex, time, mirrored, colors) {
  const ext = extent(ex);
  ctx.clearRect(0, 0, w, h);
  const ghost = Object.assign({}, colors, { body: colors.ghost, bodyFar: colors.ghost, torso: colors.ghost, shorts: colors.ghost, hair: colors.ghost, bell: colors.ghost, bellShine: colors.ghost, shadow: 'rgba(0,0,0,0)' });
  ctx.save(); ctx.globalAlpha = 0.5;
  ex.keys.forEach(k => drawFigure(ctx, w, h, mirrored ? mirrorPose(k) : k, ghost, ext, true));
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

// Form check: compares your tracked body with the coach's movement.
// It finds the point of the exercise you look closest to, scores how well
// your back, arms and legs match it, and gives a target outline to draw
// over your camera image.

const SEGS = [
  // name, group, weight, coach joints, landmark indices (person's left side = screen left when mirrored)
  ['torso', 'back', 2.2, ['P0', 'N'], ['hip', 'sho']],
  ['uaL', 'arms', 1, ['Sl', 'El'], [11, 13]], ['faL', 'arms', 0.8, ['El', 'Wl'], [13, 15]],
  ['uaR', 'arms', 1, ['Sr', 'Er'], [12, 14]], ['faR', 'arms', 0.8, ['Er', 'Wr'], [14, 16]],
  ['thL', 'legs', 1.2, ['Hl', 'Kl'], [23, 25]], ['shL', 'legs', 1, ['Kl', 'Fl'], [25, 27]],
  ['thR', 'legs', 1.2, ['Hr', 'Kr'], [24, 26]], ['shR', 'legs', 1, ['Kr', 'Fr'], [26, 28]]
];
const SWAP = { uaL: 'uaR', faL: 'faR', uaR: 'uaL', faR: 'faL', thL: 'thR', shL: 'shR', thR: 'thL', shR: 'shL', torso: 'torso' };

const _formCache = new Map();
// Samples of the coach movement: segment angles for each of 4 variants
// (as drawn, mirrored left to right, left and right swapped, both).
function formSamples(ex, mirrored) {
  const key = ex.name + (mirrored ? 'm' : '');
  if (_formCache.has(key)) return _formCache.get(key);
  const out = [];
  const N = 36;
  for (let i = 0; i < N; i++) {
    const pts = solve(poseAt(ex, i * ex.tempo / N, mirrored));
    const ang = {};
    SEGS.forEach(([n, , , [a, b]]) => { ang[n] = Math.atan2(pts[b][1] - pts[a][1], pts[b][0] - pts[a][0]); });
    for (let v = 0; v < 4; v++) {
      const flip = v & 1, swap = v & 2;
      const A = {};
      SEGS.forEach(([n]) => {
        let x = ang[swap ? SWAP[n] : n];
        if (flip) x = Math.PI - x;
        A[n] = x;
      });
      out.push({ i, v, A, pts, flip, swap });
    }
  }
  _formCache.set(key, out);
  return out;
}

const angDiff = (a, b) => { let d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };

// lm: landmarks, P: maps a landmark to screen [x, y] (already mirrored).
function formCheck(ex, mirrored, lm, P) {
  const vis = i => lm[i] && lm[i].visibility > 0.5;
  const pt = k => k === 'hip' ? mid2(P(lm[23]), P(lm[24])) : k === 'sho' ? mid2(P(lm[11]), P(lm[12])) : P(lm[k]);
  const ok = k => k === 'hip' ? vis(23) && vis(24) : k === 'sho' ? vis(11) && vis(12) : vis(k);
  const U = {};
  SEGS.forEach(([n, , , , [a, b]]) => { if (ok(a) && ok(b)) { const A = pt(a), B = pt(b); U[n] = Math.atan2(B[1] - A[1], B[0] - A[0]); } });
  if (U.torso == null) return null;
  let best = null;
  for (const smp of formSamples(ex, mirrored)) {
    let sum = 0, wsum = 0;
    const errs = {};
    for (const [n, , w] of SEGS) {
      if (U[n] == null) continue;
      const e = angDiff(U[n], smp.A[n]) * 180 / Math.PI;
      errs[n] = e; sum += e * w; wsum += w;
    }
    if (wsum < 3) continue;
    const mean = sum / wsum;
    if (!best || mean < best.mean) best = { mean, errs, smp };
  }
  if (!best) return null;
  // worst body area
  const groups = {};
  for (const [n, g, w] of SEGS) if (best.errs[n] != null) { groups[g] = groups[g] || [0, 0]; groups[g][0] += best.errs[n] * w; groups[g][1] += w; }
  let worst = null, worstE = 0;
  for (const g in groups) { const e = groups[g][0] / groups[g][1]; if (e > worstE) { worstE = e; worst = g; } }
  const score = Math.max(0, Math.min(100, Math.round(100 - (best.mean - 10) * 2)));
  // target outline in screen space, anchored on your hips and scaled to your torso
  const H = pt('hip'), S = pt('sho');
  const tu = Math.hypot(S[0] - H[0], S[1] - H[1]);
  const c = best.smp.pts, tc = Math.hypot(c.N[0] - c.P0[0], c.N[1] - c.P0[1]);
  const k = tu / tc, f = best.smp.flip ? -1 : 1;
  const target = {};
  for (const key in c) {
    const src = best.smp.swap && /^[SEWHKF][lr]$/.test(key) ? key[0] + (key[1] === 'l' ? 'r' : 'l') : key;
    target[key] = [H[0] + f * (c[src][0] - c.P0[0]) * k, H[1] + (c[src][1] - c.P0[1]) * k];
  }
  return { score, worst: worstE > 22 ? worst : null, errs: best.errs, target };
}
const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

const FORM_TIPS = {
  back: { front: 'Check your posture: stand tall and square.', side: 'Check your back angle against the coach.' },
  arms: { front: 'Match the arm position.', side: 'Match the arm position.' },
  legs: { front: 'Check your legs and stance.', side: 'Check your knees and hips.' }
};

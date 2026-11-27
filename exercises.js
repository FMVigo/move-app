// Exercise library and routines.
// Figure angles are in degrees. A limb angle of 0 points straight down,
// 90 points to the right of the screen, 180 points up, -90 points left.
// t = lower back, u = upper back, h = head (0 = upright, positive leans right).
// In side view the figure faces right, so positive torso angles lean forward.

const FRONT = { view: 'front', t: 0, u: 0, h: 0, la: -6, lf: -4, ra: 6, rf: 4, lt: -4, ls: -4, rt: 4, rs: 4, sw: 1, hw: 1 };
const SIDE = { view: 'side', t: 0, u: 0, h: 0, la: -4, lf: -2, ra: 6, rf: 4, lt: -3, ls: 0, rt: 3, rs: 0, sw: 0.22, hw: 0.3 };
const P = (base, o) => Object.assign({}, base, o);

// Kettlebell holds
const GOBLET_SIDE = { la: 18, lf: 130, ra: 22, rf: 134, bell: 'both' };
const GOBLET_FRONT = { la: 6, lf: 134, ra: -6, rf: -134, bell: 'both' };

const IG = {
  lymph: 'https://www.instagram.com/jeanne.arte/reel/DQZQjZGDI_K/',
  qigong: 'https://www.instagram.com/fitwithhit/reel/DQFD972ETcB/',
  tenmin: 'https://www.instagram.com/suzi_j/reel/DXXHhcSimYQ/',
  mobility: 'https://www.instagram.com/justinechapman_/reel/DKAFeOZuQLF/',
  kb9: 'https://www.instagram.com/fitwithwhitney_/reel/DTdTX-Ojx4S/',
  kbcircuit: 'https://www.instagram.com/themartinmethod/reel/C2gfq5ctBLj/',
  core: 'https://www.instagram.com/fitwithhit/reel/DR69n4vDO1s/'
};

const EX = {
  // ---------- Morning flow ----------
  bounce: {
    name: 'Heel bounces', tempo: 0.55, metric: 'hipY', src: IG.lymph,
    cues: ['Soft knees, loose shoulders.', 'Small quick bounces through the heels.', 'Shake the night out of your body.'],
    keys: [P(FRONT, { la: -10, lf: -6, ra: 10, rf: 6 }), P(FRONT, { lt: -10, ls: 3, rt: 10, rs: -3, la: -14, lf: -20, ra: 14, rf: 20 })]
  },
  bounceTwist: {
    name: 'Bounce with hip rotation', tempo: 1.8, metric: 'twist', src: IG.lymph,
    cues: ['Keep bouncing and let the hips turn.', 'Arms swing loose like ropes.', 'Free up the pelvis and lower back.'],
    keys: [
      P(FRONT, { lt: -10, ls: 3, rt: 10, rs: -3 }),
      P(FRONT, { sw: 0.5, hw: 0.75, la: 40, lf: 70, ra: 55, rf: 30, h: 6 }),
      P(FRONT, { lt: -10, ls: 3, rt: 10, rs: -3 }),
      P(FRONT, { sw: 0.5, hw: 0.75, la: -55, lf: -30, ra: -40, rf: -70, h: -6 })
    ]
  },
  armsUp: {
    name: 'Arms up and down', tempo: 2.6, metric: 'wristY', src: IG.lymph,
    cues: ['Big arms up, then let them float down.', 'This pumps the chest and underarms.', 'Breathe in up, breathe out down.'],
    keys: [
      P(FRONT, {}),
      P(FRONT, { la: -92, lf: -92, ra: 92, rf: 92 }),
      P(FRONT, { la: -172, lf: -176, ra: 172, rf: 176, h: 0 }),
      P(FRONT, { la: -92, lf: -92, ra: 92, rf: 92 })
    ]
  },
  twist: {
    name: 'Trunk twists', tempo: 1.6, metric: 'twist', src: IG.qigong,
    cues: ['Turn from the waist, arms wrap around you.', 'Let the arms tap the body.', 'Wring out the stiffness in your spine.'],
    keys: [
      P(FRONT, { sw: 0.4, hw: 0.85, la: 70, lf: 95, ra: 80, rf: 30, h: 8 }),
      P(FRONT, { la: -40, lf: -50, ra: 40, rf: 50 }),
      P(FRONT, { sw: 0.4, hw: 0.85, la: -80, lf: -30, ra: -70, rf: -95, h: -8 }),
      P(FRONT, { la: -40, lf: -50, ra: 40, rf: 50 })
    ]
  },
  wave: {
    name: 'Body waves', tempo: 3, metric: 'hipY', src: IG.qigong,
    cues: ['Roll from the knees, to the hips, to the chest.', 'Slow and smooth like a wave.', 'This resets the nervous system.'],
    keys: [
      P(SIDE, {}),
      P(SIDE, { rt: 22, rs: -12, lt: 22, ls: -12, t: -10, u: -4, la: -10, ra: -6 }),
      P(SIDE, { rt: 12, rs: -6, lt: 12, ls: -6, t: 8, u: 18, h: 14, la: 8, ra: 12 }),
      P(SIDE, { t: 2, u: 4 })
    ]
  },
  sideReach: {
    name: 'Standing side reach', tempo: 4, metric: 'lean', src: IG.mobility,
    cues: ['Reach long over the top.', 'Feel the side of the lower back open.', 'Keep both feet heavy.'],
    keys: [
      P(FRONT, {}),
      P(FRONT, { t: -6, u: -24, h: -26, ra: -168, rf: -150, la: -10, lf: -20 }),
      P(FRONT, {}),
      P(FRONT, { t: 6, u: 24, h: 26, la: 168, lf: 150, ra: 10, rf: 20 })
    ]
  },
  catCow: {
    name: 'Standing cat cow', tempo: 4, metric: 'none', src: IG.mobility,
    cues: ['Hands on thighs, soft knees.', 'Round the back like a cat, then gently arch.', 'Move slowly. This is for your lower back.'],
    keys: [
      P(SIDE, { t: 40, u: 70, h: 110, rt: 26, rs: -8, lt: 26, ls: -8, ra: 30, rf: 30, la: 26, lf: 26 }),
      P(SIDE, { t: 55, u: 42, h: 25, rt: 26, rs: -8, lt: 26, ls: -8, ra: 34, rf: 34, la: 30, lf: 30 })
    ]
  },
  goodMorning: {
    name: 'Hip hinge', tempo: 3.5, metric: 'torsoUp', src: IG.tenmin,
    cues: ['Arms relaxed, push the hips back.', 'Long flat back, soft knees.', 'Squeeze the glutes to stand tall.'],
    keys: [
      P(SIDE, { ra: 4, rf: 4, la: 0, lf: 0 }),
      P(SIDE, { t: 62, u: 64, h: 70, rt: 14, rs: -6, lt: 14, ls: -6, ra: 4, rf: 4, la: 0, lf: 0 })
    ]
  },
  lateralLunge: {
    name: 'Lateral lunges', tempo: 3.4, metric: 'hipX', src: IG.lymph,
    cues: ['Wide stance, sit into one hip.', 'Chest proud, other leg long.', 'Push back to the middle.'],
    keys: [
      P(FRONT, { lt: -22, ls: -22, rt: 22, rs: 22, la: 18, lf: 95, ra: -18, rf: -95 }),
      P(FRONT, { lt: -60, ls: -6, rt: 50, rs: 50, t: -4, u: 6, la: 22, lf: 100, ra: -14, rf: -90 }),
      P(FRONT, { lt: -22, ls: -22, rt: 22, rs: 22, la: 18, lf: 95, ra: -18, rf: -95 }),
      P(FRONT, { lt: -50, ls: -50, rt: 60, rs: 6, t: 4, u: -6, la: 14, lf: 90, ra: -22, rf: -100 })
    ]
  },
  plie: {
    name: 'Ballet squats', tempo: 3, metric: 'hipY', src: IG.lymph,
    cues: ['Wide feet, toes turned out.', 'Sink straight down, back tall.', 'Strong legs, strong lower back.'],
    keys: [
      P(FRONT, { lt: -24, ls: -24, rt: 24, rs: 24, la: 25, lf: 160, ra: -25, rf: -160 }),
      P(FRONT, { lt: -68, ls: -14, rt: 68, rs: 14, la: 25, lf: 160, ra: -25, rf: -160 })
    ]
  },
  breathe: {
    name: 'Breathe and reach', tempo: 7, metric: 'none', src: IG.tenmin,
    cues: ['Big breath in as the arms rise.', 'Long breath out as they float down.', 'You are ready for the day.'],
    keys: [
      P(FRONT, {}),
      P(FRONT, { la: -100, lf: -110, ra: 100, rf: 110 }),
      P(FRONT, { la: -172, lf: -178, ra: 172, rf: 178, h: -4 }),
      P(FRONT, { la: -100, lf: -110, ra: 100, rf: 110 })
    ]
  },

  // ---------- Floor work for the back ----------
  catCowFloor: {
    name: 'Cat cow', tempo: 5, metric: 'none', src: IG.mobility,
    cues: ['Hands under shoulders, knees under hips.', 'Breathe out and round the back to the ceiling.', 'Breathe in, let the belly drop and look forward.'],
    keys: [
      P(SIDE, { floor: true, t: 62, u: 96, h: 140, ra: 0, rf: 0, la: 0, lf: 0, rt: 0, rs: -90, lt: 0, ls: -90 }),
      P(SIDE, { floor: true, t: 88, u: 64, h: 60, ra: 0, rf: 0, la: 0, lf: 0, rt: 0, rs: -90, lt: 0, ls: -90 })
    ]
  },
  birdDog: {
    name: 'Bird dog', tempo: 6, metric: 'none', src: IG.core,
    cues: ['On all fours, back flat like a table.', 'Reach one arm forward and the opposite leg back.', 'Slow and steady, hips stay level.'],
    keys: [
      P(SIDE, { floor: true, t: 76, u: 76, h: 105, ra: 0, rf: 0, la: 0, lf: 0, rt: 0, rs: -90, lt: 0, ls: -90 }),
      P(SIDE, { floor: true, t: 76, u: 76, h: 100, ra: 100, rf: 100, la: 0, lf: 0, rt: 0, rs: -90, lt: -82, ls: -82 }),
      P(SIDE, { floor: true, t: 76, u: 76, h: 105, ra: 0, rf: 0, la: 0, lf: 0, rt: 0, rs: -90, lt: 0, ls: -90 }),
      P(SIDE, { floor: true, t: 76, u: 76, h: 100, ra: 0, rf: 0, la: 100, lf: 100, rt: -82, rs: -82, lt: 0, ls: -90 })
    ]
  },
  deadBug: {
    name: 'Dead bug', tempo: 6, metric: 'none', src: IG.core,
    cues: ['On your back, arms to the ceiling, knees over hips.', 'Lower one arm and the opposite leg towards the floor.', 'Press the lower back into the floor the whole time.'],
    keys: [
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: 178, rf: 178, la: 182, lf: 182, rt: 180, rs: -90, lt: 180, ls: -90 }),
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: 105, rf: 102, la: 182, lf: 182, rt: 180, rs: -90, lt: -100, ls: -96 }),
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: 178, rf: 178, la: 182, lf: 182, rt: 180, rs: -90, lt: 180, ls: -90 }),
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: 178, rf: 178, la: 105, lf: 102, rt: -100, rs: -96, lt: 180, ls: -90 })
    ]
  },
  bridge: {
    name: 'Glute bridge', tempo: 4, metric: 'none', src: IG.tenmin,
    cues: ['On your back, feet flat, knees bent.', 'Squeeze the glutes and lift the hips.', 'Hold one second at the top, lower slowly.'],
    keys: [
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: -90, rf: -90, la: -90, lf: -90, rt: -140, rs: 12, lt: -140, ls: 12 }),
      P(SIDE, { floor: true, t: 112, u: 104, h: 95, ra: -96, rf: -90, la: -96, lf: -90, rt: -108, rs: 2, lt: -108, ls: 2 })
    ]
  },
  kneeHug: {
    name: 'Knee hugs', tempo: 5, metric: 'none', src: IG.mobility,
    cues: ['On your back, hug both knees to your chest.', 'Gently rock side to side if it feels good.', 'Let the lower back melt into the floor.'],
    keys: [
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: -120, rf: -100, la: -122, lf: -102, rt: 145, rs: -60, lt: 145, ls: -60 }),
      P(SIDE, { floor: true, t: 90, u: 90, h: 90, ra: -128, rf: -108, la: -130, lf: -110, rt: 160, rs: -75, lt: 165, ls: -75 })
    ]
  },

  // ---------- Kettlebell ----------
  halo: {
    name: 'Kettlebell halo', tempo: 3.2, metric: 'none', src: IG.kb9, kb: true,
    cues: ['Hold the bell by the horns, circle it round your head.', 'Ribs down, glutes tight.', 'Switch direction halfway.'],
    keys: [
      P(FRONT, { la: 5, lf: 157, ra: -5, rf: -157, bell: 'both' }),
      P(FRONT, { la: 110, lf: 142, ra: 60, rf: -147, bell: 'both', h: -6 }),
      P(FRONT, { la: 150, lf: 164, ra: -150, rf: -164, bell: 'both', bellBehind: true }),
      P(FRONT, { la: -60, lf: 147, ra: -110, rf: -142, bell: 'both', h: 6 })
    ]
  },
  gobletSquat: {
    name: 'Goblet squat', tempo: 3, metric: 'hipY', src: IG.kb9, kb: true,
    cues: ['Bell at the chest, elbows in.', 'Sit between the heels, chest up.', 'Drive up through the whole foot.'],
    keys: [
      P(SIDE, Object.assign({}, GOBLET_SIDE)),
      P(SIDE, Object.assign({}, GOBLET_SIDE, { t: 34, u: 26, h: 15, rt: 84, rs: -26, lt: 84, ls: -26, la: 40, lf: 148, ra: 44, rf: 152 }))
    ]
  },
  swing: {
    name: 'Two hand swing', tempo: 1.7, metric: 'wristY', src: IG.kbcircuit, kb: true,
    cues: ['Hike the bell back like a football.', 'Snap the hips, stand tall.', 'The hips do the work, not the arms.'],
    keys: [
      P(SIDE, { t: -2, u: -2, ra: 88, rf: 90, la: 84, lf: 86, bell: 'both' }),
      P(SIDE, { t: 38, u: 40, h: 40, rt: 14, rs: -6, lt: 14, ls: -6, ra: 30, rf: 30, la: 26, lf: 26, bell: 'both' }),
      P(SIDE, { t: 68, u: 66, h: 55, rt: 22, rs: -10, lt: 22, ls: -10, ra: -28, rf: -38, la: -32, lf: -42, bell: 'both' }),
      P(SIDE, { t: 32, u: 32, h: 30, rt: 12, rs: -5, lt: 12, ls: -5, ra: 40, rf: 42, la: 36, lf: 38, bell: 'both' })
    ]
  },
  row: {
    name: 'Single arm row', tempo: 2.4, metric: 'wristY', src: IG.kb9, kb: true, sides: true,
    cues: ['Hinge forward, free hand on your thigh.', 'Pull the elbow to your back pocket.', 'Flat back the whole time.'],
    keys: [
      P(SIDE, { t: 52, u: 54, h: 60, rt: 26, rs: -10, lt: -8, ls: -2, la: 40, lf: 30, ra: 0, rf: 0, bell: 'R' }),
      P(SIDE, { t: 52, u: 54, h: 60, rt: 26, rs: -10, lt: -8, ls: -2, la: 40, lf: 30, ra: -128, rf: 0, bell: 'R' })
    ]
  },
  press: {
    name: 'Single arm press', tempo: 2.6, metric: 'wristY', src: IG.kb9, kb: true, sides: true,
    cues: ['Bell racked on the forearm.', 'Squeeze glutes and press to the sky.', 'Lower it with control.'],
    keys: [
      P(FRONT, { ra: 8, rf: 176, bell: 'R', la: -30, lf: 40 }),
      P(FRONT, { ra: 176, rf: 178, bell: 'R', la: -30, lf: 40, h: -4 })
    ]
  },
  sideBend: {
    name: 'Suitcase side bend', tempo: 3, metric: 'lean', src: IG.kb9, kb: true, sides: true,
    cues: ['Bell in one hand, other hand on your hip.', 'Slide the bell down the leg.', 'Pull up with the opposite side.'],
    keys: [
      P(FRONT, { ra: 2, rf: 2, la: -38, lf: 35, bell: 'R', t: -4, u: -10, h: -8 }),
      P(FRONT, { ra: 1, rf: 1, la: -38, lf: 35, bell: 'R', t: 6, u: 24, h: 22 })
    ]
  },
  deadlift: {
    name: 'Romanian deadlift', tempo: 3.2, metric: 'torsoUp', src: IG.kb9, kb: true,
    cues: ['Soft knees, push the hips back.', 'Bell slides down the thighs.', 'Flat back, stand up with the glutes.'],
    keys: [
      P(SIDE, { ra: 2, rf: 2, la: -1, lf: -1, bell: 'both' }),
      P(SIDE, { t: 70, u: 72, h: 62, rt: 12, rs: -4, lt: 12, ls: -4, ra: 2, rf: 2, la: -1, lf: -1, bell: 'both' })
    ]
  },
  woodchop: {
    name: 'Kettlebell woodchop', tempo: 2.2, metric: 'wristY', src: IG.core, kb: true, sides: true,
    cues: ['Bell high over one shoulder.', 'Chop down across to the opposite knee.', 'Turn the back foot, brace the core.'],
    keys: [
      P(FRONT, { la: 114, lf: 120, ra: 160, rf: 100, sw: 0.65, h: 10, bell: 'both' }),
      P(FRONT, { la: -8, lf: -12, ra: -36, rf: -38, lt: -26, ls: -4, rt: 18, rs: 12, sw: 0.65, h: -8, t: -3, u: -6, bell: 'both' })
    ]
  },
  curl: {
    name: 'Horn grip curl', tempo: 2.6, metric: 'wristY', src: IG.kb9, kb: true,
    cues: ['Hold the horns, elbows pinned to your sides.', 'Curl up, squeeze at the top.', 'Slow on the way down.'],
    keys: [
      P(FRONT, { la: 10, lf: 16, ra: -10, rf: -16, bell: 'both' }),
      P(FRONT, { la: 6, lf: 160, ra: -6, rf: -160, bell: 'both' })
    ]
  },
  triceps: {
    name: 'Overhead triceps extension', tempo: 2.6, metric: 'wristY', src: IG.kb9, kb: true,
    cues: ['Bell behind the head, elbows to the ceiling.', 'Straighten the arms fully.', 'Keep the ribs down.'],
    keys: [
      P(FRONT, { la: -172, lf: 25, ra: 172, rf: -25, bell: 'both', bellBehind: true }),
      P(FRONT, { la: -176, lf: -178, ra: 176, rf: 178, bell: 'both' })
    ]
  },
  march: {
    name: 'Goblet march', tempo: 2, metric: 'kneeY', src: IG.core, kb: true,
    cues: ['Bell at the chest, stand tall.', 'Drive one knee up to hip height.', 'Brace the core, no leaning back.'],
    keys: [
      P(SIDE, Object.assign({}, GOBLET_SIDE, { rt: 88, rs: 4 })),
      P(SIDE, Object.assign({}, GOBLET_SIDE)),
      P(SIDE, Object.assign({}, GOBLET_SIDE, { lt: 88, ls: 4 })),
      P(SIDE, Object.assign({}, GOBLET_SIDE))
    ]
  },
  fold: {
    name: 'Forward fold', tempo: 6, metric: 'none', src: IG.mobility,
    cues: ['Soft knees, let the head hang.', 'Breathe into the lower back.', 'Roll up slowly when ready.'],
    keys: [
      P(SIDE, { t: 76, u: 92, h: 120, rt: 10, rs: -6, lt: 10, ls: -6, ra: 0, rf: 0, la: 4, lf: 4 }),
      P(SIDE, { t: 82, u: 100, h: 130, rt: 12, rs: -8, lt: 12, ls: -8, ra: 4, rf: 4, la: 8, lf: 8 })
    ]
  },
  hipFlexor: {
    name: 'Hip flexor stretch', tempo: 5, metric: 'none', src: IG.mobility, sides: true,
    cues: ['Long stance, back heel up.', 'Tuck the tail and squeeze the back glute.', 'Feel the front of the hip open.'],
    keys: [
      P(SIDE, { rt: 40, rs: -6, lt: -30, ls: -34, t: -4, u: -2, ra: 140, rf: 170, la: 136, lf: 168 }),
      P(SIDE, { rt: 52, rs: -10, lt: -36, ls: -42, t: -8, u: -6, ra: 150, rf: 175, la: 146, lf: 172 })
    ]
  }
};

const ROUTINES = {
  morning: {
    id: 'morning', title: 'Morning flow', sub: 'Mobility, lymph, then floor work for the back', when: 'Before the shower',
    getReady: 5, rest: 0,
    blocks: [
      ['bounce', 60], ['bounceTwist', 50], ['armsUp', 50], ['twist', 50], ['wave', 45],
      ['sideReach', 50], ['goodMorning', 50], ['lateralLunge', 50], ['plie', 50],
      ['catCowFloor', 50, 12], ['birdDog', 60], ['deadBug', 60], ['bridge', 50], ['kneeHug', 45],
      ['breathe', 40, 10]
    ]
  },
  office1: {
    id: 'office1', title: 'Office strength', sub: 'Squat, swing, row, press, side bend', when: 'Between meetings',
    getReady: 6, rest: 20, kb: true,
    blocks: [['halo', 60], 'ROUND2', ['gobletSquat', 40], ['swing', 40], ['row', 40], ['press', 40], ['sideBend', 40], 'END', ['fold', 45]]
  },
  office2: {
    id: 'office2', title: 'Office power and core', sub: 'Deadlift, chop, curl, triceps, march', when: 'Between meetings',
    getReady: 6, rest: 20, kb: true,
    blocks: [['goodMorning', 50], 'ROUND2', ['deadlift', 40], ['woodchop', 40], ['curl', 40], ['triceps', 40], ['march', 40], 'END', ['hipFlexor', 50]]
  }
};

// Expand a routine into a flat list of steps: {ex, dur, phase:'work'|'rest', round}
function buildSteps(routine) {
  const out = [];
  const b = routine.blocks;
  let i = 0;
  while (i < b.length) {
    if (b[i] === 'ROUND2') {
      const end = b.indexOf('END', i);
      const group = b.slice(i + 1, end);
      for (let r = 1; r <= 2; r++) {
        group.forEach(([id, d], gi) => {
          out.push({ id, dur: d, phase: 'work', round: r });
          const last = r === 2 && gi === group.length - 1;
          if (routine.rest && !last) out.push({ id: null, dur: routine.rest, phase: 'rest' });
        });
      }
      i = end + 1;
    } else {
      const [id, d, ready] = b[i];
      out.push({ id, dur: d, phase: 'work', ready });
      i++;
    }
  }
  return out;
}

function routineSeconds(routine) {
  const steps = buildSteps(routine);
  return steps.reduce((s, st, i) => s + st.dur + (st.phase === 'work' && !(steps[i - 1] && steps[i - 1].phase === 'rest') ? (st.ready || routine.getReady) : 0), 0);
}

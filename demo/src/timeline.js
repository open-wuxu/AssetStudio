// 确定性时间线：视频逐帧渲染与网页自动演示共用同一套运动/镜头/数据。

export const DURATION = 30;
export const FPS = 60;

export const SEGMENTS = [
  { id: 'overview', t0: 0.0, t1: 4.0, page: 'overview', label: '全景总览', en: 'OVERVIEW', select: null },
  { id: 'walk', t0: 4.0, t1: 8.4, page: 'maintenance', label: '车间漫游', en: 'WALK', select: 'cnc-03' },
  { id: 'robot', t0: 8.4, t1: 14.2, page: 'production', label: '装配取放', en: 'ROBOT', select: 'arm-06' },
  { id: 'scan', t0: 14.2, t1: 19.2, page: 'inspection', label: '在线检测', en: 'SCAN', select: 'scan-02' },
  { id: 'agv', t0: 19.2, t1: 24.2, page: 'logistics', label: 'AGV 配送', en: 'AGV', select: 'agv-01' },
  { id: 'outro', t0: 24.2, t1: 30.0, page: 'overview', label: '运行总览', en: 'OUTRO', select: null },
];

export const PICK = { x: -2.8, y: 1.16, z: 2.4 };
export const PLACE = { x: 2.8, y: 1.16, z: 2.4 };
export const ROBOT_HOME = { x: 0.6, y: 2.25, z: 3.0 };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const smoother = (u) => { u = clamp01(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const seg = (t, a, b) => smooth((t - a) / (b - a));
const rad = (d) => (d * Math.PI) / 180;

export function segmentIndexAt(t) {
  const tt = ((t % DURATION) + DURATION) % DURATION;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (tt >= SEGMENTS[i].t0) return i;
  return 0;
}
export function pageAt(t) { return SEGMENTS[segmentIndexAt(t)].page; }
export function selectedAt(t) {
  const i = segmentIndexAt(t);
  if (i === 5 && t < 24.6) return 'agv-01';
  return SEGMENTS[i].select;
}

/* ---------------- 相机 ---------------- */

// 位置 / 注视点关键帧（世界坐标）。AGV 段用动态跟踪覆盖。
const CAMERA_KEYS = [
  { t: 0.0,  p: [19.0, 8.2, 20.5],  q: [1.0, 1.8, 2.0], fov: 42 },
  { t: 1.7,  p: [18.0, 7.6, 19.5],  q: [0.8, 1.8, 2.0], fov: 42 },
  { t: 3.2,  p: [16.5, 6.8, 18.8],  q: [0.5, 1.9, 2.0], fov: 41 },
  { t: 4.2,  p: [16.5, 6.0, 18.0],  q: [-4.0, 2.3, -2.0], fov: 38 },
  { t: 5.5,  p: [8.0, 3.6, 9.5],    q: [-12.0, 2.0, -7.5], fov: 33 },
  { t: 6.6,  p: [-4.0, 3.0, 9.0],   q: [-12.0, 2.0, -7.5], fov: 32 },
  { t: 7.4,  p: [1.0, 2.6, 9.5],    q: [0.0, 1.6, 2.2], fov: 40 },
  { t: 8.3,  p: [10.8, 1.8, 10.2],  q: [2.5, 1.4, 2.2], fov: 46 },
  { t: 9.0,  p: [9.2, 2.9, 8.2],    q: [0.4, 1.7, 1.8], fov: 42 },
  { t: 11.2, p: [7.4, 3.1, 8.4],    q: [0.0, 1.7, 1.7], fov: 40 },
  { t: 13.8, p: [6.4, 2.4, 7.6],    q: [1.2, 1.5, 1.9], fov: 39 },
  { t: 14.6, p: [12.4, 2.4, 7.8],   q: [9.2, 1.65, 2.2], fov: 38 },
  { t: 15.6, p: [15.5, 2.45, 5.6],  q: [9.2, 1.6, 2.2], fov: 36 },
  { t: 18.0, p: [14.4, 2.1, 6.3],   q: [9.2, 1.55, 2.2], fov: 35 },
  { t: 19.0, p: [14.2, 2.2, 5.8],   q: [10.4, 1.5, 2.6], fov: 37 },
  { t: 19.8, p: [21.8, 2.9, 12.6],  q: [15.6, 1.15, 7.3], fov: 40 },
  { t: 23.8, p: [13.9, 2.7, 12.8],  q: [8.2, 1.1, 7.3], fov: 40 },
  { t: 24.8, p: [18.0, 6.5, 16.5],  q: [7.0, 1.5, 6.5], fov: 38 },
  { t: 26.4, p: [20.0, 12.0, 23.0], q: [0.0, 2.2, 2.0], fov: 37 },
  { t: 28.4, p: [24.5, 14.5, 26.0], q: [0.0, 2.2, 1.8], fov: 36 },
  { t: 30.0, p: [26.0, 15.2, 27.0], q: [0.0, 2.2, 1.8], fov: 36 },
];

function catmull(p0, p1, p2, p3, u) {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

function sampleKeys(t, keys) {
  const tt = clamp(t, keys[0].t, keys[keys.length - 1].t);
  let i = 0;
  while (i < keys.length - 2 && tt > keys[i + 1].t) i++;
  const k0 = keys[Math.max(0, i - 1)];
  const k1 = keys[i];
  const k2 = keys[i + 1];
  const k3 = keys[Math.min(keys.length - 1, i + 2)];
  const u = (tt - k1.t) / (k2.t - k1.t);
  const p = [0, 1, 2].map((d) => catmull(k0.p[d], k1.p[d], k2.p[d], k3.p[d], u));
  const q = [0, 1, 2].map((d) => catmull(k0.q[d], k1.q[d], k2.q[d], k3.q[d], u));
  const fov = lerp(k1.fov, k2.fov, smooth(u));
  return { pos: p, target: q, fov };
}

function agvTrackingCamera(t) {
  const a = agvAt(t);
  const settle = smooth((t - 19.4) / 0.7);
  const y = lerp(3.35, 2.7, settle) + Math.sin(t * 0.7) * 0.02;
  return {
    pos: [a.x + 5.9, y, 12.75],
    target: [a.x - 0.15, 1.08, 7.25],
    fov: 40,
  };
}

export function cameraAt(t) {
  const tt = ((t % DURATION) + DURATION) % DURATION;
  const base = sampleKeys(tt, CAMERA_KEYS);

  // 19.2—24.0 为 AGV 跟随镜头，与关键帧平滑混合
  let w = 0;
  if (tt >= 19.2 && tt < 20.0) w = smooth((tt - 19.2) / 0.8);
  else if (tt >= 20.0 && tt <= 23.6) w = 1;
  else if (tt > 23.6 && tt <= 24.4) w = 1 - smooth((tt - 23.6) / 0.8);

  if (w > 0) {
    const track = agvTrackingCamera(tt);
    return {
      pos: [0, 1, 2].map((d) => lerp(base.pos[d], track.pos[d], w)),
      target: [0, 1, 2].map((d) => lerp(base.target[d], track.target[d], w)),
      fov: lerp(base.fov, track.fov, w),
    };
  }
  return base;
}

/* ---------------- 机械臂 ---------------- */

const PIDLE = { x: ROBOT_HOME.x, y: ROBOT_HOME.y, z: ROBOT_HOME.z };

function arcLerp(a, b, u, lift = 0.55) {
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u) + Math.sin(Math.PI * u) * lift,
    z: lerp(a.z, b.z, u),
  };
}

export function robotAt(t) {
  let tcp = { ...PIDLE };
  let gripper = 1;       // 1 张开, 0 闭合
  let attached = false;
  let phase = '待机';
  let blink = 0;

  if (t < 8.4) {
    const idle = Math.sin(t * 0.62) * 0.12;
    tcp = { x: PIDLE.x + idle * 0.6, y: PIDLE.y + Math.sin(t * 0.9) * 0.035, z: PIDLE.z + Math.sin(t * 0.5) * 0.08 };
    blink = (Math.sin(t * 2.2) + 1) * 0.5;
  } else if (t < 9.3) {
    const u = seg(t, 8.4, 9.3);
    tcp = arcLerp(PIDLE, { x: PICK.x, y: 2.42, z: PICK.z }, u, 0.22);
    phase = '接近取件位';
    blink = 1;
  } else if (t < 10.0) {
    const u = seg(t, 9.3, 10.0);
    tcp = { x: PICK.x, y: lerp(2.42, PICK.y, u), z: PICK.z };
    phase = '下降对位';
    blink = 1;
  } else if (t < 10.45) {
    const u = seg(t, 10.0, 10.45);
    gripper = 1 - u;
    tcp = { x: PICK.x, y: PICK.y, z: PICK.z };
    attached = t >= 10.3;
    phase = '夹爪闭合';
    blink = 1;
  } else if (t < 11.25) {
    const u = seg(t, 10.45, 11.25);
    tcp = { x: PICK.x, y: lerp(PICK.y, 2.42, u), z: PICK.z };
    gripper = 0;
    attached = true;
    phase = '提升工件';
    blink = 1;
  } else if (t < 12.35) {
    const u = seg(t, 11.25, 12.35);
    tcp = arcLerp({ x: PICK.x, y: 2.42, z: PICK.z }, { x: PLACE.x, y: 2.42, z: PLACE.z }, u, 0.5);
    gripper = 0;
    attached = true;
    phase = '搬运中';
    blink = 1;
  } else if (t < 12.98) {
    const u = seg(t, 12.35, 12.98);
    tcp = { x: PLACE.x, y: lerp(2.42, PLACE.y, u), z: PLACE.z };
    gripper = 0;
    attached = true;
    phase = '放置对位';
    blink = 1;
  } else if (t < 13.4) {
    const u = seg(t, 12.98, 13.4);
    gripper = u;
    tcp = { x: PLACE.x, y: PLACE.y, z: PLACE.z };
    attached = t < 13.16;
    phase = '夹爪张开';
    blink = 1;
  } else if (t < 14.25) {
    const u = seg(t, 13.4, 14.25);
    tcp = arcLerp({ x: PLACE.x, y: PLACE.y, z: PLACE.z }, PIDLE, u, 0.7);
    gripper = 1;
    phase = '返回待机';
    blink = 1;
  } else {
    const idle = Math.sin(t * 0.62) * 0.12;
    tcp = { x: PIDLE.x + idle * 0.6, y: PIDLE.y + Math.sin(t * 0.9) * 0.035, z: PIDLE.z + Math.sin(t * 0.5) * 0.08 };
    blink = (Math.sin(t * 2.2) + 1) * 0.5;
  }

  return { tcp, gripper, attached, phase, blink };
}

/* ---------------- 工件 / 在线检测 ---------------- */

// 工件在输送线上的位置（主轴为 X）。被夹持时由机械臂接管。
export function workpieceAt(t) {
  const r = robotAt(t);
  if (r.attached) return { x: r.tcp.x, y: r.tcp.y, z: r.tcp.z, held: true };
  if (t < 10.3) return { x: PICK.x, y: 1.14, z: PICK.z, held: false };
  const t0 = 13.16;
  const x0 = PLACE.x;
  let x;
  if (t <= 15.0) {
    x = lerp(x0, 7.5, smooth((t - t0) / (15.0 - t0)));
  } else if (t <= 17.4) {
    x = lerp(7.5, 9.9, smooth((t - 15.0) / 2.4));
  } else if (t <= 19.0) {
    x = lerp(9.9, 15.5, smooth((t - 17.4) / 1.6));
  } else {
    x = 15.5 + (t - 19.0) * 3.0;
  }
  return { x, y: 1.14, z: PLACE.z, held: false };
}

export function scanAt(t) {
  const start = 15.0, end = 17.3;
  const active = t >= start && t < end;
  const done = t >= end;
  const progress = clamp01((t - start) / (end - start));
  let label = '待检';
  if (t >= start && t < end) label = '扫描中';
  else if (done) label = 'PASS';
  const deviation = done ? 0.012 : active ? 0.012 + Math.sin(t * 9) * 0.004 * (1 - progress) : 0.012;
  const points = active ? Math.round(420 + progress * 864) : done ? 1284 : 0;
  const sweep = active ? (t - start) * 1.55 : 0;
  return {
    active, done, progress, resultLabel: label,
    pass: done, deviation, points, sweep,
    tolerance: 0.05,
    dimension: done ? 42.062 : active ? 42.06 : 42.06,
    passRate: 99.2,
  };
}

/* ---------------- AGV ---------------- */

export const AGV_START_X = 16;
export const AGV_END_X = 8;
export const AGV_LANE_Z = 7.4;
const AGV_T0 = 19.4, AGV_T1 = 23.7;

function agvProfile(t) {
  const d = AGV_START_X - AGV_END_X; // 8 m
  const dur = AGV_T1 - AGV_T0;
  if (t <= AGV_T0) return { s: 0, v: 0 };
  if (t >= AGV_T1) return { s: d, v: 0 };
  const u = (t - AGV_T0) / dur;
  const a = 0.17; // 加速/减速占比
  let s, v;
  if (u < a) {
    s = (d * u * u) / (2 * a * (1 - a));
    v = (d * u) / (a * (1 - a) * dur);
  } else if (u > 1 - a) {
    const w = 1 - u;
    s = d - (d * w * w) / (2 * a * (1 - a));
    v = (d * w) / (a * (1 - a) * dur);
  } else {
    s = d * (u - a / 2) / (1 - a);
    v = d / (dur * (1 - a));
  }
  return { s: clamp(s, 0, d), v };
}

export function agvAt(t) {
  const { s, v } = agvProfile(t);
  const x = AGV_START_X - s;
  const moving = v > 0.03;
  return {
    x,
    z: AGV_LANE_Z,
    speed: v,
    progress: (s / (AGV_START_X - AGV_END_X)) * 100,
    battery: t > 23.7 ? 77 : 78,
    moving,
    state: t >= AGV_T1 ? '已到达 · 待卸货' : moving ? '配送中' : '待发车',
    task: 'T-2041',
    from: '上料位 A',
    to: '工位 B',
    wheelSpin: s / 0.22,
    lidarSpin: t * 2.6,
  };
}

/* ---------------- UI 汇总状态 ---------------- */

export function timelineState(t) {
  const tt = ((t % DURATION) + DURATION) % DURATION;
  const si = segmentIndexAt(tt);
  const segment = SEGMENTS[si];
  const robot = robotAt(tt);
  const scan = scanAt(tt);
  const agv = agvAt(tt);
  const wp = workpieceAt(tt);
  const camera = cameraAt(tt);
  const selected = selectedAt(tt);

  const production = 2847 + Math.floor(tt * 1.9);
  const oee = 87.4 + Math.sin(tt * 0.35) * 0.28;
  const utilization = 91.2 + Math.sin(tt * 0.5 + 1.2) * 0.5;
  const temp = 68.5 + Math.sin(tt * 0.9) * 0.35;
  const pressure = 0.82 + Math.sin(tt * 0.6 + 2) * 0.008;

  return {
    t: tt,
    segment: si,
    segmentId: segment.id,
    page: segment.page,
    selected,
    camera,
    robot,
    scan,
    agv,
    workpiece: wp,
    production,
    oee,
    utilization,
    temp,
    pressure,
    clock: 14 * 3600 + 32 * 60 + 6 + tt,
    auto: true,
  };
}

export function formatClock(seconds) {
  const s = Math.floor(seconds) % 86400;
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export { rad, clamp01, smooth, lerp };

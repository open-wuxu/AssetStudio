import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------------- 材质 ---------------- */

export const M = {
  floor: new THREE.MeshStandardMaterial({ color: 0x121a1b, roughness: 0.52, metalness: 0.38, envMapIntensity: 0.8 }),
  floorPlate: new THREE.MeshStandardMaterial({ color: 0x18211f, roughness: 0.48, metalness: 0.42, envMapIntensity: 0.7 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x4a5650, roughness: 0.36, metalness: 0.8, envMapIntensity: 1.1 }),
  steelLight: new THREE.MeshStandardMaterial({ color: 0x7a8a80, roughness: 0.3, metalness: 0.9, envMapIntensity: 1.1 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x1a2320, roughness: 0.46, metalness: 0.78, envMapIntensity: 0.55 }),
  paint: new THREE.MeshStandardMaterial({ color: 0x303b35, roughness: 0.52, metalness: 0.35, envMapIntensity: 0.6 }),
  paintLight: new THREE.MeshStandardMaterial({ color: 0x4a5750, roughness: 0.48, metalness: 0.32, envMapIntensity: 0.65 }),
  paintWarm: new THREE.MeshStandardMaterial({ color: 0x3b332a, roughness: 0.56, metalness: 0.3, envMapIntensity: 0.4 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x070a09, roughness: 0.96, metalness: 0.02 }),
  rubberSoft: new THREE.MeshStandardMaterial({ color: 0x121716, roughness: 0.9, metalness: 0.05 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x0d1210, roughness: 0.8, metalness: 0.1 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb06a35, roughness: 0.34, metalness: 1.0 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x18322d, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.11,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.3,
  }),
  glassDark: new THREE.MeshStandardMaterial({
    color: 0x081211, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.5,
    side: THREE.DoubleSide, depthWrite: false,
  }),
  accent: new THREE.MeshStandardMaterial({ color: 0x1a2408, emissive: 0xc8ff3d, emissiveIntensity: 1.35, roughness: 0.4, metalness: 0.2 }),
  accentMatte: new THREE.MeshStandardMaterial({ color: 0x9ad42e, roughness: 0.6, metalness: 0.1 }),
  accentDark: new THREE.MeshStandardMaterial({ color: 0x4e5f22, roughness: 0.55, metalness: 0.35 }),
  accentRail: new THREE.MeshStandardMaterial({ color: 0x4b5c23, roughness: 0.55, metalness: 0.4 }),
  robotPaint: new THREE.MeshStandardMaterial({ color: 0x59635d, roughness: 0.4, metalness: 0.52, envMapIntensity: 1.15 }),
  robotDark: new THREE.MeshStandardMaterial({ color: 0x2c3632, roughness: 0.46, metalness: 0.62, envMapIntensity: 0.9 }),
  coolWhiteDim: new THREE.MeshStandardMaterial({ color: 0x1a2018, emissive: 0xd8f5dc, emissiveIntensity: 0.8, roughness: 0.4 }),
  cyan: new THREE.MeshStandardMaterial({ color: 0x06201a, emissive: 0x5df2c4, emissiveIntensity: 1.8, roughness: 0.35 }),
  amber: new THREE.MeshStandardMaterial({ color: 0x2a1804, emissive: 0xffb454, emissiveIntensity: 1.9, roughness: 0.4 }),
  amberMatte: new THREE.MeshStandardMaterial({ color: 0x7d5a26, roughness: 0.6, metalness: 0.2 }),
  cyanMatte: new THREE.MeshStandardMaterial({ color: 0x2d7464, roughness: 0.6, metalness: 0.2 }),
  red: new THREE.MeshStandardMaterial({ color: 0x2a070a, emissive: 0xff5f6d, emissiveIntensity: 1.9, roughness: 0.4 }),
  coolWhite: new THREE.MeshStandardMaterial({ color: 0x1c211a, emissive: 0xeaffd8, emissiveIntensity: 0.3, roughness: 0.4 }),
  roller: new THREE.MeshStandardMaterial({ color: 0x5e6963, metalness: 0.72, roughness: 0.38, envMapIntensity: 0.9 }),
  workLight: new THREE.MeshStandardMaterial({ color: 0x3a2a12, emissive: 0xffc27a, emissiveIntensity: 1.2, roughness: 0.5 }),
};

/* ---------------- 程序化贴图 ---------------- */

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const FONT = '"PingFang SC", "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
const MONO = '"DIN Alternate", "SF Mono", Menlo, monospace';

export function screenTexture(kind = 'line') {
  const conf = {
    line: { title: 'LINE 01', sub: '装配产线 · 运行中', big: '87.4', unit: '%', label: 'OEE', rows: [['OUTPUT', '2847 pcs'], ['CYCLE', '42.5 s'], ['PASS', '99.2 %']], color: '#c8ff3d' },
    robot: { title: 'ARM-06', sub: '六轴装配机械臂', big: 'RUN', unit: '', label: 'STATUS', rows: [['PAYLOAD', '12.4 kg'], ['CYCLE', '42.5 s'], ['AXIS', '6 / 6'],], color: '#c8ff3d' },
    cnc: { title: 'CNC-03', sub: '数控加工中心', big: '8400', unit: 'RPM', label: 'SPINDLE', rows: [['FEED', '1200 mm/min'], ['TEMP', '54.2 °C'], ['TOOL', '72 %']], color: '#5df2c4' },
    scan: { title: 'SCAN-02', sub: '在线检测站', big: 'SCAN', unit: '', label: 'INLINE METROLOGY', rows: [['DIM', '42.062 mm'], ['DEV', '+0.012 mm'], ['CLOUD', '1284 pts']], color: '#5df2c4' },
    agv: { title: 'AGV-01', sub: '搬运机器人', big: '78', unit: '%', label: 'BATTERY', rows: [['TASK', 'T-2041'], ['SPEED', '2.1 m/s'], ['STATE', 'MOVING']], color: '#ffb454' },
    air: { title: 'AP-01', sub: '螺杆空压机', big: '0.82', unit: 'MPa', label: 'PRESSURE', rows: [['TEMP', '68.5 °C'], ['SPEED', '2850 RPM'], ['RUN', '128 h']], color: '#c8ff3d' },
  }[kind] || {};
  return makeCanvas(640, 360, (g, w, h) => {
    g.fillStyle = '#050b09'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(140,180,160,.18)'; g.lineWidth = 2;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = 'rgba(200,255,61,.1)'; g.fillRect(8, 8, w - 16, 54);
    g.fillStyle = conf.color; g.fillRect(8, 8, 8, 54);
    g.font = `600 26px ${MONO}`; g.fillStyle = '#e8f2e9';
    g.fillText(conf.title, 30, 44);
    g.font = `400 17px ${FONT}`; g.fillStyle = 'rgba(210,228,214,.66)';
    g.fillText(conf.sub, 190, 43);
    g.fillStyle = conf.color;
    g.beginPath(); g.arc(w - 34, 35, 6, 0, Math.PI * 2); g.fill();
    g.font = `400 15px ${MONO}`; g.fillStyle = 'rgba(200,220,208,.55)';
    g.fillText('LIVE', w - 80, 40);

    g.font = `400 16px ${MONO}`; g.fillStyle = 'rgba(180,205,190,.5)';
    g.fillText(conf.label, 34, 108);
    g.font = `600 92px ${MONO}`; g.fillStyle = conf.color;
    g.fillText(conf.big, 30, 196);
    if (conf.unit) {
      g.font = `400 26px ${MONO}`; g.fillStyle = 'rgba(220,235,225,.65)';
      g.fillText(conf.unit, 40 + g.measureText(conf.big).width, 192);
    }

    // 折线图
    g.strokeStyle = 'rgba(140,180,160,.12)'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const y = 218 + i * 26; g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke(); }
    g.beginPath();
    for (let i = 0; i < 34; i++) {
      const x = 30 + (i / 33) * (w - 60);
      const y = 300 - (Math.sin(i * 0.55 + 1.2) * 0.5 + 0.5) * 58 - Math.sin(i * 0.21) * 12;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokeStyle = conf.color; g.lineWidth = 2.5; g.globalAlpha = 0.9; g.stroke(); g.globalAlpha = 1;

    conf.rows.forEach((r, i) => {
      const y = 238 + i * 38;
      g.font = `400 16px ${MONO}`; g.fillStyle = 'rgba(170,195,180,.5)';
      g.fillText(r[0], 34, y);
      g.font = `500 20px ${MONO}`; g.fillStyle = '#dfeae3';
      g.fillText(r[1], 150, y);
    });
  });
}

export function nameplateTexture(title, sub) {
  return makeCanvas(512, 128, (g, w, h) => {
    g.fillStyle = '#0b1210'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,255,61,.25)'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#c8ff3d'; g.fillRect(4, 4, 10, h - 8);
    g.font = `600 40px ${MONO}`; g.fillStyle = '#ecf4ee';
    g.fillText(title, 34, 58);
    g.font = `400 21px ${FONT}`; g.fillStyle = 'rgba(190,210,198,.65)';
    g.fillText(sub, 34, 96);
  });
}

export function hazardTexture(repeat = 1) {
  const tex = makeCanvas(256, 64, (g, w, h) => {
    g.fillStyle = '#0b0f0c'; g.fillRect(0, 0, w, h);
    g.save();
    g.translate(-h, 0);
    g.fillStyle = '#b6e13a';
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(i * 64, 0); g.lineTo(i * 64 + 32, 0); g.lineTo(i * 64 + 32 + h, h); g.lineTo(i * 64 + h, h);
      g.closePath(); g.fill();
    }
    g.restore();
    g.globalAlpha = 0.18; g.fillStyle = '#000';
    for (let i = 0; i < w; i += 4) g.fillRect(i, 0, 2, h);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, 1);
  return tex;
}

export function floorTextTexture(title, sub, color = '#c8ff3d') {
  return makeCanvas(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = color; g.globalAlpha = 0.5; g.lineWidth = 5;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.globalAlpha = 0.78;
    g.font = `600 170px ${MONO}`; g.fillStyle = color;
    g.fillText(title, 46, 250);
    g.globalAlpha = 0.5;
    g.font = `500 46px ${FONT}`; g.fillStyle = color;
    g.fillText(sub, 52, 340);
    g.globalAlpha = 0.3;
    g.font = `400 28px ${MONO}`;
    for (let i = 0; i < 5; i++) g.fillText('/// WUXU ASSETSTUDIO ///', 52, 400 + i * 0);
  });
}

export function wallSignTexture() {
  return makeCanvas(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(8,14,12,.9)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,255,61,.28)'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#c8ff3d'; g.fillRect(40, 70, 12, 210);
    g.font = `600 130px ${MONO}`; g.fillStyle = '#e9f2ea';
    g.fillText('WUXU', 90, 220);
    g.font = `400 54px ${FONT}`; g.fillStyle = 'rgba(200,225,210,.7)';
    g.fillText('物序 · 数字化总装车间 A', 94, 310);
    g.font = `400 32px ${MONO}`; g.fillStyle = 'rgba(200,255,61,.6)';
    g.fillText('ASSETSTUDIO / TWINSTUDIO   ·   FACTORY A / WORKSHOP A   ·   LINE 01', 94, 400);
  });
}

/* ---------------- 几何工具 ---------------- */

export function rbox(w, h, d, r = 0.04, mat = M.paint) {
  const rad = Math.min(r, Math.min(w, h, d) / 2 - 0.001);
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(rad, 0.001)), mat);
}

export function box(w, h, d, mat = M.paint) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

export function cyl(rTop, rBottom, h, mat = M.steel, seg = 24) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat);
}

export function place(obj, x, y, z, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  return obj;
}

export function add(parent, obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  place(obj, x, y, z, rx, ry, rz);
  parent.add(obj);
  return obj;
}

export function shadow(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}

export function boltRing(parent, count, radius, y, mat = M.steelLight, size = 0.035) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const b = cyl(size, size, size * 1.1, mat, 6);
    add(parent, b, Math.cos(a) * radius, y, Math.sin(a) * radius);
  }
}

export function boltRow(parent, n, x0, y, z0, dx, dz, mat = M.steelLight, size = 0.03) {
  for (let i = 0; i < n; i++) {
    const b = cyl(size, size, size, mat, 6);
    add(parent, b, x0 + dx * i, y, z0 + dz * i);
  }
}

export function pipe(parent, points, radius, mat = M.steel, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
  const geo = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  return mesh;
}

export function cable(parent, points, radius = 0.025, mat = M.cable) {
  return pipe(parent, points, radius, mat, 36);
}

export function labelPlate(parent, texture, w, h, x, y, z, ry = 0, rx = 0) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  add(parent, m, x, y, z, rx, ry, 0);
  return m;
}

export function screenPanel(parent, texture, w, h, x, y, z, ry = 0, bezel = true) {
  const g = new THREE.Group();
  if (bezel) {
    const b = rbox(w + 0.08, h + 0.08, 0.06, 0.02, M.steelDark);
    g.add(b);
  }
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  );
  screen.position.z = 0.036;
  g.add(screen);
  add(parent, g, x, y, z, 0, ry, 0);
  return g;
}

export function hazardStrip(parent, len, width, x, y, z, ry = 0, repeat = 1) {
  const tex = hazardTexture(repeat);
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x9aa87a, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 0.72 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, width), mat);
  add(parent, m, x, y, z, -Math.PI / 2, 0, ry);
  return m;
}

export function floorDecal(parent, texture, w, h, x, z, opacity = 0.72, ry = 0) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  add(parent, m, x, 0.012, z, -Math.PI / 2, 0, ry);
  return m;
}

export function glowRing(parent, radius, y, color = 0xc8ff3d, opacity = 0.5) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const m = new THREE.Mesh(new THREE.RingGeometry(radius * 0.92, radius, 64), mat);
  add(parent, m, 0, y, 0, -Math.PI / 2, 0, 0);
  return m;
}

export function ledRow(parent, n, spacing, x, y, z, mat = M.accent, size = 0.035) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const b = box(size, size, 0.02, mat);
    add(g, b, (i - (n - 1) / 2) * spacing, 0, 0);
  }
  add(parent, g, x, y, z);
  return g;
}

export function servo(parent, x, y, z, ry = 0, scale = 1) {
  const g = new THREE.Group();
  const body = rbox(0.34, 0.3, 0.34, 0.04, M.steelDark);
  g.add(body);
  const cap = cyl(0.12, 0.12, 0.38, M.steel, 20);
  add(g, cap, 0, 0, 0, 0, 0, Math.PI / 2);
  const led = cyl(0.025, 0.025, 0.02, M.accent, 12);
  add(g, led, 0, 0.17, 0.1);
  boltRing(g, 8, 0.155, 0.16, M.steelLight, 0.016);
  g.scale.setScalar(scale);
  add(parent, g, x, y, z, 0, ry, 0);
  return g;
}

export function makeFlowMaterial(color = 0x5df2c4, speed = 0.45) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSpeed: { value: speed },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uSpeed;
      varying vec2 vUv;
      void main() {
        float streak = fract(vUv.x * 5.0 - uTime * uSpeed);
        float pulse = smoothstep(0.0, 0.18, streak) * smoothstep(0.42, 0.2, streak);
        float rim = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
        float a = pulse * rim * 0.5;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}

export function makeScanMaterial(color = 0x5df2c4) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uActive: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uActive;
      varying vec2 vUv;
      void main() {
        float band = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        float lines = 0.55 + 0.45 * sin(vUv.y * 42.0 - uTime * 8.0);
        float sweep = smoothstep(0.0, 0.1, abs(vUv.y - fract(uTime * 0.55)));
        float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
        float a = (band * 0.015 + sweep * 0.11 + lines * 0.03) * uActive * edge;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}

export { THREE };

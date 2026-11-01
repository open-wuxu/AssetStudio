import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildFactory } from './scene/factory.js';
import { buildRobot } from './scene/robot.js';
import { buildAGV } from './scene/agv.js';
import { createLabels } from './labels.js';
import { createUI } from './ui.js';
import * as TL from './timeline.js';
import { ASSETS, seeded } from './data.js';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');
if (capture) document.body.classList.add('capture');

const canvas = document.getElementById('scene');
const stageEl = document.getElementById('stage');
const endcardEl = document.getElementById('endcard');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
  stencil: false,
});
const baseDpr = capture ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
let dpr = baseDpr;
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05090a);
scene.fog = new THREE.Fog(0x05090a, 52, 128);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.4;

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 220);
const cam0 = TL.cameraAt(0);
camera.position.fromArray(cam0.pos);
camera.lookAt(new THREE.Vector3().fromArray(cam0.target));
camera.updateMatrixWorld(true);

/* ---------------- 场景内容 ---------------- */

const factory = buildFactory(scene);
const robot = buildRobot(scene);
const agv = buildAGV(scene);

function registerDevice(id, root, anchor, wire = true) {
  root.userData.assetId = id;
  factory.devices[id] = { id, root, anchor: anchor.clone(), wire };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.userData.assetId = id;
    factory.pickables.push(o);
    factory.occluders.push(o);
  });
}
registerDevice('arm-06', robot.root, robot.anchor, false);
registerDevice('agv-01', agv.root, agv.anchor, true);

// 阴影：只让不透明且足够大的物体投影
function applyShadows(root, exclude = null) {
  const wp = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.getWorldPosition(wp);
    if (wp.y > 7.4) { o.castShadow = false; o.receiveShadow = false; return; }
    const mat = o.material;
    const transparent = Array.isArray(mat) ? mat.some((m) => m.transparent) : mat?.transparent;
    const basic = Array.isArray(mat) ? mat.some((m) => m.isMeshBasicMaterial) : mat?.isMeshBasicMaterial;
    if (transparent) { o.castShadow = false; o.receiveShadow = false; return; }
    o.receiveShadow = true;
    if (basic) { o.castShadow = false; return; }
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    o.castShadow = (o.geometry.boundingSphere?.radius || 0) > 0.18;
  });
  if (exclude) {
    exclude.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  }
}
applyShadows(factory.root, factory.root.children[0]); // 地面只接收阴影
applyShadows(robot.root);
applyShadows(agv.root);

// 空气尘埃
const dust = (() => {
  const rnd = seeded(20261101);
  const arr = [];
  for (let i = 0; i < 230; i++) {
    arr.push((rnd() - 0.5) * 72, 0.4 + rnd() * 8.2, (rnd() - 0.5) * 46);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  const m = new THREE.PointsMaterial({
    color: 0xbfe8d2, size: 0.032, transparent: true, opacity: 0.2,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false,
  });
  const p = new THREE.Points(g, m);
  scene.add(p);
  return p;
})();

/* ---------------- 后期 ---------------- */

const rt = new THREE.WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr, {
  type: THREE.HalfFloatType,
  samples: capture ? 2 : 2,
});
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(dpr);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * dpr * 0.5, window.innerHeight * dpr * 0.5), 0.4, 0.45, 0.78);
composer.addPass(bloom);
composer.addPass(new OutputPass());
function tuneBloomResolution() {
  bloom.setSize(window.innerWidth * dpr * 0.5, window.innerHeight * dpr * 0.5);
}
tuneBloomResolution();

/* ---------------- 控制器 ---------------- */

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.fromArray(cam0.target);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.7;
controls.panSpeed = 0.6;
controls.minDistance = 2.2;
controls.maxDistance = 90;
controls.maxPolarAngle = 1.5;
controls.minPolarAngle = 0.12;
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.update();

/* ---------------- 状态与 UI ---------------- */

const state = Object.assign(TL.timelineState(0), { robotJoints: [0, 0, 0, 0, 0, 0] });
let mode = 'auto';       // auto | manual
let playing = !capture ? true : true;
let t = 0;
let manualPage = 'overview';
let manualSelected = null;
let tween = null;
let endcardShown = false;
let selFx = null;
let lastAutoUi = null;
let ui;

const PAGE_HERO = {
  overview: null,
  production: 'arm-06',
  maintenance: 'cnc-03',
  inspection: 'scan-02',
  logistics: 'agv-01',
};

const PAGE_TIME = {
  overview: 2.0,
  production: 11.2,
  maintenance: 6.0,
  inspection: 16.2,
  logistics: 21.0,
};

const DEVICE_TIME = {
  'arm-06': 11.2,
  'scan-02': 16.2,
  'agv-01': 21.0,
  'cnc-03': 6.0,
  'ap-01': 6.0,
  'cab-01': 6.0,
  'cv-01': 6.0,
};

function syncAutoUI() {
  const manual = mode === 'manual';
  const key = `${playing}|${manual}`;
  if (key === lastAutoUi) return;
  lastAutoUi = key;
  ui.setAuto(playing && !manual, manual);
}

function enterManual() {
  if (mode === 'manual') return;
  mode = 'manual';
  playing = false;
  manualPage = state.page;
  manualSelected = state.selected;
  syncAutoUI();
}

ui = createUI(state, {
  select: (id) => {
    if (id) {
      selectDevice(id, true);
    } else {
      mode = 'manual';
      playing = false;
      manualSelected = null;
      syncAutoUI();
    }
  },
  page: (p) => {
    mode = 'manual';
    playing = false;
    manualPage = p;
    manualSelected = PAGE_HERO[p] || null;
    t = PAGE_TIME[p] ?? t;
    applyState(t);
    state.page = p;
    state.selected = manualSelected;
    ui.setPage(p, state, true);
    ui.setSelected(manualSelected, state);
    updateSelection(manualSelected);
    if (p === 'overview') {
      tweenCamera([19.0, 8.2, 20.5], [1.0, 1.8, 2.0], 42, 1.15);
    } else if (manualSelected) {
      focusCameraOnDevice(manualSelected);
    }
    syncAutoUI();
  },
  toggleAuto: () => {
    if (mode === 'auto' && playing) {
      playing = false;
    } else if (mode === 'auto' && !playing) {
      playing = true;
    } else {
      mode = 'auto';
      playing = true;
      manualSelected = null;
    }
    tween = null;
    syncAutoUI();
  },
  reset: () => {
    mode = 'auto';
    playing = true;
    t = 0;
    manualPage = 'overview';
    manualSelected = null;
    tween = null;
    endcardShown = false;
    ui.setEndcard(false);
    syncAutoUI();
    applyState(0);
    applyCameraFromState(true);
    ui.setPage('overview', state, true);
    ui.setSelected(null, state);
    updateSelection(null);
  },
  seek: (time) => {
    t = Math.min(TL.DURATION - 0.02, Math.max(0, time));
    mode = 'auto';
    playing = false;
    manualSelected = null;
    tween = null;
    syncAutoUI();
  },
  focus: (id) => {
    mode = 'manual';
    playing = false;
    manualSelected = id;
    const a = ASSETS[id];
    if (a?.page) manualPage = a.page;
    focusCameraOnDevice(id);
    syncAutoUI();
  },
});

/* ---------------- 设备选择 / 线框 ---------------- */

const registerMap = new Map();

function selectDevice(id, doFocus = true) {
  mode = 'manual';
  playing = false;
  manualSelected = id;
  const a = ASSETS[id];
  if (a?.page) manualPage = a.page;
  if (DEVICE_TIME[id] != null) t = DEVICE_TIME[id];
  applyState(t);
  state.page = manualPage;
  state.selected = id;
  ui.setSelected(id, state);
  updateSelection(id);
  if (doFocus) focusCameraOnDevice(id);
  syncAutoUI();
}

function clearSelectionFx() {
  if (!selFx) return;
  if (selFx.helper) { scene.remove(selFx.helper); selFx.helper.dispose?.(); }
  if (selFx.wire) {
    scene.remove(selFx.wire);
    selFx.wire.traverse((o) => { if (o.isLineSegments) o.geometry.dispose(); });
    if (selFx.wire.children[0]?.material) selFx.wire.children[0].material.dispose();
  }
  if (selFx.robotLines && selFx.root) {
    const lines = [];
    selFx.root.traverse((o) => { if (o.userData.selFxLine) lines.push(o); });
    lines.forEach((l) => { l.removeFromParent(); l.geometry.dispose(); });
    if (selFx.lineMat) selFx.lineMat.dispose();
  }
  if (selFx.ring) { scene.remove(selFx.ring); selFx.ring.geometry.dispose(); selFx.ring.material.dispose(); }
  selFx = null;
}

function buildSelectionFx(id) {
  clearSelectionFx();
  const dev = factory.devices[id];
  if (!dev) return;

  dev.root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(dev.root);
  const helper = new THREE.Box3Helper(box, new THREE.Color(0xc8ff3d));
  helper.material.transparent = true;
  helper.material.opacity = 0.42;
  helper.material.depthWrite = false;
  helper.material.toneMapped = false;
  scene.add(helper);

  let wire = null;
  let lineMat = null;
  let robotLines = false;
  if (id === 'arm-06') {
    lineMat = new THREE.LineBasicMaterial({
      color: 0xc8ff3d, transparent: true, opacity: 0.12,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    dev.root.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (Array.isArray(m) || !m || m.transparent || m.isMeshBasicMaterial) return;
      if (!o.geometry.attributes.position) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if ((o.geometry.boundingSphere?.radius || 0) < 0.16) return;
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 24), lineMat);
      line.userData.selFxLine = true;
      line.renderOrder = 8;
      o.add(line);
    });
    robotLines = true;
  } else if (dev.wire) {
    lineMat = new THREE.LineBasicMaterial({
      color: 0xc8ff3d, transparent: true, opacity: 0.16,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    wire = new THREE.Group();
    wire.matrixAutoUpdate = false;
    const inv = new THREE.Matrix4().copy(dev.root.matrixWorld).invert();
    dev.root.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (Array.isArray(m) || !m) return;
      if (m.transparent && m.opacity < 0.4) return;
      if (m.isMeshBasicMaterial) return;
      if (!o.geometry.attributes.position) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if ((o.geometry.boundingSphere?.radius || 0) < 0.25) return;
      const count = o.geometry.attributes.position.count;
      if (count > 9000) return;
      const edges = new THREE.EdgesGeometry(o.geometry, 26);
      const clone = new THREE.LineSegments(edges, lineMat);
      clone.matrixAutoUpdate = false;
      clone.matrix.copy(o.matrixWorld).premultiply(inv);
      clone.renderOrder = 8;
      wire.add(clone);
    });
    wire.matrix.copy(dev.root.matrixWorld);
    scene.add(wire);
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) * 0.56 + 0.2;
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc8ff3d, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.035, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(center.x, 0.035, center.z);
  ring.renderOrder = 9;
  scene.add(ring);

  selFx = { id, helper, wire, ring, box, center, size, radius, lineMat, ringMat, robotLines, root: dev.root };
  registerMap.set(id, { box });
}

function updateSelection(id) {
  if (!id) { clearSelectionFx(); return; }
  const dev = factory.devices[id];
  if (!dev) { clearSelectionFx(); return; }
  if (!selFx || selFx.id !== id) buildSelectionFx(id);
  if (!selFx) return;

  const moving = id === 'agv-01' || id === 'arm-06';
  if (moving) {
    dev.root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(dev.root);
    selFx.helper.box.copy(box);
    selFx.helper.updateMatrixWorld(true);
    if (selFx.wire) {
      selFx.wire.matrix.copy(dev.root.matrixWorld);
      selFx.wire.matrixWorldNeedsUpdate = true;
    }
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const r = Math.max(s.x, s.z) * 0.56 + 0.2;
    selFx.ring.position.set(c.x, 0.035, c.z);
    selFx.ring.scale.setScalar(r / Math.max(0.001, selFx.radius));
    selFx.center.copy(c);
  }

  const pulse = 0.5 + 0.5 * Math.sin(state.t * 3.2);
  if (selFx.helper) selFx.helper.material.opacity = 0.18 + pulse * 0.14;
  if (selFx.lineMat) selFx.lineMat.opacity = 0.1 + pulse * 0.1;
  if (selFx.ringMat) selFx.ringMat.opacity = 0.1 + pulse * 0.12;
}

/* ---------------- 相机 ---------------- */

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

function applyCameraFromState(force = false) {
  const c = state.camera;
  if (!c) return;
  camera.position.fromArray(c.pos);
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
  tmpTarget.fromArray(c.target);
  camera.lookAt(tmpTarget);
  controls.target.copy(tmpTarget);
  camera.updateMatrixWorld(true);
}

function tweenCamera(pos, target, fov = 40, dur = 1.1) {
  tween = {
    start: performance.now(),
    dur: dur * 1000,
    fromPos: camera.position.clone(),
    toPos: new THREE.Vector3().fromArray(pos),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3().fromArray(target),
    fromFov: camera.fov,
    toFov: fov,
  };
  controls.enabled = true;
  mode = 'manual';
  playing = false;
  syncAutoUI();
}

const CAMERA_PRESETS = {
  'arm-06': { p: [8.2, 3.0, 8.6], t: [0.2, 1.7, 1.8], fov: 40 },
  'scan-02': { p: [15.5, 2.45, 5.6], t: [9.2, 1.6, 2.2], fov: 36 },
  'cnc-03': { p: [-4.0, 3.0, 9.0], t: [-12.0, 2.0, -7.5], fov: 32 },
  'ap-01': { p: [-20.0, 3.3, 3.5], t: [-27.2, 1.5, -2.4], fov: 38 },
  'cab-01': { p: [20.0, 3.0, 3.6], t: [27.2, 1.3, -0.4], fov: 38 },
  'cv-01': { p: [8.0, 4.0, 13.0], t: [-14.0, 1.5, 2.2], fov: 38 },
};

function focusCameraOnDevice(id) {
  const dev = factory.devices[id];
  if (!dev) return;
  const a = ASSETS[id];
  let target;
  let pos;
  if (CAMERA_PRESETS[id]) {
    const preset = CAMERA_PRESETS[id];
    tweenCamera(preset.p, preset.t, preset.fov, 1.05);
    return;
  }
  if (id === 'agv-01') {
    target = new THREE.Vector3(state.agv.x, 1.15, 7.4);
    pos = new THREE.Vector3(state.agv.x + 5.6, 2.75, 12.4);
  } else {
    dev.root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(dev.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    target = new THREE.Vector3(center.x, Math.max(1.3, center.y * 0.9), center.z);
    let dir = new THREE.Vector3(0.62, 0.45, 1);
    if (center.x > 20) dir = new THREE.Vector3(-1, 0.5, 0.7);
    if (id === 'cnc-03') dir = new THREE.Vector3(0.45, 0.52, 1);
    if (id === 'ap-01') dir = new THREE.Vector3(1, 0.5, 0.8);
    const dist = Math.max(size.x, size.y, size.z) * 1.55 + 2.9;
    pos = target.clone().add(dir.normalize().multiplyScalar(dist));
  }
  tweenCamera([pos.x, pos.y, pos.z], [target.x, target.y, target.z], 40, 1.05);
}

function updateTween(now) {
  if (!tween) return false;
  const u = Math.min(1, (now - tween.start) / tween.dur);
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
  camera.fov = tween.fromFov + (tween.toFov - tween.fromFov) * e;
  camera.updateProjectionMatrix();
  camera.lookAt(controls.target);
  camera.updateMatrixWorld(true);
  if (u >= 1) tween = null;
  return true;
}

/* ---------------- 状态应用 ---------------- */

function applyState(time) {
  const s = TL.timelineState(time);
  for (const k of Object.keys(s)) state[k] = s[k];
  if (mode === 'manual') {
    state.page = manualPage;
    state.selected = manualSelected;
  }
  factory.update(time, state);
  robot.update(state.robot, time);
  state.robotJoints = robot.state.joints;
  agv.update(state.agv, time);
  const agvDev = factory.devices['agv-01'];
  if (agvDev) agvDev.anchor.set(state.agv.x, 1.95, 7.4);
  dust.rotation.y = time * 0.008;
}

/* ---------------- 标签 / UI ---------------- */

const labels = createLabels({
  layer: document.getElementById('labels'),
  stage: stageEl,
  camera,
  devices: factory.devices,
  occluders: factory.occluders,
});

/* ---------------- 录制 / 主循环 ---------------- */

function updateEndcard(time, force = false) {
  if (capture) {
    const o = TL.smooth((time - 27.65) / 1.3);
    endcardEl.style.opacity = o.toFixed(3);
    endcardEl.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    document.body.classList.toggle('outro', time >= 27.95);
    return;
  }
  const show = mode === 'auto' && time >= 27.65;
  if (show !== endcardShown || force) {
    endcardShown = show;
    ui.setEndcard(show);
  }
}

function updateFrame(time) {
  applyState(time);
  scene.updateMatrixWorld(true);
  updateSelection(state.selected);
  if (mode === 'auto') {
    applyCameraFromState();
  } else if (!updateTween(performance.now())) {
    controls.update();
  }
  camera.updateMatrixWorld(true);
  labels.update(state, capture);
  ui.update(state, capture);
  updateEndcard(time, capture);
  syncAutoUI();
}

let fpsFrames = 0;
let fpsTime = 0;
function updateFps(dt) {
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    renderer.__fps = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
  }
}

function render() {
  composer.render();
  ui.updatePerf(renderer);
}

async function renderAt(time) {
  const tt = Math.min(TL.DURATION - 0.001, Math.max(0, time));
  mode = 'auto';
  playing = true;
  t = tt;
  updateFrame(tt);
  renderer.__fps = 60;
  render();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

window.__renderAt = renderAt;
window.__capture = capture;
window.__info = { fps: TL.FPS, duration: TL.DURATION, width: window.innerWidth, height: window.innerHeight };

/* ---------------- 交互事件 ---------------- */

let down = null;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickAt(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(factory.pickables, false);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.assetId) o = o.parent;
    if (o?.userData.assetId) return o.userData.assetId;
  }
  return null;
}

if (!capture) {
  renderer.domElement.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, time: performance.now() };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const dt = performance.now() - down.time;
    down = null;
    if (moved > 7 || dt > 700) return;
    const id = pickAt(e.clientX, e.clientY);
    if (id) {
      selectDevice(id, true);
    } else {
      mode = 'manual';
      playing = false;
      manualSelected = null;
      syncAutoUI();
    }
  });
  let lastHover = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastHover < 90) return;
    lastHover = now;
    const id = pickAt(e.clientX, e.clientY);
    renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
  });
  controls.addEventListener('start', () => {
    tween = null;
    enterManual();
    renderer.domElement.style.cursor = 'grabbing';
  });
  controls.addEventListener('end', () => {
    renderer.domElement.style.cursor = 'grab';
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); ui && document.getElementById('btn-auto').click(); }
    if (e.key === 'r' || e.key === 'R') document.getElementById('btn-reset').click();
    if (e.key === 'Escape') { mode = 'manual'; playing = false; manualSelected = null; syncAutoUI(); }
  });
}

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  tuneBloomResolution();
  labels.update(state, true);
});

/* ---------------- 启动 ---------------- */

ui.setLoader(0.25);
applyState(0);
ui.update(state, true);
labels.update(state, true);
ui.setLoader(0.7);

if (capture) {
  ui.setLoader(1);
  ui.hideLoader();
  syncAutoUI();
  await renderAt(0);
  window.__ready = true;
} else {
  const timer = new THREE.Timer();
  timer.connect(document);
  renderer.setAnimationLoop(() => {
    timer.update();
    const dt = Math.min(0.05, timer.getDelta());
    if (mode === 'auto' && playing) {
      t += dt;
      if (t >= TL.DURATION) t -= TL.DURATION;
    }
    updateFrame(t);
    render();
    updateFps(dt);
  });
  setTimeout(() => { ui.setLoader(1); ui.hideLoader(); }, 450);
  window.__ready = true;
}

// 调试入口
window.__app = { state, scene, camera, renderer, composer, controls, factory, robot, agv, labels, ui, setTime: (v) => { t = v; } };

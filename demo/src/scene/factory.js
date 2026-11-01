import * as THREE from 'three';
import {
  M, rbox, box, cyl, add, place, shadow, boltRing, pipe, cable,
  screenTexture, nameplateTexture, wallSignTexture, floorTextTexture,
  labelPlate, screenPanel, hazardStrip, floorDecal, glowRing, ledRow,
  makeFlowMaterial, makeScanMaterial, servo, THREE as T,
} from './utils.js';
import { seeded } from '../data.js';

export function buildFactory(scene) {
  const root = new THREE.Group();
  root.name = 'factory';
  scene.add(root);

  const devices = {};
  const pickables = [];
  const occluders = [];
  const animated = {
    rollers: [],
    flowMats: [],
    scanMat: null,
    laser: null,
    pointCloud: null,
    compressorFan: null,
  };

  function registerDevice(id, group, anchor, opts = {}) {
    group.userData.assetId = id;
    devices[id] = {
      id,
      root: group,
      anchor: new THREE.Vector3(anchor[0], anchor[1], anchor[2]),
      wire: opts.wire !== false,
      box: null,
    };
    group.traverse((o) => {
      if (o.isMesh) {
        o.userData.assetId = id;
        pickables.push(o);
        occluders.push(o);
      }
    });
    if (opts.extraMeshes) {
      opts.extraMeshes.forEach((m) => {
        if (m.isMesh) { m.userData.assetId = id; pickables.push(m); occluders.push(m); }
      });
    }
  }

  /* ============================================================
     地面 / 厂房
     ============================================================ */

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 110), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const gridFine = new THREE.GridHelper(120, 80, 0x1c2b25, 0x101a16);
  gridFine.position.y = 0.006;
  gridFine.material.transparent = true;
  gridFine.material.opacity = 0.32;
  root.add(gridFine);

  const gridMajor = new THREE.GridHelper(120, 12, 0x2b4036, 0x203129);
  gridMajor.position.y = 0.007;
  gridMajor.material.transparent = true;
  gridMajor.material.opacity = 0.42;
  root.add(gridMajor);

  // 墙
  const backWall = rbox(68, 9.5, 0.8, 0.05, M.paint);
  add(root, backWall, 0, 4.75, -16.6);
  const leftWall = rbox(0.8, 9.5, 36, 0.05, M.paint);
  add(root, leftWall, -33.2, 4.75, 0.5);
  // 墙面分缝
  for (let i = -31; i <= 31; i += 4.4) {
    add(root, box(0.05, 9.2, 0.06, M.steelDark), i, 4.7, -16.15);
  }
  for (let z = -15; z <= 16; z += 4.6) {
    add(root, box(0.06, 9.2, 0.05, M.steelDark), -32.75, 4.7, z);
  }
  // 墙面腰线
  add(root, box(66, 0.1, 0.08, M.accentDark), 0, 3.3, -16.14);
  add(root, box(0.08, 0.1, 34, M.accentDark), -32.74, 3.3, 0.5);
  // 墙面线性洗墙灯
  add(root, box(60, 0.045, 0.045, M.coolWhiteDim), 0, 2.92, -16.1);
  add(root, box(0.045, 0.045, 31, M.coolWhiteDim), -32.7, 2.92, 0.5);
  for (let x = -28; x <= 28; x += 8) {
    add(root, box(1.4, 0.03, 0.03, M.coolWhiteDim), x, 2.55, -16.12);
  }
  // 墙面高窗
  for (let i = -3; i <= 3; i++) {
    const win = box(5.0, 1.5, 0.08, M.glassDark);
    add(root, win, i * 7.5, 6.9, -16.18);
    add(root, box(5.1, 0.06, 0.12, M.steelDark), i * 7.5, 6.1, -16.12);
    add(root, box(0.06, 1.5, 0.12, M.steelDark), i * 7.5, 6.9, -16.12);
  }

  // 大字墙标
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 3),
    new THREE.MeshBasicMaterial({ map: wallSignTexture(), transparent: true, toneMapped: false, opacity: 0.62, color: 0xa9bdae })
  );
  add(root, sign, -14, 5.15, -16.16);

  // 结构柱
  for (let z = -14; z <= 14; z += 7) {
    const col = new THREE.Group();
    add(col, rbox(0.55, 9.6, 0.55, 0.04, M.steelDark), 0, 4.8, 0);
    add(col, rbox(0.9, 0.18, 0.9, 0.02, M.steel), 0, 0.09, 0);
    add(col, box(0.06, 8.8, 0.06, M.accentDark), 0.29, 4.6, 0);
    add(col, box(0.56, 0.2, 0.56, M.steel), 0, 1.35, 0);
    add(root, col, -31.6, 0, z);
    add(root, col, 31.6, 0, z);
  }

  // 顶部桁架
  for (let x = -28; x <= 28; x += 7) {
    if (x > -19 && x < 19) continue;
    const truss = new THREE.Group();
    add(truss, box(0.1, 0.18, 38, M.steelDark), 0, 0, 0);
    add(truss, box(0.06, 0.06, 38, M.steel), 0, 0.28, 0);
    for (let z = -17; z <= 17; z += 3.4) {
      add(truss, box(0.045, 0.4, 0.045, M.steelDark), 0, 0.08, z, 0, 0, 0.38);
    }
    add(root, truss, x, 9.0, 0);
  }
  // 纵向主管
  add(root, box(62, 0.1, 0.1, M.steelDark), 0, 8.9, -12);
  add(root, box(62, 0.1, 0.1, M.steelDark), 0, 8.9, 12);

  // 吊灯
  for (let x = -24; x <= 24; x += 8) {
    for (const z of [-6]) {
      const g = new THREE.Group();
      add(g, box(0.04, 0.55, 0.04, M.steelDark), 0, 0.28, 0);
      add(g, rbox(2.0, 0.09, 0.32, 0.02, M.steelDark), 0, 0, 0);
      add(g, box(1.86, 0.03, 0.2, M.coolWhite), 0, -0.06, 0);
      add(root, g, x, 7.1, z);
    }
  }

  /* ============================================================
     地面分区 / 标识
     ============================================================ */

  // AGV 通道双虚线
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x3c4a20, emissive: 0xc8ff3d, emissiveIntensity: 0.35, roughness: 0.6 });
  for (let x = -28; x <= 28; x += 2.4) {
    for (const z of [6.15, 8.65]) {
      add(root, box(1.3, 0.015, 0.075, dashMat), x, 0.02, z);
    }
  }
  // 通道箭头
  for (let x = -24; x <= 24; x += 8) {
    for (let i = 0; i < 3; i++) {
      add(root, box(0.09, 0.016, 0.55, dashMat), x + i * 0.22, 0.021, 7.4 - i * 0.24, 0, Math.PI / 4, 0);
    }
  }
  // 机器人安全区
  const cellFloor = box(12.4, 0.02, 8.4, M.floorPlate);
  add(root, cellFloor, 0, 0.012, 1.15);
  hazardStrip(root, 12.4, 0.22, 0, 0.026, 5.35, 0, 8);
  hazardStrip(root, 12.4, 0.22, 0, 0.026, -3.05, 0, 8);
  hazardStrip(root, 8.4, 0.22, -6.2, 0.026, 1.15, Math.PI / 2, 6);
  hazardStrip(root, 8.4, 0.22, 6.2, 0.026, 1.15, Math.PI / 2, 6);
  // 机器人基座光环
  glowRing(root, 1.35, 0.03, 0xc8ff3d, 0.12);

  floorDecal(root, floorTextTexture('A-01', '总装产线 / ASSEMBLY', '#c8ff3d'), 5.2, 2.6, -15.5, 9.4, 0.32, -0.18);
  floorDecal(root, floorTextTexture('AGV', '物流通道 / LOGISTICS', '#c8ff3d'), 4.4, 2.2, 21.5, 7.4, 0.26, Math.PI / 2);
  floorDecal(root, floorTextTexture('B', '工位 / STATION', '#5df2c4'), 2.2, 1.1, 8, 9.7, 0.34, Math.PI);
  floorDecal(root, floorTextTexture('A', '上料位 / DOCK', '#ffb454'), 2.2, 1.1, 16, 9.7, 0.3, Math.PI);

  // 人行通道线
  for (const z of [10.4, 12.2]) {
    add(root, box(58, 0.012, 0.05, M.steelDark), 0, 0.02, z);
  }
  for (let x = -28; x <= 28; x += 3.2) {
    add(root, box(0.05, 0.012, 1.8, M.steelDark), x, 0.021, 11.3);
  }

  /* ============================================================
     输送线
     ============================================================ */

  function buildConveyor(x0, x1, z, width, height, label) {
    const g = new THREE.Group();
    const len = x1 - x0;
    const cx = (x0 + x1) / 2;
    // 侧梁
    for (const s of [-1, 1]) {
      add(g, rbox(len, 0.18, 0.1, 0.02, M.steelDark), cx, height - 0.08, z + s * width / 2);
      add(g, box(len, 0.018, 0.018, M.accentRail), cx, height - 0.02, z + s * (width / 2 + 0.058));
    }
    // 支腿
    for (let x = x0 + 1.2; x <= x1 - 1; x += 4.2) {
      for (const s of [-1, 1]) {
        add(g, box(0.1, height - 0.15, 0.1, M.steel), x, (height - 0.15) / 2, z + s * (width / 2 - 0.05));
        add(g, box(0.5, 0.04, 0.32, M.steelDark), x, 0.02, z + s * (width / 2 - 0.05));
      }
      add(g, box(0.06, 0.06, width - 0.2, M.steelDark), x, 0.42, z);
      add(g, box(0.05, height * 0.55, 0.05, M.steelDark), x, height * 0.5, z, 0.5, 0, 0);
    }
    // 滚筒（实例化）
    const count = Math.max(2, Math.floor(len / 0.17));
    const rollerGeo = new THREE.CylinderGeometry(0.062, 0.062, width - 0.14, 12);
    const rollers = new THREE.InstancedMesh(rollerGeo, M.roller, count);
    rollers.castShadow = true;
    rollers.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const baseQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const spinQ = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const x = x0 + 0.12 + (i / (count - 1)) * (len - 0.24);
      dummy.position.set(x, height - 0.045, z);
      dummy.quaternion.copy(baseQ);
      dummy.updateMatrix();
      rollers.setMatrixAt(i, dummy.matrix);
    }
    g.add(rollers);
    animated.rollers.push({ mesh: rollers, count, baseQ, spinQ, dummy, x0, len, height, z, speed: label === 'in' ? 2.2 : 2.6 });

    // 导向护栏
    for (const s of [-1, 1]) {
      add(g, box(len, 0.05, 0.04, M.steel), cx, height + 0.24, z + s * (width / 2 - 0.05));
      for (let x = x0 + 1.5; x <= x1 - 1; x += 3.2) {
        add(g, box(0.04, 0.3, 0.04, M.steel), x, height + 0.12, z + s * (width / 2 - 0.05));
      }
    }

    // 驱动电机
    const motor = new THREE.Group();
    add(motor, cyl(0.22, 0.22, 0.5, M.steelDark, 20), 0, 0, 0, 0, 0, Math.PI / 2);
    add(motor, rbox(0.34, 0.34, 0.34, 0.03, M.paint), 0, 0.3, 0);
    add(motor, cyl(0.05, 0.05, 0.62, M.steelLight, 10), 0, 0.3, 0);
    add(g, motor, x1 + 0.15, height - 0.45, z);
    // 端头护罩
    add(g, rbox(0.18, height - 0.1, width, 0.02, M.steelDark), x1 + 0.42, height / 2 - 0.05, z);

    // 传感器立柱
    for (const x of [x0 + 3.2, cx - len * 0.18]) {
      const post = new THREE.Group();
      add(post, box(0.05, height + 0.55, 0.05, M.steel), 0, (height + 0.55) / 2, 0);
      add(post, rbox(0.12, 0.1, 0.08, 0.01, M.steelDark), 0, height + 0.52, 0.1);
      add(post, cyl(0.022, 0.022, 0.02, M.cyan, 10), 0, height + 0.52, 0.16, Math.PI / 2, 0, 0);
      add(g, post, x, 0, z - width / 2 - 0.16);
    }

    // 铭牌
    labelPlate(g, nameplateTexture(label === 'in' ? 'CV-01' : 'CV-02', label === 'in' ? 'INFEED CONVEYOR' : 'OUTFEED CONVEYOR'), 0.8, 0.2, cx + 2.2, height - 0.25, z + width / 2 + 0.07);

    // 底部安全条纹
    hazardStrip(g, 2.4, 0.16, cx - len * 0.3, 0.02, z, 0, 2);

    root.add(g);
    return g;
  }

  const infeedGroup = buildConveyor(-30, -1.6, 2.2, 1.5, 0.95, 'in');
  const outfeedGroup = buildConveyor(1.6, 30, 2.2, 1.5, 0.95, 'out');
  registerDevice('cv-01', infeedGroup, [-14, 1.62, 2.2]);

  // 工件缓存
  function makeHousing(scale = 1, variant = 0) {
    const g = new THREE.Group();
    const body = rbox(0.38, 0.36, 0.54, 0.03, variant ? M.paintLight : M.steelLight);
    g.add(body);
    add(g, rbox(0.3, 0.03, 0.44, 0.01, M.steelDark), 0, 0.19, 0);
    const bore = cyl(0.09, 0.09, 0.035, M.steelDark, 20);
    add(g, bore, 0, 0.205, -0.08);
    const bore2 = cyl(0.055, 0.055, 0.04, M.steelDark, 18);
    add(g, bore2, 0, 0.207, 0.13);
    add(g, box(0.16, 0.015, 0.03, M.accentMatte), 0, 0.195, 0.22);
    for (let i = 0; i < 4; i++) {
      const b = cyl(0.018, 0.018, 0.02, M.steelLight, 6);
      add(g, b, (i % 2 ? 1 : -1) * 0.14, 0.2, (i < 2 ? -1 : 1) * 0.22);
    }
    const led = box(0.03, 0.02, 0.03, variant ? M.cyan : M.accent);
    add(g, led, 0.18, 0.05, 0.24);
    g.scale.setScalar(scale);
    return g;
  }

  const queue = [];
  const queueXs = [-4.55, -6.8, -9.15, -11.6];
  queueXs.forEach((x, i) => {
    const p = makeHousing(1, i % 2);
    p.position.set(x, 1.14, 2.2);
    p.rotation.y = (i % 2 ? 1 : -1) * 0.04;
    root.add(p);
    queue.push(p);
  });

  const heroPart = makeHousing(1, 0);
  heroPart.position.set(-2.8, 1.14, 2.4);
  root.add(heroPart);

  // 停机挡块
  add(root, cyl(0.11, 0.11, 0.3, M.amber, 16), -3.75, 1.02, 2.86, 0, 0, Math.PI / 2);

  /* ============================================================
     机器人安全围栏
     ============================================================ */

  function fenceRun(x0, z0, x1, z1) {
    const g = new THREE.Group();
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const ang = Math.atan2(dx, dz);
    const n = Math.max(1, Math.ceil(len / 1.55));
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const post = new THREE.Group();
      add(post, box(0.055, 2.15, 0.055, M.steel), 0, 1.075, 0);
      add(post, box(0.12, 0.08, 0.12, M.accentMatte), 0, 0.04, 0);
      add(post, box(0.07, 0.05, 0.07, M.steel), 0, 2.15, 0);
      add(g, post, x0 + dx * u, 0, z0 + dz * u);
    }
    // 横杆
    add(g, box(0.05, 0.05, len, M.steel), x0 + dx / 2, 2.06, z0 + dz / 2, 0, ang, 0);
    add(g, box(0.05, 0.05, len, M.steel), x0 + dx / 2, 0.32, z0 + dz / 2, 0, ang, 0);
    // 半透明防护板
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.62), M.glass);
    panel.position.set(x0 + dx / 2, 1.2, z0 + dz / 2);
    panel.rotation.y = ang + Math.PI / 2;
    panel.renderOrder = 2;
    g.add(panel);
    // 顶部黄绿警示条
    add(g, box(0.022, 0.022, len, M.accentRail), x0 + dx / 2, 2.12, z0 + dz / 2, 0, ang, 0);
    root.add(g);
    return g;
  }

  fenceRun(-6.1, 5.35, -3.4, 5.35);
  fenceRun(3.4, 5.35, 6.1, 5.35);
  fenceRun(-6.1, -3.05, 6.1, -3.05);
  fenceRun(-6.1, -3.05, -6.1, 1.25);
  fenceRun(-6.1, 3.15, -6.1, 5.35);
  fenceRun(6.1, -3.05, 6.1, 1.25);
  fenceRun(6.1, 3.15, 6.1, 5.35);

  // 安全门立柱与光幕
  for (const x of [-3.4, 3.4]) {
    add(root, box(0.06, 2.2, 0.06, M.steel), x, 1.1, 5.35);
    add(root, cyl(0.026, 0.026, 1.7, M.red, 10), x, 1.05, 5.35);
  }

  // 机器人控制柜
  const rc = new THREE.Group();
  add(rc, rbox(1.15, 1.85, 0.62, 0.03, M.steelDark), 0, 0.925, 0);
  add(rc, box(1.02, 0.03, 0.03, M.accentMatte), 0, 1.62, 0.32);
  screenPanel(rc, screenTexture('robot'), 0.46, 0.32, -0.2, 1.25, 0.33, 0);
  add(rc, box(0.08, 0.08, 0.03, M.red), 0.32, 1.42, 0.33);
  add(rc, box(0.08, 0.08, 0.03, M.accent), 0.32, 1.3, 0.33);
  add(rc, rbox(0.9, 0.06, 0.5, 0.01, M.steelDark), 0, 1.88, 0);
  add(rc, cable(rc, [[0.5, 1.8, 0.2], [0.9, 1.2, 0.6], [1.4, 0.2, 0.9], [1.9, 0.08, 0.9]], 0.03, M.cable));
  add(root, rc, -5.0, 0, -2.25);
  add(root, box(0.9, 0.02, 0.9, M.steelDark), -5.0, 0.01, -2.25);

  /* ============================================================
     数控加工中心 ×4
     ============================================================ */

  function buildCNC(x, z, code) {
    const g = new THREE.Group();
    add(g, rbox(4.3, 0.32, 3.1, 0.03, M.steelDark), 0, 0.16, 0);
    add(g, rbox(4.1, 2.55, 2.9, 0.06, M.paintLight), 0, 1.55, 0);
    add(g, rbox(4.16, 0.16, 2.96, 0.04, M.steelDark), 0, 2.9, 0);
    // 前面板色带
    add(g, box(3.9, 0.08, 0.04, M.accentMatte), 0, 2.55, 1.46);
    add(g, box(3.9, 0.04, 0.05, M.steelDark), 0, 0.42, 1.46);
    // 观察窗 + 内部
    add(g, rbox(2.1, 1.5, 0.06, 0.02, M.steelDark), -0.55, 1.78, 1.45);
    add(g, box(1.96, 1.36, 0.02, M.glassDark), -0.55, 1.78, 1.485);
    add(g, box(1.9, 1.3, 0.01, new THREE.MeshStandardMaterial({ color: 0x11201a, emissive: 0xffb454, emissiveIntensity: 0.32, roughness: 0.8 })), -0.55, 1.78, 1.44);
    // 内部主轴剪影
    add(g, cyl(0.16, 0.2, 0.6, M.steel, 18), -0.55, 1.95, 1.36, Math.PI / 2, 0, 0);
    add(g, box(0.9, 0.35, 0.4, M.steelDark), -0.55, 1.3, 1.25);
    // 窗框十字
    add(g, box(0.04, 1.38, 0.03, M.steelDark), -0.55, 1.78, 1.5);
    add(g, box(1.98, 0.035, 0.03, M.steelDark), -0.55, 1.78, 1.5);
    // 门把手
    add(g, box(0.07, 0.35, 0.07, M.steelLight), 0.55, 1.75, 1.54);
    // 控制面板
    const panel = new THREE.Group();
    add(panel, rbox(0.9, 0.7, 0.08, 0.02, M.steelDark), 0, 0, 0);
    screenPanel(panel, screenTexture('cnc'), 0.72, 0.42, 0, 0.11, 0.05, 0);
    add(panel, cyl(0.045, 0.045, 0.03, M.red, 14), 0.33, -0.19, 0.05, Math.PI / 2, 0, 0);
    add(panel, cyl(0.045, 0.045, 0.03, M.accent, 14), 0.18, -0.19, 0.05, Math.PI / 2, 0, 0);
    add(g, panel, 1.34, 1.95, 1.47, -0.12, 0, 0);
    // 操作按钮杆
    add(g, box(0.06, 0.34, 0.06, M.steel), 1.34, 1.45, 1.47);
    add(g, cyl(0.11, 0.11, 0.06, M.red, 18), 1.34, 1.5, 1.5, Math.PI / 2, 0, 0);
    // 顶部状态灯
    const tower = new THREE.Group();
    add(tower, cyl(0.045, 0.045, 0.16, M.accent, 12), 0, 0.08, 0);
    add(tower, cyl(0.045, 0.045, 0.16, M.amber, 12), 0, 0.24, 0);
    add(tower, cyl(0.045, 0.045, 0.16, M.red, 12), 0, 0.4, 0);
    add(tower, box(0.03, 0.25, 0.03, M.steelDark), 0, -0.12, 0);
    add(g, tower, 1.6, 3.0, 0.8);
    // 侧面散热格栅
    const ventTex = makeVentTexture();
    const ventMat = new THREE.MeshBasicMaterial({ map: ventTex, transparent: true, toneMapped: false, opacity: 0.85 });
    const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), ventMat);
    add(g, vent, 2.056, 1.6, -0.35, 0, Math.PI / 2, 0);
    // 底部排屑器
    add(g, rbox(2.2, 0.3, 0.4, 0.02, M.steelDark), -0.4, 0.35, 1.55);
    add(g, box(0.4, 0.22, 0.4, M.steel), 1.05, 0.35, 1.55);
    // 脚杯
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(g, cyl(0.09, 0.09, 0.1, M.steelLight, 10), sx * 1.75, 0.05, sz * 1.25);
    }
    // 铭牌
    labelPlate(g, nameplateTexture(code, 'MACHINING CENTER'), 0.85, 0.21, -1.05, 0.65, 1.47);
    // 背部管线
    cable(g, [[-1.7, 2.8, -1.4], [-1.9, 2.4, -1.7], [-1.9, 1.2, -1.7], [-1.5, 0.2, -1.5]], 0.035);
    add(g, box(0.08, 0.6, 0.08, M.steel), -1.75, 2.6, -1.4);
    add(root, g, x, 0, z);
    // 地面边框
    add(root, box(4.6, 0.015, 3.4, M.steelDark), x, 0.012, z);
    return g;
  }

  function makeVentTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 160;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 160);
    g.fillStyle = 'rgba(8,14,12,.9)'; g.fillRect(0, 0, 256, 160);
    g.strokeStyle = 'rgba(150,180,165,.35)'; g.lineWidth = 3;
    for (let y = 12; y < 150; y += 12) { g.beginPath(); g.moveTo(10, y); g.lineTo(246, y); g.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const cncList = [
    [-20, -8.6, 'CNC-01'],
    [-12, -8.6, 'CNC-03'],
    [12, -8.6, 'CNC-04'],
    [20, -8.6, 'CNC-05'],
  ];
  const cncGroups = cncList.map(([x, z, code]) => buildCNC(x, z, code));
  registerDevice('cnc-03', cncGroups[1], [-12, 4.05, -8.6]);

  /* ============================================================
     在线检测站
     ============================================================ */

  const scanGroup = new THREE.Group();
  {
    const X = 9.2, Z = 2.2;
    for (const s of [-1, 1]) {
      add(scanGroup, rbox(0.26, 2.85, 0.34, 0.03, M.paint), X, 1.43, Z + s * 1.08);
      add(scanGroup, box(0.28, 0.05, 0.38, M.accentMatte), X, 2.87, Z + s * 1.08);
      add(scanGroup, box(0.18, 0.6, 0.2, M.steelDark), X, 0.3, Z + s * 1.08);
    }
    add(scanGroup, rbox(0.38, 0.3, 2.4, 0.03, M.paint), X, 2.9, Z);
    add(scanGroup, box(0.18, 0.05, 1.65, M.steelDark), X, 2.72, Z);
    // 传感器阵列
    const scanLedMat = new THREE.MeshStandardMaterial({ color: 0x0a201a, emissive: 0x5df2c4, emissiveIntensity: 0.5, roughness: 0.4 });
    for (let i = 0; i < 9; i++) {
      const s = i / 8 - 0.5;
      add(scanGroup, cyl(0.021, 0.021, 0.045, scanLedMat, 12), X, 2.655, Z + s * 1.5, Math.PI / 2, 0, 0);
      add(scanGroup, cyl(0.04, 0.04, 0.025, M.steelDark, 12), X, 2.68, Z + s * 1.5, Math.PI / 2, 0, 0);
    }
    // 顶部状态塔
    add(scanGroup, box(0.04, 0.3, 0.04, M.steelDark), X, 3.2, Z);
    add(scanGroup, cyl(0.04, 0.04, 0.16, new THREE.MeshStandardMaterial({ color: 0x0a201a, emissive: 0x5df2c4, emissiveIntensity: 0.35, roughness: 0.4 }), 12), X, 3.4, Z);
    add(scanGroup, cyl(0.04, 0.04, 0.16, new THREE.MeshStandardMaterial({ color: 0x1a200c, emissive: 0xc8ff3d, emissiveIntensity: 0.35, roughness: 0.4 }), 12), X, 3.58, Z);
    // 控制柜
    add(scanGroup, rbox(0.9, 1.5, 0.55, 0.03, M.steelDark), X, 0.75, Z - 1.62);
    add(scanGroup, box(1.0, 0.05, 0.65, M.steel), X, 1.53, Z - 1.62);
    screenPanel(scanGroup, screenTexture('scan'), 0.58, 0.4, X, 1.18, Z - 1.345, 0);
    ledRow(scanGroup, 3, 0.08, X, 0.72, Z - 1.345);
    // 激光扫描面
    const scanMat = makeScanMaterial(0x5df2c4);
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), scanMat);
    scanPlane.position.set(X - 0.03, 1.72, Z);
    scanPlane.rotation.y = Math.PI / 2;
    scanPlane.renderOrder = 4;
    scanGroup.add(scanPlane);
    animated.scanMat = scanMat;
    // 扫描亮线
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xc8fff6, transparent: true, opacity: 1.0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });
    const laser = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.6), laserMat);
    laser.position.set(X - 0.04, 1.05, Z);
    scanGroup.add(laser);
    animated.laser = laser;
    // 点云
    const rnd = seeded(77);
    const pts = [];
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = 0.12 + rnd() * 0.45;
      pts.push(X + (rnd() - 0.5) * 0.25, 1.15 + rnd() * 0.6, Z + Math.cos(a) * rr);
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const pmat = new THREE.PointsMaterial({ color: 0x8ffff0, size: 0.012, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const cloud = new THREE.Points(pgeo, pmat);
    scanGroup.add(cloud);
    animated.pointCloud = cloud;
    // 地面标识
    hazardStrip(scanGroup, 2.8, 0.18, X, 0.02, Z - 1.55, 0, 2);
    hazardStrip(scanGroup, 2.8, 0.18, X, 0.02, Z + 1.55, 0, 2);
    labelPlate(scanGroup, nameplateTexture('SCAN-02', 'INLINE METROLOGY'), 0.9, 0.22, X, 2.0, Z - 1.338);
    root.add(scanGroup);
  }
  registerDevice('scan-02', scanGroup, [9.2, 3.02, 2.2]);

  /* ============================================================
     空压机站
     ============================================================ */

  const airGroup = new THREE.Group();
  {
    const X = -27.2, Z = -3.2;
    add(airGroup, rbox(3.6, 1.6, 2.6, 0.05, M.paintWarm), X, 0.8, Z);
    add(airGroup, rbox(3.7, 0.12, 2.7, 0.02, M.steelDark), X, 1.64, Z);
    // 储气罐
    const tank = cyl(0.62, 0.62, 2.2, M.paintLight, 28);
    add(airGroup, tank, X - 0.4, 1.15, Z + 1.9, 0, 0, Math.PI / 2);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.paintLight);
      add(airGroup, cap, X - 0.4 + s * 1.1, 1.15, Z + 1.9, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
    add(airGroup, box(0.5, 0.35, 1.0, M.steelDark), X - 1.2, 0.18, Z + 1.9);
    add(airGroup, box(0.5, 0.35, 1.0, M.steelDark), X + 0.4, 0.18, Z + 1.9);
    // 机组细节
    add(airGroup, rbox(1.5, 1.05, 1.2, 0.04, M.steelDark), X + 1.2, 1.1, Z + 0.2);
    add(airGroup, cyl(0.3, 0.3, 0.9, M.steel, 24), X + 0.55, 1.15, Z + 0.2, 0, 0, Math.PI / 2);
    const fan = new THREE.Group();
    add(fan, cyl(0.34, 0.34, 0.05, M.steelDark, 24), 0, 0, 0, 0, 0, Math.PI / 2);
    for (let i = 0; i < 6; i++) {
      add(fan, box(0.02, 0.28, 0.1, M.steelLight), 0.03, 0.16, 0, Math.PI / 6 * i, 0, 0);
    }
    fan.rotation.z = 0;
    add(airGroup, fan, X + 0.53, 1.15, Z + 0.2, 0, 0, 0);
    animated.compressorFan = fan;
    // 屏幕
    screenPanel(airGroup, screenTexture('air'), 0.46, 0.3, X + 1.25, 1.36, Z + 0.81, 0);
    // 压力表
    add(airGroup, cyl(0.16, 0.16, 0.04, M.steelLight, 24), X - 1.7, 1.55, Z + 1.9, Math.PI / 2, 0, 0);
    add(airGroup, cyl(0.13, 0.13, 0.02, M.coolWhite, 24), X - 1.7, 1.55, Z + 1.925, Math.PI / 2, 0, 0);
    // 管道上升
    pipe(airGroup, [[X + 0.8, 1.6, Z - 0.4], [X + 0.8, 3.4, Z - 0.4], [X + 0.8, 6.2, Z - 2.2], [X + 0.8, 6.2, 2.0]], 0.14, M.steel);
    pipe(airGroup, [[X + 0.8, 1.6, Z - 0.2], [X + 0.8, 3.4, Z - 0.2], [X + 0.8, 6.2, Z - 2.2]], 0.14, M.accentDark);
    // 软管盘
    const hose = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 25 * Math.PI * 3.2;
      hose.push([X + 1.75 + Math.cos(a) * 0.24, 1.0 + i * 0.012, Z + 0.95 + Math.sin(a) * 0.24]);
    }
    pipe(airGroup, hose, 0.025, M.cable, 60);
    // 铭牌
    labelPlate(airGroup, nameplateTexture('AP-01', 'AIR COMPRESSOR'), 0.9, 0.22, X, 1.42, Z + 1.32);
    hazardStrip(airGroup, 3.8, 0.2, X, 0.02, Z + 1.15, 0, 3);
    root.add(airGroup);
  }
  registerDevice('ap-01', airGroup, [-27.2, 3.2, -1.2]);

  /* ============================================================
     配电柜
     ============================================================ */

  const cabGroup = new THREE.Group();
  {
    const X = 27.2;
    for (let i = 0; i < 3; i++) {
      const z = -2.4 + i * 1.35;
      add(cabGroup, rbox(0.8, 2.1, 1.2, 0.03, M.paint), X, 1.05, z);
      add(cabGroup, box(0.82, 0.03, 1.22, M.steelDark), X, 2.11, z);
      add(cabGroup, box(0.02, 0.05, 1.0, M.accentMatte), X - 0.41, 1.85, z);
      add(cabGroup, box(0.02, 0.28, 0.06, M.steelLight), X - 0.42, 1.1, z - 0.4);
      ledRow(cabGroup, 4, 0.12, X - 0.42, 1.45, z + 0.25, i === 1 ? M.amber : M.accent, 0.03);
      add(cabGroup, box(0.02, 0.4, 0.34, M.steelDark), X - 0.41, 1.72, z + 0.25);
      // 散热孔
      for (let k = 0; k < 5; k++) add(cabGroup, box(0.02, 0.02, 0.5, M.steelDark), X - 0.415, 0.55 + k * 0.06, z);
    }
    add(cabGroup, box(0.45, 0.1, 4.2, M.steel), X, 2.25, -0.6);
    for (let i = 0; i < 6; i++) add(cabGroup, box(0.5, 0.03, 0.06, M.steelDark), X, 2.3, -2.3 + i * 0.7);
    labelPlate(cabGroup, nameplateTexture('CAB-01', 'POWER / CONTROL'), 0.8, 0.2, X - 0.415, 1.5, -1.05, -Math.PI / 2);
    root.add(cabGroup);
  }
  registerDevice('cab-01', cabGroup, [27.2, 3.0, -0.4]);

  /* ============================================================
     上料位 / 工位 B / 货架
     ============================================================ */

  function buildStation(x, z, label, color) {
    const g = new THREE.Group();
    add(g, box(2.6, 0.75, 2.0, M.steelDark), x, 0.375, z);
    add(g, box(2.4, 0.06, 1.8, M.steelDark), x, 0.78, z);
    for (let i = 0; i < 7; i++) {
      add(g, cyl(0.055, 0.055, 1.7, M.roller, 10), x - 1.0 + i * 0.34, 0.83, z, Math.PI / 2, 0, 0);
    }
    add(g, box(2.6, 0.03, 0.03, color), x, 0.86, z + 0.95);
    add(g, box(0.35, 0.06, 0.35, M.steel), x, 0.84, z + 1.1);
    add(g, box(0.08, 1.4, 0.08, M.steel), x + 1.2, 1.5, z + 0.8);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.145), new THREE.MeshBasicMaterial({ map: nameplateTexture(label, 'MATERIAL STATION'), transparent: true, toneMapped: false, opacity: 0.62, color: 0x7c9082 }));
    add(g, sign, x + 1.32, 2.02, z + 0.84);
    root.add(g);
    return g;
  }
  buildStation(16, 9.5, 'STATION A', M.amberMatte);
  buildStation(8, 9.5, 'STATION B', M.cyanMatte);

  // 成品货架
  function buildRack(x, z) {
    const g = new THREE.Group();
    for (const sx of [-2, 2]) for (const sz of [-0.8, 0.8]) {
      add(g, box(0.1, 3.4, 0.1, M.steel), x + sx, 1.7, z + sz);
      add(g, box(0.4, 0.05, 0.4, M.steelDark), x + sx, 0.025, z + sz);
    }
    for (let level = 0; level < 3; level++) {
      add(g, box(4.1, 0.08, 1.7, M.steelDark), x, 0.9 + level * 1.1, z);
    }
    for (let i = 0; i < 4; i++) {
      const px = x - 1.5 + (i % 2) * 3.0;
      const py = 0.98 + Math.floor(i / 2) * 0;
      for (let lv = 0; lv < 2; lv++) {
        add(g, box(1.0, 0.12, 1.0, M.paintWarm), px, 0.96 + lv * 1.1, z);
        add(g, box(0.96, 0.4, 0.96, M.paintLight), px, 1.22 + lv * 1.1, z);
        add(g, box(0.7, 0.18, 0.7, M.accentDark), px, 1.51 + lv * 1.1, z);
      }
    }
    add(g, box(4.2, 0.1, 1.8, M.steel), x, 3.42, z);
    root.add(g);
  }
  buildRack(24.5, 12.4);
  buildRack(24.5, 14.6);
  buildRack(-24.5, 12.4);

  // 托盘与料箱
  function buildPallet(x, z, rot = 0) {
    const g = new THREE.Group();
    add(g, box(1.3, 0.14, 1.1, M.paintWarm), 0, 0.07, 0);
    for (let i = 0; i < 3; i++) add(g, box(1.2, 0.07, 0.12, M.steelDark), 0, 0.16, -0.4 + i * 0.4);
    for (let i = 0; i < 2; i++) {
      add(g, box(0.62, 0.42, 0.5, M.paintLight), (i - 0.5) * 0.66, 0.4, 0);
      add(g, box(0.58, 0.06, 0.46, M.accentDark), (i - 0.5) * 0.66, 0.63, 0);
    }
    add(root, g, x, 0, z);
    g.rotation.y = rot;
    return g;
  }
  buildPallet(21.8, 10.6, 0.15);
  buildPallet(19.0, 10.2, -0.1);
  buildPallet(-23.5, 9.6, 0.2);
  buildPallet(13.0, 10.4, 0.05);

  // 工具车 / 桶
  const cart = new THREE.Group();
  add(cart, rbox(1.0, 0.06, 0.55, 0.02, M.steelDark), 0, 0.8, 0);
  add(cart, box(0.8, 0.72, 0.5, M.paint), 0, 0.42, 0);
  for (const sx of [-0.4, 0.4]) for (const sz of [-0.22, 0.22]) {
    add(cart, cyl(0.09, 0.09, 0.06, M.rubber, 14), sx, 0.09, sz, 0, 0, Math.PI / 2);
  }
  add(root, cart, 5.0, 0, 9.2);
  for (let i = 0; i < 3; i++) {
    add(root, cyl(0.3, 0.3, 0.9, M.paintWarm, 18), -18.5 + i * 0.8, 0.45, -2.4);
    add(root, cyl(0.31, 0.31, 0.06, M.steelDark, 18), -18.5 + i * 0.8, 0.9, -2.4);
  }

  /* ============================================================
     管线 / 桥架
     ============================================================ */

  const flowA = makeFlowMaterial(0x5df2c4, 0.5);
  const flowB = makeFlowMaterial(0xc8ff3d, 0.36);
  animated.flowMats.push(flowA, flowB);

  // 两条主气管
  const pipe1 = cyl(0.11, 0.11, 60, M.steel, 18);
  add(root, pipe1, 0, 6.45, -4.9, 0, 0, Math.PI / 2);
  const flow1 = cyl(0.175, 0.175, 58, new THREE.MeshBasicMaterial({ color: 0x5df2c4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }), 18);
  // 使用流光管的独立材质网格
  const flowMesh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 58, 18, 1, true), flowA);
  add(root, flowMesh1, 0, 6.45, -4.9, 0, 0, Math.PI / 2);
  const pipe2 = cyl(0.085, 0.085, 60, M.steel, 16);
  add(root, pipe2, 0, 6.9, -5.95, 0, 0, Math.PI / 2);
  const flowMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.093, 0.093, 58, 16, 1, true), flowB);
  add(root, flowMesh2, 0, 6.9, -5.95, 0, 0, Math.PI / 2);

  // 管道支吊架
  for (let x = -28; x <= 28; x += 8) {
    add(root, box(0.05, 0.7, 0.05, M.steelDark), x, 7.0, -4.9);
    add(root, box(0.05, 0.7, 0.05, M.steelDark), x, 7.2, -5.95);
    add(root, box(0.3, 0.05, 0.6, M.steelDark), x, 7.35, -5.4);
  }

  // 电缆桥架
  for (const z of [-5.4, -6.6]) {
    const y = 4.55;
    add(root, box(48, 0.06, 0.4, M.steelDark), 0, y, z);
    add(root, box(48, 0.1, 0.035, M.steel), 0, y + 0.12, z - 0.2);
    add(root, box(48, 0.1, 0.035, M.steel), 0, y + 0.12, z + 0.2);
    for (let x = -23; x <= 23; x += 1.3) {
      add(root, box(0.04, 0.04, 0.38, M.steelDark), x, y - 0.04, z);
    }
    // 桥架内线缆
    pipe(root, [[-25, y + 0.05, z], [-10, y + 0.09, z + 0.06], [8, y + 0.03, z - 0.04], [25, y + 0.07, z]], 0.03, M.cable, 60);
    pipe(root, [[-25, y + 0.09, z + 0.1], [-8, y + 0.02, z + 0.04], [10, y + 0.08, z + 0.08], [25, y + 0.04, z + 0.02]], 0.022, M.cable, 60);
  }
  // 垂下线缆
  for (const x of [-12, 12]) {
    cable(root, [[x, 4.5, -5.4], [x, 3.7, -5.0], [x, 2.8, -4.2], [x, 2.0, -3.9]], 0.03);
  }
  cable(root, [[9.2, 4.5, 3.5], [9.2, 3.4, 3.7], [9.2, 2.4, 3.75], [9.2, 1.6, 3.82]], 0.03);

  // 压缩空气软管至机器人（贴地走线，避免遮挡镜头）
  cable(root, [[-4.8, 4.5, -5.2], [-4.6, 3.1, -4.2], [-4.4, 1.4, -2.8], [-4.2, 0.2, -1.6], [-3.2, 0.08, -0.8], [-1.8, 0.08, -0.2], [-0.6, 0.2, 0.1]], 0.024, M.cable, 60);

  /* ============================================================
     光照
     ============================================================ */

  const hemi = new THREE.HemisphereLight(0xc0d6da, 0x0a1210, 0.86);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4dd, 2.7);
  key.position.set(20, 30, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -42;
  key.shadow.camera.right = 42;
  key.shadow.camera.top = 42;
  key.shadow.camera.bottom = -42;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 90;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9db8c4, 0.65);
  fill.position.set(-24, 18, -10);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xc8ff3d, 0.2);
  rim.position.set(0, 8, -24);
  scene.add(rim);

  const pRobot = new THREE.PointLight(0xeafff2, 58, 18, 2);
  pRobot.position.set(0, 5.2, 2.4);
  scene.add(pRobot);

  const pScan = new THREE.PointLight(0x6ff5d0, 10, 9, 2);
  pScan.position.set(9.2, 3.4, 2.2);
  scene.add(pScan);

  const pCnc = new THREE.PointLight(0xffd9a8, 34, 20, 2);
  pCnc.position.set(0, 4.4, -6.6);
  scene.add(pCnc);

  const pCncL = new THREE.PointLight(0xffd9a8, 46, 18, 2);
  pCncL.position.set(-14, 5.0, -3.8);
  scene.add(pCncL);

  const pCncR = new THREE.PointLight(0xffd9a8, 46, 18, 2);
  pCncR.position.set(14, 5.0, -3.8);
  scene.add(pCncR);

  const pAir = new THREE.PointLight(0x9fe0c8, 30, 12, 2);

  const pAisle = new THREE.PointLight(0xd8e8ff, 32, 24, 2);
  pAisle.position.set(11, 6.4, 8);
  scene.add(pAisle);

  const pWalk = new THREE.PointLight(0xffe0b0, 26, 18, 2);
  pWalk.position.set(-8, 5.4, 6);
  scene.add(pWalk);
  pAir.position.set(-27, 3.2, -1.0);
  scene.add(pAir);

  /* ============================================================
     更新
     ============================================================ */

  function update(t, state) {

    // 滚筒
    for (const r of animated.rollers) {
      const spin = (t * r.speed) % (Math.PI * 2);
      for (let i = 0; i < r.count; i++) {
        const x = r.x0 + 0.12 + (i / (r.count - 1)) * (r.len - 0.24);
        r.dummy.position.set(x, r.height - 0.045, r.z);
        r.spinQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), spin + i * 0.15);
        r.dummy.quaternion.copy(r.spinQ).multiply(r.baseQ);
        r.dummy.updateMatrix();
        r.mesh.setMatrixAt(i, r.dummy.matrix);
      }
      r.mesh.instanceMatrix.needsUpdate = true;
    }

    // 流光
    for (const m of animated.flowMats) m.uniforms.uTime.value = t;

    // 扫描站
    const scan = state?.scan;
    if (animated.scanMat) {
      animated.scanMat.uniforms.uTime.value = scan ? scan.sweep : t * 0.4;
      animated.scanMat.uniforms.uActive.value = scan?.active ? 1 : 0.08;
    }
    if (animated.laser) {
      const active = scan?.active;
      animated.laser.visible = !!active;
      if (active) {
        const u = (scan.sweep * 0.62) % 1;
        animated.laser.position.y = 1.02 + u * 1.18;
        animated.laser.material.opacity = 0.7 + Math.sin(t * 20) * 0.2;
      }
    }
    if (animated.pointCloud) {
      animated.pointCloud.material.opacity = scan?.active ? 0.4 + Math.sin(t * 8) * 0.1 : 0;
      animated.pointCloud.rotation.y = t * 0.25;
    }
    if (animated.compressorFan) animated.compressorFan.rotation.x = t * 4.2;

    // 英雄工件
    if (state?.workpiece) {
      heroPart.position.set(state.workpiece.x, state.workpiece.y, state.workpiece.z);
      heroPart.rotation.y = state.workpiece.held ? -0.0 : 0;
    }

    // AGV 与机械臂由各自模块更新
  }

  // 曝光/环境由 main 配置

  return {
    root,
    devices,
    pickables,
    occluders,
    update,
    heroPart,
    lights: { hemi, key, fill, rim, pRobot, pScan, pCnc, pCncL, pCncR, pAir, pAisle, pWalk },
    anchors: {
      line: new THREE.Vector3(0, 5.4, 2.2),
    },
  };
}

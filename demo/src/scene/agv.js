import * as THREE from 'three';
import {
  M, rbox, box, cyl, add, nameplateTexture, labelPlate, ledRow, cable, glowRing,
} from './utils.js';

export function buildAGV(scene) {
  const root = new THREE.Group();
  root.position.set(16, 0, 7.4);
  root.name = 'agv';
  scene.add(root);

  const wheels = [];
  let beaconMat = null;
  let lidar = null;
  let statusLed = null;

  // 底盘
  const chassis = new THREE.Group();
  root.add(chassis);
  add(chassis, rbox(2.5, 0.3, 1.42, 0.06, M.steelDark), 0, 0.3, 0);
  add(chassis, rbox(2.34, 0.22, 1.3, 0.05, M.paint), 0, 0.52, 0);
  add(chassis, rbox(2.44, 0.07, 1.38, 0.03, M.steelDark), 0, 0.655, 0);
  add(chassis, box(2.3, 0.02, 0.04, M.accentRail), 0, 0.692, 0.66);
  add(chassis, box(2.3, 0.02, 0.04, M.accentRail), 0, 0.692, -0.66);
  add(chassis, rbox(2.18, 0.08, 1.16, 0.02, M.steelDark), 0, 0.71, 0);
  // 侧面装饰
  for (const s of [-1, 1]) {
    add(chassis, box(1.8, 0.05, 0.02, M.accentMatte), 0, 0.46, s * 0.716);
    add(chassis, box(1.8, 0.025, 0.02, M.steelDark), 0, 0.38, s * 0.716);
    add(chassis, box(0.5, 0.12, 0.02, M.steelDark), -0.65, 0.55, s * 0.72);
    add(chassis, box(0.05, 0.08, 0.02, M.amber), -0.92, 0.55, s * 0.72);
  }
  // 防撞条
  for (const s of [-1, 1]) {
    add(chassis, rbox(0.14, 0.14, 1.2, 0.04, M.rubber), s * 1.27, 0.32, 0);
    add(chassis, box(0.02, 0.04, 0.8, M.amber), s * 1.34, 0.32, 0);
  }
  // 四轮
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wg = new THREE.Group();
      const tire = cyl(0.2, 0.2, 0.16, M.rubber, 24);
      tire.rotation.x = Math.PI / 2;
      wg.add(tire);
      const hub = cyl(0.09, 0.09, 0.17, M.steelLight, 18);
      hub.rotation.x = Math.PI / 2;
      wg.add(hub);
      for (let i = 0; i < 4; i++) {
        const spoke = box(0.03, 0.03, 0.17, M.steelDark);
        spoke.rotation.z = (i / 4) * Math.PI;
        spoke.position.set(Math.cos(spoke.rotation.z) * 0.12, Math.sin(spoke.rotation.z) * 0.12, 0);
        wg.add(spoke);
      }
      // 轮罩
      add(chassis, box(0.1, 0.12, 0.32, M.steelDark), sx * 0.98, 0.48, sz * 0.62);
      add(root, wg, sx * 0.78, 0.2, sz * 0.61);
      wheels.push(wg);
    }
  }
  // 充电触点
  add(chassis, rbox(0.3, 0.18, 0.5, 0.02, M.steelDark), 1.22, 0.24, 0);
  add(chassis, box(0.04, 0.1, 0.36, M.copper), 1.36, 0.24, 0);

  // 顶升 / 辊道台面
  add(chassis, rbox(2.0, 0.12, 1.06, 0.03, M.steel), 0, 0.79, 0);
  for (let i = 0; i < 7; i++) {
    add(chassis, cyl(0.045, 0.045, 0.94, M.steelLight, 12), -0.82 + i * 0.27, 0.87, 0, Math.PI / 2, 0, 0);
  }
  // 托盘 + 两箱货物
  add(chassis, box(1.7, 0.09, 0.95, M.paintWarm), 0, 0.94, 0);
  for (let i = 0; i < 3; i++) add(chassis, box(1.6, 0.05, 0.1, M.steelDark), 0, 0.99, -0.34 + i * 0.34);
  for (const s of [-1, 1]) {
    add(chassis, box(0.68, 0.46, 0.66, M.paintLight), s * 0.42, 1.24, 0);
    add(chassis, box(0.66, 0.045, 0.64, M.accentDark), s * 0.42, 1.48, 0);
    add(chassis, box(0.7, 0.06, 0.7, M.steelDark), s * 0.42, 1.02, 0);
    add(chassis, box(0.7, 0.012, 0.06, M.accentRail), s * 0.42, 1.36, 0.34);
    add(chassis, box(0.7, 0.012, 0.06, M.accentRail), s * 0.42, 1.36, -0.34);
    add(chassis, box(0.03, 0.4, 0.68, M.accentDark), s * 0.06, 1.24, 0);
  }
  // 绑带
  add(chassis, box(1.72, 0.02, 0.06, M.rubber), 0, 1.37, 0.3);
  add(chassis, box(1.72, 0.02, 0.06, M.rubber), 0, 1.37, -0.3);

  // 前传感器 / 激光雷达
  const mast = new THREE.Group();
  add(mast, cyl(0.06, 0.08, 0.55, M.steel, 14), 0, 0.28, 0);
  add(mast, rbox(0.3, 0.18, 0.3, 0.03, M.steelDark), 0, 0.58, 0);
  lidar = new THREE.Group();
  add(lidar, cyl(0.11, 0.11, 0.14, M.steelDark, 20), 0, 0.08, 0);
  add(lidar, box(0.17, 0.06, 0.05, M.cyan), 0, 0.08, 0.07);
  add(lidar, cyl(0.03, 0.03, 0.16, M.cyan, 10), 0, 0.16, 0);
  mast.add(lidar);
  add(root, mast, 1.02, 0.85, 0.18);
  // 前向避障
  add(chassis, rbox(0.16, 0.1, 0.3, 0.02, M.steelDark), 1.18, 0.6, 0.4);
  add(chassis, cyl(0.03, 0.03, 0.04, M.red, 10), 1.27, 0.6, 0.4, Math.PI / 2, 0, 0);

  // 状态灯 / 警示灯
  statusLed = new THREE.MeshStandardMaterial({ color: 0x11200c, emissive: 0xc8ff3d, emissiveIntensity: 1.4, roughness: 0.4 });
  add(chassis, box(0.24, 0.02, 0.02, statusLed), 0, 0.75, 0.72);
  add(chassis, box(0.24, 0.02, 0.02, statusLed), 0, 0.75, -0.72);
  beaconMat = new THREE.MeshStandardMaterial({ color: 0x2a1804, emissive: 0xffb454, emissiveIntensity: 2.2, roughness: 0.35 });
  add(root, cyl(0.09, 0.09, 0.12, beaconMat, 16), -1.0, 1.15, 0.5);
  add(root, cyl(0.11, 0.11, 0.03, M.steelDark, 16), -1.0, 1.09, 0.5);
  // 天线
  add(root, cyl(0.012, 0.012, 0.7, M.steelDark, 8), -0.95, 1.25, -0.5);
  add(root, cyl(0.03, 0.03, 0.05, M.cyan, 8), -0.95, 1.62, -0.5);

  // 铭牌
  labelPlate(chassis, nameplateTexture('AGV-01', 'MATERIAL HANDLING'), 0.78, 0.19, -0.4, 0.66, 0.726, 0);
  // 底部安全投影
  const under = glowRing(root, 1.55, 0.025, 0xffb454, 0.08);
  under.scale.set(1.1, 0.62, 1);
  under.rotation.z = 0;

  // 轮毂与雷达更新
  function update(a, t) {
    root.position.x = a.x;
    root.position.z = a.z;
    root.position.y = 0;

    const spin = a.wheelSpin;
    for (const w of wheels) w.rotation.z = spin;

    if (lidar) lidar.rotation.y = a.lidarSpin;
    if (beaconMat) {
      const moving = a.moving;
      beaconMat.emissive.setHex(moving ? 0xffb454 : 0xc8ff3d);
      beaconMat.emissiveIntensity = moving ? 2.4 + Math.sin(t * 9) * 0.9 : 1.6;
    }
    if (statusLed) {
      statusLed.emissiveIntensity = a.moving ? 1.8 : 1.0;
    }
  }

  return {
    root,
    update,
    anchor: new THREE.Vector3(16, 1.95, 7.4),
  };
}

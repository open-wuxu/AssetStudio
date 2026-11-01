import * as THREE from 'three';
import {
  M, rbox, box, cyl, add, shadow, boltRing, pipe, cable,
  nameplateTexture, labelPlate, glowRing, ledRow,
} from './utils.js';

const BASE = { x: 0, y: 0, z: 0.4 };
const SHOULDER_Y = 1.35;
const L1 = 2.0;   // 肩 → 肘
const L2 = 1.75;  // 肘 → 腕
const TOOL = 0.62;

export function buildRobot(scene) {
  const root = new THREE.Group();
  root.position.set(BASE.x, BASE.y, BASE.z);
  root.name = 'robot-arm';
  scene.add(root);

  const jointAngles = { yaw: 0, shoulder: 0, elbow: 0, wrist: 0 };
  let ledMat = null;

  // 底座
  const base = new THREE.Group();
  add(base, cyl(0.88, 0.95, 0.2, M.steelDark, 32), 0, 0.1, 0);
  add(base, cyl(0.74, 0.8, 0.22, M.steel, 32), 0, 0.31, 0);
  add(base, cyl(0.62, 0.68, 0.12, M.accentMatte, 32), 0, 0.47, 0);
  add(base, cyl(0.56, 0.6, 0.14, M.steelDark, 32), 0, 0.575, 0);
  boltRing(base, 12, 0.78, 0.21, M.steelLight, 0.028);
  add(base, box(0.42, 0.1, 0.2, M.steelDark), 0.62, 0.44, 0.42, 0, -0.6, 0);
  add(base, box(0.16, 0.08, 0.08, M.red), 0.62, 0.52, 0.5);
  add(base, cyl(0.055, 0.055, 0.045, M.red, 18), 0.68, 0.36, 0.12, Math.PI / 2, 0, 0);
  add(base, box(0.15, 0.06, 0.01, M.amber), -0.58, 0.5, 0.72);
  // 底座线缆入口
  add(base, cyl(0.1, 0.1, 0.22, M.steel), -0.55, 0.42, -0.45, 0, 0, 0.4);
  root.add(base);

  // 第一轴
  const baseYaw = new THREE.Group();
  baseYaw.position.y = 0.62;
  root.add(baseYaw);

  add(baseYaw, cyl(0.52, 0.56, 0.62, M.robotPaint, 28), 0, 0.31, 0);
  add(baseYaw, cyl(0.54, 0.54, 0.05, M.accentMatte, 28), 0, 0.6, 0);
  add(baseYaw, cyl(0.4, 0.44, 0.1, M.steelDark, 28), 0, 0.68, 0);
  // 肩部叉架
  for (const s of [-1, 1]) {
    add(baseYaw, rbox(0.16, 0.7, 0.64, 0.04, M.steelDark), s * 0.33, 0.72, 0);
    add(baseYaw, cyl(0.3, 0.3, 0.1, M.steel, 24), s * 0.45, 0.73, 0, 0, 0, Math.PI / 2);
    boltRing(baseYaw, 6, 0.22, 0.73, M.steelLight, 0.018);
  }
  // 肩部电机/减速机
  add(baseYaw, cyl(0.27, 0.27, 0.36, M.steel, 24), 0.52, 0.73, 0, 0, 0, Math.PI / 2);
  add(baseYaw, cyl(0.2, 0.2, 0.38, M.steelDark, 24), 0.56, 0.73, 0, 0, 0, Math.PI / 2);
  add(baseYaw, cyl(0.06, 0.06, 0.4, M.steelLight, 12), 0.56, 0.73, 0, 0, 0, Math.PI / 2);
  // 背部控制盒
  add(baseYaw, rbox(0.34, 0.48, 0.2, 0.03, M.steelDark), 0, 0.4, -0.5);
  add(baseYaw, box(0.24, 0.04, 0.04, M.accent), 0, 0.5, -0.61);
  add(baseYaw, box(0.06, 0.06, 0.02, M.cyan), 0.1, 0.32, -0.61);
  // 软管/线束
  cable(baseYaw, [[0.3, 0.5, -0.4], [0.46, 0.8, -0.55], [0.45, 1.2, -0.52], [0.32, 1.5, -0.4]], 0.028, M.cable);

  // 肩关节
  const shoulder = new THREE.Group();
  shoulder.position.y = SHOULDER_Y - 0.62;
  baseYaw.add(shoulder);

  const upper = new THREE.Group();
  shoulder.add(upper);
  add(upper, rbox(0.36, 0.46, L1, 0.06, M.robotPaint), 0, 0, L1 / 2);
  add(upper, rbox(0.3, 0.05, L1 * 0.72, 0.02, M.robotDark), 0, 0.24, L1 * 0.52);
  add(upper, box(0.03, 0.05, L1 * 0.78, M.accentRail), 0.185, 0.02, L1 / 2);
  add(upper, box(0.03, 0.05, L1 * 0.78, M.accentRail), -0.185, 0.02, L1 / 2);
  for (let i = 0; i < 5; i++) {
    add(upper, box(0.37, 0.012, 0.025, M.robotDark), 0, 0.0, 0.32 + i * 0.32);
  }
  add(upper, rbox(0.28, 0.06, L1 * 0.55, 0.02, M.steelDark), 0, 0.245, L1 * 0.5);
  add(upper, box(0.22, 0.03, L1 * 0.4, M.steelLight), 0, -0.235, L1 * 0.48);
  // 上臂加强筋
  for (let i = 0; i < 4; i++) {
    add(upper, box(0.03, 0.3, 0.06, M.steelDark), 0.19, 0, 0.5 + i * 0.35);
    add(upper, box(0.03, 0.3, 0.06, M.steelDark), -0.19, 0, 0.5 + i * 0.35);
  }
  // 肩部端盖
  add(upper, cyl(0.29, 0.29, 0.4, M.steelDark, 24), 0, 0, 0, 0, 0, Math.PI / 2);
  add(upper, cyl(0.18, 0.18, 0.42, M.steel, 20), 0, 0, 0, 0, 0, Math.PI / 2);
  boltRing(upper, 8, 0.23, 0, M.steelLight, 0.018);
  // 上臂伺服
  add(upper, rbox(0.3, 0.26, 0.3, 0.03, M.steelDark), 0.22, -0.1, 0.45);
  add(upper, cyl(0.055, 0.055, 0.06, M.cyan, 12), 0.22, 0.045, 0.45);
  // 铭牌
  labelPlate(upper, nameplateTexture('ARM-06', '6-AXIS ASSEMBLY'), 0.62, 0.155, 0.188, 0.02, 1.15, Math.PI / 2);
  // 线缆沿上臂
  cable(upper, [[-0.2, 0.26, 0.1], [-0.26, 0.32, 0.6], [-0.24, 0.3, 1.2], [-0.16, 0.24, 1.85]], 0.032, M.cable);
  pipe(upper, [[0.17, -0.05, 0.3], [0.23, -0.08, 0.8], [0.23, -0.08, 1.4], [0.15, -0.04, 1.9]], 0.016, M.cable, 40);

  // 肘关节
  const elbow = new THREE.Group();
  elbow.position.z = L1;
  upper.add(elbow);
  add(elbow, cyl(0.25, 0.25, 0.62, M.steelDark, 24), 0, 0, 0, 0, 0, Math.PI / 2);
  add(elbow, cyl(0.16, 0.16, 0.66, M.steel, 20), 0, 0, 0, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    add(elbow, cyl(0.28, 0.28, 0.08, M.steel, 24), s * 0.34, 0, 0, 0, 0, Math.PI / 2);
    boltRing(elbow, 6, 0.2, 0, M.steelLight, 0.016);
  }

  const fore = new THREE.Group();
  elbow.add(fore);
  add(fore, rbox(0.3, 0.38, L2, 0.05, M.robotPaint), 0, 0, L2 / 2);
  add(fore, box(0.026, 0.045, L2 * 0.7, M.accentRail), 0.16, 0.02, L2 * 0.5);
  add(fore, box(0.026, 0.045, L2 * 0.7, M.accentRail), -0.16, 0.02, L2 * 0.5);
  add(fore, rbox(0.24, 0.05, L2 * 0.5, 0.02, M.steelDark), 0, 0.22, L2 * 0.52);
  add(fore, rbox(0.22, 0.3, 0.26, 0.03, M.steelDark), 0, -0.06, 0.3);
  add(fore, cyl(0.06, 0.06, 0.05, M.cyan, 12), 0.13, 0.1, 0.3);
  cable(fore, [[0.14, 0.23, 0.1], [0.18, 0.25, 0.5], [0.15, 0.2, 1.1], [0.08, 0.16, 1.55]], 0.026, M.cable);

  // 腕部
  const wrist = new THREE.Group();
  wrist.position.z = L2;
  fore.add(wrist);
  add(wrist, cyl(0.2, 0.2, 0.42, M.steelDark, 22), 0, 0, 0, 0, 0, Math.PI / 2);
  add(wrist, cyl(0.13, 0.13, 0.46, M.steel, 18), 0, 0, 0, 0, 0, Math.PI / 2);
  boltRing(wrist, 8, 0.16, 0, M.steelLight, 0.014);

  const roll = new THREE.Group();
  roll.position.z = 0.2;
  wrist.add(roll);
  add(roll, cyl(0.13, 0.15, 0.18, M.steel, 24), 0, 0, 0.08, Math.PI / 2, 0, 0);
  add(roll, cyl(0.1, 0.1, 0.04, M.accentMatte, 24), 0, 0, 0.18, Math.PI / 2, 0, 0);
  // 腕部视觉传感器
  add(roll, rbox(0.16, 0.1, 0.2, 0.02, M.steelDark), 0.18, 0.02, 0.1);
  add(roll, cyl(0.045, 0.045, 0.03, M.cyan, 16), 0.18, 0.02, 0.21, Math.PI / 2, 0, 0);

  // 夹爪
  const gripper = new THREE.Group();
  gripper.position.z = 0.2;
  roll.add(gripper);
  add(gripper, rbox(0.36, 0.2, 0.16, 0.02, M.steelDark), 0, 0, 0.08);
  add(gripper, box(0.24, 0.06, 0.02, M.accentMatte), 0, 0.08, 0.165);
  add(gripper, box(0.26, 0.03, 0.05, M.steel), 0, -0.09, 0.1);
  // 夹爪导轨
  add(gripper, box(0.34, 0.03, 0.06, M.steelLight), 0, -0.04, 0.2);
  ledMat = new THREE.MeshStandardMaterial({ color: 0x0b2a10, emissive: 0x5dff8a, emissiveIntensity: 1.2, roughness: 0.4 });
  add(gripper, cyl(0.022, 0.022, 0.02, ledMat, 12), 0.13, 0.11, 0.18, Math.PI / 2, 0, 0);

  const jawL = new THREE.Group();
  const jawR = new THREE.Group();
  gripper.add(jawL, jawR);
  for (const [jaw, s] of [[jawL, -1], [jawR, 1]]) {
    add(jaw, box(0.06, 0.2, 0.26, M.steel), 0, 0, 0.02);
    add(jaw, box(0.025, 0.16, 0.2, M.rubberSoft), s * -0.045, 0, 0.02);
    add(jaw, box(0.02, 0.02, 0.2, M.steelLight), 0, 0.115, 0.02);
  }

  // 夹爪气管
  pipe(fore, [[0.13, -0.12, 0.9], [0.18, -0.16, 1.2], [0.21, -0.12, 1.5], [0.16, -0.02, 1.72], [0.1, 0.0, 1.78]], 0.014, M.cable, 44);

  // 地面光环
  const ring = glowRing(root, 1.45, 0.03, 0xc8ff3d, 0.16);
  ring.renderOrder = 3;

  const tmp = new THREE.Vector3();
  const state = { joints: [0, 0, 0, 0, 0, 0], phase: '待机' };

  function setState(r, t = 0) {
    const lx = r.tcp.x - BASE.x;
    const ly = r.tcp.y - BASE.y;
    const lz = r.tcp.z - BASE.z;

    const yaw = Math.atan2(lx, lz);
    const rHoriz = Math.hypot(lx, lz);
    const wristY = ly + TOOL;
    const h = wristY - SHOULDER_Y;
    let d = Math.hypot(rHoriz, h);
    d = Math.min(L1 + L2 - 0.02, Math.max(0.35, d));

    const a = Math.atan2(h, rHoriz);
    const cosB = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const B = Math.acos(cosB);
    const cosC = THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1);
    const C = Math.acos(cosC);

    const p1 = a + B;                    // 上臂仰角
    const p2 = p1 - (Math.PI - C);       // 前臂仰角（肘部向上）

    baseYaw.rotation.y = yaw;
    shoulder.rotation.x = -p1;
    elbow.rotation.x = p1 - p2;
    wrist.rotation.x = Math.PI / 2 + p2;
    roll.rotation.y = -yaw;

    const open = r.gripper;
    const gap = 0.21 + open * 0.13;
    jawL.position.x = -gap;
    jawR.position.x = gap;

    if (ledMat) {
      ledMat.emissiveIntensity = r.gripper < 0.15 ? 2.4 : 1.0;
      ledMat.emissive.setHex(r.gripper < 0.15 ? 0xc8ff3d : 0x5dff8a);
    }

    state.phase = r.phase;
    const deg = (v) => (v * 180) / Math.PI;
    state.joints = [deg(yaw), deg(-p1), deg(p1 - p2), deg(Math.PI / 2 + p2), 0, 0];

    // 机械臂状态灯呼吸
    ring.material.opacity = 0.1 + (Math.sin(t * 2.5) * 0.5 + 0.5) * 0.12;
  }

  function update(r, t = 0) {
    setState(r, t);
    state.phase = r.phase;
  }

  // 控制柜到本体的地面线缆
  const floorCable = pipe(scene, [
    [-5.0, 0.12, -1.9], [-4.4, 0.1, -1.2], [-3.2, 0.09, -0.7], [-1.6, 0.09, -0.25], [-0.4, 0.12, 0.0], [0, 0.5, 0.18], [0.1, 0.9, 0.1],
  ], 0.045, M.cable, 70);
  floorCable.name = 'robot-cable';

  return {
    root,
    state,
    update,
    anchor: new THREE.Vector3(BASE.x, 2.2, BASE.z),
    base: BASE,
  };
}

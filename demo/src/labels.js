import * as THREE from 'three';

const DEFS = [
  {
    id: 'arm-06', code: 'ARM-06', name: '六轴装配机械臂',
    pages: ['overview', 'production'],
    value: (s) => `${s.robot.phase} · 节拍 42.5 s`,
  },
  {
    id: 'cv-01', code: 'CV-01', name: '进料输送线',
    pages: ['overview', 'production', 'inspection'],
    value: () => '0.55 m/s · 在制 6 件',
  },
  {
    id: 'scan-02', code: 'SCAN-02', name: '在线检测站',
    pages: ['overview', 'production', 'inspection'],
    value: (s) => s.scan.active
      ? `扫描中 ${Math.round(s.scan.progress * 100)}% · ${s.scan.points} 点`
      : s.scan.done ? `PASS · ${s.scan.dimension.toFixed(3)} mm` : '待检 · 等待来料',
  },
  {
    id: 'agv-01', code: 'AGV-01', name: '搬运机器人',
    pages: ['overview', 'logistics'],
    value: (s) => `${s.agv.task} · ${s.agv.speed.toFixed(1)} m/s · ${Math.round(s.agv.progress)}%`,
  },
  {
    id: 'cnc-03', code: 'CNC-03', name: '数控加工中心',
    pages: ['overview', 'maintenance'],
    value: () => '主轴 8,400 RPM · 振动 1.8 mm/s',
  },
  {
    id: 'ap-01', code: 'AP-01', name: '螺杆空压机',
    pages: ['maintenance'],
    value: (s) => `${s.pressure.toFixed(2)} MPa · ${s.temp.toFixed(1)} °C`,
  },
  {
    id: 'cab-01', code: 'CAB-01', name: '电气控制柜',
    pages: ['maintenance'],
    value: () => '负载 46.2 A · 柜温 32.4 °C',
  },
];

export function createLabels(opts) {
  const { layer, stage, camera, devices, occluders } = opts;
  const els = new Map();
  const raycaster = new THREE.Raycaster();
  const tmpV = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  const box = new THREE.Box3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const reticle = document.getElementById('reticle');
  const reticleTag = document.getElementById('reticle-tag');

  for (const d of DEFS) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.dataset.id = d.id;
    el.innerHTML = `<i class="l-dot"></i><div class="l-body"><span class="l-name"><b>${d.code}</b>${d.name}</span><span class="l-val"></span></div>`;
    layer.appendChild(el);
    els.set(d.id, el);
  }

  let lastSelected = null;
  let cachedBoxId = null;
  let cachedBox = new THREE.Box3();

  function deviceBox(device, id, force) {
    if (!force && cachedBoxId === id) return cachedBox;
    box.setFromObject(device.root);
    cachedBox.copy(box);
    cachedBoxId = id;
    return cachedBox;
  }

  function update(state, force = false) {
    const rect = stage.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const page = state.page;
    const selected = state.selected;
    const now = performance.now();
    // 标签内容以 15Hz 刷新，降低 DOM 开销
    const refresh = force || !update._last || now - update._last > 66;
    if (refresh) update._last = now;

    for (const d of DEFS) {
      const el = els.get(d.id);
      const device = devices[d.id];
      if (!device) { el.classList.remove('visible'); continue; }

      const allowed = d.pages.includes(page) || selected === d.id;
      if (!allowed) { el.classList.remove('visible'); continue; }

      const anchor = device.anchor;
      tmpV.copy(anchor);
      const dist = tmpV.distanceTo(camera.position);
      tmpV.project(camera);
      const sx = (tmpV.x * 0.5 + 0.5) * vw - rect.left;
      const sy = (-tmpV.y * 0.5 + 0.5) * vh - rect.top;

      if (tmpV.z > 1 || tmpV.z < -1 || sx < -40 || sy < -40 || sx > rect.width + 40 || sy > rect.height + 40 || dist > 78) {
        el.classList.remove('visible');
        continue;
      }

      // 遮挡检测
      let occluded = false;
      if (device.id !== 'agv-01' || true) {
        tmpDir.copy(anchor).sub(camera.position).normalize();
        raycaster.set(camera.position, tmpDir);
        raycaster.far = Math.max(0.1, dist - 0.25);
        const hits = raycaster.intersectObjects(occluders, false);
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i];
          if (hit.object.visible === false) continue;
          const aid = hit.object.userData.assetId;
          if (aid === d.id) continue;
          if (hit.distance < dist - 0.35) { occluded = true; break; }
        }
      }

      if (occluded && selected !== d.id) {
        el.classList.remove('visible');
        continue;
      }

      el.style.left = `${sx.toFixed(1)}px`;
      el.style.top = `${sy.toFixed(1)}px`;
      el.classList.add('visible');
      el.classList.toggle('selected', selected === d.id);
      el.classList.toggle('warn', d.id === 'ap-01' && state.page === 'maintenance');
      if (refresh) {
        const v = el.querySelector('.l-val');
        const text = d.value(state);
        if (v.textContent !== text) v.textContent = text;
      }
    }

    // 选中设备的取景框
    if (selected && devices[selected]) {
      const dev = devices[selected];
      const moving = selected === 'agv-01' || selected === 'arm-06';
      const b = deviceBox(dev, selected, moving || selected !== lastSelected);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, behind = 0;
      for (let i = 0; i < 8; i++) {
        corners[i].set(
          i & 1 ? b.max.x : b.min.x,
          i & 2 ? b.max.y : b.min.y,
          i & 4 ? b.max.z : b.min.z
        ).project(camera);
        if (corners[i].z > 1) behind++;
        const px = (corners[i].x * 0.5 + 0.5) * vw - rect.left;
        const py = (-corners[i].y * 0.5 + 0.5) * vh - rect.top;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
      const pad = 10;
      const w = Math.max(40, maxX - minX + pad * 2);
      const h = Math.max(40, maxY - minY + pad * 2);
      const left = Math.min(rect.width - 20, Math.max(-w + 20, minX - pad));
      const top = Math.min(rect.height - 20, Math.max(-h + 20, minY - pad));
      if (behind >= 8) {
        reticle.classList.remove('visible');
      } else {
        reticle.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
        reticle.style.width = `${Math.min(w, rect.width * 1.2).toFixed(1)}px`;
        reticle.style.height = `${Math.min(h, rect.height * 1.2).toFixed(1)}px`;
        reticle.classList.add('visible');
        const code = (devices[selected] && selected.toUpperCase()) || selected;
        reticleTag.textContent = `${code} · LOCKED`;
      }
      lastSelected = selected;
    } else {
      reticle.classList.remove('visible');
      lastSelected = null;
    }
  }

  return { update, els };
}

import { ASSETS, TREE, PAGES, EVENTS, WORK_ORDERS, MAINTENANCE_PLAN, INSPECTION_LOG, LOGISTICS_QUEUE, sparkValues } from './data.js';
import { SEGMENTS, DURATION, formatClock, AGV_START_X } from './timeline.js';

const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  factory: icon('<path d="M3 21h18M4 21V9l5 3V9l5 3V4h6v17"/><path d="M7 17h2M12 17h2M17 17h2"/>'),
  workshop: icon('<path d="M3 21h18M5 21V8h14v13"/><path d="M9 21v-6h6v6M8 11h2M14 11h2"/>'),
  line: icon('<path d="M2 12h20M6 8v8M12 6v12M18 8v8"/>'),
  robot: icon('<path d="M9 4h6v4H9zM12 8v3M8 11h8l2 4H6zM6 15v3M18 15v3M9 18h6"/>'),
  conveyor: icon('<path d="M3 10h18v4H3zM6 14v4M18 14v4"/><path d="M7 12h.01M11 12h.01M15 12h.01"/>'),
  scanner: icon('<path d="M4 8V5h4M20 8V5h-4M4 16v3h4M20 16v3h-4M3 12h18M8 10v4M12 9v6M16 10v4"/>'),
  agv: icon('<path d="M3 14h18v4H3zM6 18v2M18 18v2M7 10h10l2 4H5z"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>'),
  cnc: icon('<path d="M5 3h14v18H5zM8 7h8v5H8zM9 17h6M9 19h.01M15 19h.01M8 12v5"/>'),
  compressor: icon('<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7 7l10 10M17 7L7 17"/>'),
  cabinet: icon('<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/><path d="M16 17h.01"/>'),
};
const STATUS_TEXT = { running: '运行', idle: '待机', warning: '告警', offline: '离线' };

function sparkline(values, opts = {}) {
  const w = opts.w || 300;
  const h = opts.h || 54;
  const pad = 3;
  const color = opts.color || 'var(--accent)';
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - v * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const dots = pts.slice(-1).map((p) => `<circle class="dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" fill="${color}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <line class="axis" x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}"/>
    <path d="${area}" fill="${color}" opacity="0.08"/>
    <path class="line" d="${line}" stroke="${color}"/>
    ${dots}
  </svg>`;
}

function donut(segments) {
  const C = 2 * Math.PI * 46;
  let offset = 0;
  const circles = segments.map((s) => {
    const len = (s.value / 128) * C;
    const el = `<circle class="d-seg" cx="60" cy="60" r="46" stroke="${s.color}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
    offset += len;
    return el;
  }).join('');
  return `<div class="donut"><svg viewBox="0 0 120 120"><circle class="d-bg" cx="60" cy="60" r="46"/>${circles}</svg>
    <div class="donut-center"><b>116</b><span>在线设备</span></div></div>`;
}

function statusClass(s) { return s === 'warning' ? 'warn' : s === 'offline' ? 'off' : s === 'idle' ? 'idle' : 'run'; }

function buildTree() {
  let html = '';
  const walk = (nodes) => {
    for (const n of nodes) {
      const a = ASSETS[n.id];
      if (!a) continue;
      const hasKids = n.children && n.children.length;
      html += `<div class="tree-row l${n.depth}" data-id="${n.id}" data-device="${n.depth === 4 ? 1 : 0}">
        <span class="caret">${hasKids ? '▾' : ''}</span>
        <span class="ico">${ICONS[a.type] || ''}</span>
        <span class="tname">${a.name}</span>
        <span class="tcode">${a.code}</span>
        <i class="st ${statusClass(a.status)}"></i>
      </div>`;
      if (n.children) walk(n.children);
    }
  };
  walk(TREE);
  html += `<div class="tree-row l4" style="opacity:.4;cursor:default">
    <span class="caret"></span><span class="ico"></span><span class="tname">其他资产 · 121</span><span class="tcode">+121</span>
  </div>`;
  return html;
}

function deviceCard(id, state) {
  const a = ASSETS[id];
  if (!a) return '';
  const metrics = a.metrics ? a.metrics(state) : [];
  const rows = metrics.map((m) => {
    let val = m.value;
    if (m.key === 'robotPhase') val = state.robot.phase;
    let display;
    if (typeof val === 'number' && m.unit) display = `${val}<small>${m.unit}</small>`;
    else if (typeof val === 'number') display = `${val}`;
    else display = String(val ?? '—');
    if (m.label === '当前动作') display = `<span style="font-size:.72rem">${val}</span>`;
    return `<div class="dc-metric"><span>${m.label}</span><b class="${m.warn ? 'warn' : ''}">${display}</b></div>`;
  }).join('');
  return `<section class="card device-card fade-in" data-device-card>
    <div class="dc-top">
      <div class="dc-icon">${ICONS[a.type] || ''}</div>
      <div class="dc-main">
        <div class="dc-name"><b>${a.name}</b><i class="st ${statusClass(a.status)}"></i></div>
        <div class="dc-code">${a.code} · ${STATUS_TEXT[a.status] || '运行'} · MQTT</div>
      </div>
      <button class="dc-close" data-action="deselect" title="取消选中">✕</button>
    </div>
    <div class="dc-metrics">${rows}</div>
    <div class="dc-foot">
      <span class="sim">模拟遥测 · 1 s 刷新</span>
      <button class="focus-btn" data-action="focus" data-id="${id}">聚焦设备</button>
    </div>
  </section>`;
}

/* ---------------- 页面模板 ---------------- */

function pageOverview(state) {
  const donutSegs = [
    { value: 96, color: '#c8ff3d' },
    { value: 17, color: '#5df2c4' },
    { value: 3, color: '#ffb454' },
    { value: 12, color: '#4a5a52' },
  ];
  const bars = [62, 74, 58, 81, 76, 89, 71, 84];
  return `
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">PLANT STATUS</span><span class="card-title">工厂运行态势</span></div><span class="card-chip">实时</span></div>
    <div class="stat-row">
      <div class="stat"><div class="s-label">资产总数</div><div class="s-val">128</div><div class="s-sub">8 类资产模板</div></div>
      <div class="stat"><div class="s-label">在线设备</div><div class="s-val accent">116</div><div class="s-sub">在线率 90.6%</div></div>
      <div class="stat"><div class="s-label">综合效率 OEE</div><div class="s-val" data-bind="oee">87.4<small>%</small></div><div class="s-sub">较昨日 +1.2%</div></div>
      <div class="stat"><div class="s-label">未处理告警</div><div class="s-val warn">3</div><div class="s-sub">1 条需关注</div></div>
    </div>
    <div class="donut-wrap" style="margin-top:.8rem">
      ${donut(donutSegs)}
      <div class="donut-legend">
        <div class="dl"><i style="background:var(--accent)"></i>运行 <b>96</b></div>
        <div class="dl"><i style="background:var(--teal)"></i>待机 <b>17</b></div>
        <div class="dl"><i style="background:var(--amber)"></i>告警 <b>3</b></div>
        <div class="dl"><i style="background:#4a5a52"></i>离线 <b>12</b></div>
      </div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">OUTPUT</span><span class="card-title">今日产能</span></div><span class="card-chip">+6.8%</span></div>
    <div class="hero-metric"><b data-bind="production">2847</b><span>件</span><em>目标 3,200</em></div>
    <div class="bar-row"><div class="bar-meta"><span>班次达成</span><b data-bind="outputPct">89%</b></div><div class="bar-track"><i class="bar-fill" data-bind="outputBar" style="width:89%"></i></div></div>
    ${sparkline(bars.map((b) => b / 100), { h: 58 })}
    <div class="mini-legend"><span><i style="background:var(--accent)"></i>每小时产出</span><span>08:00 — 16:00</span></div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">ALERTS</span><span class="card-title">需要关注</span></div><span class="card-chip warn">3</span></div>
    <div class="rows">
      <div class="row"><span class="r-label"><i style="background:var(--amber)"></i>AP-01 运行温度</span><span class="r-val warn">68.5 °C</span></div>
      <div class="row"><span class="r-label"><i style="background:var(--amber)"></i>AP-01 阈值 80 °C</span><span class="r-val">剩余 11.5 °C</span></div>
      <div class="row"><span class="r-label"><i style="background:var(--accent)"></i>SCAN-02 通过率</span><span class="r-val accent">99.2 %</span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">LINES</span><span class="card-title">产线状态</span></div><span class="card-chip teal">3 / 3</span></div>
    <div class="bar-row"><div class="bar-meta"><span>产线 01 · 总装</span><b>运行 · 92%</b></div><div class="bar-track"><i class="bar-fill" style="width:92%"></i></div></div>
    <div class="bar-row"><div class="bar-meta"><span>产线 02 · 机加</span><b>运行 · 78%</b></div><div class="bar-track"><i class="bar-fill teal" style="width:78%"></i></div></div>
    <div class="bar-row"><div class="bar-meta"><span>包装线 · 辅助</span><b>待机 · 34%</b></div><div class="bar-track"><i class="bar-fill amber" style="width:34%"></i></div></div>
  </section>`;
}

function pageProduction(state) {
  return `
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">LINE 01 / CYCLE</span><span class="card-title">装配单元</span></div><span class="card-chip" data-bind="robotChip">运行中</span></div>
    <div class="hero-metric"><b data-bind="cycle">42.5</b><span>s / 件</span><em data-bind="robotPhase">待机</em></div>
    <div class="stat-row">
      <div class="stat"><div class="s-label">今日产量</div><div class="s-val accent"><span data-bind="production">2847</span><small>件</small></div></div>
      <div class="stat"><div class="s-label">一次良率</div><div class="s-val">99.2<small>%</small></div></div>
    </div>
    <div class="rows" style="margin-top:.6rem">
      <div class="row"><span class="r-label"><i style="background:var(--accent)"></i>夹爪状态</span><span class="r-val accent" data-bind="gripper">张开</span></div>
      <div class="row"><span class="r-label"><i style="background:var(--teal)"></i>负载</span><span class="r-val">12.4 <small>kg</small></span></div>
      <div class="row"><span class="r-label"><i style="background:var(--teal)"></i>当前动作</span><span class="r-val" data-bind="robotPhase2">待机</span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">JOINTS</span><span class="card-title">关节角度</span></div><span class="card-chip teal">6 AXIS</span></div>
    ${[0, 1, 2, 3].map((i) => `<div class="bar-row"><div class="bar-meta"><span>J${i + 1} ${['回转', '肩部', '肘部', '腕部'][i]}</span><b data-bind="j${i}">0°</b></div><div class="bar-track"><i class="bar-fill ${i % 2 ? 'teal' : ''}" data-bind="jb${i}" style="width:0%"></i></div></div>`).join('')}
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">WORK ORDERS</span><span class="card-title">工单队列</span></div><span class="card-chip">3</span></div>
    ${WORK_ORDERS.map((w) => `<div class="bar-row"><div class="bar-meta"><span>${w.code} · ${w.name}</span><b>${w.progress}%</b></div><div class="bar-track"><i class="bar-fill ${w.tone}" style="width:${w.progress}%"></i></div></div>`).join('')}
    <div class="rows" style="margin-top:.55rem">
      <div class="row"><span class="r-label">今日计划</span><span class="r-val">3,200 <small>件</small></span></div>
      <div class="row"><span class="r-label">已完成</span><span class="r-val accent"><span data-bind="production">2,847</span> <small>件</small></span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">ARM HEALTH</span><span class="card-title">机器人健康</span></div><span class="card-chip teal">正常</span></div>
    <div class="rows">
      <div class="row"><span class="r-label">J2 减速机温度</span><span class="r-val">42.6 <small>°C</small></span></div>
      <div class="row"><span class="r-label">J3 电流</span><span class="r-val">3.8 <small>A</small></span></div>
      <div class="row"><span class="r-label">线缆磨损</span><span class="r-val accent">0.0 <small>mm</small></span></div>
      <div class="row"><span class="r-label">下次保养</span><span class="r-val">12 <small>天后</small></span></div>
    </div>
  </section>`;
}

function pageMaintenance(state) {
  return `
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">HEALTH</span><span class="card-title">设备健康度</span></div><span class="card-chip teal">良好</span></div>
    <div class="hero-metric"><b style="color:var(--teal)">92</b><span>/ 100</span><em>全厂 116 台在线</em></div>
    <div class="bar-row"><div class="bar-meta"><span>综合健康</span><b>92%</b></div><div class="bar-track"><i class="bar-fill teal" style="width:92%"></i></div></div>
    <div class="row" style="margin-top:.5rem"><span class="r-label"><i style="background:var(--teal)"></i>预测性维护覆盖</span><span class="r-val teal">86 %</span></div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">AP-01 / TELEMETRY</span><span class="card-title">螺杆空压机</span></div><span class="card-chip warn">接近阈值</span></div>
    <div class="stat-row">
      <div class="stat"><div class="s-label">运行温度</div><div class="s-val warn" data-bind="temp">68.5<small>°C</small></div><div class="s-sub">阈值 80 °C</div></div>
      <div class="stat"><div class="s-label">排气压力</div><div class="s-val" data-bind="pressure">0.82<small>MPa</small></div><div class="s-sub">额定 1.0 MPa</div></div>
    </div>
    <div class="rows" style="margin-top:.55rem">
      <div class="row"><span class="r-label">主机转速</span><span class="r-val">2,850 <small>RPM</small></span></div>
      <div class="row"><span class="r-label">累计运行</span><span class="r-val">128 <small>h</small></span></div>
      <div class="row"><span class="r-label">振动烈度</span><span class="r-val">1.8 <small>mm/s</small></span></div>
    </div>
    ${sparkline(sparkValues(34, 21, 0.6, 0.12), { color: 'var(--teal)', h: 46 })}
    <div class="mini-legend"><span><i style="background:var(--teal)"></i>温度趋势 24h</span><span>峰值 69.2 °C</span></div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">PLAN</span><span class="card-title">维护计划</span></div><span class="card-chip">3</span></div>
    <div class="rows">
      ${MAINTENANCE_PLAN.map((m) => `<div class="row"><span class="r-label"><i style="background:${m.level ? 'var(--amber)' : 'var(--ink-4)'}"></i>${m.code} · ${m.name}</span><span class="r-val ${m.level ? 'warn' : ''}">${m.due}</span></div>`).join('')}
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">ENERGY</span><span class="card-title">能耗分布</span></div><span class="card-chip teal">-4.2%</span></div>
    ${[['加工设备', 42, ''], ['空压系统', 27, 'teal'], ['输送 / AGV', 18, ''], ['照明 / 辅助', 13, 'teal']].map(([n, v, tone]) => `<div class="bar-row"><div class="bar-meta"><span>${n}</span><b>${v}%</b></div><div class="bar-track"><i class="bar-fill ${tone}" style="width:${v}%"></i></div></div>`).join('')}
  </section>`;
}

function pageInspection(state) {
  return `
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">SCAN-02 / RESULT</span><span class="card-title">在线检测</span></div><span class="card-chip teal" data-bind="scanChip">PASS</span></div>
    <div class="result" data-bind="resultCard">
      <div class="r-lg" data-bind="resultIcon">PASS</div>
      <div class="r-body"><div class="r-title" data-bind="scanTitle">尺寸合格 · 已放行</div><div class="r-sub" data-bind="scanSub">检测完成 · 17:32:18</div></div>
      <div class="r-side" data-bind="scanDev">+0.012<small>mm 偏差</small></div>
    </div>
    <div class="tol">
      <div class="tol-scale">
        ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => `<i class="tick ${i % 2 === 0 ? 'major' : ''}" style="left:${50 + i * 10}%"></i>`).join('')}
        <div class="zone"></div>
        <div class="pin" data-bind="tolPin" style="left:52.4%"></div>
      </div>
      <div class="tol-labels"><span>-0.050</span><span>0.000</span><span>+0.050 mm</span></div>
    </div>
    <div class="rows" style="margin-top:.55rem">
      <div class="row"><span class="r-label">测量尺寸</span><span class="r-val" data-bind="dimension">42.062 <small>mm</small></span></div>
      <div class="row"><span class="r-label">公差带</span><span class="r-val">±0.050 <small>mm</small></span></div>
      <div class="row"><span class="r-label">点云数量</span><span class="r-val accent" data-bind="points">1,284 <small>点</small></span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">PROCESS</span><span class="card-title">扫描过程</span></div><span class="card-chip teal" data-bind="scanState">完成</span></div>
    <div class="bar-row"><div class="bar-meta"><span>扫描进度</span><b data-bind="scanPct">100%</b></div><div class="bar-track"><i class="bar-fill teal" data-bind="scanBar" style="width:100%"></i></div></div>
    ${sparkline(sparkValues(30, 32, 0.78, 0.1), { color: 'var(--teal)', h: 52 })}
    <div class="mini-legend"><span><i style="background:var(--teal)"></i>近 30 件通过率</span><span>99.2 %</span></div>
    <div class="rows" style="margin-top:.4rem">
      <div class="row"><span class="r-label">在线节拍</span><span class="r-val">8.6 <small>s / 件</small></span></div>
      <div class="row"><span class="r-label">重复精度</span><span class="r-val">±0.008 <small>mm</small></span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">LOG</span><span class="card-title">检测记录</span></div><span class="card-chip">最近 3 件</span></div>
    <div class="rows">
      ${INSPECTION_LOG.map((r) => `<div class="row"><span class="r-label">${r.t} · ${r.id}</span><span class="r-val ${r.ok ? 'accent' : 'warn'}">${r.dim} <small>mm</small> · ${r.dev}</span></div>`).join('')}
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">QUALITY</span><span class="card-title">质量指标</span></div><span class="card-chip teal">稳定</span></div>
    <div class="stat-row">
      <div class="stat"><div class="s-label">CPK</div><div class="s-val accent">1.67</div></div>
      <div class="stat"><div class="s-label">重复精度</div><div class="s-val">±0.008<small>mm</small></div></div>
    </div>
    <div class="rows" style="margin-top:.5rem">
      <div class="row"><span class="r-label">今日检测</span><span class="r-val">2,301 <small>件</small></span></div>
      <div class="row"><span class="r-label">不合格</span><span class="r-val warn">18 <small>件</small></span></div>
    </div>
  </section>`;
}

function pageLogistics(state) {
  return `
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">AGV-01 / TASK T-2041</span><span class="card-title">物料配送</span></div><span class="card-chip" data-bind="agvChip">配送中</span></div>
    <div class="hero-metric"><b data-bind="agvProgress">0</b><span>% 任务进度</span><em data-bind="agvState">待发车</em></div>
    <div class="bar-row"><div class="bar-meta"><span>上料位 A → 工位 B</span><b data-bind="agvProgress2">0%</b></div><div class="bar-track"><i class="bar-fill" data-bind="agvBar" style="width:0%"></i></div></div>
    <div class="stat-row" style="margin-top:.65rem">
      <div class="stat"><div class="s-label">运行速度</div><div class="s-val" data-bind="agvSpeed">0.0<small>m/s</small></div></div>
      <div class="stat"><div class="s-label">电池电量</div><div class="s-val accent" data-bind="agvBattery">78<small>%</small></div></div>
    </div>
    <div class="rows" style="margin-top:.5rem">
      <div class="row"><span class="r-label">当前位置</span><span class="r-val" data-bind="agvX">X 16.0 m</span></div>
      <div class="row"><span class="r-label">导航方式</span><span class="r-val">SLAM 激光导航</span></div>
      <div class="row"><span class="r-label">载重</span><span class="r-val">320 <small>kg</small></span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">ROUTE</span><span class="card-title">配送路线</span></div><span class="card-chip teal">实时</span></div>
    <svg class="spark" viewBox="0 0 200 84" preserveAspectRatio="none" style="height:5.2rem">
      <rect x="12" y="30" width="176" height="24" fill="rgba(154,190,168,.05)" stroke="rgba(154,190,168,.15)" stroke-width=".6"/>
      <line x1="24" y1="42" x2="176" y2="42" stroke="rgba(200,255,61,.25)" stroke-width=".8" stroke-dasharray="4 4"/>
      <rect x="14" y="34" width="12" height="16" fill="none" stroke="rgba(255,180,84,.6)" stroke-width=".8"/>
      <rect x="174" y="34" width="12" height="16" fill="none" stroke="rgba(93,242,196,.6)" stroke-width=".8"/>
      <text x="20" y="66" fill="rgba(255,180,84,.7)" font-size="7" font-family="DIN Alternate, monospace">A</text>
      <text x="178" y="66" fill="rgba(93,242,196,.7)" font-size="7" font-family="DIN Alternate, monospace">B</text>
      <circle class="dot" data-bind="mapDot" cx="20" cy="42" r="3.2" fill="#c8ff3d"/>
      <circle cx="20" cy="42" r="7" fill="none" stroke="rgba(200,255,61,.3)" stroke-width=".7" data-bind="mapPulse"/>
    </svg>
    <div class="rows" style="margin-top:.3rem">
      <div class="row"><span class="r-label">起点</span><span class="r-val">上料位 A · X 16.0</span></div>
      <div class="row"><span class="r-label">终点</span><span class="r-val">工位 B · X 8.0</span></div>
      <div class="row"><span class="r-label">路径长度</span><span class="r-val">8.0 <small>m</small></span></div>
    </div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">QUEUE</span><span class="card-title">任务队列</span></div><span class="card-chip">2</span></div>
    <div class="rows">
      ${LOGISTICS_QUEUE.map((q) => `<div class="row"><span class="r-label"><i style="background:${q.tone === 'accent' ? 'var(--accent)' : 'var(--ink-4)'}"></i>${q.id} · ${q.from} → ${q.to}</span><span class="r-val ${q.tone}">${q.state}</span></div>`).join('')}
    </div>
    <div class="row" style="margin-top:.4rem"><span class="r-label">今日完成</span><span class="r-val accent">42 <small>单</small></span></div>
    <div class="row"><span class="r-label">平均耗时</span><span class="r-val">6.4 <small>min</small></span></div>
  </section>
  <section class="card fade-in">
    <div class="card-head"><div><span class="eyebrow">FLEET</span><span class="card-title">AGV 状态</span></div><span class="card-chip teal">1 / 3 任务</span></div>
    <div class="rows">
      <div class="row"><span class="r-label"><i style="background:var(--accent)"></i>AGV-01 · 配送中</span><span class="r-val accent">78%</span></div>
      <div class="row"><span class="r-label"><i style="background:var(--teal)"></i>AGV-02 · 充电中</span><span class="r-val">96%</span></div>
      <div class="row"><span class="r-label"><i style="background:#4a5a52"></i>AGV-03 · 待命</span><span class="r-val">64%</span></div>
    </div>
  </section>`;
}

const PAGE_BUILDERS = {
  overview: pageOverview,
  production: pageProduction,
  maintenance: pageMaintenance,
  inspection: pageInspection,
  logistics: pageLogistics,
};

export function createUI(state, handlers) {
  const treeEl = document.getElementById('asset-tree');
  const kpiEl = document.getElementById('kpi-grid');
  const eventEl = document.getElementById('event-list');
  const pagePanel = document.getElementById('page-panel');
  const deviceEl = document.getElementById('device-card');
  const clockEl = document.getElementById('clock-time');
  const stageTitle = document.getElementById('stage-title');
  const cameraMode = document.getElementById('camera-mode');
  const tabs = [...document.querySelectorAll('.tab')];
  const tlProgress = document.getElementById('tl-progress');
  const tlHead = document.getElementById('tl-head');
  const tlMarks = document.getElementById('tl-marks');
  const tlLabels = document.getElementById('tl-labels');
  const autoBtn = document.getElementById('btn-auto');
  const autoLabel = document.getElementById('auto-label');
  const autoIco = document.getElementById('auto-ico');
  const resetBtn = document.getElementById('btn-reset');
  const endcard = document.getElementById('endcard');
  const fpsEl = document.getElementById('fps');
  const drawEl = document.getElementById('drawcalls');
  const triEl = document.getElementById('tris');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loader-fill');

  let page = null;
  let selected = null;
  let refs = new Map();
  let lastEventScan = false;
  let lastEventAgv = false;
  let lastPerf = 0;

  // 资产树
  treeEl.innerHTML = buildTree();
  treeEl.addEventListener('click', (e) => {
    const row = e.target.closest('.tree-row[data-device="1"]');
    if (!row) return;
    const id = row.dataset.id;
    handlers.select(id, true);
  });

  // KPI
  kpiEl.innerHTML = `
    <div class="kpi"><div class="kpi-label">资产总数</div><div class="kpi-val">128</div><div class="kpi-sub">ASSETS</div></div>
    <div class="kpi"><div class="kpi-label">在线设备</div><div class="kpi-val accent">116</div><div class="kpi-sub">ONLINE · 90.6%</div></div>
    <div class="kpi"><div class="kpi-label">综合效率</div><div class="kpi-val" data-bind="kpiOee">87.4<em>%</em></div><div class="kpi-sub">OEE</div></div>
    <div class="kpi"><div class="kpi-label">未处理告警</div><div class="kpi-val warn">3</div><div class="kpi-sub">ALERTS</div></div>`;

  // 事件
  eventEl.innerHTML = EVENTS.map((ev) => `
    <div class="event"><span class="time">${ev.time}</span>
      <span class="e-text"><b>${ev.asset}</b> · ${ev.text}</span>
      <span class="e-type ${ev.kind}">${ev.type}</span></div>`).join('');

  // 时间轴
  tlMarks.innerHTML = SEGMENTS.map((s) => `<i class="tl-mark" style="left:${(s.t0 / DURATION) * 100}%" data-seg="${s.id}"></i>`).join('') +
    `<i class="tl-mark" style="left:100%"></i>`;
  tlLabels.innerHTML = SEGMENTS.map((s) => `<span class="tl-label" style="left:${(s.t0 / DURATION) * 100}%" data-seg="${s.id}">${s.label}<em>${s.t0.toFixed(1)}s</em></span>`).join('');
  const tlTrack = document.querySelector('.tl-track');
  tlTrack.addEventListener('click', (e) => {
    const r = tlTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    handlers.seek(ratio * DURATION);
  });

  tabs.forEach((t) => t.addEventListener('click', () => handlers.page(t.dataset.page)));
  autoBtn.addEventListener('click', () => handlers.toggleAuto());
  resetBtn.addEventListener('click', () => handlers.reset());

  pagePanel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'deselect') handlers.select(null);
    if (btn.dataset.action === 'focus') handlers.focus(btn.dataset.id);
  });
  deviceEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'deselect') handlers.select(null);
    if (btn.dataset.action === 'focus') handlers.focus(btn.dataset.id);
  });

  function collectRefs() {
    refs = new Map();
    [pagePanel, deviceEl, kpiEl].forEach((root) => {
      root.querySelectorAll('[data-bind]').forEach((el) => refs.set(el.dataset.bind, el));
    });
  }

  function setPage(next, st, force = false) {
    if (!force && next === page) return;
    page = next;
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.page === next));
    const p = PAGES[next];
    stageTitle.textContent = p.stage;
    pagePanel.innerHTML = PAGE_BUILDERS[next](st);
    collectRefs();
  }

  function setSelected(id, st) {
    if (id === selected) {
      if (id) {
        // 同一设备仅刷新指标
        updateDeviceMetrics(st);
      }
      return;
    }
    selected = id;
    if (id) {
      deviceEl.innerHTML = deviceCard(id, st);
      collectRefs();
      updateDeviceMetrics(st);
    } else {
      deviceEl.innerHTML = '';
      collectRefs();
    }
    treeEl.querySelectorAll('.tree-row').forEach((r) => r.classList.toggle('selected', r.dataset.id === id));
  }

  function updateDeviceMetrics(st) {
    if (!selected) return;
    const card = deviceEl.querySelector('[data-device-card]');
    if (!card) return;
    const a = ASSETS[selected];
    if (!a || !a.metrics) return;
    const metrics = a.metrics(st);
    const cells = card.querySelectorAll('.dc-metric b');
    metrics.forEach((m, i) => {
      const cell = cells[i];
      if (!cell) return;
      let val = m.value;
      if (m.key === 'robotPhase') val = st.robot.phase;
      if (m.label === '当前动作') {
        cell.innerHTML = `<span style="font-size:.72rem">${val}</span>`;
      } else if (typeof val === 'number' && m.unit) {
        cell.innerHTML = `${val}<small>${m.unit}</small>`;
      } else {
        cell.textContent = val ?? '—';
      }
      cell.classList.toggle('warn', !!m.warn);
    });
  }

  function prependEvent(clock, asset, text, type, kind) {
    const el = document.createElement('div');
    el.className = 'event fade-in';
    el.innerHTML = `<span class="time">${formatClock(clock)}</span><span class="e-text"><b>${asset}</b> · ${text}</span><span class="e-type ${kind}">${type}</span>`;
    eventEl.prepend(el);
    while (eventEl.children.length > 5) eventEl.lastElementChild.remove();
  }

  function setAuto(playing, manual = false) {
    autoBtn.classList.toggle('paused', !playing);
    autoLabel.textContent = playing ? '暂停演示' : '继续演示';
    autoIco.textContent = playing ? '❚❚' : '▶';
    cameraMode.classList.toggle('manual', manual);
    cameraMode.innerHTML = manual
      ? '<i></i>手动控制 · MANUAL'
      : (playing ? '<i></i>自动演示 · AUTO' : '<i></i>自动演示 · 已暂停');
  }

  function setEndcard(on) {
    endcard.classList.toggle('show', on);
    document.body.classList.toggle('outro', on);
  }

  function hideLoader() {
    loader.classList.add('hide');
  }

  function setLoader(p) {
    loaderFill.style.width = `${Math.round(p * 100)}%`;
  }

  function update(st, force = false) {
    update._last = update._last || 0;
    const now = performance.now();
    const slow = force || now - update._last > 66;
    if (slow) update._last = now;

    if (page !== st.page) setPage(st.page, st);

    if (selected !== st.selected) setSelected(st.selected, st);

    clockEl.textContent = formatClock(st.clock);

    if (slow) {
      const oeeEl = refs.get('oee');
      if (oeeEl) oeeEl.innerHTML = `${st.oee.toFixed(1)}<small>%</small>`;
      const kpiOee = refs.get('kpiOee');
      if (kpiOee) kpiOee.innerHTML = `${st.oee.toFixed(1)}<em>%</em>`;
      const prodEl = refs.get('production');
      if (prodEl) prodEl.textContent = st.production.toLocaleString('en-US');
      const outputPct = Math.min(100, (st.production / 3200) * 100);
      const outputBar = refs.get('outputBar');
      if (outputBar) outputBar.style.width = `${outputPct.toFixed(1)}%`;
      const outputPctEl = refs.get('outputPct');
      if (outputPctEl) outputPctEl.textContent = `${Math.round(outputPct)}%`;

      // 生产页
      const phase = refs.get('robotPhase');
      if (phase) phase.textContent = st.robot.phase;
      const phase2 = refs.get('robotPhase2');
      if (phase2) phase2.textContent = st.robot.phase;
      const gripper = refs.get('gripper');
      if (gripper) {
        gripper.textContent = st.robot.gripper < 0.15 ? '闭合 · 夹持中' : '张开';
        gripper.classList.toggle('accent', st.robot.gripper < 0.15);
      }
      const joints = st.robotJoints || [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        const v = joints[i] || 0;
        const jel = refs.get(`j${i}`);
        if (jel) jel.textContent = `${v.toFixed(0)}°`;
        const jb = refs.get(`jb${i}`);
        if (jb) jb.style.width = `${Math.min(100, Math.abs(v) / 1.8).toFixed(1)}%`;
      }

      // 运维页
      const tempEl = refs.get('temp');
      if (tempEl) tempEl.innerHTML = `${st.temp.toFixed(1)}<small>°C</small>`;
      const pressEl = refs.get('pressure');
      if (pressEl) pressEl.innerHTML = `${st.pressure.toFixed(2)}<small>MPa</small>`;

      // 检测页
      const sc = st.scan;
      const chip = refs.get('scanChip');
      if (chip) {
        chip.textContent = sc.active ? '扫描中' : sc.done ? 'PASS' : '待检';
        chip.className = `card-chip ${sc.active ? 'teal' : sc.done ? 'teal' : ''}`;
      }
      const resultCard = refs.get('resultCard');
      if (resultCard) {
        resultCard.classList.toggle('scanning', sc.active);
        if (resultCard.firstElementChild) resultCard.firstElementChild.classList.toggle('scanning', sc.active);
      }
      const iconEl = refs.get('resultIcon');
      if (iconEl) iconEl.textContent = sc.active ? `${Math.round(sc.progress * 100)}%` : sc.done ? 'PASS' : '待检';
      const title = refs.get('scanTitle');
      if (title) title.textContent = sc.active ? '扫描中 · 请稍候' : sc.done ? '尺寸合格 · 已放行' : '等待来料 · 站内无工件';
      const sub = refs.get('scanSub');
      if (sub) sub.textContent = sc.active ? '激光轮廓扫描进行中' : sc.done ? '检测完成 · 结果已上传' : '输送线运行正常';
      const devEl = refs.get('scanDev');
      if (devEl) devEl.innerHTML = `${sc.deviation >= 0 ? '+' : ''}${sc.deviation.toFixed(3)}<small>mm 偏差</small>`;
      const dimEl = refs.get('dimension');
      if (dimEl) dimEl.innerHTML = `${sc.dimension.toFixed(3)} <small>mm</small>`;
      const pts = refs.get('points');
      if (pts) pts.innerHTML = `${sc.points.toLocaleString('en-US')} <small>点</small>`;
      const pin = refs.get('tolPin');
      if (pin) pin.style.left = `${50 + (sc.deviation / 0.05) * 50 * 0.85}%`;
      const scanPct = refs.get('scanPct');
      if (scanPct) scanPct.textContent = `${Math.round(sc.progress * 100)}%`;
      const scanBar = refs.get('scanBar');
      if (scanBar) scanBar.style.width = `${sc.progress * 100}%`;
      const scanState = refs.get('scanState');
      if (scanState) scanState.textContent = sc.active ? '扫描中' : sc.done ? '完成' : '待机';

      // 物流页
      const ag = st.agv;
      const prog = Math.round(ag.progress);
      const p1 = refs.get('agvProgress');
      if (p1) p1.textContent = prog;
      const p2 = refs.get('agvProgress2');
      if (p2) p2.textContent = `${prog}%`;
      const bar = refs.get('agvBar');
      if (bar) bar.style.width = `${prog}%`;
      const chipAgv = refs.get('agvChip');
      if (chipAgv) { chipAgv.textContent = ag.state; chipAgv.className = `card-chip ${ag.moving ? '' : 'teal'}`; }
      const stateEl = refs.get('agvState');
      if (stateEl) stateEl.textContent = ag.state;
      const speedEl = refs.get('agvSpeed');
      if (speedEl) speedEl.innerHTML = `${ag.speed.toFixed(1)}<small>m/s</small>`;
      const batEl = refs.get('agvBattery');
      if (batEl) batEl.innerHTML = `${ag.battery}<small>%</small>`;
      const xEl = refs.get('agvX');
      if (xEl) xEl.textContent = `X ${ag.x.toFixed(1)} m`;
      const mapDot = refs.get('mapDot');
      if (mapDot) {
        const cx = 20 + (ag.progress / 100) * 150;
        mapDot.setAttribute('cx', cx.toFixed(1));
        const pulse = refs.get('mapPulse');
        if (pulse) {
          pulse.setAttribute('cx', cx.toFixed(1));
          pulse.setAttribute('r', (5 + (Math.sin(st.t * 5) * 0.5 + 0.5) * 3).toFixed(1));
          pulse.setAttribute('opacity', (0.18 + (Math.sin(st.t * 5) * 0.5 + 0.5) * 0.22).toFixed(2));
        }
      }

      // 事件联动
      if (sc.done && !lastEventScan) {
        lastEventScan = true;
        prependEvent(st.clock, 'SCAN-02', '检测完成 · PASS · 偏差 +0.012 mm', '质量', 'ok');
      }
      if (!sc.done && lastEventScan && st.t < 17) lastEventScan = false;
      if (ag.progress >= 99.9 && !lastEventAgv) {
        lastEventAgv = true;
        prependEvent(st.clock, 'AGV-01', '任务 T-2041 到达工位 B', '运单', 'ok');
      }
      if (ag.progress < 2 && lastEventAgv && st.t < 20) lastEventAgv = false;
    }

    // 时间轴
    const ratio = st.t / DURATION;
    tlProgress.style.width = `${ratio * 100}%`;
    tlHead.style.left = `${ratio * 100}%`;
    tlMarks.querySelectorAll('[data-seg]').forEach((m, i) => m.classList.toggle('active', i === st.segment));
    tlLabels.querySelectorAll('[data-seg]').forEach((m) => m.classList.toggle('active', m.dataset.seg === st.segmentId));

    // 设备卡指标每帧刷新
    updateDeviceMetrics(st);
  }

  function updatePerf(renderer) {
    const now = performance.now();
    if (now - lastPerf < 500) return;
    lastPerf = now;
    fpsEl.textContent = Math.round(renderer.__fps || 0);
    drawEl.textContent = renderer.info.render.calls;
    triEl.textContent = `${(renderer.info.render.triangles / 1000).toFixed(0)}k`;
  }

  return {
    update,
    setPage,
    setSelected,
    updatePerf,
    setAuto,
    setEndcard,
    hideLoader,
    setLoader,
    get page() { return page; },
    get selected() { return selected; },
  };
}

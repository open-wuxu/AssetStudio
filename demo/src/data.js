// 演示用模拟数据。所有数值均由时间轴驱动，仅用于产品演示，不代表真实生产数据。

export const ASSETS = {
  'factory-a': {
    id: 'factory-a', name: '虚拟工厂 A', code: 'FAC-A', type: 'factory',
    status: 'running', level: 1,
  },
  'workshop-a': {
    id: 'workshop-a', name: '车间 A · 总装', code: 'WS-A', type: 'workshop',
    status: 'running', level: 2,
  },
  'line-01': {
    id: 'line-01', name: '产线 01', code: 'LINE-01', type: 'line',
    status: 'running', level: 3,
  },
  'arm-06': {
    id: 'arm-06', name: '六轴装配机械臂', code: 'ARM-06', type: 'robot',
    status: 'running', page: 'production', level: 4,
    metrics: () => [
      { label: '当前动作', value: null, key: 'robotPhase' },
      { label: '负载', value: 12.4, unit: 'kg' },
      { label: '循环节拍', value: 42.5, unit: 's' },
    ],
  },
  'cv-01': {
    id: 'cv-01', name: '进料输送线', code: 'CV-01', type: 'conveyor',
    status: 'running', page: 'production', level: 4,
    metrics: () => [
      { label: '线体速度', value: 0.55, unit: 'm/s' },
      { label: '在制品', value: 6, unit: '件' },
      { label: '累计输送', value: 2847, unit: '件' },
    ],
  },
  'scan-02': {
    id: 'scan-02', name: '在线检测站', code: 'SCAN-02', type: 'scanner',
    status: 'running', page: 'inspection', level: 4,
    metrics: (s) => [
      { label: '检测结果', value: s.scan.resultLabel, accent: true },
      { label: '尺寸偏差', value: s.scan.deviation.toFixed(3), unit: 'mm' },
      { label: '点云数量', value: s.scan.points, unit: '点' },
    ],
  },
  'agv-01': {
    id: 'agv-01', name: '搬运机器人', code: 'AGV-01', type: 'agv',
    status: 'running', page: 'logistics', level: 4,
    metrics: (s) => [
      { label: '运行速度', value: s.agv.speed.toFixed(1), unit: 'm/s' },
      { label: '电池电量', value: s.agv.battery, unit: '%' },
      { label: '任务进度', value: Math.round(s.agv.progress), unit: '%' },
    ],
  },
  'cnc-03': {
    id: 'cnc-03', name: '数控加工中心', code: 'CNC-03', type: 'cnc',
    status: 'running', page: 'maintenance', level: 4,
    metrics: () => [
      { label: '主轴转速', value: 8400, unit: 'RPM' },
      { label: '主轴温度', value: 54.2, unit: '°C' },
      { label: '振动值', value: 1.8, unit: 'mm/s' },
    ],
  },
  'ap-01': {
    id: 'ap-01', name: '螺杆空压机', code: 'AP-01', type: 'compressor',
    status: 'warning', page: 'maintenance', level: 4,
    metrics: () => [
      { label: '运行温度', value: 68.5, unit: '°C', warn: true },
      { label: '排气压力', value: 0.82, unit: 'MPa' },
      { label: '转速', value: 2850, unit: 'RPM' },
    ],
  },
  'cab-01': {
    id: 'cab-01', name: '电气控制柜', code: 'CAB-01', type: 'cabinet',
    status: 'running', page: 'maintenance', level: 4,
    metrics: () => [
      { label: '母线电压', value: 382, unit: 'V' },
      { label: '负载电流', value: 46.2, unit: 'A' },
      { label: '柜内温度', value: 32.4, unit: '°C' },
    ],
  },
};

export const TREE = [
  {
    id: 'factory-a', depth: 1, open: true,
    children: [
      {
        id: 'workshop-a', depth: 2, open: true,
        children: [
          {
            id: 'line-01', depth: 3, open: true,
            children: [
              { id: 'arm-06', depth: 4 },
              { id: 'cv-01', depth: 4 },
              { id: 'scan-02', depth: 4 },
              { id: 'agv-01', depth: 4 },
              { id: 'cnc-03', depth: 4 },
              { id: 'ap-01', depth: 4 },
              { id: 'cab-01', depth: 4 },
            ],
          },
        ],
      },
    ],
  },
];

export const PAGES = {
  overview: {
    en: 'OVERVIEW', title: '系统总览', sub: '工厂运行态势',
    stage: '车间 A · 产线 01',
  },
  production: {
    en: 'PRODUCTION', title: '生产运行', sub: '装配与节拍',
    stage: '产线 01 · 机器人装配单元',
  },
  maintenance: {
    en: 'MAINTENANCE', title: '设备运维', sub: '健康与能耗',
    stage: '车间 A · 动力与加工设备',
  },
  inspection: {
    en: 'INSPECTION', title: '在线检测', sub: '尺寸与质量',
    stage: '产线 01 · 在线检测站',
  },
  logistics: {
    en: 'LOGISTICS', title: '物流配送', sub: 'AGV 与任务',
    stage: '车间 A · 物流通道',
  },
};

export const EVENTS = [
  { time: '14:31:52', asset: 'AGV-01', text: '任务 T-2041 已接单，前往工位 B', type: '运单', kind: 'ok' },
  { time: '14:30:18', asset: 'SCAN-02', text: '检测完成 · 尺寸偏差 +0.012 mm', type: '质量', kind: 'ok' },
  { time: '14:28:04', asset: 'AP-01', text: '运行温度 68.5°C，接近预警阈值', type: '告警', kind: 'warn' },
  { time: '14:27:36', asset: 'ARM-06', text: '装配循环完成 · 节拍 42.5 s', type: '生产', kind: 'ok' },
  { time: '14:26:10', asset: 'CNC-03', text: '刀具寿命剩余 72%，状态正常', type: '设备', kind: '' },
];

export const WORK_ORDERS = [
  { code: 'WO-2411-08', name: '伺服壳体 · A 型', qty: '1,200', progress: 78, tone: '' },
  { code: 'WO-2411-09', name: '减速器端盖', qty: '860', progress: 46, tone: 'teal' },
  { code: 'WO-2411-10', name: '传感器支架', qty: '2,400', progress: 21, tone: 'amber' },
];

export const MAINTENANCE_PLAN = [
  { code: 'AP-01', name: '空压机滤芯更换', due: '2 天后', level: 'warn' },
  { code: 'CNC-03', name: '主轴振动复检', due: '5 天后', level: '' },
  { code: 'ARM-06', name: '减速机润滑保养', due: '12 天后', level: '' },
];

export const INSPECTION_LOG = [
  { t: '14:30:18', id: 'P-8842', dim: '42.06', dev: '+0.012', ok: true },
  { t: '14:28:42', id: 'P-8841', dim: '42.03', dev: '+0.008', ok: true },
  { t: '14:27:06', id: 'P-8840', dim: '41.97', dev: '-0.018', ok: true },
];

export const LOGISTICS_QUEUE = [
  { id: 'T-2041', from: '上料位 A', to: '工位 B', state: '执行中', tone: 'accent' },
  { id: 'T-2042', from: '成品库', to: '发货区', state: '排队中', tone: '' },
];

// 稳定的伪随机序列，保证每次录制一致
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sparkValues(n, seed, base = 0.5, amp = 0.2) {
  const rnd = seeded(seed);
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * amp;
    v = Math.min(1, Math.max(0.08, v));
    out.push(v);
  }
  return out;
}

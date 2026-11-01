# WUXU · AssetStudio 初步产品设计方案

产品方向建议

V0.1 产品规划

将 AssetStudio 作为「物序 WUXU」旗下的第一款产品，定位为：

一款面向工业物联网与专业设备场景的开源可视化资产管理与监控平台。

它不是传统的 ERP 资产台账，也不是一个简单的 IoT Dashboard，而是以「物理资产数字化」为核心，将设备、传感器、空间、数据、关系和运行状态组织在一个统一的数字化环境中。

核心理念：

> 让每一个物理资产都拥有数字身份，让复杂的设备系统变得可见、可管理、可理解。

英文描述：

> A Visual Platform for Industrial Assets, Devices and Connected Systems.

## 一、产品定位与核心理念

### 1. AssetStudio 解决什么问题？

目前工业设备管理、物联网监控和数字孪生通常存在一些问题：

| 现有问题         | AssetStudio 的解决方向 |
| ------------ | ----------------- |
| 设备信息分散在不同系统  | 统一设备与资产模型         |
| 设备之间的关系不直观   | 可视化拓扑与层级关系        |
| 设备数据缺少业务上下文  | 设备与实时数据关联         |
| 监控页面需要大量人工配置 | 可视化 Dashboard 编辑器 |
| 设备状态难以整体感知   | 实时状态与事件可视化        |
| 系统之间缺少统一数据接口 | 标准化 API 与数据接入机制   |
| 传统系统部署复杂     | Docker 自主部署       |

AssetStudio 不需要取代已有的工业控制系统、SCADA 或 MES。

它应该首先成为这些系统之上的一个轻量级数字化资产管理与可视化层。

### 2. 产品核心定位

# AssetStudio

by WUXU · 物序

Industrial Asset Visualization Platform

工业资产可视化平台

Asset Modeling

设备与资产建模

Relationship

设备关系与拓扑

Monitoring

实时数据与状态监控

Visualization

仪表盘与可视化工作台

### 3. 目标用户

第一阶段不直接面向大型制造企业的生产管理部门，而是优先面向：

- 工业物联网开发者。
- 自动化工程师。
- 设备管理与运维人员。
- 工业系统集成商。
- 中小型制造企业的技术团队。
- 有设备数据可视化需求的研发团队。

这样更容易通过开源社区获得第一批用户，也更容易形成标准化产品。

# 二、核心功能体系

我建议将 AssetStudio 划分为六个核心模块。

01\. Asset Management · 资产管理

管理物理设备及其数字化身份。

- 设备注册与编辑
- 设备分类、标签、分组
- 设备型号与模板
- 设备属性与元数据
- 设备生命周期状态
- 设备附件及文档

02\. Asset Topology · 资产拓扑

通过可视化方式管理设备之间的关系。

- 设备层级结构
- 父子设备关系
- 设备连接关系
- 设备组与空间关系
- 拓扑画布编辑
- 设备状态映射

03\. Device Connectivity · 设备接入

连接真实设备和外部数据源。

- MQTT 接入
- HTTP API 接入
- 设备身份认证
- 数据点映射
- 数据接入状态
- 数据模拟器

04\. Telemetry · 数据监控

将实时数据与设备模型关联。

- 实时数据采集
- 时序数据存储
- 历史数据查询
- 数据曲线
- 设备运行状态
- 阈值告警

05\. Dashboard Studio · 可视化工作台

用户自主设计设备监控页面。

- 拖拽式布局
- 图表组件
- 设备状态卡片
- 仪表盘
- 数据绑定
- 页面保存与分享

06\. Events & Alerts · 事件与告警

管理设备运行过程中产生的异常。

- 阈值规则
- 状态变化事件
- 告警记录
- 告警确认
- 告警通知接口
- 事件历史

这里有一个重要的产品设计原则：

资产是核心对象，数据是资产的动态表现，拓扑是资产之间的关系，可视化是用户理解整个系统的主要方式。

这四者应该从数据模型层面就建立关联，而不是分别开发六个互不相干的功能模块。

# 三、核心产品设计：以 Asset 为中心的数据模型

这是 AssetStudio 最值得投入设计精力的地方。

如果仅仅将设备、传感器、图表和拓扑分开管理，最终很容易成为一个普通的 IoT 管理后台。

先建立统一的 Asset Domain Model。

## 1. 核心领域对象

| 对象            | 说明        | 示例        |
| ------------- | --------- | --------- |
| Asset         | 物理资产的数字身份 | 一台空压机     |
| AssetType     | 资产类型      | 空压机、泵、电机  |
| AssetTemplate | 资产模板      | 某型号空压机模板  |
| Attribute     | 静态属性      | 型号、厂商、序列号 |
| Telemetry     | 动态数据      | 温度、压力、转速  |
| Relationship  | 资产关系      | 从属、连接、安装  |
| Location      | 物理位置      | 厂区、车间、生产线 |
| Event         | 运行事件      | 启动、停止、异常  |
| Alarm         | 告警记录      | 温度超过阈值    |
| Dashboard     | 可视化视图     | 设备运行监控面板  |

需要区分三个概念：

- Attribute：设备相对稳定的属性。
- Telemetry：随时间变化的测量数据。
- State：系统根据设备数据和业务规则计算出的当前状态。

例如：

Asset：空压机 A-001

运行中

Asset ID: asset-001

静态属性

| 属性   | 值          |
| ---- | ---------- |
| 型号   | AC-200     |
| 厂商   | Example    |
| 所属车间 | 车间 A       |
| 安装日期 | 2026-01-01 |

动态数据

运行温度

# 68.5°C

运行压力

# 0.82 MPa

转速

# 2850 RPM

运行时间

# 128 h

示例数据，仅用于产品概念展示。

## 2. 资产关系模型

建议第一版同时支持树形层级和图关系。

例如：

```
Factory
  └── Workshop A
       ├── Production Line 01
       │     ├── Compressor A
       │     │     ├── Temperature Sensor
       │     │     └── Pressure Sensor
       │     └── Motor A
       └── Production Line 02
             └── Pump B
```

但是要注意，树形结构不能完全表达工业设备关系。

例如，传感器可能关联多个业务对象，设备之间也可能存在供能、连接、控制等关系。

因此：

- `parent_id`：用于层级归属。
- `relationships`：用于任意实体关系。
- `location_id`：用于空间位置。
- `asset_type_id`：用于类型归类。

不要将所有关系都塞进一棵设备树中。

## 3. 数据结构

初期可以采用 PostgreSQL，核心表大致如下：

```
organizations
projects
locations

asset_types
asset_templates
assets
asset_attributes
asset_relationships

device_connections
device_credentials
telemetry_definitions
telemetry_latest

telemetry_data
events
alarm_rules
alarms

dashboards
dashboard_widgets
```

其中，`assets` 是中心实体，其他对象通过明确的外键或关联表进行连接。

一个简化的 Asset 数据结构：

```
{
  "id": "asset-001",
  "name": "Compressor A",
  "code": "COMP-A-001",
  "type": "compressor",
  "status": "running",
  "location_id": "location-001",
  "attributes": {
    "manufacturer": "Example",
    "model": "AC-200"
  },
  "tags": ["workshop-a", "production"],
  "metadata": {}
}
```

从一开始区分业务资产和接入设备（Device）。

例如一台空压机可以由一个工业网关连接多个传感器。它们可能对应一个 Asset 和多个 Device，而不是强制一对一。

# 四、UI / UX：可视化优先的产品界面

 AssetStudio 的核心竞争力应该体现在 UI/UX 上。

建议采用现代工程软件的工作台设计，而不是传统工业软件那种密集菜单和大量表格的布局。

## 1. 整体信息架构

建议采用左侧主导航 + 顶部项目栏 + 中央工作区的结构。

AssetStudio

Workspace

WORKSPACE

总览

资产管理

资产拓扑

设备接入

数据监控

可视化工作台

事件告警

系统总览

资产总数

# 128

在线设备

# 116

离线设备

# 12

未处理告警

# 3

最近事件

空压机 A · 温度异常

设备监控事件

水泵 B · 恢复在线

设备状态事件

界面结构示意，非最终视觉稿。

导航建议：

| 一级导航       | 二级功能           |
| ---------- | -------------- |
| Overview   | 系统总览、运行状态      |
| Assets     | 资产列表、资产类型、模板   |
| Topology   | 资产拓扑、关系管理      |
| Devices    | 设备列表、设备接入、连接配置 |
| Telemetry  | 实时数据、历史数据、数据点  |
| Dashboards | 仪表盘、页面编辑器      |
| Events     | 事件记录、告警管理      |
| Settings   | 项目、用户、权限、系统配置  |

## 2. 最重要的三个界面

我建议优先打磨这三个页面。

页面 A：Asset Explorer

资产资源管理器。

核心体验：

- 左侧资产树。
- 中间资产列表或卡片。
- 右侧资产详情。
- 快速搜索、筛选和标签。
- 资产之间的关系查看。

页面 B：Topology Studio

这是最值得打造产品特色的界面。

核心体验：

- 拖拽设备到画布。
- 连接设备和传感器。
- 自动布局。
- 设备状态实时映射。
- 点击节点查看设备详情。
- 支持保存多个拓扑视图。

我建议不要只做一个普通的流程图编辑器，而是设计一个真正的 Asset-aware Canvas：画布中的节点直接绑定真实资产，连线对应真实关系。

页面 C：Dashboard Studio

这是用户日常使用频率最高的界面之一。

核心体验：

- 拖拽组件。
- 配置数据源。
- 绑定资产和数据点。
- 配置组件属性。
- 实时预览。
- 保存和发布。

建议第一版支持 8～10 种组件：

1. 数值卡片。
2. 折线图。
3. 仪表盘。
4. 状态指示器。
5. 设备卡片。
6. 告警列表。
7. 设备表格。
8. 柱状图。
9. 设备拓扑。
10. 文本与说明组件。

# 五、技术架构与工程设计

结合 WUXU 的产品路线，AssetStudio 从第一天就采用模块化、可扩展的架构。

但第一版不要过度微服务化。

## 1. 总体技术架构

AssetStudio Web

React · TypeScript · Visual Editors

Go Application Core

REST API · WebSocket · Authentication · RBAC

Asset Domain

资产、类型、模板、关系

Device Gateway

MQTT、HTTP、设备连接

Telemetry Engine

数据处理、时序、状态

Visualization Engine

数据绑定、组件配置

Event Engine

事件、规则、告警

Extension System

插件、协议适配、扩展

Infrastructure

PostgreSQL · Time-series Storage · MQTT Broker · Object Storage

## 2. 技术栈建议

| 模块          | 技术                       | 选择原因       |
| ----------- | ------------------------ | ---------- |
| Web         | React + TypeScript       | 工程生态成熟     |
| UI          | Tailwind CSS + shadcn/ui | 组件开发效率     |
| 拓扑          | React Flow               | 设备关系与画布    |
| 图表          | ECharts                  | 时序与数据展示    |
| 3D          | Three.js                 | 后续数字孪生     |
| Backend     | Go                       | 性能、部署、工程化  |
| API         | REST + WebSocket         | 简单、通用      |
| ORM         | GORM 或 sqlc              | 结合复杂查询需求选择 |
| Database    | PostgreSQL               | 核心业务数据     |
| Time-series | TimescaleDB（可选）          | 时序数据       |
| MQTT        | Mosquitto                | 消息接入       |
| Cache       | Redis（按需）                | 缓存及短期状态    |
| Deployment  | Docker Compose           | 快速部署       |

这里有几个需要提前明确的技术决策。

第一，设备接入与业务 API 分离。

设备数据接入是持续、高频的数据流，不应该与普通 CRUD API 混在同一处理链路中。

第二，Telemetry 与 Asset 分离存储。

设备静态属性适合 PostgreSQL，时序数据可以先采用 PostgreSQL 原生表，数据量增长后再引入 TimescaleDB 或独立时序存储。

第三，设备在线状态不能简单依赖最后一条数据。

应该综合心跳、连接状态、超时时间和设备上报规则计算在线状态。

第四，所有数据都需要明确时间语义。

至少区分设备产生时间、服务端接收时间和数据入库时间，避免设备时钟不准确造成历史数据错乱。

# 六、设备接入与数据处理设计

这一部分决定 AssetStudio 是否真正具备工业物联网产品的基础能力。

## 1. 设备接入方式

第一版只支持两种协议：

- MQTT：面向 IoT 设备、传感器和网关。
- HTTP：面向已有业务系统和第三方设备。

后续逐步扩展：

| 协议         | 适用场景        | 优先级 |
| ---------- | ----------- | --- |
| MQTT       | 传感器、IoT 设备  | P0  |
| HTTP       | 外部系统、设备 API | P0  |
| Modbus TCP | 工业仪表、PLC    | P1  |
| OPC UA     | 工业自动化系统     | P1  |
| Modbus RTU | 串口设备        | P2  |
| BACnet     | 楼宇自动化       | P2  |

第一版先不实现所有工业协议。

可以通过独立 Gateway 或协议适配器接入，核心系统只需要理解统一的数据模型。

## 2. 数据处理流程

```
Physical Devices
       |
       v
  MQTT / HTTP
       |
       v
  Device Gateway
       |
       v
  Data Normalizer
       |
       v
  Asset Binding
       |
       v
  Telemetry Engine
       |
       +------> Latest State
       |
       +------> Time-series Storage
       |
       +------> Event / Alert Engine
                       |
                       v
                 WebSocket Push
                       |
                       v
                  Web UI
```

核心是 `Data Normalizer`。

无论数据来自 MQTT、HTTP 还是未来的 Modbus、OPC UA，都统一成内部 Telemetry 格式。

例如：

```
{
  "device_id": "device-001",
  "asset_id": "asset-001",
  "timestamp": 1793520000000,
  "values": {
    "temperature": 68.5,
    "pressure": 0.82,
    "speed": 2850
  }
}
```

这样以后增加协议，不需要修改上层资产管理、数据监控和 Dashboard。

## 3. 一个非常值得做的功能：设备模拟器

将设备模拟器纳入 V0.1，而不是等真实硬件接入后再做。

它可以：

- 模拟不同类型设备。
- 按配置产生温度、压力、转速等数据。
- 模拟设备上线、离线。
- 模拟正常、异常状态。
- 模拟数据波动和故障事件。
- 支持 MQTT 和 HTTP 两种输出。

这会带来三个价值：

1. 没有工业硬件也能完整演示产品。
2. 开发者可以快速验证自己的设备模型。
3. 后续可以作为仿真系统的基础组件。

它甚至可以独立发展为 AssetStudio 的一个特色工具。

# 七、V0.1 MVP：明确开发边界

第一版就先不实现完整的六大模块。

应该以一个完整场景作为验收标准：

用户创建一个工厂项目，注册几台设备，接入模拟数据，通过可视化拓扑和 Dashboard 查看设备运行状态，并能收到异常告警。

## 1. MVP 功能范围

| 功能              | V0.1 | V0.2 | V1.0 |
| --------------- | ---- | ---- | ---- |
| 项目管理            | ✓    |      |      |
| 资产 CRUD         | ✓    |      |      |
| 资产类型与模板         | ✓    |      |      |
| 资产层级            | ✓    |      |      |
| 资产关系            | 基础   | 增强   |      |
| MQTT 接入         | ✓    |      |      |
| HTTP 接入         | ✓    |      |      |
| 设备模拟器           | ✓    | 增强   |      |
| 实时数据            | ✓    |      |      |
| 历史曲线            | ✓    | 增强   |      |
| 拓扑画布            | ✓    | 增强   |      |
| Dashboard 编辑器   | 基础   | 增强   |      |
| 阈值告警            | ✓    |      |      |
| Modbus / OPC UA |      | ✓    |      |
| 多用户权限           | 基础   |      | 增强   |
| 3D 数字孪生         |      |      | ✓    |
| 插件市场            |      |      | ✓    |
| 高可用部署           |      |      | ✓    |

这里的 V1.0 是产品成熟版本的目标，不意味着所有功能都必须在第一次正式发布前完成。

## 2. 开发任务拆解

建议拆成 8 个阶段。

| 阶段 | 核心任务              | 验收标准           |
| -- | ----------------- | -------------- |
| P1 | 工程初始化、基础 UI、项目管理  | 可以创建项目         |
| P2 | Asset Domain、设备管理 | 可以完成资产 CRUD    |
| P3 | MQTT / HTTP、模拟器   | 数据正常接入         |
| P4 | Telemetry Engine  | 实时数据与历史数据可查询   |
| P5 | Asset Topology    | 画布节点绑定真实资产     |
| P6 | Dashboard Studio  | 可以编辑、保存、发布监控面板 |
| P7 | Event / Alert     | 异常检测与告警确认      |
| P8 | 部署、文档、开源发布        | Docker 一键运行    |

单人开发时预留约 8～12 周完成一个可用的 MVP，实际取决于拓扑编辑器、数据存储和 Dashboard 的实现深度。

## 3. 必须准备的验收场景

建议第一版直接内置一个虚拟工厂场景：

场景结构：

```
Factory A
  ├── Workshop A
  │    ├── Compressor A
  │    │    ├── Temperature Sensor
  │    │    └── Pressure Sensor
  │    └── Motor A
  │
  └── Workshop B
       ├── Pump A
       └── Pump B
```

验证流程：

1. 创建 Factory A 项目。
2. 导入虚拟设备。
3. 启动设备模拟器。
4. MQTT 将数据发送到 AssetStudio。
5. 设备数据自动关联资产。
6. 在拓扑画布中查看设备状态。
7. 在 Dashboard 中查看温度、压力和转速。
8. 将温度阈值设置为 80°C。
9. 模拟温度超过阈值。
10. 触发告警并在事件中心查看记录。

这十个步骤如果可以完整跑通，就已经形成一个有演示价值的产品。

# 八、开源与商业化规划

AssetStudio 从第一个版本就采用 Open Core 思路。

## 1. 产品版本

| 版本           | 定位    | 核心能力                  |
| ------------ | ----- | --------------------- |
| Community    | 开源社区版 | 设备、资产、数据、拓扑、Dashboard |
| Professional | 专业版   | 高级可视化、复杂规则、专业分析       |
| Enterprise   | 企业版   | 高可用、审计、权限、集成、技术支持     |

初期只发布 Community，暂时不要为了商业化而分拆代码。

先验证真实使用价值，再依据企业需求划分商业功能。

## 2. 开源仓库规划

初期采用 Monorepo：

```
assetstudio/
├── apps/
│   └── web/                  # Web 前端
│
├── cmd/
│   ├── server/               # 主服务
│   └── simulator/            # 设备模拟器
│
├── internal/
│   ├── asset/                # 资产领域
│   ├── device/               # 设备管理
│   ├── telemetry/             # 时序数据
│   ├── topology/              # 资产关系
│   ├── dashboard/             # 仪表盘
│   ├── event/                 # 事件
│   ├── alert/                 # 告警
│   └── gateway/               # 接入网关
│
├── pkg/
│   ├── protocol/              # 协议接口
│   ├── model/                 # 公共模型
│   └── sdk/                   # 开发 SDK
│
├── deployments/
│   └── docker-compose/
│
├── examples/
│   └── virtual-factory/
│
├── docs/
├── scripts/
├── LICENSE
└── README.md
```

## 3. 产品许可证

- Community：Apache-2.0。
- 商业扩展：独立商业授权。
- 官方协议适配器：根据具体实现和依赖单独确定许可证。

这样能够降低企业采用门槛，也方便未来形成插件生态。

# 九、AssetStudio 后续演进方向

AssetStudio 不应该止步于设备管理。

把它视为 WUXU 整个产品体系的基础入口。

# WUXU · 物序

PHYSICAL WORLD SOFTWARE

AssetStudio

设备、资产、数据、拓扑、可视化

首个产品

TwinStudio

数字孪生、3D 场景、空间映射

规划中

SimStudio

仿真、模拟、运行推演

规划中

InsightStudio

时序分析、异常检测、数据洞察

规划中

ProtocolStudio

工业协议、数据接入、设备适配

规划中

这里有一个值得提前考虑的架构方向：

AssetStudio 中的 Asset Model、Relationship Model、Telemetry Model 和 Visualization Engine，未来可以成为其他产品共享的基础能力。

例如 TwinStudio 不必重新建立一套设备模型，而是直接引用 AssetStudio 的资产和关系数据。

但现在先不把所有产品做成一个大型共享系统。先保证 AssetStudio 可以独立运行，未来通过 API、SDK 和标准化数据模型实现产品间协作。

# 十、最终：AssetStudio 第一版应该重点打磨什么？

将优先级重新排序：

## V0.1 最重要的四个能力

# 01

统一资产模型

设备、传感器、属性、关系和状态有清晰的数据结构。

# 02

可视化资产拓扑

用户能够直观构建设备关系，并且节点与真实资产关联。

# 03

设备数据接入与实时监控

MQTT、HTTP、模拟器形成完整的数据闭环。

# 04

可视化 Dashboard

用户可以自主设计设备监控界面，而不是只能使用固定报表。

AssetStudio 真正值得做的差异化，不是设备管理功能本身，而是将资产模型、设备关系、实时数据和可视化编辑能力融合起来。

这既符合 WUXU「让物理世界可见、可知、可模拟」的品牌愿景，也为未来数字孪生和仿真产品建立了基础。

下一步最值得做的是：将 AssetStudio V0.1 拆解成正式 PRD、领域模型、数据库设计、API 规范和可执行开发 Roadmap，并优先完成核心 UI 原型，先验证产品的交互特色，再进入工程实现。

# 今天吃什么网站 - 实施计划

## 1. 项目概述

构建一个名为「今天吃什么」的趣味性网页应用。核心功能：

* 用户可手动输入位置，或点击按钮获取当前定位。

* 用户可设置搜索半径（如 500m、1km、2km、5km）。

* 调用高德地图 POI 搜索，展示附近餐饮店铺列表。

* 点击「大转盘」按钮，进入轮盘抽奖界面，从已筛选店铺中随机选出一家，解决「今天吃什么」的纠结。

技术栈：**React + Vite + 高德地图 JS API / Place API**。

***

## 2. 当前状态分析

工作目录 `c:\Users\dapeng.DESKTOP-0RBS8OG\Desktop\Pros\Pro2` 为空目录，不存在任何前端工程结构、配置文件或源码。因此本项目为从零开始的全新工程，无需兼容现有代码。

关键约束：

* 高德地图服务需要申请 **Key** 与 **安全密钥（jscode）**，前端直接调用需在白名单域名中配置。

* 浏览器定位依赖 `navigator.geolocation`，部分浏览器需要 HTTPS。

* POI 搜索免费额度有限， Demo 阶段使用默认参数即可。

***

## 3. 实施步骤

### 3.1 初始化工程

* 使用 Vite 创建 React 项目（模板 `react`）。

* 安装依赖：`react`、`react-dom`。

* 安装高德地图 JS API Loader：`@amap/amap-jsapi-loader`。

* 配置 `.env.local` 存储高德 Key（本地开发）。

生成文件：

* `package.json`

* `vite.config.js`

* `index.html`

* `src/main.jsx`

* `src/App.jsx`

### 3.2 核心模块开发

#### 3.2.1 地图与定位模块

* 封装 `src/services/amap.js`：

  * 加载高德地图 JS API。

  * 提供 `getCurrentPosition()`：使用浏览器 Geolocation 获取经纬度，失败时 fallback 到 IP 定位。

  * 提供 `searchNearby(lng, lat, radius, keywords)`：调用 `AMap.PlaceSearch` 搜索「餐饮」类 POI。

* 封装 `src/services/geocoder.js`：

  * 经纬度转地址（逆地理编码），用于显示当前位置名称。

  * 地址转经纬度（地理编码），用于用户输入位置后搜索。

#### 3.2.2 状态管理

使用 React `useState` 与 `useReducer` 管理：

* `location`：当前经纬度 + 地址文本。

* `radius`：搜索半径（默认 1000 米）。

* `shops`：店铺列表。

* `loading`：搜索中状态。

* `selectedShop`：轮盘结果。

#### 3.2.3 页面组件

* `src/App.jsx`：整体布局与状态流转。

* `src/components/SearchPanel.jsx`：

  * 位置输入框 + 定位按钮。

  * 距离选择（500m / 1km / 2km / 5km）。

  * 「搜索附近店铺」按钮。

* `src/components/ShopList.jsx`：展示店铺卡片（名称、距离、评分、地址）。

* `src/components/Wheel.jsx`：

  * 绘制彩色扇形转盘，每个扇区对应一家店铺名。

  * 点击开始后旋转动画，最终停在随机店铺。

  * 显示中奖结果弹窗。

#### 3.2.4 样式与视觉

* 使用 CSS Modules 或 Tailwind（按开发阶段选择，计划采用 CSS Modules 保持轻量）。

* 主色调：暖橙色/黄色（食物、活力）。

* 转盘使用 conic-gradient 或 SVG 实现，配合 CSS `transition`/`transform` 动画。

* 响应式：移动端优先，最大宽度 600px 居中。

### 3.3 构建与验证

* 运行 `npm run dev` 本地预览。

* 验证：

  1. 定位成功并显示地址。
  2. 输入地址后搜索返回店铺。
  3. 半径切换后店铺列表变化。
  4. 轮盘转动后能从列表中随机选中一家并高亮展示。

***

## 4. 文件清单

| 文件                               | 说明               |
| -------------------------------- | ---------------- |
| `package.json`                   | 项目依赖与脚本          |
| `vite.config.js`                 | Vite 配置          |
| `index.html`                     | 入口 HTML，引入高德安全密钥 |
| `.env.local`                     | 高德 Key（本地环境变量）   |
| `src/main.jsx`                   | React 挂载入口       |
| `src/App.jsx`                    | 根组件与状态管理         |
| `src/services/amap.js`           | 高德 API 封装        |
| `src/services/geocoder.js`       | 地理/逆地理编码封装       |
| `src/components/SearchPanel.jsx` | 搜索面板             |
| `src/components/ShopList.jsx`    | 店铺列表             |
| `src/components/Wheel.jsx`       | 大转盘组件            |
| `src/styles/*.css`               | 样式文件             |

***

## 5. 假设与决策

* 技术栈：React + Vite（用户已确认）。

* 地图服务：高德地图（用户已确认）。

* 店铺数据直接来自高德 POI 搜索，不做后端持久化。

* 轮盘展示所有搜索到的店铺；若店铺过多（>12），取前 12 家展示，避免转盘过于拥挤。

* 不接入用户登录、收藏等额外功能，保持 MVP 范围。

* 高德 Key 由用户在部署前自行申请并填入环境变量。

***

## 6. 风险与应对

| 风险                | 应对                                 |
| ----------------- | ---------------------------------- |
| 高德 Key 未配置导致地图不可用 | 在代码中检测 Key 缺失，给出提示；README 中说明申请方式。 |
| 浏览器定位失败           | fallback 到 IP 定位，并允许用户手动输入地址。      |
| POI 搜索无结果         | 给出「附近没有合适的餐厅，请扩大范围或更换位置」提示。        |
| 跨域/HTTPS 限制       | 开发时使用 localhost，生产部署到 HTTPS 站点。    |

***

## 7. 验证清单

* [ ] 项目能正常 `npm install` 与 `npm run dev` 启动。

* [ ] 页面加载后显示搜索面板与默认半径 1km。

* [ ] 点击「定位」按钮能获取当前位置并展示地址。

* [ ] 输入城市/商圈名称后点击搜索，返回附近餐饮店铺列表。

* [ ] 切换半径后重新搜索，结果按距离过滤。

* [ ] 点击「大转盘」按钮弹出/展示转盘，点击开始旋转并随机选中一家店铺。

* [ ] 转盘结果与店铺列表一致，中奖店铺有明确高亮或弹窗展示。


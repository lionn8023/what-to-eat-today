# 今天吃什么 🍜

让命运来决定你下一顿饭的 Web 小应用。基于定位 / 地址，搜索附近美食，再用一个大转盘随机帮你「翻牌」。

## ✨ 功能

- 📍 **定位 / 地址搜索**：浏览器定位，或选择省/市后输入具体地址（带输入联想）
- 🍱 **品类筛选**：全部美食 / 火锅 / 烧烤 / 快餐 / 咖啡 / 面包甜点 / 日料 / 西餐
- 🔍 **附近搜索**：按半径（500m–5km）和数量（20–100 家）搜索周边餐饮
- 🎰 **命运大转盘**：从结果中随机抽取 12 家进入转盘，公平公正地帮你决定
- 📋 **店铺详情**：评分、人均、电话、营业时间、照片，一键在高德地图打开
- 💾 **记忆上次搜索**：自动恢复上一次的位置、范围与筛选条件
- 🔐 **账号登录**：邮箱密码 / 魔法链接登录（Supabase Auth）
- ❤️ **收藏想吃清单**：把心动的店收藏起来，跨设备同步
- 🕘 **抽签历史**：每次转盘结果自动记录成时间线，回顾「最近都吃了啥」

## 🛠 技术栈

- React 18 + Vite 5
- 高德地图 JS API（定位、逆地理编码、地点搜索、行政区划）
- 纯 CSS Modules（新拟态 / 硬阴影风格）

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置高德 Key
cp .env.example .env.local
# 然后编辑 .env.local，填入你自己的 Key 与 securityJsCode
# 申请地址：https://console.amap.com/dev/key/app （类型为「Web端(JS API)」）

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本（输出到 dist/）
npm run build

# 5. 本地预览构建产物
npm run preview
```

> ⚠️ 没有配置 `VITE_AMAP_KEY` / `VITE_AMAP_SCODE` 时，应用会在加载高德 SDK 时给出明确提示。`.env.local` 已被 `.gitignore` 忽略，不会泄露密钥。

## 📁 目录结构

```
src/
  App.jsx                  # 主逻辑、状态、搜索编排
  components/
    SearchPanel.jsx        # 省/市选择、地址输入联想、范围与品类筛选
    ShopList.jsx           # 附近店铺列表
    Wheel.jsx              # 命运大转盘（SVG 扇区 + CSS 旋转）
    ShopDetail.jsx         # 店铺详情弹窗
  services/
    amap.js                # 高德 SDK 加载、定位、附近搜索
    geocoder.js            # 经纬度 <-> 地址
    autocomplete.js        # 地址输入联想
    district.js            # 省/市行政区划数据
  styles/index.css         # 全局变量与基础样式
```

## 🗄 接入 Supabase（收藏 / 历史 / 登录）

数据库功能（登录、收藏、抽签历史）由 [Supabase](https://supabase.com) 提供，免费层足够个人作品集使用。
**未配置时应用自动降级**：地图、转盘等核心功能照常工作，仅登录/收藏入口隐藏。

### 1. 建 Supabase 项目

1. 在 [supabase.com](https://supabase.com) 用 GitHub 登录 → **New Project**
2. 进入项目 → **Project Settings → API**，复制：
   - **Project URL**
   - **anon public key**（前端可公开，权限由下方 RLS 控制）
3. 进入 **SQL Editor**，新建查询，把本项目 `sql/schema.sql` 的完整内容粘贴进去并运行（建表 + 开启行级安全）

### 2. 配置环境变量

**本地开发**：编辑 `.env.local`，补充：
```
VITE_SUPABASE_URL=你的ProjectURL
VITE_SUPABASE_ANON_KEY=你的anonKey
```

**Vercel 部署**：项目 **Settings → Environment Variables** 添加：
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL            # 服务端保活函数用（与上面同值）
SUPABASE_ANON_KEY       # 服务端保活函数用（与上面同值）
```

### 3. 关于安全（重要）

- 前端使用的 `VITE_SUPABASE_ANON_KEY` 是**设计上可公开**的 key，真正的数据权限由数据库 **RLS（行级安全）** 策略控制——每个用户只能读写自己的 `favorites` / `draw_history` 行（见 `sql/schema.sql`）。
- **切勿**把 Supabase 的 `service_role` key 放进任何 `VITE_` 前缀变量，那会暴露后端超管权限。
- 免费项目连续 7 天无数据库活动会被自动暂停。本项目已内置 `api/keepalive.js` + Vercel 每日 cron 自动保活，无需手动处理。

### 4. 部署后验证

打开线上站 → 点右上角「登录」→ 注册/登录 → 在店铺详情或列表点 ♥ 收藏 → 转一次大转盘 → 打开「📚 美食库」抽屉，应能看到收藏与抽签历史。

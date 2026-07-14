# 今天吃什么 🍜

让命运来决定你下一顿饭的 Web 小应用。基于定位 / 地址，搜索附近美食，再用一个大转盘随机帮你「翻牌」。

## ✨ 功能

- 📍 **定位 / 地址搜索**：浏览器定位，或选择省/市后输入具体地址（带输入联想）
- 🍱 **品类筛选**：全部美食 / 火锅 / 烧烤 / 快餐 / 咖啡 / 面包甜点 / 日料 / 西餐
- 🔍 **附近搜索**：按半径（500m–5km）和数量（20–100 家）搜索周边餐饮
- 🎰 **命运大转盘**：从结果中随机抽取 12 家进入转盘，公平公正地帮你决定
- 📋 **店铺详情**：评分、人均、电话、营业时间、照片，一键在高德地图打开
- 💾 **记忆上次搜索**：自动恢复上一次的位置、范围与筛选条件

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

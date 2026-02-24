# 星闪与 LoRa 户外探险应急监测系统 (Web 上位机)

这是一个基于 Web Bluetooth API 的户外探险应急监测系统前端应用。

## 技术栈
- React 18
- TypeScript
- Vite
- Material UI (MUI) v5
- Zustand
- React-Leaflet

## 环境配置

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

## UUID 填写指南

在 `src/config.ts` 文件中，你可以修改以下常量以匹配你的硬件设备：

- `DEVICE_NAME_FILTER`: 蓝牙设备名称前缀，默认为 "WlidLinkClient"。
- `SERVICE_UUID`: 主服务 UUID。
- `CHAR_A_UUID`: 特征值 A (用于接收遥测数据，Notify/Read)。
- `CHAR_B_UUID`: 特征值 B (用于下发配置和 GPS 数据，Write/Read)。
- `PACKET_SIZE`: 数据包大小 (50 字节)。
- `REQUIRED_MTU`: 要求的最小 MTU (53 字节)。

## 运行步骤

1. 确保你的设备支持 Web Bluetooth API (如 Chrome 浏览器)。
2. 确保你的网站运行在 HTTPS 环境下，或者在本地 `localhost` 运行。
3. 点击首页的“连接设备”按钮，在弹出的浏览器原生蓝牙选择框中选择你的设备。
4. 首次连接时，浏览器会请求地理位置权限，请允许以获取当前 GPS 坐标。
5. 连接成功后，系统会自动接收数据并显示在仪表盘上。
6. 你可以点击“雷达地图”查看队友位置。
7. 如果收到队友的 SOS 信号，系统会弹出全屏红色警告并播放警报音。

## 注意事项

- 确保硬件设备发送的数据格式与 `src/utils/parser.ts` 中的解析逻辑一致 (Little-Endian, 无内存对齐)。
- 警报音效需要用户与页面有交互后才能播放 (例如点击“连接设备”按钮时已初始化 AudioContext)。

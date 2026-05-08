# A股复盘助手

一款基于 PWA 的 A 股股票复盘工具，支持手机端添加到桌面像 App 一样使用。

## 功能模块

- **行情回顾**：大盘指数、板块涨跌、涨停跌停
- **技术分析**：K 线图、均线、成交量、资金流向
- **基本面分析**：PE/PB 估值、雷达图评分、估值趋势
- **交易日志**：交易记录、持仓管理、盈亏曲线、策略回测
- **全球情绪**：VIX 恐慌指数、全球指数、北向资金、情绪打分

## 部署方式

### GitHub Pages（推荐）

1. 将本仓库 Fork 或 Clone 到你的 GitHub 账号
2. 进入仓库 Settings → Pages
3. Source 选择 `main` 分支，目录选 `/ (root)`
4. 保存后等待 1-2 分钟，即可通过 `https://你的用户名.github.io/仓库名/` 访问

### 本地运行

```bash
cd stock-review
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 添加到手机桌面

在手机浏览器中打开部署好的网址 → 点击"分享" → 选择"添加到主屏幕"即可。

## 技术栈

- 纯前端 HTML/CSS/JavaScript
- ECharts 图表库
- PWA（Service Worker + Manifest）
- 东方财富公开 API（数据源）

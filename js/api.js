/**
 * A股复盘助手 - API数据层
 *
 * 东方财富等接口在GitHub Pages上因CORS限制无法直接访问
 * 当前版本使用模拟数据展示完整功能
 * 如需实时数据，请部署到支持后端代理的服务器
 */

const API = {
  _useMock: true,
  _mockReason: '演示模式（API存在跨域限制）',

  // 初始化（无需网络探测）
  async init() {
    console.log('📊 A股复盘助手：使用模拟数据模式');
  },

  // 获取数据源状态
  getDataSourceLabel() {
    return this._useMock ? `📊 模拟数据（${this._mockReason}）` : '📡 实时数据';
  },

  // ===== 大盘指数 =====
  async getIndexData() {
    return [
      { code: '000001', name: '上证指数', price: 3350.28, changePercent: 0.85, changeAmount: 28.35 },
      { code: '399001', name: '深证成指', price: 10856.42, changePercent: 1.12, changeAmount: 120.15 },
      { code: '399006', name: '创业板指', price: 2156.78, changePercent: 1.56, changeAmount: 33.21 },
      { code: '000688', name: '科创50', price: 986.35, changePercent: -0.32, changeAmount: -3.18 },
      { code: '399005', name: '中小100', price: 6856.12, changePercent: 0.67, changeAmount: 45.56 },
      { code: '000300', name: '沪深300', price: 3925.68, changePercent: 0.92, changeAmount: 35.78 }
    ];
  },

  // ===== 板块涨跌 =====
  async getSectorData(type = 'industry') {
    if (type === 'industry') return [
      { code:'BK0477', name:'半导体', changePercent:3.25, price:0, changeAmount:0 },
      { code:'BK0478', name:'新能源', changePercent:2.18, price:0, changeAmount:0 },
      { code:'BK0479', name:'人工智能', changePercent:2.87, price:0, changeAmount:0 },
      { code:'BK0480', name:'医药生物', changePercent:1.56, price:0, changeAmount:0 },
      { code:'BK0481', name:'消费电子', changePercent:1.23, price:0, changeAmount:0 },
      { code:'BK0482', name:'汽车整车', changePercent:0.89, price:0, changeAmount:0 },
      { code:'BK0483', name:'银行', changePercent:-0.35, price:0, changeAmount:0 },
      { code:'BK0484', name:'房地产', changePercent:-1.28, price:0, changeAmount:0 },
      { code:'BK0485', name:'白酒', changePercent:0.67, price:0, changeAmount:0 },
      { code:'BK0486', name:'军工', changePercent:1.45, price:0, changeAmount:0 },
      { code:'BK0487', name:'光伏', changePercent:-0.78, price:0, changeAmount:0 },
      { code:'BK0488', name:'锂电池', changePercent:1.92, price:0, changeAmount:0 },
      { code:'BK0489', name:'证券', changePercent:0.45, price:0, changeAmount:0 },
      { code:'BK0490', name:'保险', changePercent:-0.56, price:0, changeAmount:0 },
      { code:'BK0491', name:'钢铁', changePercent:-0.92, price:0, changeAmount:0 }
    ];
    return [
      { code:'BK0901', name:'华为概念', changePercent:3.56, price:0, changeAmount:0 },
      { code:'BK0902', name:'ChatGPT', changePercent:2.89, price:0, changeAmount:0 },
      { code:'BK0903', name:'机器人', changePercent:2.34, price:0, changeAmount:0 },
      { code:'BK0904', name:'低空经济', changePercent:1.78, price:0, changeAmount:0 },
      { code:'BK0905', name:'固态电池', changePercent:-0.45, price:0, changeAmount:0 },
      { code:'BK0906', name:'量子科技', changePercent:1.23, price:0, changeAmount:0 },
      { code:'BK0907', name:'卫星导航', changePercent:0.89, price:0, changeAmount:0 },
      { code:'BK0908', name:'碳中和', changePercent:-1.12, price:0, changeAmount:0 },
      { code:'BK0909', name:'元宇宙', changePercent:0.56, price:0, changeAmount:0 },
      { code:'BK0910', name:'数字经济', changePercent:1.67, price:0, changeAmount:0 }
    ];
  },

  // ===== 个股搜索 =====
  async searchStock(keyword) {
    const stocks = [
      { code:'600519', name:'贵州茅台', market:1 }, { code:'000858', name:'五粮液', market:0 },
      { code:'300750', name:'宁德时代', market:0 }, { code:'601318', name:'中国平安', market:1 },
      { code:'000001', name:'平安银行', market:0 }, { code:'600036', name:'招商银行', market:1 },
      { code:'002594', name:'比亚迪', market:0 }, { code:'601012', name:'隆基绿能', market:1 },
      { code:'300059', name:'东方财富', market:0 }, { code:'600900', name:'长江电力', market:1 },
      { code:'601899', name:'紫金矿业', market:1 }, { code:'000333', name:'美的集团', market:0 },
      { code:'600276', name:'恒瑞医药', market:1 }, { code:'002475', name:'立讯精密', market:0 },
      { code:'603259', name:'药明康德', market:1 }, { code:'000725', name:'京东方A', market:0 }
    ];
    if (!keyword) return stocks.slice(0, 8);
    return stocks.filter(s => s.name.includes(keyword) || s.code.includes(keyword));
  },

  // ===== 个股K线 =====
  async getStockKline(secid, klt = 101, count = 120) {
    const klines = [];
    let price = 50 + Math.random() * 100;
    for (let i = 0; i < count; i++) {
      const d = new Date(); d.setDate(d.getDate() - (count - i));
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const change = (Math.random() - 0.48) * 5;
      const open = price;
      const close = price * (1 + change / 100);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(50000 + Math.random() * 200000);
      klines.push({
        date: dateStr, open: +open.toFixed(2), close: +close.toFixed(2),
        high: +high.toFixed(2), low: +low.toFixed(2), volume,
        amount: volume * close, amplitude: +((high-low)/open*100).toFixed(2),
        changePercent: +change.toFixed(2), changeAmount: +(close-open).toFixed(2),
        turnover: +(Math.random() * 5).toFixed(2)
      });
      price = close;
    }
    return klines;
  },

  // ===== 个股实时行情 =====
  async getStockQuote(secid) {
    const code = secid ? secid.split('.')[1] : '600519';
    const names = {'600519':'贵州茅台','000858':'五粮液','300750':'宁德时代','601318':'中国平安',
                   '000001':'平安银行','600036':'招商银行','002594':'比亚迪','601012':'隆基绿能',
                   '300059':'东方财富','600900':'长江电力'};
    const name = names[code] || '示例股票';
    const basePrice = { '600519':1688,'000858':156,'300750':198,'601318':48,'000001':12.5,
                        '600036':35,'002594':265,'601012':22,'300059':18,'600900':28 };
    const p = basePrice[code] || (20 + Math.random() * 100);
    const changeP = (Math.random() - 0.45) * 4;
    return {
      code, name,
      price: +(p * (1 + changeP/100)).toFixed(2),
      open: +p.toFixed(2),
      high: +(p * 1.02).toFixed(2),
      low: +(p * 0.98).toFixed(2),
      preClose: +p.toFixed(2),
      volume: Math.floor(100000 + Math.random() * 500000),
      amount: Math.floor(5000000 + Math.random() * 20000000),
      changePercent: +changeP.toFixed(2),
      changeAmount: +(p * changeP / 100).toFixed(2),
      turnover: +(Math.random() * 5).toFixed(2),
      pe: +(10 + Math.random() * 50).toFixed(1),
      pb: +(1 + Math.random() * 8).toFixed(1),
      totalValue: Math.floor(p * 1e8 * (10 + Math.random() * 100)),
      floatValue: Math.floor(p * 1e8 * (5 + Math.random() * 50))
    };
  },

  // ===== 资金流向 =====
  async getMoneyFlow(secid) {
    const result = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      result.push({
        date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
        mainNet: Math.floor((Math.random() - 0.4) * 5e7)
      });
    }
    return result;
  },

  // ===== 涨停/跌停 =====
  async getLimitList(type = 'zt') {
    const isUp = type === 'zt';
    return [
      { code:'300888', name:'稳健医疗', price:58.90, changePercent: isUp?10.02:-10.01 },
      { code:'002456', name:'欧菲光', price:12.35, changePercent: isUp?10.05:-10.03 },
      { code:'600734', name:'实达集团', price:8.92, changePercent: isUp?9.98:-10.00 },
      { code:'000062', name:'深圳华强', price:32.15, changePercent: isUp?10.01:-9.99 },
      { code:'002049', name:'紫光国微', price:78.56, changePercent: isUp?10.00:-10.02 }
    ];
  },

  // ===== 北向资金 =====
  async getNorthFlow() {
    const series = [];
    for (let h = 9; h <= 15; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 9 && m < 30) continue;
        if (h === 11 && m > 30) continue;
        if (h === 12) continue;
        if (h === 15 && m > 0) continue;
        series.push({
          time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
          net: Math.floor((Math.random() - 0.4) * 3e8)
        });
      }
    }
    return { netAmount: 560000000, series };
  },

  // ===== 全球指数 =====
  async getGlobalIndices() {
    return [
      { code:'DJIA', name:'道琼斯', price:42568.32, changePercent:0.45 },
      { code:'NDX', name:'纳斯达克', price:18956.78, changePercent:1.23 },
      { code:'SPX', name:'标普500', price:5925.67, changePercent:0.78 },
      { code:'N225', name:'日经225', price:38956.12, changePercent:-0.35 },
      { code:'HSI', name:'恒生指数', price:19568.45, changePercent:1.56 },
      { code:'FTSE', name:'英国富时100', price:8356.78, changePercent:0.23 },
      { code:'DAX', name:'德国DAX', price:18562.34, changePercent:-0.12 }
    ];
  },

  // ===== VIX =====
  async getVIX() {
    return { name:'VIX', price:16.85, changePercent:-3.25, changeAmount:-0.57 };
  },

  // ===== 个股基本面 =====
  async getStockFinance(secid) {
    const quote = await this.getStockQuote(secid);
    return {
      name: quote.name, code: quote.code, price: quote.price,
      pe: quote.pe, pb: quote.pb, totalValue: quote.totalValue, floatValue: quote.floatValue,
      turnover: quote.turnover, changePercent: quote.changePercent
    };
  },

  // ===== 工具方法 =====
  getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  },

  formatNumber(num, decimals = 2) {
    if (num == null || isNaN(num)) return '--';
    if (Math.abs(num) >= 1e8) return (num / 1e8).toFixed(decimals) + '亿';
    if (Math.abs(num) >= 1e4) return (num / 1e4).toFixed(decimals) + '万';
    return num.toFixed(decimals);
  },

  formatMoney(num) {
    if (num == null || isNaN(num)) return '--';
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + '万亿';
    if (Math.abs(num) >= 1e8) return (num / 1e8).toFixed(2) + '亿';
    if (Math.abs(num) >= 1e4) return (num / 1e4).toFixed(2) + '万';
    return num.toFixed(2);
  }
};

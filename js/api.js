/**
 * A股复盘助手 - API数据层
 * 使用东方财富等免费公开接口获取数据
 * 无网络时自动使用模拟数据展示
 */

const API = {
  BASE_URL: 'https://push2.eastmoney.com/api/qt',
  DATA_URL: 'https://datacenter-web.eastmoney.com/api/data/v1/get',

  // 通用请求
  async fetch(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${url}?${query}` : url;
    try {
      const resp = await fetch(fullUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn('API fetch failed:', url, err.message);
      return null;
    }
  },

  // ===== 大盘指数 =====
  async getIndexData() {
    const data = await this.fetch(`${this.BASE_URL}/ulist.np/get`, {
      fltt: 2, fields: 'f2,f3,f4,f12,f14',
      secids: '1.000001,0.399001,0.399006,1.000688,0.399005,1.000300'
    });
    if (!data || !data.data?.diff) return this._mockIndices();
    return data.data.diff.map(i => ({
      code: i.f12, name: i.f14, price: i.f2,
      changePercent: i.f3, changeAmount: i.f4
    }));
  },
  _mockIndices() {
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
    const fs = type === 'industry' ? 'm:90+t:2' : 'm:90+t:3';
    const data = await this.fetch(`${this.BASE_URL}/clist.np/get`, {
      pn: 1, pz: 20, po: 1, np: 1, fltt: 2, fs, fields: 'f2,f3,f4,f12,f14'
    });
    if (!data || !data.data?.diff) return this._mockSectors(type);
    return data.data.diff.map(i => ({
      code: i.f12, name: i.f14, price: i.f2,
      changePercent: i.f3, changeAmount: i.f4
    }));
  },
  _mockSectors(type) {
    if (type === 'industry') return [
      { code:'BK0477', name:'半导体', changePercent:3.25 }, { code:'BK0478', name:'新能源', changePercent:2.18 },
      { code:'BK0479', name:'人工智能', changePercent:2.87 }, { code:'BK0480', name:'医药生物', changePercent:1.56 },
      { code:'BK0481', name:'消费电子', changePercent:1.23 }, { code:'BK0482', name:'汽车整车', changePercent:0.89 },
      { code:'BK0483', name:'银行', changePercent:-0.35 }, { code:'BK0484', name:'房地产', changePercent:-1.28 },
      { code:'BK0485', name:'白酒', changePercent:0.67 }, { code:'BK0486', name:'军工', changePercent:1.45 },
      { code:'BK0487', name:'光伏', changePercent:-0.78 }, { code:'BK0488', name:'锂电池', changePercent:1.92 },
      { code:'BK0489', name:'证券', changePercent:0.45 }, { code:'BK0490', name:'保险', changePercent:-0.56 },
      { code:'BK0491', name:'钢铁', changePercent:-0.92 }
    ].map(s => ({ ...s, price: 0, changeAmount: 0 }));
    return [
      { code:'BK0901', name:'华为概念', changePercent:3.56 }, { code:'BK0902', name:'ChatGPT', changePercent:2.89 },
      { code:'BK0903', name:'机器人', changePercent:2.34 }, { code:'BK0904', name:'低空经济', changePercent:1.78 },
      { code:'BK0905', name:'固态电池', changePercent:-0.45 }, { code:'BK0906', name:'量子科技', changePercent:1.23 },
      { code:'BK0907', name:'卫星导航', changePercent:0.89 }, { code:'BK0908', name:'碳中和', changePercent:-1.12 },
      { code:'BK0909', name:'元宇宙', changePercent:0.56 }, { code:'BK0910', name:'数字经济', changePercent:1.67 }
    ].map(s => ({ ...s, price: 0, changeAmount: 0 }));
  },

  // ===== 个股搜索 =====
  async searchStock(keyword) {
    const data = await this.fetch('https://searchapi.eastmoney.com/api/suggest/get', {
      input: keyword, type: 14, token: 'D43BF722C8E33BDC906FB84D85E326E8', count: 10
    });
    if (!data || !data.QuotationCodeTable?.Data) return this._mockSearch(keyword);
    return data.QuotationCodeTable.Data.filter(item =>
      item.SecurityTypeName === 'A股' || item.MktNum === '0' || item.MktNum === '1'
    ).map(item => ({
      code: item.Code, name: item.Name, market: item.MktNum === '0' ? 1 : 0
    }));
  },
  _mockSearch(keyword) {
    const stocks = [
      { code:'600519', name:'贵州茅台', market:1 }, { code:'000858', name:'五粮液', market:0 },
      { code:'300750', name:'宁德时代', market:0 }, { code:'601318', name:'中国平安', market:1 },
      { code:'000001', name:'平安银行', market:0 }, { code:'600036', name:'招商银行', market:1 },
      { code:'002594', name:'比亚迪', market:0 }, { code:'601012', name:'隆基绿能', market:1 },
      { code:'300059', name:'东方财富', market:0 }, { code:'600900', name:'长江电力', market:1 }
    ];
    return stocks.filter(s => s.name.includes(keyword) || s.code.includes(keyword));
  },

  // ===== 个股K线 =====
  async getStockKline(secid, klt = 101, count = 120) {
    const data = await this.fetch(`${this.BASE_URL}/stock/kline/get`, {
      secid, fields1: 'f1,f2,f3,f4,f5,f6',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
      klt, fqt: 1, beg: 0, end: 20500101, lmt: count
    });
    if (!data || !data.data?.klines) return this._mockKline(count);
    return data.data.klines.map(line => {
      const p = line.split(',');
      return {
        date: p[0], open: +p[1], close: +p[2], high: +p[3], low: +p[4],
        volume: +p[5], amount: +p[6], amplitude: +p[7],
        changePercent: +p[8], changeAmount: +p[9], turnover: +p[10]
      };
    });
  },
  _mockKline(count) {
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
    const data = await this.fetch(`${this.BASE_URL}/stock/get`, {
      secid, fields: 'f43,f44,f45,f46,f47,f48,f50,f51,f52,f55,f57,f58,f60,f116,f117,f162,f167,f168,f169,f170,f171,f292'
    });
    if (!data || !data.data) return this._mockQuote(secid);
    const d = data.data;
    return {
      code: d.f57, name: d.f58,
      price: d.f43 / 1000, open: d.f46 / 1000,
      high: d.f44 / 1000, low: d.f45 / 1000,
      preClose: d.f60 / 1000, volume: d.f47, amount: d.f48,
      changePercent: d.f170 / 100, changeAmount: d.f169 / 100,
      turnover: d.f168 / 100, pe: d.f167, pb: d.f162,
      totalValue: d.f116, floatValue: d.f117
    };
  },
  _mockQuote(secid) {
    const code = secid.split('.')[1];
    const names = {'600519':'贵州茅台','000858':'五粮液','300750':'宁德时代','601318':'中国平安','000001':'上证指数'};
    return {
      code, name: names[code] || '示例股票',
      price: 25.68, open: 25.20, high: 26.15, low: 25.05,
      preClose: 25.10, volume: 156800, amount: 4025000,
      changePercent: 2.31, changeAmount: 0.58,
      turnover: 1.85, pe: 28.5, pb: 4.2,
      totalValue: 51200000000, floatValue: 38500000000
    };
  },

  // ===== 资金流向 =====
  async getMoneyFlow(secid) {
    const data = await this.fetch('https://push2.eastmoney.com/api/qt/stock/fflow/daykline/get', {
      lmt: 10, klt: 101, secid, fields1: 'f1,f2,f3', fields2: 'f51,f52,f53,f54,f55,f56'
    });
    if (!data || !data.data?.klines) return this._mockMoneyFlow();
    return data.data.klines.map(line => {
      const p = line.split(',');
      return {
        date: p[0], mainIn: +p[1], mainOut: +p[2], mainNet: +p[3],
        superIn: +p[4], superOut: +p[5], bigIn: +p[4], bigOut: +p[5],
        midIn: +p[6], midOut: +p[7], smallIn: +p[8], smallOut: +p[9]
      };
    });
  },
  _mockMoneyFlow() {
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
    const data = await this.fetch(`${this.BASE_URL}/clist.np/get`, {
      pn: 1, pz: 30, po: 1, np: 1, fltt: 2,
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
      fields: 'f2,f3,f4,f12,f14'
    });
    if (!data || !data.data?.diff) return this._mockLimitList(type);
    const list = data.data.diff;
    if (type === 'zt') {
      return list.filter(i => i.f3 >= 9.8).map(i => ({ code:i.f12, name:i.f14, price:i.f2, changePercent:i.f3 }));
    }
    return list.filter(i => i.f3 <= -9.8).map(i => ({ code:i.f12, name:i.f14, price:i.f2, changePercent:i.f3 }));
  },
  _mockLimitList(type) {
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
    const data = await this.fetch('https://push2.eastmoney.com/api/qt/kamt.rtmin/get', {
      fields1: 'f1,f2,f3', fields2: 'f51,f52,f53,f54,f55,f56'
    });
    if (!data || !data.data) return this._mockNorthFlow();
    const d = data.data;
    return {
      buyAmount: d.s2nBuyAmount, sellAmount: d.s2nSellAmount, netAmount: d.s2nNetAmount,
      series: d.s2n ? d.s2n.map(item => ({ time: item.split(',')[0], net: +item.split(',')[1] })) : []
    };
  },
  _mockNorthFlow() {
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
    const data = await this.fetch(`${this.BASE_URL}/ulist.np/get`, {
      fltt: 2, fields: 'f2,f3,f4,f12,f14',
      secids: '100.DJIA,100.NDX,100.SPX,100.N225,100.HSI,100.FTSE,100.DAX,100.GDAXI'
    });
    if (!data || !data.data?.diff) return this._mockGlobalIndices();
    return data.data.diff.map(i => ({
      code: i.f12, name: i.f14, price: i.f2, changePercent: i.f3
    }));
  },
  _mockGlobalIndices() {
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
    const data = await this.fetch(`${this.BASE_URL}/stock/get`, {
      secid: '100.VIX', fields: 'f43,f44,f45,f46,f47,f48,f57,f58,f170,f169'
    });
    if (!data || !data.data) return { name:'VIX', price:16.85, changePercent:-3.25, changeAmount:-0.57 };
    const d = data.data;
    return { name: d.f58, price: d.f43 / 1000, changePercent: d.f170 / 100, changeAmount: d.f169 / 100 };
  },

  // ===== 个股基本面 =====
  async getStockFinance(secid) {
    const data = await this.fetch(`${this.BASE_URL}/stock/get`, {
      secid, fields: 'f43,f44,f45,f46,f47,f48,f57,f58,f162,f167,f168,f169,f170,f116,f117'
    });
    if (!data || !data.data) return this._mockQuote(secid);
    const d = data.data;
    return {
      name: d.f58, code: d.f57, price: d.f43 / 1000,
      pe: d.f167, pb: d.f162, totalValue: d.f116, floatValue: d.f117,
      turnover: d.f168 / 100, changePercent: d.f170 / 100
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

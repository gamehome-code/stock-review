/**
 * 技术分析模块 - K线图、均线、MACD、成交量
 */

const Technical = {
  currentCode: '000001',
  currentName: '上证指数',
  currentMarket: 1,
  klineData: [],
  klineType: 101, // 101=日K, 102=周K, 103=月K
  indicators: { ma: true, boll: false, macd: true, kdj: false, vol: true },
  searchTimer: null,

  async init(code, name) {
    if (code) this.setCode(code, name);
    this.bindEvents();
    await this.loadKline();
  },

  setCode(code, name) {
    // 判断市场
    if (code.startsWith('6') || code.startsWith('000001') && name?.includes('上证')) {
      this.currentMarket = 1;
    } else if (code.startsWith('0') || code.startsWith('3')) {
      this.currentMarket = 0;
    } else if (code.startsWith('9')) {
      this.currentMarket = 1; // B股
    }
    this.currentCode = code;
    this.currentName = name || code;
    const searchInput = document.getElementById('stock-search');
    if (searchInput) searchInput.value = name || code;
  },

  get secid() {
    return `${this.currentMarket}.${this.currentCode}`;
  },

  async loadKline() {
    const chartEl = document.getElementById('kline-chart');
    if (!chartEl) return;
    chartEl.innerHTML = '<div class="loading"><div class="spinner"></div>加载K线数据...</div>';

    this.klineData = await API.getStockKline(this.secid, this.klineType, 120);
    if (!this.klineData.length) {
      chartEl.innerHTML = '<div class="empty-state">暂无K线数据</div>';
      return;
    }

    this.renderChart();
    await this.loadQuote();
    this.loadMoneyFlow();
  },

  async loadQuote() {
    const quote = await API.getStockQuote(this.secid);
    if (!quote) return;
    const el = document.getElementById('stock-quote');
    if (!el) return;
    const cls = quote.changePercent > 0 ? 'up' : quote.changePercent < 0 ? 'down' : 'flat';
    const sign = quote.changePercent > 0 ? '+' : '';
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:18px;font-weight:700">${quote.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${quote.code}</div>
          </div>
          <div style="text-align:right">
            <div class="index-value ${cls}" style="font-size:28px">${quote.price?.toFixed(2)}</div>
            <div class="${cls}" style="font-size:13px">${sign}${quote.changePercent?.toFixed(2)}% ${sign}${quote.changeAmount?.toFixed(2)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;font-size:12px">
          <div><span style="color:var(--text-muted)">开盘</span><br><span>${quote.open?.toFixed(2)}</span></div>
          <div><span style="color:var(--text-muted)">最高</span><br><span class="up">${quote.high?.toFixed(2)}</span></div>
          <div><span style="color:var(--text-muted)">最低</span><br><span class="down">${quote.low?.toFixed(2)}</span></div>
          <div><span style="color:var(--text-muted)">成交量</span><br><span>${API.formatNumber(quote.volume)}</span></div>
          <div><span style="color:var(--text-muted)">市盈率</span><br><span>${quote.pe || '--'}</span></div>
          <div><span style="color:var(--text-muted)">市净率</span><br><span>${quote.pb || '--'}</span></div>
          <div><span style="color:var(--text-muted)">总市值</span><br><span>${API.formatMoney(quote.totalValue)}</span></div>
          <div><span style="color:var(--text-muted)">换手率</span><br><span>${quote.turnover != null ? quote.turnover.toFixed(2) + '%' : '--'}</span></div>
        </div>
      </div>
    `;
  },

  async loadMoneyFlow() {
    const container = document.getElementById('money-flow');
    if (!container) return;
    const data = await API.getMoneyFlow(this.secid);
    if (!data.length) {
      container.innerHTML = '<div class="empty-state">暂无资金流向数据</div>';
      return;
    }

    // 渲染资金流向图表
    const dates = data.map(d => d.date.slice(5));
    const mainNet = data.map(d => d.mainNet);

    const chart = echarts.init(document.getElementById('money-flow-chart'));
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 10, bottom: 20, left: 50, right: 10 },
      xAxis: { type: 'category', data: dates, axisLabel: { color: '#8b949e', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#8b949e', fontSize: 10, formatter: v => (v/1e4).toFixed(0)+'万' } },
      series: [{
        type: 'bar', data: mainNet,
        itemStyle: { color: p => p.value >= 0 ? '#f85149' : '#3fb950' }
      }],
      tooltip: { trigger: 'axis', formatter: p => `${p[0].name}<br/>主力净流入: ${API.formatMoney(p[0].value)}` }
    });
    window.addEventListener('resize', () => chart.resize());
  },

  renderChart() {
    const chartEl = document.getElementById('kline-chart');
    if (!chartEl || !this.klineData.length) return;
    chartEl.innerHTML = '';

    const chart = echarts.init(chartEl);
    const dates = this.klineData.map(d => d.date);
    const ohlc = this.klineData.map(d => [d.open, d.close, d.low, d.high]);
    const volumes = this.klineData.map(d => d.volume);
    const colors = this.klineData.map(d => d.close >= d.open ? '#f85149' : '#3fb950');

    const option = {
      backgroundColor: '#0d1117',
      animation: false,
      axisPointer: { link: [{ xAxisIndex: 'all' }], label: { backgroundColor: '#333' } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(22,27,34,0.95)',
        borderColor: '#30363d',
        textStyle: { color: '#e6edf3', fontSize: 12 },
        formatter: params => {
          const idx = params[0].dataIndex;
          const d = this.klineData[idx];
          if (!d) return '';
          const sign = d.changePercent >= 0 ? '+' : '';
          const c = d.close >= d.open ? 'color:#f85149' : 'color:#3fb950';
          return `<div style="${c};font-weight:600">${d.date}</div>
            开: ${d.open.toFixed(2)} 收: ${d.close.toFixed(2)}<br/>
            高: ${d.high.toFixed(2)} 低: ${d.low.toFixed(2)}<br/>
            量: ${API.formatNumber(d.volume)}<br/>
            涨跌: ${sign}${d.changePercent.toFixed(2)}%`;
        }
      },
      legend: {
        data: ['MA5', 'MA10', 'MA20', 'MA60'],
        top: 5, left: 'center',
        textStyle: { color: '#8b949e', fontSize: 10 },
        itemWidth: 14, itemHeight: 2
      },
      grid: [
        { left: 50, right: 10, top: 30, height: '50%' },
        { left: 50, right: 10, top: '72%', height: '18%' }
      ],
      xAxis: [
        { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#30363d' } }, axisTick: { show: false } },
        { type: 'category', data: dates, gridIndex: 1, axisLabel: { color: '#8b949e', fontSize: 10 }, axisLine: { lineStyle: { color: '#30363d' } }, axisTick: { show: false } }
      ],
      yAxis: [
        { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#21262d' } }, axisLabel: { color: '#8b949e', fontSize: 10 } },
        { scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10, formatter: v => API.formatNumber(v, 0) } }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
        { show: false, xAxisIndex: [0, 1], start: 60, end: 100 }
      ],
      series: [
        {
          name: 'K线', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0,
          data: ohlc,
          itemStyle: { color: '#f85149', color0: '#3fb950', borderColor: '#f85149', borderColor0: '#3fb950' }
        },
        {
          name: 'MA5', type: 'line', xAxisIndex: 0, yAxisIndex: 0,
          data: this.calcMA(5), smooth: true, showSymbol: false,
          lineStyle: { width: 1, color: '#f0b429' }
        },
        {
          name: 'MA10', type: 'line', xAxisIndex: 0, yAxisIndex: 0,
          data: this.calcMA(10), smooth: true, showSymbol: false,
          lineStyle: { width: 1, color: '#58a6ff' }
        },
        {
          name: 'MA20', type: 'line', xAxisIndex: 0, yAxisIndex: 0,
          data: this.calcMA(20), smooth: true, showSymbol: false,
          lineStyle: { width: 1, color: '#bc8cff' }
        },
        {
          name: 'MA60', type: 'line', xAxisIndex: 0, yAxisIndex: 0,
          data: this.calcMA(60), smooth: true, showSymbol: false,
          lineStyle: { width: 1, color: '#3fb950' }
        },
        {
          name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
          data: volumes.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i], opacity: 0.7 }
          }))
        }
      ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    this._chart = chart;
  },

  calcMA(dayCount) {
    const result = [];
    for (let i = 0; i < this.klineData.length; i++) {
      if (i < dayCount - 1) { result.push(null); continue; }
      let sum = 0;
      for (let j = 0; j < dayCount; j++) sum += this.klineData[i - j].close;
      result.push(+(sum / dayCount).toFixed(2));
    }
    return result;
  },

  // MACD计算
  calcMACD(short = 12, long = 26, signal = 9) {
    const closes = this.klineData.map(d => d.close);
    const emaShort = this.calcEMA(closes, short);
    const emaLong = this.calcEMA(closes, long);
    const dif = emaShort.map((v, i) => v - emaLong[i]);
    const dea = this.calcEMA(dif, signal);
    const macd = dif.map((v, i) => (v - dea[i]) * 2);
    return { dif, dea, macd };
  },

  calcEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  },

  async search(keyword) {
    if (!keyword || keyword.length < 1) return;
    const results = await API.searchStock(keyword);
    const dropdown = document.getElementById('search-results');
    if (!dropdown) return;
    if (!results.length) {
      dropdown.style.display = 'none';
      return;
    }
    dropdown.innerHTML = results.map(r => `
      <div class="stock-item" onclick="Technical.selectStock('${r.code}','${r.name}',${r.market})">
        <div class="stock-info">
          <div class="stock-name">${r.name}</div>
          <div class="stock-code">${r.code}</div>
        </div>
      </div>
    `).join('');
    dropdown.style.display = 'block';
  },

  selectStock(code, name, market) {
    this.currentMarket = market;
    this.currentCode = code;
    this.currentName = name;
    document.getElementById('stock-search').value = name;
    document.getElementById('search-results').style.display = 'none';
    this.loadKline();
  },

  bindEvents() {
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.search(e.target.value.trim()), 500);
      });
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          const dropdown = document.getElementById('search-results');
          if (dropdown) dropdown.style.display = 'none';
        }, 200);
      });
    }

    // K线类型切换
    document.querySelectorAll('.kline-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.kline-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.klineType = parseInt(tab.dataset.type);
        this.loadKline();
      });
    });
  }
};

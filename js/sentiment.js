/**
 * 全球市场情绪模块 - VIX、全球指数、北向资金、情绪打分
 */

const Sentiment = {
  sentimentScore: 50,

  async init() {
    await this.loadAll();
  },

  async refresh() {
    await this.loadAll();
  },

  async loadAll() {
    await Promise.all([
      this.loadVIX(),
      this.loadGlobalIndices(),
      this.loadNorthFlow(),
      this.calcSentimentScore()
    ]);
  },

  // VIX恐慌指数
  async loadVIX() {
    const el = document.getElementById('vix-card');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const vix = await API.getVIX();
    if (!vix) {
      el.innerHTML = '<div class="card"><div class="card-title">😰 VIX恐慌指数</div><div class="empty-state">数据加载失败</div></div>';
      return;
    }

    const cls = vix.changePercent > 0 ? 'down' : 'up'; // VIX涨=恐慌
    const sign = vix.changePercent > 0 ? '+' : '';
    const level = vix.price < 15 ? '极度贪婪 😍' : vix.price < 20 ? '贪婪 😊' : vix.price < 25 ? '中性 😐' : vix.price < 30 ? '恐慌 😰' : '极度恐慌 😱';

    el.innerHTML = `
      <div class="card">
        <div class="card-title">😰 VIX恐慌指数</div>
        <div class="gauge-container">
          <div class="gauge-value ${cls}">${vix.price?.toFixed(2)}</div>
          <div class="gauge-label">${sign}${vix.changePercent?.toFixed(2)}%</div>
          <div style="margin-top:8px;font-size:16px;font-weight:600">${level}</div>
        </div>
        <div class="gauge-scale">
          <div class="gauge-pointer" style="left:${Math.min(95, Math.max(5, vix.price / 50 * 100))}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px">
          <span>贪婪</span><span>中性</span><span>恐慌</span>
        </div>
      </div>
    `;
  },

  // 全球指数
  async loadGlobalIndices() {
    const el = document.getElementById('global-indices');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const indices = await API.getGlobalIndices();
    if (!indices.length) {
      el.innerHTML = '<div class="empty-state">数据加载失败</div>';
      return;
    }

    el.innerHTML = `
      <div class="card">
        <div class="card-title">🌍 全球主要指数</div>
        <ul class="stock-list">
          ${indices.map(item => {
            const cls = item.changePercent > 0 ? 'up' : item.changePercent < 0 ? 'down' : 'flat';
            const sign = item.changePercent > 0 ? '+' : '';
            return `
              <li class="stock-item">
                <div class="stock-info">
                  <div class="stock-name">${item.name}</div>
                </div>
                <div class="stock-price">
                  <div class="price ${cls}">${item.price?.toFixed(2)}</div>
                  <div class="change ${cls}">${sign}${item.changePercent?.toFixed(2)}%</div>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  },

  // 北向资金
  async loadNorthFlow() {
    const el = document.getElementById('north-flow');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const data = await API.getNorthFlow();
    if (!data) {
      el.innerHTML = '<div class="empty-state">北向资金数据加载失败</div>';
      return;
    }

    const netAmount = data.netAmount || 0;
    const cls = netAmount > 0 ? 'up' : netAmount < 0 ? 'down' : 'flat';
    const sign = netAmount > 0 ? '+' : '';

    el.innerHTML = `
      <div class="card">
        <div class="card-title">💰 北向资金</div>
        <div class="gauge-container">
          <div class="gauge-value ${cls}">${sign}${API.formatMoney(netAmount)}</div>
          <div class="gauge-label">今日净流入</div>
        </div>
        <div id="north-flow-chart" style="height:180px;margin-top:12px"></div>
      </div>
    `;

    // 渲染分时图
    if (data.series && data.series.length) {
      this.renderNorthFlowChart(data.series);
    }
  },

  renderNorthFlowChart(series) {
    const chartEl = document.getElementById('north-flow-chart');
    if (!chartEl) return;
    const chart = echarts.init(chartEl);

    const times = series.map(s => s.time);
    const values = series.map(s => s.net);
    const cumulative = [];
    let sum = 0;
    values.forEach(v => { sum += v; cumulative.push(sum); });

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 10, bottom: 25, left: 50, right: 10 },
      xAxis: {
        type: 'category', data: times,
        axisLabel: { color: '#8b949e', fontSize: 10, interval: Math.floor(times.length / 4) },
        axisLine: { lineStyle: { color: '#30363d' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8b949e', fontSize: 10, formatter: v => (v/1e4).toFixed(0)+'万' },
        splitLine: { lineStyle: { color: '#21262d' } }
      },
      series: [{
        type: 'line', data: cumulative, smooth: true,
        lineStyle: { color: '#58a6ff', width: 2 },
        itemStyle: { color: '#58a6ff' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(88,166,255,0.2)' }, { offset: 1, color: 'rgba(88,166,255,0)' }]
          }
        },
        markLine: { data: [{ yAxis: 0 }], lineStyle: { color: '#30363d', type: 'dashed' } }
      }],
      tooltip: { trigger: 'axis', formatter: p => `${p[0].name}<br/>累计净流入: ${API.formatMoney(p[0].value)}` }
    });
    window.addEventListener('resize', () => chart.resize());
  },

  // 综合情绪打分
  async calcSentimentScore() {
    const el = document.getElementById('sentiment-score');
    if (!el) return;

    let score = 50; // 基准分

    // 因子1: VIX
    const vix = await API.getVIX();
    if (vix?.price) {
      // VIX越低越贪婪，分数越高
      score += (25 - vix.price) * 1.5;
    }

    // 因子2: 全球指数
    const indices = await API.getGlobalIndices();
    if (indices?.length) {
      const avgChange = indices.reduce((s, i) => s + (i.changePercent || 0), 0) / indices.length;
      score += avgChange * 3;
    }

    // 因子3: 北向资金
    const north = await API.getNorthFlow();
    if (north?.netAmount) {
      // 净流入>50亿加分，净流出减分
      score += (north.netAmount / 1e8) * 0.5;
    }

    // 限制在0-100
    score = Math.max(0, Math.min(100, Math.round(score)));
    this.sentimentScore = score;

    const level = score >= 80 ? '极度贪婪 🔴' : score >= 60 ? '贪婪 🟠' : score >= 40 ? '中性 🟡' : score >= 20 ? '恐慌 🟢' : '极度恐慌 🔵';
    const color = score >= 60 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

    el.innerHTML = `
      <div class="card">
        <div class="card-title">🎯 A股综合情绪指数</div>
        <div class="gauge-container">
          <div class="gauge-value" style="color:${color}">${score}</div>
          <div class="gauge-label">${level}</div>
        </div>
        <div class="gauge-scale">
          <div class="gauge-pointer" style="left:${score}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px">
          <span>极度恐慌</span><span>中性</span><span>极度贪婪</span>
        </div>
        <div style="margin-top:16px;font-size:12px;color:var(--text-secondary);line-height:1.8">
          <div>📊 评估因子：</div>
          <div>• VIX恐慌指数 ${vix?.price ? (vix.price < 20 ? '🟢低位' : vix.price < 30 ? '🟡中位' : '🔴高位') : '--'}</div>
          <div>• 全球市场 ${indices?.length ? (indices.filter(i => i.changePercent > 0).length > indices.length/2 ? '🟢偏多' : '🔴偏空') : '--'}</div>
          <div>• 北向资金 ${north?.netAmount ? (north.netAmount > 0 ? `🟢净流入${API.formatMoney(north.netAmount)}` : `🔴净流出${API.formatMoney(Math.abs(north.netAmount))}`) : '--'}</div>
        </div>
      </div>
    `;
  }
};

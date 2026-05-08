/**
 * 基本面分析模块
 */

const Fundamental = {
  searchTimer: null,
  currentStock: null,

  async init() {
    this.bindEvents();
    // 默认加载贵州茅台
    await this.loadStock('600519', '贵州茅台', 1);
  },

  async loadStock(code, name, market) {
    this.currentStock = { code, name, market };
    const secid = `${market}.${code}`;

    // 获取行情+估值数据
    const quote = await API.getStockQuote(secid);
    if (!quote) {
      document.getElementById('fundamental-content').innerHTML =
        '<div class="empty-state">数据加载失败，请检查网络</div>';
      return;
    }

    this.renderFundamental(quote);
    this.renderValuationChart(code, market);
  },

  renderFundamental(q) {
    const container = document.getElementById('fundamental-content');
    const cls = q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'flat';
    const sign = q.changePercent > 0 ? '+' : '';

    container.innerHTML = `
      <!-- 股票概览 -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:18px;font-weight:700">${q.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${q.code}</div>
          </div>
          <div style="text-align:right">
            <div class="index-value ${cls}" style="font-size:28px">${q.price?.toFixed(2)}</div>
            <div class="${cls}" style="font-size:13px">${sign}${q.changePercent?.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <!-- 估值指标 -->
      <div class="card">
        <div class="card-title">
          <span class="icon">📊</span> 估值指标
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:var(--bg-input);padding:12px;border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">市盈率(PE-TTM)</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${q.pe || '--'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${this.getPELevel(q.pe)}</div>
          </div>
          <div style="background:var(--bg-input);padding:12px;border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">市净率(PB)</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${q.pb || '--'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${this.getPBLevel(q.pb)}</div>
          </div>
          <div style="background:var(--bg-input);padding:12px;border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">总市值</div>
            <div style="font-size:16px;font-weight:600;margin-top:4px">${API.formatMoney(q.totalValue)}</div>
          </div>
          <div style="background:var(--bg-input);padding:12px;border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">流通市值</div>
            <div style="font-size:16px;font-weight:600;margin-top:4px">${API.formatMoney(q.floatValue)}</div>
          </div>
        </div>
      </div>

      <!-- 估值雷达图 -->
      <div class="card">
        <div class="card-title">
          <span class="icon">🎯</span> 综合评分
        </div>
        <div id="radar-chart" style="height:280px"></div>
      </div>

      <!-- 市场热度 -->
      <div class="card">
        <div class="card-title">
          <span class="icon">🔥</span> 市场热度
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
          <div style="text-align:center">
            <div style="color:var(--text-muted)">换手率</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px">${q.turnout?.toFixed(2)}%</div>
          </div>
          <div style="text-align:center">
            <div style="color:var(--text-muted)">成交额</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px">${API.formatMoney(q.amount)}</div>
          </div>
          <div style="text-align:center">
            <div style="color:var(--text-muted)">量比</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px">${(q.volume / (q.totalValue * q.turnout / 100 / q.price) || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
    `;

    // 渲染雷达图
    this.renderRadar(q);
  },

  renderRadar(q) {
    const chartEl = document.getElementById('radar-chart');
    if (!chartEl) return;
    const chart = echarts.init(chartEl);

    // 简单评分逻辑
    const peScore = q.pe ? Math.max(0, Math.min(100, 100 - (q.pe - 10) * 2)) : 50;
    const pbScore = q.pb ? Math.max(0, Math.min(100, 100 - (q.pb - 1) * 15)) : 50;
    const capScore = q.totalValue ? Math.min(100, q.totalValue / 1e10) : 50;
    const turnoverScore = q.turnout ? Math.min(100, q.turnout * 10) : 50;

    chart.setOption({
      backgroundColor: 'transparent',
      radar: {
        indicator: [
          { name: '估值偏低', max: 100 },
          { name: '市值规模', max: 100 },
          { name: '市场活跃', max: 100 },
          { name: '安全边际', max: 100 },
          { name: '成长潜力', max: 100 }
        ],
        axisName: { color: '#8b949e', fontSize: 11 },
        splitArea: { areaStyle: { color: ['rgba(26,115,232,0.05)', 'rgba(26,115,232,0.1)'] } },
        axisLine: { lineStyle: { color: '#30363d' } },
        splitLine: { lineStyle: { color: '#30363d' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: [peScore, capScore, turnoverScore, pbScore, (peScore + pbScore) / 2],
          name: q.name,
          areaStyle: { color: 'rgba(26,115,232,0.2)' },
          lineStyle: { color: '#1a73e8' },
          itemStyle: { color: '#1a73e8' }
        }]
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  },

  renderValuationChart(code, market) {
    // 使用历史PE/PB数据（简化版，展示趋势）
    const chartEl = document.getElementById('valuation-chart');
    if (!chartEl) return;
    const chart = echarts.init(chartEl);

    // 模拟历史估值数据（实际应从API获取）
    const months = [];
    const peData = [];
    const pbData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(`${d.getMonth()+1}月`);
      peData.push(+(20 + Math.random() * 30).toFixed(1));
      pbData.push(+(2 + Math.random() * 5).toFixed(2));
    }

    chart.setOption({
      backgroundColor: 'transparent',
      legend: {
        data: ['PE', 'PB'],
        top: 5, right: 10,
        textStyle: { color: '#8b949e', fontSize: 11 }
      },
      grid: { top: 35, bottom: 25, left: 45, right: 10 },
      xAxis: {
        type: 'category', data: months,
        axisLabel: { color: '#8b949e', fontSize: 10 },
        axisLine: { lineStyle: { color: '#30363d' } }
      },
      yAxis: [
        {
          type: 'value', name: 'PE',
          nameTextStyle: { color: '#8b949e', fontSize: 10 },
          axisLabel: { color: '#8b949e', fontSize: 10 },
          splitLine: { lineStyle: { color: '#21262d' } }
        },
        {
          type: 'value', name: 'PB',
          nameTextStyle: { color: '#8b949e', fontSize: 10 },
          axisLabel: { color: '#8b949e', fontSize: 10 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'PE', type: 'line', data: peData, smooth: true,
          lineStyle: { color: '#58a6ff', width: 2 },
          itemStyle: { color: '#58a6ff' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(88,166,255,0.2)' }, { offset: 1, color: 'rgba(88,166,255,0)' }] } }
        },
        {
          name: 'PB', type: 'line', yAxisIndex: 1, data: pbData, smooth: true,
          lineStyle: { color: '#bc8cff', width: 2 },
          itemStyle: { color: '#bc8cff' }
        }
      ],
      tooltip: { trigger: 'axis' }
    });
    window.addEventListener('resize', () => chart.resize());
  },

  getPELevel(pe) {
    if (!pe) return '数据不足';
    if (pe < 0) return '亏损';
    if (pe < 15) return '低估 🟢';
    if (pe < 30) return '合理 🟡';
    if (pe < 60) return '偏高 🟠';
    return '高估 🔴';
  },

  getPBLevel(pb) {
    if (!pb) return '数据不足';
    if (pb < 1) return '破净 🟢';
    if (pb < 2) return '低估 🟢';
    if (pb < 5) return '合理 🟡';
    if (pb < 10) return '偏高 🟠';
    return '高估 🔴';
  },

  async search(keyword) {
    if (!keyword || keyword.length < 1) return;
    const results = await API.searchStock(keyword);
    const dropdown = document.getElementById('fund-search-results');
    if (!dropdown) return;
    if (!results.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = results.map(r => `
      <div class="stock-item" onclick="Fundamental.selectStock('${r.code}','${r.name}',${r.market})">
        <div class="stock-info">
          <div class="stock-name">${r.name}</div>
          <div class="stock-code">${r.code}</div>
        </div>
      </div>
    `).join('');
    dropdown.style.display = 'block';
  },

  selectStock(code, name, market) {
    document.getElementById('fund-search').value = name;
    document.getElementById('fund-search-results').style.display = 'none';
    this.loadStock(code, name, market);
  },

  bindEvents() {
    const searchInput = document.getElementById('fund-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.search(e.target.value.trim()), 500);
      });
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          const d = document.getElementById('fund-search-results');
          if (d) d.style.display = 'none';
        }, 200);
      });
    }
  }
};

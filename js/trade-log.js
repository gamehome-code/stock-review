/**
 * 交易日志模块 - 交易记录、持仓管理、盈亏统计、简单回测
 */

const TradeLog = {
  STORAGE_KEY: 'stock_trade_log',
  trades: [],
  editingId: null,

  init() {
    this.loadTrades();
    this.render();
    this.bindEvents();
  },

  // ===== 数据持久化 =====
  loadTrades() {
    try {
      this.trades = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch { this.trades = []; }
  },

  saveTrades() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.trades));
  },

  // ===== CRUD =====
  addTrade(trade) {
    trade.id = Date.now();
    trade.createTime = new Date().toISOString();
    this.trades.push(trade);
    this.saveTrades();
    this.render();
    this.showToast('交易记录已添加');
  },

  updateTrade(id, data) {
    const idx = this.trades.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.trades[idx] = { ...this.trades[idx], ...data };
      this.saveTrades();
      this.render();
      this.showToast('交易记录已更新');
    }
  },

  deleteTrade(id) {
    this.trades = this.trades.filter(t => t.id !== id);
    this.saveTrades();
    this.render();
    this.showToast('交易记录已删除');
  },

  // ===== 渲染 =====
  render() {
    this.renderSummary();
    this.renderPositionList();
    this.renderTradeHistory();
    this.renderPnlChart();
  },

  renderSummary() {
    const el = document.getElementById('trade-summary');
    if (!el) return;

    const positions = this.getPositions();
    const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
    const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
    const totalPnlPercent = totalCost ? (totalPnl / totalCost * 100) : 0;
    const winCount = positions.filter(p => p.pnl > 0).length;
    const winRate = positions.length ? (winCount / positions.length * 100) : 0;

    el.innerHTML = `
      <div class="summary-item">
        <div class="summary-label">持仓盈亏</div>
        <div class="summary-value ${totalPnl >= 0 ? 'up' : 'down'}">${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">盈亏比例</div>
        <div class="summary-value ${totalPnlPercent >= 0 ? 'up' : 'down'}">${totalPnlPercent >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">胜率</div>
        <div class="summary-value" style="color:var(--blue)">${winRate.toFixed(0)}%</div>
      </div>
    `;
  },

  getPositions() {
    const map = {};
    this.trades.forEach(t => {
      if (!map[t.code]) {
        map[t.code] = { code: t.code, name: t.name, shares: 0, totalCost: 0, realized: 0 };
      }
      const pos = map[t.code];
      if (t.type === 'buy') {
        pos.shares += t.shares;
        pos.totalCost += t.price * t.shares;
      } else {
        const avgCost = pos.shares ? pos.totalCost / pos.shares : t.price;
        pos.shares -= t.shares;
        pos.totalCost = pos.shares * avgCost;
        pos.realized += (t.price - avgCost) * t.shares;
      }
    });

    return Object.values(map).filter(p => p.shares > 0).map(p => ({
      ...p,
      avgCost: p.totalCost / p.shares,
      pnl: 0, // 需要实时价格才能计算，这里先留0
      pnlPercent: 0
    }));
  },

  renderPositionList() {
    const el = document.getElementById('position-list');
    if (!el) return;

    const positions = this.getPositions();
    if (!positions.length) {
      el.innerHTML = '<div class="empty-state">暂无持仓记录<br/>点击下方"添加交易"开始记录</div>';
      return;
    }

    el.innerHTML = positions.map(p => `
      <div class="stock-item">
        <div class="stock-info">
          <div class="stock-name">${p.name}</div>
          <div class="stock-code">${p.code} · ${p.shares}股</div>
        </div>
        <div class="stock-price">
          <div class="price">成本 ${p.avgCost.toFixed(2)}</div>
          <div class="change">市值 ${API.formatMoney(p.totalCost + p.pnl)}</div>
        </div>
      </div>
    `).join('');
  },

  renderTradeHistory() {
    const el = document.getElementById('trade-history');
    if (!el) return;

    const sorted = [...this.trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!sorted.length) {
      el.innerHTML = '<div class="empty-state">暂无交易记录</div>';
      return;
    }

    el.innerHTML = sorted.slice(0, 50).map(t => {
      const isBuy = t.type === 'buy';
      return `
        <div class="stock-item">
          <div class="stock-info">
            <div class="stock-name">
              <span class="tag ${isBuy ? 'tag-up' : 'tag-down'}">${isBuy ? '买入' : '卖出'}</span>
              ${t.name}
            </div>
            <div class="stock-code">${t.code} · ${t.date}</div>
          </div>
          <div class="stock-price">
            <div class="price">${t.price.toFixed(2)} × ${t.shares}</div>
            <div class="change">金额 ${(t.price * t.shares).toFixed(0)}</div>
          </div>
          <button class="btn btn-sm btn-danger" style="margin-left:8px;padding:4px 8px;font-size:11px"
            onclick="TradeLog.deleteTrade(${t.id})">删</button>
        </div>
      `;
    }).join('');
  },

  renderPnlChart() {
    const chartEl = document.getElementById('pnl-chart');
    if (!chartEl) return;

    // 按日期汇总盈亏
    const dailyPnl = {};
    this.trades.forEach(t => {
      if (!dailyPnl[t.date]) dailyPnl[t.date] = 0;
      // 简化：卖出时计算盈亏
      if (t.type === 'sell') {
        const buyTrades = this.trades.filter(b => b.code === t.code && b.type === 'buy' && b.date <= t.date);
        if (buyTrades.length) {
          const avgCost = buyTrades.reduce((s, b) => s + b.price * b.shares, 0) / buyTrades.reduce((s, b) => s + b.shares, 0);
          dailyPnl[t.date] += (t.price - avgCost) * t.shares;
        }
      }
    });

    const dates = Object.keys(dailyPnl).sort();
    const values = dates.map(d => dailyPnl[d]);
    const cumulative = [];
    let sum = 0;
    values.forEach(v => { sum += v; cumulative.push(+sum.toFixed(2)); });

    if (!dates.length) {
      chartEl.innerHTML = '<div class="empty-state">完成交易后查看盈亏曲线</div>';
      return;
    }

    const chart = echarts.init(chartEl);
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 15, bottom: 25, left: 50, right: 10 },
      xAxis: {
        type: 'category', data: dates,
        axisLabel: { color: '#8b949e', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: '#30363d' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8b949e', fontSize: 10 },
        splitLine: { lineStyle: { color: '#21262d' } }
      },
      series: [{
        type: 'line', data: cumulative, smooth: true,
        lineStyle: { color: '#58a6ff', width: 2 },
        itemStyle: { color: '#58a6ff' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(88,166,255,0.3)' }, { offset: 1, color: 'rgba(88,166,255,0)' }]
          }
        },
        markLine: {
          data: [{ yAxis: 0 }],
          lineStyle: { color: '#30363d', type: 'dashed' }
        }
      }],
      tooltip: { trigger: 'axis', formatter: p => `${p[0].name}<br/>累计盈亏: ${p[0].value.toFixed(2)}` }
    });
    window.addEventListener('resize', () => chart.resize());
  },

  // ===== 简单回测 =====
  async runBacktest() {
    const code = document.getElementById('backtest-code')?.value?.trim();
    const strategy = document.getElementById('backtest-strategy')?.value;

    if (!code) { this.showToast('请输入股票代码'); return; }

    const market = code.startsWith('6') ? 1 : 0;
    const secid = `${market}.${code}`;
    const kline = await API.getStockKline(secid, 101, 250);

    if (!kline.length) { this.showToast('无法获取K线数据'); return; }

    let trades = [];
    let cash = 100000;
    let shares = 0;
    let wins = 0, losses = 0;

    if (strategy === 'ma-cross') {
      // 均线交叉策略
      for (let i = 60; i < kline.length; i++) {
        const ma5 = kline.slice(i-4, i+1).reduce((s, k) => s + k.close, 0) / 5;
        const ma20 = kline.slice(i-19, i+1).reduce((s, k) => s + k.close, 0) / 20;
        const prevMa5 = kline.slice(i-5, i).reduce((s, k) => s + k.close, 0) / 5;
        const prevMa20 = kline.slice(i-20, i).reduce((s, k) => s + k.close, 0) / 20;

        if (prevMa5 <= prevMa20 && ma5 > ma20 && shares === 0) {
          shares = Math.floor(cash / kline[i].close / 100) * 100;
          cash -= shares * kline[i].close;
          trades.push({ date: kline[i].date, type: 'buy', price: kline[i].close, shares });
        } else if (prevMa5 >= prevMa20 && ma5 < ma20 && shares > 0) {
          const pnl = (kline[i].close - trades[trades.length-1].price) * shares;
          if (pnl > 0) wins++; else losses++;
          cash += shares * kline[i].close;
          trades.push({ date: kline[i].date, type: 'sell', price: kline[i].close, shares });
          shares = 0;
        }
      }
    }

    // 最终平仓
    if (shares > 0) {
      cash += shares * kline[kline.length-1].close;
      const pnl = (kline[kline.length-1].close - trades[trades.length-1].price) * shares;
      if (pnl > 0) wins++; else losses++;
    }

    const totalReturn = ((cash - 100000) / 100000 * 100).toFixed(2);
    const totalTrades = Math.floor(trades.length / 2);
    const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;

    this.renderBacktestResult({
      totalReturn, totalTrades, winRate, trades, initialCash: 100000, finalCash: cash
    });
  },

  renderBacktestResult(result) {
    const el = document.getElementById('backtest-result');
    if (!el) return;
    const isProfit = result.totalReturn > 0;
    el.innerHTML = `
      <div class="card">
        <div class="card-title">📊 回测结果</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">总收益率</div>
            <div style="font-size:22px;font-weight:700;color:${isProfit ? 'var(--green)' : 'var(--red)'}">
              ${isProfit ? '+' : ''}${result.totalReturn}%
            </div>
          </div>
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">交易次数</div>
            <div style="font-size:22px;font-weight:700">${result.totalTrades}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">胜率</div>
            <div style="font-size:22px;font-weight:700;color:var(--blue)">${result.winRate}%</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary)">
          初始资金: ¥${result.initialCash.toLocaleString()} → 最终资金: ¥${result.finalCash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </div>
      </div>
    `;
  },

  // ===== 表单 =====
  openTradeModal() {
    this.editingId = null;
    document.getElementById('trade-modal').classList.add('active');
    document.getElementById('trade-form').reset();
    document.getElementById('modal-title').textContent = '添加交易';
  },

  closeTradeModal() {
    document.getElementById('trade-modal').classList.remove('active');
  },

  submitTrade() {
    const form = document.getElementById('trade-form');
    const name = form.querySelector('[name="name"]').value.trim();
    const code = form.querySelector('[name="code"]').value.trim();
    const type = form.querySelector('[name="type"]').value;
    const price = parseFloat(form.querySelector('[name="price"]').value);
    const shares = parseInt(form.querySelector('[name="shares"]').value);
    const date = form.querySelector('[name="date"]').value;

    if (!name || !code || !price || !shares || !date) {
      this.showToast('请填写完整信息');
      return;
    }

    if (this.editingId) {
      this.updateTrade(this.editingId, { name, code, type, price, shares, date });
    } else {
      this.addTrade({ name, code, type, price, shares, date });
    }
    this.closeTradeModal();
  },

  exportData() {
    const data = JSON.stringify(this.trades, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-log-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('导出成功');
  },

  importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          this.trades = [...this.trades, ...data];
          this.saveTrades();
          this.render();
          this.showToast(`导入${data.length}条记录`);
        }
      } catch { this.showToast('导入失败，文件格式错误'); }
    };
    reader.readAsText(file);
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  bindEvents() {
    // 添加交易按钮
    const addBtn = document.getElementById('add-trade-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.openTradeModal());

    // 关闭弹窗
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeTradeModal());

    // 提交表单
    const submitBtn = document.getElementById('submit-trade');
    if (submitBtn) submitBtn.addEventListener('click', () => this.submitTrade());

    // 导出
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());

    // 导入
    const importInput = document.getElementById('import-input');
    if (importInput) importInput.addEventListener('change', e => {
      if (e.target.files[0]) this.importData(e.target.files[0]);
    });

    // 回测
    const backtestBtn = document.getElementById('run-backtest');
    if (backtestBtn) backtestBtn.addEventListener('click', () => this.runBacktest());
  }
};

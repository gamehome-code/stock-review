/**
 * 行情回顾模块
 */

const Market = {
  currentSectorType: 'industry',

  async init() {
    await this.loadIndexData();
    await this.loadSectorData();
    await this.loadLimitList();
    this.bindEvents();
  },

  async refresh() {
    await this.loadIndexData();
    await this.loadSectorData();
  },

  // 大盘指数
  async loadIndexData() {
    const container = document.getElementById('index-grid');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';

    const indices = await API.getIndexData();
    if (!indices.length) {
      container.innerHTML = '<div class="empty-state">数据加载失败，请检查网络</div>';
      return;
    }

    container.innerHTML = indices.map(item => {
      const cls = item.changePercent > 0 ? 'up' : item.changePercent < 0 ? 'down' : 'flat';
      const sign = item.changePercent > 0 ? '+' : '';
      return `
        <div class="index-card" onclick="App.switchToPage('technical', '${item.code}', '${item.name}')">
          <div class="index-name">${item.name}</div>
          <div class="index-value ${cls}">${item.price != null ? item.price.toFixed(2) : '--'}</div>
          <div class="index-change ${cls}">${sign}${item.changePercent?.toFixed(2)}% ${sign}${item.changeAmount?.toFixed(2)}</div>
        </div>
      `;
    }).join('');
  },

  // 板块数据
  async loadSectorData(type) {
    if (type) this.currentSectorType = type;
    const container = document.getElementById('sector-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';

    const sectors = await API.getSectorData(this.currentSectorType);
    if (!sectors.length) {
      container.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    const maxAbs = Math.max(...sectors.map(s => Math.abs(s.changePercent || 0)));
    container.innerHTML = sectors.map(item => {
      const cls = item.changePercent > 0 ? 'up' : item.changePercent < 0 ? 'down' : 'flat';
      const width = maxAbs ? (Math.abs(item.changePercent) / maxAbs * 100) : 0;
      const barColor = item.changePercent >= 0 ? 'var(--green)' : 'var(--red)';
      const sign = item.changePercent > 0 ? '+' : '';
      return `
        <div class="sector-item" onclick="App.switchToPage('technical', '${item.code}', '${item.name}')">
          <span class="sector-name">${item.name}</span>
          <div class="sector-bar">
            <div class="sector-bar-fill" style="width:${width}%;background:${barColor}"></div>
          </div>
          <span class="sector-change ${cls}">${sign}${item.changePercent?.toFixed(2)}%</span>
        </div>
      `;
    }).join('');
  },

  // 涨停跌停
  async loadLimitList(type) {
    const container = document.getElementById('limit-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';

    const list = await API.getLimitList(type);
    if (!list.length) {
      container.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    container.innerHTML = list.map(item => {
      const cls = item.changePercent > 0 ? 'up' : 'down';
      const sign = item.changePercent > 0 ? '+' : '';
      return `
        <div class="stock-item" onclick="App.switchToPage('technical', '${item.code}', '${item.name}')">
          <div class="stock-info">
            <div class="stock-name">${item.name}</div>
            <div class="stock-code">${item.code}</div>
          </div>
          <div class="stock-price">
            <div class="price ${cls}">${item.price?.toFixed(2)}</div>
            <div class="change ${cls}">${sign}${item.changePercent?.toFixed(2)}%</div>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // 板块Tab切换
    document.querySelectorAll('.sector-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sector-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadSectorData(tab.dataset.type);
      });
    });

    // 涨跌停Tab切换
    document.querySelectorAll('.limit-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.limit-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadLimitList(tab.dataset.type);
      });
    });
  }
};

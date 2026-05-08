/**
 * A股复盘助手 - 主应用
 */

const App = {
  currentPage: 'market',
  modules: {},

  async init() {
    // 先检测API是否可达（1.5秒快速探测）
    await API.init();

    // 初始化各模块
    this.modules = { Market, Technical, Fundamental, TradeLog, Sentiment };

    // 绑定导航
    this.bindNav();

    // 加载默认页面
    await this.switchPage('market');
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.switchPage(page);
      });
    });
  },

  async switchPage(page, code, name) {
    this.currentPage = page;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });

    // 切换页面显示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // 初始化对应模块
    switch (page) {
      case 'market':
        await Market.init();
        break;
      case 'technical':
        if (code) Technical.setCode(code, name);
        await Technical.init(code, name);
        break;
      case 'fundamental':
        await Fundamental.init();
        break;
      case 'tradelog':
        TradeLog.init();
        break;
      case 'sentiment':
        await Sentiment.init();
        break;
    }
  },

  // 从其他页面跳转到技术分析
  switchToPage(page, code, name) {
    this.switchPage(page, code, name);
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => App.init());
